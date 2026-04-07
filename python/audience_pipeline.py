import json
import os
import threading
import time
import traceback
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from enum import Enum
from typing import Dict, List, Optional

from channel_scraper import (
    scrape_channel,
    get_bootstrap_videos,
    get_video_batch,
    ChannelScrapeResult,
)
from audience_comment_scraper import (
    scrape_comments_for_videos,
    channel_videos_to_scrape_input,
)
from creator_dna_service import (
    CreatorDNASnapshot,
    create_dna_snapshot,
    update_dna_snapshot,
    snapshot_to_dict,
    snapshot_from_dict,
    snapshot_to_creator_dna_string,
)

# Tracks live worker threads by channel_id
_running_channels: Dict[str, bool] = {}


class PipelinePhase(str, Enum):
    BOOTSTRAPPING = "BOOTSTRAPPING"
    ENRICHING = "ENRICHING"
    COMPLETE = "COMPLETE"
    FAILED = "FAILED"


# Configuration constants
BOOTSTRAP_VIDEO_COUNT = 20
BOOTSTRAP_COMMENTS_PER_VIDEO = 30
ENRICHMENT_BATCH_SIZE = 10
ENRICHMENT_COMMENTS_PER_VIDEO = 50
ENRICHMENT_INTERVAL_HOURS = 6
MAX_VIDEOS_CAP = 500
RELIABILITY_THRESHOLD = 50

# Storage directory for pipeline state files
_STATE_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "pipeline_state",
)


@dataclass
class PipelineState:
    channel_id: str
    channel_title: str
    youtube_api_key: str
    phase: PipelinePhase = PipelinePhase.BOOTSTRAPPING
    is_reliable: bool = False

    # Progress tracking
    total_videos_on_channel: int = 0
    videos_processed: int = 0
    current_batch_index: int = 0
    last_run_timestamp: float = 0.0
    next_run_timestamp: float = 0.0

    # Error tracking
    consecutive_failures: int = 0
    last_error: str = ""

    # Not persisted
    is_running: bool = field(default=False, compare=False)


def _state_dir_for_channel(channel_id: str) -> str:
    return os.path.join(_STATE_DIR, channel_id)


def _state_file_path(channel_id: str) -> str:
    return os.path.join(_state_dir_for_channel(channel_id), "pipeline_state.json")


def _dna_file_path(channel_id: str) -> str:
    return os.path.join(_state_dir_for_channel(channel_id), "dna_snapshot.json")


def _save_state(state: PipelineState) -> None:
    os.makedirs(_state_dir_for_channel(state.channel_id), exist_ok=True)
    d = {k: v for k, v in asdict(state).items() if k != "is_running"}
    with open(_state_file_path(state.channel_id), "w", encoding="utf-8") as f:
        json.dump(d, f, indent=2)
    print(f"[pipeline] state saved for {state.channel_id} — phase={state.phase}")


def _load_state(channel_id: str) -> Optional[PipelineState]:
    path = _state_file_path(channel_id)
    if not os.path.exists(path):
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        state = PipelineState(
            channel_id=data.get("channel_id", ""),
            channel_title=data.get("channel_title", ""),
            youtube_api_key=data.get("youtube_api_key", ""),
            phase=PipelinePhase(data.get("phase", PipelinePhase.BOOTSTRAPPING.value)),
            is_reliable=bool(data.get("is_reliable", False)),
            total_videos_on_channel=int(data.get("total_videos_on_channel", 0) or 0),
            videos_processed=int(data.get("videos_processed", 0) or 0),
            current_batch_index=int(data.get("current_batch_index", 0) or 0),
            last_run_timestamp=float(data.get("last_run_timestamp", 0.0) or 0.0),
            next_run_timestamp=float(data.get("next_run_timestamp", 0.0) or 0.0),
            consecutive_failures=int(data.get("consecutive_failures", 0) or 0),
            last_error=str(data.get("last_error", "") or ""),
            is_running=False,
        )
        return state
    except Exception:
        traceback.print_exc()
        return None


def _save_dna(snapshot: CreatorDNASnapshot) -> None:
    os.makedirs(_state_dir_for_channel(snapshot.channel_id), exist_ok=True)
    with open(_dna_file_path(snapshot.channel_id), "w", encoding="utf-8") as f:
        json.dump(snapshot_to_dict(snapshot), f, indent=2)
    print(
        f"[pipeline] DNA saved for {snapshot.channel_id} — comments={snapshot.total_comments_analysed}"
    )


def _load_dna(channel_id: str) -> Optional[CreatorDNASnapshot]:
    path = _dna_file_path(channel_id)
    if not os.path.exists(path):
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return snapshot_from_dict(data)
    except Exception:
        traceback.print_exc()
        return None


def _run_bootstrap(
    state: PipelineState,
    scrape_result: ChannelScrapeResult,
) -> bool:
    print(f"[pipeline] starting BOOTSTRAP for '{state.channel_title}'...")

    bootstrap_videos = get_bootstrap_videos(scrape_result, count=BOOTSTRAP_VIDEO_COUNT)
    if not bootstrap_videos:
        state.last_error = "No videos found for bootstrap"
        return False

    print(f"[pipeline] bootstrap: processing {len(bootstrap_videos)} most recent videos")

    scrape_input = channel_videos_to_scrape_input(bootstrap_videos)
    print(f"[pipeline] bootstrap: {len(scrape_input)} videos have comments")

    if not scrape_input:
        print("[pipeline] bootstrap: no comments available — skipping DNA creation")
        state.videos_processed = len(bootstrap_videos)
        state.phase = PipelinePhase.ENRICHING
        return True

    comment_batch = scrape_comments_for_videos(
        scrape_input,
        max_comments_per_video=BOOTSTRAP_COMMENTS_PER_VIDEO,
        max_failures_before_abort=5,
    )

    if not comment_batch.batch_successful and comment_batch.total_comments == 0:
        state.last_error = (
            f"Bootstrap comment scraping failed: {comment_batch.error_message}"
        )
        return False

    dna_result = create_dna_snapshot(
        channel_id=state.channel_id,
        channel_title=state.channel_title,
        comment_texts=comment_batch.all_comment_texts,
        videos_processed=len(bootstrap_videos),
    )

    if not dna_result.success or dna_result.updated_snapshot is None:
        state.last_error = f"Bootstrap DNA creation failed: {dna_result.error_message}"
        return False

    state.is_reliable = dna_result.updated_snapshot.is_reliable
    _save_dna(dna_result.updated_snapshot)
    state.videos_processed = len(bootstrap_videos)
    state.phase = PipelinePhase.ENRICHING
    state.current_batch_index = 0
    state.last_error = ""

    print(
        f"[pipeline] BOOTSTRAP complete — "
        f"comments={comment_batch.total_comments}, "
        f"dna_reliable={dna_result.updated_snapshot.is_reliable}"
    )
    return True


def _run_enrichment_batch(
    state: PipelineState,
    scrape_result: ChannelScrapeResult,
) -> bool:
    print(
        f"[pipeline] starting ENRICHMENT batch {state.current_batch_index} "
        f"for '{state.channel_title}'..."
    )

    batch_videos = get_video_batch(
        scrape_result,
        batch_index=state.current_batch_index,
        batch_size=ENRICHMENT_BATCH_SIZE,
    )

    if not batch_videos:
        print(f"[pipeline] no more videos to process — marking as COMPLETE")
        state.phase = PipelinePhase.COMPLETE
        return True

    print(f"[pipeline] enrichment batch: processing {len(batch_videos)} videos")

    scrape_input = channel_videos_to_scrape_input(batch_videos)

    if not scrape_input:
        print("[pipeline] enrichment batch: no videos with comments — advancing batch index")
        state.current_batch_index += 1
        state.videos_processed += len(batch_videos)
        return True

    comment_batch = scrape_comments_for_videos(
        scrape_input,
        max_comments_per_video=ENRICHMENT_COMMENTS_PER_VIDEO,
        max_failures_before_abort=3,
    )

    existing_dna = _load_dna(state.channel_id)

    if existing_dna is None:
        print("[pipeline] no existing DNA found — running create instead of update")
        dna_result = create_dna_snapshot(
            channel_id=state.channel_id,
            channel_title=state.channel_title,
            comment_texts=comment_batch.all_comment_texts,
            videos_processed=len(batch_videos),
        )
    else:
        dna_result = update_dna_snapshot(
            existing_snapshot=existing_dna,
            new_comment_texts=comment_batch.all_comment_texts,
            additional_videos_processed=len(batch_videos),
        )

    if dna_result.success and dna_result.updated_snapshot is not None:
        _save_dna(dna_result.updated_snapshot)

    state.current_batch_index += 1
    state.videos_processed += len(batch_videos)
    state.last_error = ""

    total_processable = min(scrape_result.videos_fetched, MAX_VIDEOS_CAP)
    if state.videos_processed >= total_processable:
        state.phase = PipelinePhase.COMPLETE
        print(f"[pipeline] all {state.videos_processed} videos processed — marking COMPLETE")
    else:
        remaining = total_processable - state.videos_processed
        print(
            f"[pipeline] ENRICHMENT batch {state.current_batch_index - 1} complete — "
            f"videos_processed={state.videos_processed}, remaining={remaining}"
        )

    return True


def _pipeline_worker(channel_id: str, youtube_api_key: str) -> None:
    """
    Background thread worker for the audience pipeline.
    Runs bootstrap first, then enrichment batches with sleep intervals.
    Saves state after every phase transition.
    """
    print(f"[pipeline] worker started for channel {channel_id}")

    try:
        try:
            # Entire worker body runs inside this try/finally
            state = _load_state(channel_id)
            if state is None:
                print(f"[pipeline] ERROR: no state found for {channel_id} — worker exiting")
                return

            state.is_running = True

            print(f"[pipeline] fetching channel video metadata...")
            scrape_result = scrape_channel(
                channel_input=channel_id,
                youtube_api_key=youtube_api_key,
                max_videos=MAX_VIDEOS_CAP,
            )

            if not scrape_result.scrape_successful:
                state.phase = PipelinePhase.FAILED
                state.last_error = f"Channel scrape failed: {scrape_result.error_message}"
                _save_state(state)
                print(f"[pipeline] channel scrape failed — worker exiting")
                return

            state.total_videos_on_channel = scrape_result.total_video_count
            _save_state(state)

            if state.phase == PipelinePhase.BOOTSTRAPPING:
                success = _run_bootstrap(state, scrape_result)
                state.last_run_timestamp = time.time()
                if not success:
                    state.consecutive_failures += 1
                    if state.consecutive_failures >= 3:
                        state.phase = PipelinePhase.FAILED
                        print(f"[pipeline] bootstrap failed 3 times — marking FAILED")
                else:
                    state.consecutive_failures = 0
                _save_state(state)

            while state.phase == PipelinePhase.ENRICHING:
                now = time.time()
                if state.last_run_timestamp > 0:
                    elapsed_hours = (now - state.last_run_timestamp) / 3600
                    if elapsed_hours < ENRICHMENT_INTERVAL_HOURS:
                        wait_seconds = (ENRICHMENT_INTERVAL_HOURS - elapsed_hours) * 3600
                        print(
                            f"[pipeline] next enrichment batch in "
                            f"{wait_seconds/3600:.1f}h — sleeping..."
                        )
                        time.sleep(min(wait_seconds, 3600))
                        continue

                success = _run_enrichment_batch(state, scrape_result)
                state.last_run_timestamp = time.time()
                state.next_run_timestamp = time.time() + (ENRICHMENT_INTERVAL_HOURS * 3600)

                if not success:
                    state.consecutive_failures += 1
                    if state.consecutive_failures >= 3:
                        state.phase = PipelinePhase.FAILED
                        print(f"[pipeline] enrichment failed 3 times — marking FAILED")
                        break
                else:
                    state.consecutive_failures = 0

                _save_state(state)

            print(f"[pipeline] worker finished — final phase: {state.phase}")

        except Exception:
            traceback.print_exc()
            print(f"[pipeline] worker crashed for {channel_id}")
        finally:
            state_on_exit = _load_state(channel_id)
            if state_on_exit:
                state_on_exit.is_running = False
                _save_state(state_on_exit)
            _running_channels[channel_id] = False
    except Exception:
        # Guardrail: never raise from worker
        traceback.print_exc()


def start_pipeline(channel_input: str, youtube_api_key: str) -> PipelineState:
    """
    Creates or resumes a pipeline for the given channel.
    If a pipeline is already running for this channel, returns current state without starting a new thread.
    If state exists on disk but is not running, resumes from saved state.
    If no state exists, initialises fresh state and starts the worker thread.
    Returns the current PipelineState (never raises).
    """
    try:
        raw = (channel_input or "").strip()
        is_bare_channel_id = raw.startswith("UC") and " " not in raw

        channel_id = raw
        channel_title = ""
        if not is_bare_channel_id:
            sr = scrape_channel(raw, youtube_api_key, max_videos=1)
            if sr.scrape_successful and sr.channel_id:
                channel_id = sr.channel_id
                channel_title = sr.channel_title

        state = _load_state(channel_id)
        if state is not None and state.phase in (PipelinePhase.COMPLETE, PipelinePhase.FAILED):
            state.phase = PipelinePhase.BOOTSTRAPPING
            state.current_batch_index = 0
            state.videos_processed = 0
            _save_state(state)

        if state is None:
            if not channel_title:
                channel_title = channel_id
            state = PipelineState(
                channel_id=channel_id,
                channel_title=channel_title,
                youtube_api_key=youtube_api_key,
                phase=PipelinePhase.BOOTSTRAPPING,
            )
            _save_state(state)
        else:
            # Ensure we keep the latest API key for background runs
            state.youtube_api_key = youtube_api_key
            _save_state(state)

        if _running_channels.get(channel_id) is True:
            return state

        _running_channels[channel_id] = True
        _save_state(state)

        thread = threading.Thread(
            target=_pipeline_worker,
            args=(channel_id, youtube_api_key),
            daemon=True,
            name=f"audience-pipeline-{channel_id}",
        )
        thread.start()
        return state
    except Exception:
        traceback.print_exc()
        return PipelineState(
            channel_id="",
            channel_title="",
            youtube_api_key=youtube_api_key,
            phase=PipelinePhase.FAILED,
            last_error="start_pipeline failed",
        )


def get_pipeline_status(channel_id: str) -> Optional[PipelineState]:
    """
    Loads and returns the persisted PipelineState for the given channel_id.
    Returns None if no state file exists.
    Does not start any threads.
    """
    return _load_state(channel_id)


def get_pipeline_dna_string(channel_id: str) -> Optional[str]:
    """
    Loads the DNA snapshot for the given channel_id and returns
    snapshot_to_creator_dna_string(snapshot).
    Returns None if no snapshot exists.
    """
    snap = _load_dna(channel_id)
    if snap is None:
        return None
    return snapshot_to_creator_dna_string(snap)


def start_pipeline_for_channel(
    channel_id: str,
    channel_title: str,
    youtube_api_key: str,
) -> bool:
    """
    Initialises and starts the audience pipeline for a channel.
    Called on paid user signup when they connect their channel.
    Creates initial state and launches the background worker thread.
    Returns True if started successfully, False if already running or failed.
    """
    existing_state = _load_state(channel_id)

    if existing_state is not None and existing_state.is_running:
        print(f"[pipeline] pipeline already running for {channel_id}")
        return False

    if existing_state is not None and existing_state.phase == PipelinePhase.FAILED:
        print(f"[pipeline] resetting FAILED pipeline for {channel_id}")
        existing_state.phase = PipelinePhase.BOOTSTRAPPING
        existing_state.consecutive_failures = 0
        _save_state(existing_state)

    if existing_state is None:
        state = PipelineState(
            channel_id=channel_id,
            channel_title=channel_title,
            youtube_api_key=youtube_api_key,
            phase=PipelinePhase.BOOTSTRAPPING,
        )
        _save_state(state)
        print(f"[pipeline] new pipeline created for '{channel_title}' ({channel_id})")

    thread = threading.Thread(
        target=_pipeline_worker,
        args=(channel_id, youtube_api_key),
        daemon=True,
        name=f"audience-pipeline-{channel_id}",
    )
    thread.start()
    print(f"[pipeline] background thread launched for {channel_id}")
    return True


def get_creator_dna_for_channel(channel_id: str) -> Optional[str]:
    """
    Returns the agent-ready creator DNA string for a channel.
    Returns None if no DNA exists yet.
    This is what gets injected into AgentContext.request.creator_dna
    for paid users who have connected their channel.
    """
    dna = _load_dna(channel_id)
    if dna is None:
        return None
    return snapshot_to_creator_dna_string(dna)


def run_single_enrichment_now(
    channel_id: str,
    youtube_api_key: str,
) -> bool:
    """
    Forces a single enrichment batch to run immediately, bypassing the
    6-hour interval check. Used for testing and manual triggers.
    Returns True if the batch ran successfully.
    """
    state = _load_state(channel_id)
    if state is None:
        print(f"[pipeline] no state found for {channel_id}")
        return False

    scrape_result = scrape_channel(
        channel_input=channel_id,
        youtube_api_key=youtube_api_key,
        max_videos=MAX_VIDEOS_CAP,
    )

    if not scrape_result.scrape_successful:
        print(f"[pipeline] channel scrape failed: {scrape_result.error_message}")
        return False

    success = _run_enrichment_batch(state, scrape_result)
    state.last_run_timestamp = time.time()
    _save_state(state)
    return success


if __name__ == "__main__":
    import sys

    sys.stdout.reconfigure(encoding="utf-8")
    import os
    from dotenv import load_dotenv

    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))
    youtube_key = os.getenv("YOUTUBE_API_KEY")
    gemini_key = os.getenv("GEMINI_API_KEY")

    if not youtube_key or not gemini_key:
        print("ERROR: YOUTUBE_API_KEY and GEMINI_API_KEY must be set in .env")
        sys.exit(1)

    import google.generativeai as genai

    genai.configure(api_key=gemini_key)

    TEST_CHANNEL_ID = "UCsBjURrPoezykLs9EqgamOA"
    TEST_CHANNEL_TITLE = "Fireship"

    print(f"[test] cleaning up any existing test state...")
    import shutil

    test_state_dir = _state_dir_for_channel(TEST_CHANNEL_ID)
    if os.path.exists(test_state_dir):
        shutil.rmtree(test_state_dir)
        print(f"[test] removed existing state directory")

    print(f"\n[test] starting pipeline for '{TEST_CHANNEL_TITLE}'...")
    print(f"[test] NOTE: this test uses max_videos=5 internally via run_single_enrichment_now")
    print(f"[test] Full pipeline with max_videos=500 would take much longer")

    state = PipelineState(
        channel_id=TEST_CHANNEL_ID,
        channel_title=TEST_CHANNEL_TITLE,
        youtube_api_key=youtube_key,
        phase=PipelinePhase.ENRICHING,
        current_batch_index=0,
        last_run_timestamp=0.0,
    )
    _save_state(state)
    print(f"[test] state created: phase={state.phase}")

    status = get_pipeline_status(TEST_CHANNEL_ID)
    print(f"\n[test] Pipeline status before run:")
    print(f"  phase: {status['phase']}")
    print(f"  videos_processed: {status['videos_processed']}")
    print(f"  dna_available: {status['dna_available']}")

    import audience_pipeline as _self

    original_cap = _self.MAX_VIDEOS_CAP
    _self.MAX_VIDEOS_CAP = 5
    print(f"\n[test] running single enrichment batch (max_videos=5 for speed)...")
    success = run_single_enrichment_now(TEST_CHANNEL_ID, youtube_key)
    _self.MAX_VIDEOS_CAP = original_cap

    print(f"\n[test] run_single_enrichment_now result: {success}")

    status = get_pipeline_status(TEST_CHANNEL_ID)
    print(f"\n[test] Pipeline status after run:")
    if status:
        for k, v in status.items():
            print(f"  {k}: {v}")

    dna_string = get_creator_dna_for_channel(TEST_CHANNEL_ID)
    if dna_string:
        print(f"\n[test] Creator DNA string (first 400 chars):")
        print(dna_string[:400])
    else:
        print(f"\n[test] No DNA available yet (expected if yt-dlp returned 0 comments)")

    print(f"\n[test] testing start_pipeline_for_channel call...")
    if os.path.exists(test_state_dir):
        shutil.rmtree(test_state_dir)
    started = start_pipeline_for_channel(TEST_CHANNEL_ID, TEST_CHANNEL_TITLE, youtube_key)
    print(f"[test] start_pipeline_for_channel returned: {started}")
    print(f"[test] (background thread launched — it will run in background and may produce logs)")
    time.sleep(3)
    status2 = get_pipeline_status(TEST_CHANNEL_ID)
    print(f"[test] status after start: phase={status2['phase'] if status2 else 'None'}")

    print(f"\n[test] all checks complete")

