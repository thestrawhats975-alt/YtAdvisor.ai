import json
import subprocess
import sys
import time
import traceback
from dataclasses import dataclass, field
from typing import List, Optional, Tuple


@dataclass
class ScrapedComment:
    video_id: str
    video_title: str
    text: str
    like_count: int = 0
    author: str = ""
    is_reply: bool = False


@dataclass
class VideoCommentResult:
    video_id: str
    video_title: str
    comments: List[ScrapedComment] = field(default_factory=list)
    scrape_successful: bool = False
    comments_found: int = 0
    error_message: str = ""


@dataclass
class AudienceCommentBatch:
    video_results: List[VideoCommentResult] = field(default_factory=list)
    total_comments: int = 0
    successful_videos: int = 0
    failed_videos: int = 0
    # Flat list of all comment texts for easy consumption by Creator DNA builder
    all_comment_texts: List[str] = field(default_factory=list)
    batch_successful: bool = False
    error_message: str = ""


def check_ytdlp_available() -> Tuple[bool, str]:
    """
    Checks whether yt-dlp is installed and callable.
    Returns (is_available, version_or_error_message).
    """
    try:
        result = subprocess.run(
            ["yt-dlp", "--version"],
            capture_output=True,
            text=True,
            timeout=10,
        )
        if result.returncode == 0:
            return (True, (result.stdout or "").strip())
        msg = (result.stderr or result.stdout or "Unknown yt-dlp error").strip()
        return (False, msg)
    except FileNotFoundError:
        # Common on Windows when Scripts/ isn't on PATH; fall back to `python -m yt_dlp`.
        try:
            result = subprocess.run(
                [sys.executable, "-m", "yt_dlp", "--version"],
                capture_output=True,
                text=True,
                timeout=10,
            )
            if result.returncode == 0:
                return (True, (result.stdout or "").strip())
            return (
                False,
                (result.stderr or result.stdout or "yt-dlp not found").strip(),
            )
        except Exception:
            return (False, "yt-dlp not found — install with: pip install yt-dlp")
    except subprocess.TimeoutExpired:
        return (False, "yt-dlp version check timed out")
    except Exception as e:
        return (False, str(e))


def _scrape_comments_for_video(
    video_id: str,
    video_title: str,
    max_comments: int = 50,
    timeout_s: int = 60,
) -> VideoCommentResult:
    """
    Scrapes top comments for a single YouTube video using yt-dlp via subprocess.
    Always sleeps 2.0s at the end to rate-limit calls.
    """
    import platform
    import os
    import tempfile

    url = f"https://www.youtube.com/watch?v={video_id}"
    base_cmd = ["yt-dlp"]
    try:
        # If yt-dlp is installed but Scripts/ isn't on PATH, use python -m.
        subprocess.run(
            ["yt-dlp", "--version"],
            capture_output=True,
            text=True,
            timeout=5,
        )
    except FileNotFoundError:
        base_cmd = [sys.executable, "-m", "yt_dlp"]

    with tempfile.TemporaryDirectory(prefix="ytdlp_comments_") as tmpdir:
        # Use a real output template so yt-dlp can write `<id>.comments.json`.
        outtmpl = os.path.join(tmpdir, "%(id)s")
        cmd = [
            *base_cmd,
            "--skip-download",
            "--write-comments",
            "--no-write-info-json",
            "--extractor-args",
            f"youtube:comment_sort=top;max_comments={max_comments},0,0,{max_comments}",
            "-o",
            outtmpl,
            "--print-json",
            url,
        ]

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=timeout_s,
            )

            if result.returncode != 0:
                stderr = result.stderr or ""
                if "Video unavailable" in stderr:
                    return VideoCommentResult(
                        video_id=video_id,
                        video_title=video_title,
                        comments=[],
                        scrape_successful=False,
                        comments_found=0,
                        error_message="Video unavailable",
                    )
                if "Private video" in stderr:
                    return VideoCommentResult(
                        video_id=video_id,
                        video_title=video_title,
                        comments=[],
                        scrape_successful=False,
                        comments_found=0,
                        error_message="Private video",
                    )
                print(f"[ytdlp] non-zero exit for {video_id}: {stderr[:200]}")
                return VideoCommentResult(
                    video_id=video_id,
                    video_title=video_title,
                    comments=[],
                    scrape_successful=False,
                    comments_found=0,
                    error_message=(stderr.strip()[:500] or "yt-dlp non-zero exit"),
                )

            comments: List[ScrapedComment] = []

            comments_path = os.path.join(tmpdir, f"{video_id}.comments.json")
            if os.path.exists(comments_path):
                try:
                    with open(comments_path, "r", encoding="utf-8", errors="replace") as f:
                        for line in f:
                            line = line.strip()
                            if not line:
                                continue
                            try:
                                c = json.loads(line)
                            except Exception:
                                continue
                            if not isinstance(c, dict):
                                continue
                            text = (c.get("text") or "").strip()
                            if not text:
                                continue
                            like_count = int(c.get("like_count", 0) or 0)
                            author = c.get("author", "") or ""
                            is_reply = c.get("parent") not in (None, "root")
                            comments.append(
                                ScrapedComment(
                                    video_id=video_id,
                                    video_title=video_title,
                                    text=text,
                                    like_count=like_count,
                                    author=author,
                                    is_reply=is_reply,
                                )
                            )
                            if len(comments) >= max_comments:
                                break
                except Exception:
                    traceback.print_exc()

            if not comments:
                # Fallback: try to parse comments from the JSONL stdout if present.
                for line in (result.stdout or "").splitlines():
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        data = json.loads(line)
                    except Exception:
                        continue
                    if "comments" not in data:
                        continue
                    raw_comments = data.get("comments") or []
                    if not isinstance(raw_comments, list):
                        raw_comments = []
                    for c in raw_comments[:max_comments]:
                        if not isinstance(c, dict):
                            continue
                        text = (c.get("text") or "").strip()
                        if not text:
                            continue
                        like_count = int(c.get("like_count", 0) or 0)
                        author = c.get("author", "") or ""
                        is_reply = c.get("parent") not in (None, "root")
                        comments.append(
                            ScrapedComment(
                                video_id=video_id,
                                video_title=video_title,
                                text=text,
                                like_count=like_count,
                                author=author,
                                is_reply=is_reply,
                            )
                        )
                    break

            if not comments:
                return VideoCommentResult(
                    video_id=video_id,
                    video_title=video_title,
                    comments=[],
                    scrape_successful=True,
                    comments_found=0,
                    error_message="No comments found in output",
                )

            return VideoCommentResult(
                video_id=video_id,
                video_title=video_title,
                comments=comments,
                scrape_successful=True,
                comments_found=len(comments),
                error_message="",
            )

        except subprocess.TimeoutExpired:
            return VideoCommentResult(
                video_id=video_id,
                video_title=video_title,
                comments=[],
                scrape_successful=False,
                comments_found=0,
                error_message=f"yt-dlp timed out after {timeout_s}s",
            )
        except Exception:
            traceback.print_exc()
            return VideoCommentResult(
                video_id=video_id,
                video_title=video_title,
                comments=[],
                scrape_successful=False,
                comments_found=0,
                error_message="yt-dlp scrape failed",
            )
        finally:
            time.sleep(2.0)


def scrape_comments_for_videos(
    video_ids_and_titles: List[Tuple[str, str]],
    max_comments_per_video: int = 50,
    max_failures_before_abort: int = 3,
) -> AudienceCommentBatch:
    """
    Scrapes comments for a list of (video_id, video_title) tuples.
    """
    available, version_or_error = check_ytdlp_available()
    if not available:
        return AudienceCommentBatch(
            batch_successful=False,
            error_message=f"yt-dlp not available: {version_or_error}",
        )
    print(f"[ytdlp] version: {version_or_error}")

    video_results: List[VideoCommentResult] = []
    consecutive_failures = 0

    for i, (video_id, video_title) in enumerate(video_ids_and_titles):
        print(f"[ytdlp] scraping {i+1}/{len(video_ids_and_titles)}: {video_title[:50]}...")

        result = _scrape_comments_for_video(
            video_id,
            video_title,
            max_comments=max_comments_per_video,
        )
        video_results.append(result)

        if result.scrape_successful:
            consecutive_failures = 0
            print(f"[ytdlp] got {result.comments_found} comments from '{video_title[:40]}'")
        else:
            consecutive_failures += 1
            print(f"[ytdlp] failed for '{video_title[:40]}': {result.error_message}")

            if consecutive_failures >= max_failures_before_abort:
                print(f"[ytdlp] {consecutive_failures} consecutive failures — aborting batch")
                break

    successful = [r for r in video_results if r.scrape_successful]
    failed = [r for r in video_results if not r.scrape_successful]
    all_texts = [
        c.text
        for r in successful
        for c in r.comments
        if c.text.strip()
    ]
    total_comments = sum(r.comments_found for r in successful)

    print(
        f"[ytdlp] batch complete - {len(successful)} successful, {len(failed)} failed, "
        f"{total_comments} total comments"
    )

    return AudienceCommentBatch(
        video_results=video_results,
        total_comments=total_comments,
        successful_videos=len(successful),
        failed_videos=len(failed),
        all_comment_texts=all_texts,
        batch_successful=len(successful) > 0,
        error_message="" if len(successful) > 0 else "All video scrapes failed",
    )


def channel_videos_to_scrape_input(
    videos,
) -> List[Tuple[str, str]]:
    """
    Converts a list of ChannelVideoMeta objects into (video_id, title) tuples
    ready for scrape_comments_for_videos().
    Only includes videos where comment_count > 0 to avoid wasting yt-dlp calls
    on videos with no comments.
    """
    return [(v.video_id, v.title) for v in videos if v.comment_count > 0]


if __name__ == "__main__":
    import os

    sys.stdout.reconfigure(encoding="utf-8")
    from dotenv import load_dotenv

    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

    print("[test] checking yt-dlp availability...")
    available, msg = check_ytdlp_available()
    print(f"[test] yt-dlp available: {available}")
    print(f"[test] version/error: {msg}")

    if not available:
        print("[test] Install yt-dlp with: pip install yt-dlp")
        print("[test] Then re-run this test.")
        sys.exit(1)

    test_videos = [
        ("dQw4w9WgXcQ", "Rick Astley - Never Gonna Give You Up"),
        ("jNQXAC9IVRw", "Me at the zoo (first YouTube video)"),
    ]

    print(f"\n[test] scraping comments from {len(test_videos)} test videos...")
    print("[test] NOTE: this will take ~20-30 seconds due to yt-dlp rate limiting delays")

    batch = scrape_comments_for_videos(
        test_videos,
        max_comments_per_video=10,
        max_failures_before_abort=2,
    )

    print(f"\n[test] batch_successful: {batch.batch_successful}")
    print(f"[test] successful_videos: {batch.successful_videos}")
    print(f"[test] failed_videos: {batch.failed_videos}")
    print(f"[test] total_comments: {batch.total_comments}")
    print(f"[test] all_comment_texts count: {len(batch.all_comment_texts)}")

    if batch.all_comment_texts:
        print(f"\n[test] First 3 comment texts:")
        for text in batch.all_comment_texts[:3]:
            print(f"  - {text[:100]}")

    for vr in batch.video_results:
        print(f"\n[test] Video: {vr.video_title[:50]}")
        print(f"  scrape_successful: {vr.scrape_successful}")
        print(f"  comments_found: {vr.comments_found}")
        print(f"  error_message: {vr.error_message}")

