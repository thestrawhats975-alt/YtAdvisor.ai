import re
import time
import traceback
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, List, Optional, Tuple

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


@dataclass
class ChannelVideoMeta:
    video_id: str
    title: str
    published_at: str  # raw ISO string e.g. "2023-04-15T10:30:00Z"
    age_days: int  # computed from published_at
    view_count: int
    like_count: int
    comment_count: int
    duration_seconds: int  # 0 if unavailable
    thumbnail_url: str


@dataclass
class ChannelScrapeResult:
    channel_id: str
    channel_title: str
    subscriber_count: int
    total_video_count: int  # total on channel per API
    videos: List[ChannelVideoMeta] = field(default_factory=list)
    scrape_successful: bool = False
    error_message: str = ""
    videos_fetched: int = 0  # actual count of videos fetched (may be less than total)


def _safe_int(value: Any) -> int:
    try:
        return int(value) if value is not None else 0
    except (TypeError, ValueError):
        return 0


def _age_days(published_at: str) -> int:
    try:
        published_dt = datetime.strptime(published_at, "%Y-%m-%dT%H:%M:%SZ").replace(
            tzinfo=timezone.utc
        )
    except (TypeError, ValueError):
        return 0
    delta = datetime.now(timezone.utc) - published_dt
    return max(delta.days, 0)


def _parse_duration(duration: str) -> int:
    try:
        if not duration:
            return 0
        h = re.findall(r"(\d+)H", duration)
        m = re.findall(r"(\d+)M", duration)
        s = re.findall(r"(\d+)S", duration)
        hours = int(h[0]) if h else 0
        minutes = int(m[0]) if m else 0
        seconds = int(s[0]) if s else 0
        return hours * 3600 + minutes * 60 + seconds
    except (TypeError, ValueError, IndexError):
        return 0


def _best_thumbnail(thumbnails_dict: dict) -> str:
    if not thumbnails_dict:
        return ""
    for key in ("maxres", "standard", "high", "medium", "default"):
        entry = thumbnails_dict.get(key) or {}
        url = entry.get("url")
        if url:
            return url
    return ""


def _chunked(items: List[Any], size: int) -> List[List[Any]]:
    return [items[i : i + size] for i in range(0, len(items), size)]


def _channel_id_from_input(raw_input: str, youtube: Any) -> Optional[str]:
    s = raw_input.strip()

    if s.startswith("UC") and " " not in s and len(s) > 10:
        return s

    try:
        if s.lower().startswith("http"):
            if "/channel/" in s:
                after = s.split("/channel/", 1)[1]
                cid = after.split("/")[0].split("?")[0]
                return cid if cid else None
            if "/@" in s:
                after = s.split("/@", 1)[1]
                handle = after.split("/")[0].split("?")[0]
                if not handle:
                    return None
                resp = (
                    youtube.search()
                    .list(part="snippet", q=handle, type="channel", maxResults=1)
                    .execute()
                )
                items = resp.get("items", [])
                if not items:
                    return None
                ch_id = items[0].get("id", {}).get("channelId")
                return ch_id

        resp = (
            youtube.search()
            .list(part="snippet", q=s, type="channel", maxResults=1)
            .execute()
        )
        items = resp.get("items", [])
        if not items:
            return None
        return items[0].get("id", {}).get("channelId")
    except HttpError as e:
        print(f"[channel_scraper] channel resolve HttpError: {e}")
        return None
    except Exception as e:
        print(f"[channel_scraper] channel resolve failed: {e}")
        return None


def _get_uploads_playlist_id(
    youtube: Any, channel_id: str
) -> Tuple[Optional[str], str, int, int]:
    try:
        resp = (
            youtube.channels()
            .list(
                part="contentDetails,snippet,statistics",
                id=channel_id,
            )
            .execute()
        )
        items = resp.get("items", [])
        if not items:
            return (None, "", 0, 0)
        item = items[0]
        uploads = (
            item.get("contentDetails", {})
            .get("relatedPlaylists", {})
            .get("uploads")
        )
        title = item.get("snippet", {}).get("title", "") or ""
        stats = item.get("statistics", {}) or {}
        subs = _safe_int(stats.get("subscriberCount"))
        vcount = _safe_int(stats.get("videoCount"))
        if not uploads:
            return (None, title, subs, vcount)
        return (uploads, title, subs, vcount)
    except Exception as e:
        print(f"[channel_scraper] _get_uploads_playlist_id: {e}")
        return (None, "", 0, 0)


def _fetch_all_video_ids_from_playlist(
    youtube: Any,
    playlist_id: str,
    max_videos: int = 500,
) -> List[str]:
    video_ids: List[str] = []
    next_page_token: Optional[str] = None
    page_num = 0

    try:
        while len(video_ids) < max_videos:
            kwargs = {
                "part": "contentDetails",
                "playlistId": playlist_id,
                "maxResults": 50,
            }
            if next_page_token:
                kwargs["pageToken"] = next_page_token
            response = youtube.playlistItems().list(**kwargs).execute()

            for item in response.get("items", []):
                vid = item.get("contentDetails", {}).get("videoId")
                if vid:
                    video_ids.append(vid)
                if len(video_ids) >= max_videos:
                    break

            page_num += 1
            if page_num % 5 == 0:
                print(
                    f"[channel_scraper] fetched {len(video_ids)} video IDs so far..."
                )

            next_page_token = response.get("nextPageToken")
            if not next_page_token or len(video_ids) >= max_videos:
                break
            time.sleep(0.3)
    except HttpError as e:
        print(f"[channel_scraper] playlistItems HttpError: {e}")

    return video_ids[:max_videos]


def _fetch_video_metadata_batch(
    youtube: Any,
    video_ids: List[str],
) -> List[ChannelVideoMeta]:
    results: List[ChannelVideoMeta] = []
    for batch in _chunked(video_ids, 50):
        batch_list = list(batch)
        try:
            resp = (
                youtube.videos()
                .list(
                    part="snippet,statistics,contentDetails",
                    id=",".join(batch_list),
                    maxResults=len(batch_list),
                )
                .execute()
            )
            for item in resp.get("items", []):
                snippet = item.get("snippet", {}) or {}
                statistics = item.get("statistics", {}) or {}
                content_details = item.get("contentDetails", {}) or {}
                vid = item.get("id", "")
                results.append(
                    ChannelVideoMeta(
                        video_id=vid,
                        title=snippet.get("title", "") or "",
                        published_at=snippet.get("publishedAt", "") or "",
                        age_days=_age_days(snippet.get("publishedAt", "") or ""),
                        view_count=_safe_int(statistics.get("viewCount")),
                        like_count=_safe_int(statistics.get("likeCount")),
                        comment_count=_safe_int(statistics.get("commentCount")),
                        duration_seconds=_parse_duration(
                            content_details.get("duration", "PT0S") or "PT0S"
                        ),
                        thumbnail_url=_best_thumbnail(snippet.get("thumbnails") or {}),
                    )
                )
        except HttpError as e:
            print(f"[channel_scraper] videos.list HttpError: {e}")

        print(
            f"[channel_scraper] metadata fetched for {len(results)} videos so far..."
        )
        time.sleep(0.3)

    return results


def scrape_channel(
    channel_input: str,
    youtube_api_key: str,
    max_videos: int = 500,
) -> ChannelScrapeResult:
    """
    Scrapes all video metadata for a YouTube channel.
    Accepts channel ID, channel URL, handle URL, or channel name as input.
    Returns ChannelScrapeResult with all video metadata.
    max_videos caps the total videos fetched (default 500).
    """
    print(f"[channel_scraper] starting for input: {channel_input[:60]}")

    try:
        youtube = build("youtube", "v3", developerKey=youtube_api_key)

        channel_id = _channel_id_from_input(channel_input, youtube)
        if not channel_id:
            return ChannelScrapeResult(
                channel_id="",
                channel_title="",
                subscriber_count=0,
                total_video_count=0,
                scrape_successful=False,
                error_message=f"Could not resolve channel ID from input: {channel_input}",
            )
        print(f"[channel_scraper] resolved channel_id: {channel_id}")

        uploads_playlist_id, channel_title, subscriber_count, total_video_count = (
            _get_uploads_playlist_id(youtube, channel_id)
        )
        if not uploads_playlist_id:
            return ChannelScrapeResult(
                channel_id=channel_id,
                channel_title="",
                subscriber_count=0,
                total_video_count=0,
                scrape_successful=False,
                error_message=f"Could not find uploads playlist for channel: {channel_id}",
            )
        print(
            f"[channel_scraper] channel: '{channel_title}', subs: {subscriber_count:,}, "
            f"total_videos: {total_video_count:,}"
        )

        print(f"[channel_scraper] fetching video IDs (max {max_videos})...")
        video_ids = _fetch_all_video_ids_from_playlist(
            youtube, uploads_playlist_id, max_videos=max_videos
        )
        print(f"[channel_scraper] fetched {len(video_ids)} video IDs")

        if not video_ids:
            return ChannelScrapeResult(
                channel_id=channel_id,
                channel_title=channel_title,
                subscriber_count=subscriber_count,
                total_video_count=total_video_count,
                scrape_successful=False,
                error_message="No videos found in uploads playlist.",
            )

        print(f"[channel_scraper] fetching metadata for {len(video_ids)} videos...")
        videos = _fetch_video_metadata_batch(youtube, video_ids)

        print(
            f"[channel_scraper] complete - channel='{channel_title}', "
            f"videos_fetched={len(videos)}, subscriber_count={subscriber_count:,}"
        )

        return ChannelScrapeResult(
            channel_id=channel_id,
            channel_title=channel_title,
            subscriber_count=subscriber_count,
            total_video_count=total_video_count,
            videos=videos,
            scrape_successful=True,
            error_message="",
            videos_fetched=len(videos),
        )

    except Exception as e:
        traceback.print_exc()
        return ChannelScrapeResult(
            channel_id="",
            channel_title="",
            subscriber_count=0,
            total_video_count=0,
            scrape_successful=False,
            error_message=str(e),
        )


def get_bootstrap_videos(
    scrape_result: ChannelScrapeResult,
    count: int = 20,
) -> List[ChannelVideoMeta]:
    """
    Returns the most recent `count` videos from a ChannelScrapeResult.
    Videos are sorted by age_days ascending (newest first).
    Used for Phase 1 bootstrapping on user signup.
    """
    sorted_videos = sorted(scrape_result.videos, key=lambda v: v.age_days)
    return sorted_videos[:count]


def get_video_batch(
    scrape_result: ChannelScrapeResult,
    batch_index: int,
    batch_size: int = 10,
) -> List[ChannelVideoMeta]:
    """
    Returns a batch of videos by index for the background enrichment job.
    Videos are sorted by age_days descending (oldest first) so enrichment
    processes older content progressively.
    batch_index 0 returns the oldest 10 videos, batch_index 1 the next 10, etc.
    Returns empty list if batch_index is out of range.
    """
    sorted_videos = sorted(
        scrape_result.videos, key=lambda v: v.age_days, reverse=True
    )
    start = batch_index * batch_size
    end = start + batch_size
    return sorted_videos[start:end]


if __name__ == "__main__":
    import os
    import sys

    sys.stdout.reconfigure(encoding="utf-8")
    from dotenv import load_dotenv

    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))
    api_key = os.getenv("YOUTUBE_API_KEY")

    if not api_key:
        print("ERROR: YOUTUBE_API_KEY not found in .env")
    else:
        test_input = "https://www.youtube.com/@Fireship"
        print(f"[test] scraping channel: {test_input}")
        print(f"[test] using max_videos=30 to keep test fast")

        result = scrape_channel(test_input, api_key, max_videos=30)

        print(f"\n[test] scrape_successful: {result.scrape_successful}")
        print(f"[test] error_message: {result.error_message}")
        print(f"[test] channel_id: {result.channel_id}")
        print(f"[test] channel_title: {result.channel_title}")
        print(f"[test] subscriber_count: {result.subscriber_count:,}")
        print(f"[test] total_video_count: {result.total_video_count:,}")
        print(f"[test] videos_fetched: {result.videos_fetched}")

        if result.videos:
            print(f"\n[test] First 3 videos:")
            for v in result.videos[:3]:
                print(
                    f"  - [{v.age_days}d ago] {v.title[:50]} | views={v.view_count:,} | comments={v.comment_count:,}"
                )

            bootstrap = get_bootstrap_videos(result, count=5)
            print(f"\n[test] Bootstrap videos (5 most recent):")
            for v in bootstrap:
                print(f"  - [{v.age_days}d ago] {v.title[:50]}")

            batch_0 = get_video_batch(result, batch_index=0, batch_size=5)
            print(f"\n[test] Batch 0 (5 oldest videos):")
            for v in batch_0:
                print(f"  - [{v.age_days}d ago] {v.title[:50]}")
