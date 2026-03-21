import json
import os
from typing import Any, List

import google.generativeai as genai
from pydantic import ValidationError

from models import StrategyResponse, VideoData

_MODEL_NAME = "gemini-2.5-flash"
_QUERY_EXPANSION_SYSTEM_PROMPT = (
    "You are a YouTube SEO expert. Convert the user's raw video idea into exactly 3 "
    "highly optimized YouTube search queries that will find the closest competitor videos. "
    "Return ONLY a JSON array of 3 strings."
)


def configure_gemini(api_key: str) -> None:
    if not api_key:
        raise ValueError("Missing GEMINI_API_KEY in environment.")
    genai.configure(api_key=api_key)


def _configure_from_env() -> None:
    configure_gemini(os.environ.get("GEMINI_API_KEY", ""))


def _extract_json_array(raw_content: str) -> List[str]:
    content = raw_content.strip()
    if content.startswith("```"):
        content = content.strip("`")
        if "\n" in content:
            content = content.split("\n", 1)[1]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()

    array_start = content.find("[")
    array_end = content.rfind("]")
    if array_start == -1 or array_end == -1 or array_end < array_start:
        raise ValueError("LLM response did not contain a valid JSON array.")

    parsed = json.loads(content[array_start : array_end + 1])
    if not isinstance(parsed, list):
        raise ValueError("LLM query expansion output is not a list.")

    normalized = [str(item).strip() for item in parsed]
    if len(normalized) != 3 or any(not item for item in normalized):
        raise ValueError("LLM query expansion output must be exactly 3 non-empty strings.")
    return normalized


def _extract_json_object(raw_content: str) -> dict[str, Any]:
    content = raw_content.strip()
    if content.startswith("```"):
        content = content.strip("`")
        if "\n" in content:
            content = content.split("\n", 1)[1]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()

    object_start = content.find("{")
    object_end = content.rfind("}")
    if object_start == -1 or object_end == -1 or object_end < object_start:
        raise ValueError("LLM response did not contain a valid JSON object.")

    parsed = json.loads(content[object_start : object_end + 1])
    if not isinstance(parsed, dict):
        raise ValueError("LLM strategy output is not a JSON object.")
    return parsed


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
    content = response.text or "[]"
    return _extract_json_array(content)


def _build_video_summary(videos: List[VideoData]) -> str:
    summary = [
        {
            "video_id": video.video_id,
            "title": video.title,
            "view_count": video.view_count,
            "subscriber_count": video.subscriber_count,
            "age_days": video.age_days,
            "category_id": video.category_id,
            "transcript_excerpt": video.transcript[:300],
        }
        for video in videos
    ]
    return json.dumps(summary, ensure_ascii=False)


def generate_strategy(
    idea: str,
    videos: List[VideoData],
    is_monopoly: bool,
    is_personality: bool,
    is_fragmented: bool,
) -> StrategyResponse:
    _configure_from_env()

    # 1. Refined Anomaly Overrides (Search vs. Browse & Novelty)
    override_instructions: List[str] = []
    if is_monopoly:
        override_instructions.append(
            "SYSTEM OVERRIDE: IMPENETRABLE MONOPOLY. Massive, old channels own the Search intent. "
            "You MUST force a radical micro-niche pivot. Do NOT suggest generic better thumbnails."
        )
    if is_personality:
        override_instructions.append(
            "SYSTEM OVERRIDE: PERSONALITY-DRIVEN NICHE. Search Engine Optimization (SEO) is useless here. "
            "Set 'search_volume' to Low, but 'browse_potential' to High. Focus the strategy 100% on "
            "charisma, high-stakes storytelling, and emotional hooks."
        )
    if is_fragmented:
        override_instructions.append(
            "SYSTEM OVERRIDE: NOVEL / EXPERIMENTAL IDEA. This is NOT a dead trend; it is a bizarre, untested mashup. "
            "Ignore the age of the competitor videos because direct competitors do not exist. "
            "Set 'search_volume' to Low, but highlight that success depends purely on curiosity and high 'browse_potential'."
        )

    # 2. The Empowering Strategist Base Prompt
    system_prompt = (
        "You are an elite, highly-paid YouTube strategist. Your job is to help creators find the winning angle "
        "for their specific skills. DO NOT flatter the user, but DO NOT tell them to abandon their core skill. "
        "Be brutally honest about the market, but fiercely optimistic about their ability to pivot within it.\n\n"
        "CRITICAL RULES FOR EVALUATION:\n"
        "1. NO PLACEHOLDERS: NEVER use brackets like [Specific App] or [Industry]. You must make a definitive creative choice. "
        "Instead of 'Build a [Niche] App', explicitly invent one, like 'Build a Real-Time Crypto Portfolio Tracker'.\n"
        
        "2. THE SMALL CHANNEL ADVANTAGE (RECENCY PIVOT): If the user's idea is a skill-based or educational topic (e.g., coding, software, tools) "
        "that is dominated by massive channels with old videos (2+ years old), DO NOT call it a dead trend. "
        "Instead, you MUST use the 'Recency Pivot'. Explain that viewers actively search for updated content. "
        "Tell the creator their advantage is being brand new. Force the strategy to focus on the LATEST version of the software, "
        "the newest features, and explicitly putting the current year in the title.\n"
        
        "3. THE KILLER IDEA: You must provide one 'killer_idea'. This must be a highly specific, surprising, and concrete "
        "video concept that utilizes the user's stated skill but applies it to a fresh angle or modern problem.\n"
        
        "4. EXECUTION RISKS: Provide 2-3 fatal pitfalls. Tell the creator exactly how they will ruin this video during production "
        "(e.g., bad audio, slow pacing, failing to show the final result immediately).\n"
        
        "5. HOOK REWRITE: You MUST write a first-person, spoken-word script (1-2 sentences) that the creator will actually say to the camera. Do not give advice here.\n"
        
        "6. Return output that strictly matches the required JSON schema."
    )
    
    if override_instructions:
        system_prompt = f"{system_prompt}\n\n" + "\n".join(override_instructions)

    user_prompt = (
        f"Idea:\n{idea}\n\n"
        f"Competitor Video Summary (JSON):\n{_build_video_summary(videos)}"
    )

    model = genai.GenerativeModel(
        _MODEL_NAME,
        system_instruction=system_prompt,
    )
    
    response = model.generate_content(
        user_prompt,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            response_schema=StrategyResponse,
        ),
    )

    content = response.text or "{}"
    try:
        return StrategyResponse.model_validate_json(content)
    except ValidationError:
        return StrategyResponse.model_validate(_extract_json_object(content))
