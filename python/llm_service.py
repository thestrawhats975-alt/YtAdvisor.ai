import json
import os
import re
import time
import concurrent.futures
from typing import Any, List, TypeVar

import google.generativeai as genai
from pydantic import BaseModel, ValidationError

# Legacy — no longer used
# from models import AnalystReport, CreativeStrategy, VideoData

_MODEL_NAME = "gemini-2.5-flash"
_EXECUTOR = concurrent.futures.ThreadPoolExecutor(max_workers=5)

# -------------------------------
# QUERY EXPANSION
# -------------------------------
_QUERY_EXPANSION_SYSTEM_PROMPT = (
    "You are a YouTube SEO expert. Convert the user's raw video idea into exactly 3 "
    "highly optimized YouTube search queries. Return ONLY a JSON array of 3 strings."
)

# -------------------------------
# ANALYST PROMPT
# -------------------------------
_ANALYST_SYSTEM_PROMPT = (
    "You are a data-driven YouTube strategist.\n\n"

    "Evaluate FOUR dimensions (0-100):\n"
    "- demand_score\n"
    "- competition_score\n"
    "- viral_potential\n"
    "- exploitability\n\n"

    "RULES:\n"
    "- Emotional / relatable ideas → increase viral_potential + exploitability\n"
    "- Do NOT penalize novelty\n\n"

    "VERDICT:\n"
    "- GO if viral_potential >=70 OR exploitability >=70\n"
    "- MODIFY if high demand but high competition\n"
    "- AVOID only if demand <30 AND viral <40\n\n"

    "MARKET TYPES:\n"
    "SATURATED, TRENDING, DEAD, NOVEL, PERSONALITY, HYBRID\n\n"

    "Be sharp, not verbose."
)

# -------------------------------
# CREATIVE PROMPT
# -------------------------------
_CREATIVE_SYSTEM_PROMPT = (
    "You are a YouTube growth expert.\n\n"

    "Generate:\n"
    "- strong title\n"
    "- hook\n"
    "- thumbnail idea\n\n"

    "RULES:\n"
    "- prioritize CTR + curiosity\n"
    "- avoid generic ideas\n"
    "- keep it practical\n"
)

TModel = TypeVar("TModel", bound=BaseModel)


def configure_gemini(api_key: str) -> None:
    if not api_key:
        raise ValueError("Missing GEMINI_API_KEY")
    genai.configure(api_key=api_key)


def _configure_from_env():
    configure_gemini(os.environ.get("GEMINI_API_KEY", ""))


def _extract_json_array(raw: str) -> List[str]:
    start = raw.find("[")
    end = raw.rfind("]")
    if start == -1 or end == -1 or end < start:
        raise ValueError("No JSON array found in model output")
    return json.loads(raw[start:end + 1])


def _extract_json_object(raw: str) -> dict:
    start = raw.find("{")
    end = raw.rfind("}")
    if start == -1 or end == -1 or end < start:
        raise ValueError("No JSON object found in model output")
    return json.loads(raw[start:end + 1])


def _parse(raw: str, schema: type[TModel]) -> TModel:
    try:
        return schema.model_validate_json(raw)
    except Exception as e:
        print(f"[_parse error] {e}")
        return schema.model_validate(_extract_json_object(raw))


def generate_content_with_timeout(
    model: Any,
    prompt: str,
    generation_config: Any,
    timeout_s: float,
):
    """
    Calls model.generate_content with a timeout.
    On 429 ResourceExhausted, reads the retry_delay from the error
    message and waits exactly that long before retrying.
    Retries up to 5 times before giving up and re-raising.
    """
    last_exception = None

    for attempt in range(5):
        try:
            future = _EXECUTOR.submit(
                model.generate_content,
                prompt,
                generation_config=generation_config,
            )
            return future.result(timeout=timeout_s)

        except Exception as e:
            last_exception = e
            error_str = str(e)

            is_rate_limit = (
                "429" in error_str
                or "ResourceExhausted" in error_str
                or "RESOURCE_EXHAUSTED" in error_str
            )

            if not is_rate_limit:
                # Not a quota error — re-raise immediately
                raise

            # Try to extract the exact retry delay Google specifies
            wait_seconds = 60  # safe default
            try:
                match = re.search(r'seconds:\s*(\d+)', error_str)
                if match:
                    wait_seconds = int(match.group(1)) + 5
            except Exception:
                pass

            print(
                f"[llm] 429 rate limited on attempt {attempt + 1}/5 — "
                f"waiting {wait_seconds}s before retry..."
            )
            time.sleep(wait_seconds)

    # All 5 attempts exhausted
    raise last_exception


def expand_idea_to_queries(idea: str) -> List[str]:
    _configure_from_env()
    model = genai.GenerativeModel(
        _MODEL_NAME,
        system_instruction=_QUERY_EXPANSION_SYSTEM_PROMPT,
    )
    response = model.generate_content(
        idea,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
        ),
    )
    raw_text = response.text or "[]"
    try:
        queries = _extract_json_array(raw_text)
    except Exception:
        return []

    normalized = [str(q).strip() for q in queries if str(q).strip()]
    return normalized[:3]


# -------------------------------
# VIDEO SUMMARY
# -------------------------------
def _build_video_summary(videos: List[Any]) -> str:
    return json.dumps([
        {
            "title": v.title,
            "views": v.view_count,
            "subs": v.subscriber_count,
            "age": v.age_days,
            "breakout": v.breakout_multiplier,
        }
        for v in videos
    ])


# Legacy function - no longer used in the main pipeline
# Kept for reference but should be removed in production cleanup
# def generate_strategy(...):