import concurrent.futures
import statistics
import time
import traceback
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set, Tuple

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from youtube_transcript_api import YouTubeTranscriptApi


@dataclass
class VideoNode:
    video_id: str
    channel_id: str
    title: str
    view_count: int
    subscriber_count: int
    age_days: int
    category_id: str
    thumbnail_url: str  # highest resolution thumbnail URL available
    transcript: str  # empty string if unavailable
    breakout_multiplier: float  # view_count / subscriber_count, 0.0 if subs == 0
    comment_count: int  # from statistics.commentCount


@dataclass
class CompetitorIntelligence:
    # All 15 deduplicated videos (or fewer if duplicates removed)
    all_videos: List[VideoNode] = field(default_factory=list)

    # Top 3 by breakout multiplier — used for comment scraping and thumbnail analysis
    top_videos: List[VideoNode] = field(default_factory=list)

    # Concatenated top comments from the top 3 videos only
    # Format: each comment on its own line, prefixed with video title
    # e.g. "[Spring Boot Tutorial] Great video but missed the webhook part."
    top_comments: str = ""

    # Thumbnail URLs from the top 3 videos in order
    # These are passed to Gemini vision in a later step
    top_thumbnail_urls: List[str] = field(default_factory=list)

    # Median subscriber count across all 15 videos
    # Used by analyst agent for small_creator_verdict
    median_subscriber_count: float = 0.0

    # Whether scraping succeeded or fell back to empty data
    scrape_successful: bool = False

    # Human-readable error if scrape failed
    error_message: str = ""


def _safe_int(value: Any) -> int:
    """
    Converts a value that may be a string, int, or None to int safely.
    Returns 0 on any failure.
    """
    try:
        return int(value) if value is not None else 0
    except (TypeError, ValueError):
        return 0


def _age_days(published_at: str) -> int:
    """
    Converts a YouTube publishedAt string (e.g. "2023-04-15T10:30:00Z") to
    integer days since publication. Returns 0 on parse failure.
    """
    try:
        published_dt = datetime.strptime(published_at, "%Y-%m-%dT%H:%M:%SZ").replace(
            tzinfo=timezone.utc
        )
    except (TypeError, ValueError):
        return 0
    delta = datetime.now(timezone.utc) - published_dt
    return max(delta.days, 0)


def _best_thumbnail(thumbnails_dict: dict) -> str:
    """
    Given snippet.thumbnails from a YouTube API response, returns the URL of
    the highest-resolution thumbnail available (maxres → standard → high →
    medium → default). Returns an empty string if none are present.
    """
    if not thumbnails_dict:
        return ""
    for key in ("maxres", "standard", "high", "medium", "default"):
        entry = thumbnails_dict.get(key) or {}
        url = entry.get("url")
        if url:
            return url
    return ""


def _chunked(items: List[Any], size: int) -> List[List[Any]]:
    """Splits a list into consecutive chunks of at most `size` elements."""
    return [items[i : i + size] for i in range(0, len(items), size)]


def _compute_breakout(view_count: int, subscriber_count: int) -> float:
    """Returns views per subscriber rounded to 2 decimals, or 0.0 if subs is 0."""
    if subscriber_count > 0:
        return round(view_count / subscriber_count, 2)
    return 0.0


def _fetch_transcript_safe(video_id: str) -> str:
    """
    Fetches a video transcript, joins segment text with spaces, truncates to
    1500 characters. Returns an empty string on any error; never raises.
    """
    try:
        segments = YouTubeTranscriptApi.get_transcript(video_id)
        text = " ".join(seg.get("text", "") for seg in segments)
        return text[:1500]
    except Exception:
        return ""


def _median_of(values: List[float]) -> float:
    """Returns the median of a list of floats, or 0.0 if the list is empty."""
    if not values:
        return 0.0
    return float(statistics.median(values))


def _fetch_comments_for_video(
    youtube: Any,
    video_id: str,
    video_title: str,
    max_comments: int = 30,
) -> List[str]:
    """
    Fetches top-level comments for a video (by relevance), prefixes each with
    the video title in brackets, and returns the list of strings. Handles
    disabled/missing comments and HTTP errors without raising.
    """
    try:
        response = (
            youtube.commentThreads()
            .list(
                part="snippet",
                videoId=video_id,
                order="relevance",
                maxResults=min(max_comments, 100),
                textFormat="plainText",
            )
            .execute()
        )
        time.sleep(0.5)
    except HttpError as e:
        status = getattr(e.resp, "status", None)
        if status in (403, 404):
            return []
        print(f"[comments] HTTP error for {video_id}: {e}")
        return []
    except Exception as e:
        print(f"[comments] failed for {video_id}: {e}")
        return []

    out: List[str] = []
    for item in response.get("items", []):
        try:
            text = item["snippet"]["topLevelComment"]["snippet"]["textDisplay"]
            out.append(f"[{video_title}] {text}")
        except (KeyError, TypeError):
            continue
    return out


def scrape_competitor_intelligence(
    queries: List[str],
    youtube_api_key: str,
) -> CompetitorIntelligence:
    """
    Orchestrates Pipeline 1: search, metadata, subscribers, transcripts,
    breakout ranking, and top-comment scraping. Returns CompetitorIntelligence.
    """
    try:
        youtube = build("youtube", "v3", developerKey=youtube_api_key)

        # Stage B — Search for video IDs
        deduped_video_ids: List[str] = []
        seen_ids: Set[str] = set()
        for query in queries[:3]:
            search_response = (
                youtube.search()
                .list(
                    part="id",
                    q=query,
                    type="video",
                    maxResults=5,
                    relevanceLanguage="en",
                )
                .execute()
            )
            new_ids: List[str] = []
            for item in search_response.get("items", []):
                vid = item.get("id", {}).get("videoId")
                if vid and vid not in seen_ids:
                    seen_ids.add(vid)
                    deduped_video_ids.append(vid)
                    new_ids.append(vid)
            print(f"[scraper] query '{query}' → {len(new_ids)} new videos")
            time.sleep(0.3)

        if not deduped_video_ids:
            return CompetitorIntelligence(
                scrape_successful=False,
                error_message="No videos found for the provided queries",
            )

        # Stage C — Fetch video metadata in batches
        video_items: List[dict] = []
        for batch_ids in _chunked(deduped_video_ids, 50):
            batch_list = list(batch_ids)
            videos_response = (
                youtube.videos()
                .list(
                    part="snippet,statistics",
                    id=",".join(batch_list),
                    maxResults=len(batch_list),
                )
                .execute()
            )
            video_items.extend(videos_response.get("items", []))
            time.sleep(0.3)

        videos_by_id: Dict[str, dict] = {}
        for item in video_items:
            vid = item.get("id")
            if vid:
                videos_by_id[vid] = item

        # Stage D — Channel subscriber counts
        channel_ids_set: Set[str] = set()
        for item in video_items:
            cid = item.get("snippet", {}).get("channelId")
            if cid:
                channel_ids_set.add(cid)

        channel_subscribers: Dict[str, int] = {}
        channel_id_list = list(channel_ids_set)
        for batch_channel_ids in _chunked(channel_id_list, 50):
            batch_ch = list(batch_channel_ids)
            channels_response = (
                youtube.channels()
                .list(
                    part="statistics",
                    id=",".join(batch_ch),
                    maxResults=len(batch_ch),
                )
                .execute()
            )
            for channel_item in channels_response.get("items", []):
                cid = channel_item.get("id", "")
                channel_subscribers[cid] = _safe_int(
                    channel_item.get("statistics", {}).get("subscriberCount")
                )
            time.sleep(0.3)

        # Stage E — Transcripts in parallel (order matches deduped_video_ids)
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            transcripts = list(
                executor.map(_fetch_transcript_safe, deduped_video_ids)
            )
        available = sum(1 for t in transcripts if t)
        print(
            f"[scraper] transcripts fetched: {available} of {len(transcripts)} available"
        )

        # Stage F — Build VideoNode list in deduped_video_ids order
        all_videos: List[VideoNode] = []
        for vid, transcript in zip(deduped_video_ids, transcripts):
            item = videos_by_id.get(vid)
            if not item:
                continue
            snippet = item.get("snippet", {})
            statistics = item.get("statistics", {})
            channel_id = snippet.get("channelId", "")
            title = snippet.get("title", "")
            view_count = _safe_int(statistics.get("viewCount"))
            subscriber_count = channel_subscribers.get(channel_id, 0)
            age_days_val = _age_days(snippet.get("publishedAt", ""))
            breakout = _compute_breakout(view_count, subscriber_count)
            thumb = _best_thumbnail(snippet.get("thumbnails") or {})
            comment_count = _safe_int(statistics.get("commentCount", 0))
            all_videos.append(
                VideoNode(
                    video_id=vid,
                    channel_id=channel_id,
                    title=title,
                    view_count=view_count,
                    subscriber_count=subscriber_count,
                    age_days=age_days_val,
                    category_id=snippet.get("categoryId", "") or "",
                    thumbnail_url=thumb,
                    transcript=transcript,
                    breakout_multiplier=breakout,
                    comment_count=comment_count,
                )
            )

        # Stage G — Top 3 by breakout multiplier
        sorted_videos = sorted(
            all_videos, key=lambda v: v.breakout_multiplier, reverse=True
        )
        top_videos = sorted_videos[:3]
        print(
            f"[scraper] top 3 by breakout: {[v.title[:40] for v in top_videos]}"
        )

        # Stage H — Comments from top 3
        comment_lines: List[str] = []
        for video in top_videos:
            batch = _fetch_comments_for_video(
                youtube, video.video_id, video.title, max_comments=30
            )
            raw_total = len(batch)

            prefix = f"[{video.title}] "
            raw_texts: List[str] = []
            for line in batch:
                if isinstance(line, str) and line.startswith(prefix):
                    raw_texts.append(line[len(prefix) :])
                elif isinstance(line, str):
                    parts = line.split("] ", 1)
                    raw_texts.append(parts[1] if len(parts) == 2 else line)

            filtered = [t for t in raw_texts if len(t.strip()) >= 50]
            surviving = len(filtered)
            print(
                f"[scraper] '{video.title[:40]}': {surviving} of {raw_total} comments passed filter"
            )

            title_trunc = video.title[:40]
            for t in filtered:
                comment_trunc = t.strip()[:150]
                comment_lines.append(f"[{title_trunc}] {comment_trunc}")

        top_comments = "\n".join(comment_lines)
        if not top_comments.strip():
            top_comments = "No comments available for analysis"

        top_comments = top_comments[:8000]

        # Stage I — Median subscriber count
        subs_positive = [
            float(v.subscriber_count)
            for v in all_videos
            if v.subscriber_count > 0
        ]
        median_subscriber_count = _median_of(subs_positive)

        # Stage J
        result = CompetitorIntelligence(
            all_videos=all_videos,
            top_videos=top_videos,
            top_comments=top_comments,
            top_thumbnail_urls=[v.thumbnail_url for v in top_videos],
            median_subscriber_count=median_subscriber_count,
            scrape_successful=True,
            error_message="",
        )
        n_comment_lines = len(result.top_comments.splitlines())
        print(
            f"[scraper] complete - {len(all_videos)} videos, {n_comment_lines} comments, "
            f"median_subs={median_subscriber_count:,.0f}"
        )
        return result

    except Exception as e:
        traceback.print_exc()
        return CompetitorIntelligence(
            scrape_successful=False,
            error_message=str(e),
        )


def intelligence_to_competitor_data(intel: CompetitorIntelligence):
    """
    Converts CompetitorIntelligence into api_models.CompetitorData
    for use in AgentContext. Import CompetitorData from api_models inside
    this function to avoid circular imports.
    """
    from api_models import CompetitorData

    return CompetitorData(
        thumbnails=intel.top_thumbnail_urls,
        top_comments=intel.top_comments,
    )


def get_median_subscriber_count(intel: CompetitorIntelligence) -> int:
    """Returns median subscriber count as integer for analyst agent context."""
    return int(intel.median_subscriber_count)


if __name__ == "__main__":
    import os
    import sys

    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

    from dotenv import load_dotenv

    load_dotenv(
        dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env")
    )
    api_key = os.getenv("YOUTUBE_API_KEY")

    if not api_key:
        print("ERROR: YOUTUBE_API_KEY not found in .env file")
    else:
        test_queries = [
            "how to build SaaS with Next.js and Stripe",
            "Next.js Stripe subscription tutorial",
            "Stripe webhook handling Next.js tutorial",
        ]
        print(f"[test] running with {len(test_queries)} queries...")
        result = scrape_competitor_intelligence(test_queries, api_key)
        print(f"[test] scrape_successful: {result.scrape_successful}")
        print(f"[test] error_message: {result.error_message}")
        print(f"[test] total videos: {len(result.all_videos)}")
        print(f"[test] top videos: {[v.title[:50] for v in result.top_videos]}")
        print(f"[test] top_thumbnail_urls: {result.top_thumbnail_urls}")
        print(
            f"[test] median_subscriber_count: {result.median_subscriber_count:,.0f}"
        )
        print(f"[test] top_comments preview (first 500 chars):")
        print(result.top_comments[:500])
