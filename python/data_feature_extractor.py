from __future__ import annotations

import re
import statistics
from collections import Counter
from typing import Dict, List, Optional

from models import VideoData


STOPWORDS = {
    "the",
    "and",
    "to",
    "of",
    "in",
    "a",
    "for",
    "is",
    "on",
    "this",
    "that",
    "with",
    "you",
}


def _clean_token(token: str) -> str:
    token = token.lower()
    # Keep letters/digits, drop leading/trailing punctuation.
    token = re.sub(r"^[^a-z0-9]+|[^a-z0-9]+$", "", token)
    return token


def compute_breakout_summary(videos: List[VideoData]) -> Dict:
    distribution = {"low": 0, "normal": 0, "high": 0, "viral": 0}

    def classify(multiplier: float) -> str:
        if multiplier < 1:
            return "low"
        if 1 <= multiplier < 2:
            return "normal"
        if 2 <= multiplier < 5:
            return "high"
        return "viral"

    for v in videos:
        distribution[classify(v.breakout_multiplier)] += 1

    top_sorted = sorted(videos, key=lambda v: v.breakout_multiplier or 0, reverse=True)[
        :3
    ]
    top_performers = [
        {"title": v.title, "multiplier": round(float(v.breakout_multiplier), 2)}
        for v in top_sorted
    ]

    return {
        "distribution": distribution,
        "top_performers": top_performers,
    }


def compute_creator_distribution(videos: List[VideoData]) -> Dict:
    def bucket(subs: int) -> str:
        if subs < 10_000:
            return "small"
        if subs <= 100_000:
            return "mid"
        return "large"

    counts = {"small": 0, "mid": 0, "large": 0}

    for v in videos:
        subs = v.subscriber_count or 0
        b = bucket(subs)
        counts[b] += 1
    total_breakout = sum(1 for v in videos if v.breakout_multiplier >= 2)
    small_breakout = sum(
        1
        for v in videos
        if v.breakout_multiplier >= 2 and (v.subscriber_count or 0) < 10_000
    )

    ratio = (small_breakout / total_breakout) if total_breakout > 0 else 0.0

    if ratio < 0.3:
        success = "LOW"
    elif ratio < 0.6:
        success = "MEDIUM"
    else:
        success = "HIGH"

    return {
        "small": counts["small"],
        "mid": counts["mid"],
        "large": counts["large"],
        "small_creator_success_rate": success,
    }


def compute_title_patterns(videos: List[VideoData]) -> Dict:
    keyword_counter: Counter[str] = Counter()
    saw_how_any = False
    saw_digit_any = False

    for v in videos:
        raw_tokens = v.title.lower().split()
        cleaned_tokens: List[str] = []
        for t in raw_tokens:
            tok = _clean_token(t)
            if not tok:
                continue
            cleaned_tokens.append(tok)
            if tok == "how":
                saw_how_any = True
                continue
            if tok.isdigit():
                saw_digit_any = True
                continue
            if tok in STOPWORDS:
                continue
            if len(tok) < 3:
                continue
            keyword_counter[tok] += 1

    top_keywords = [w for w, _ in keyword_counter.most_common(5)]

    if saw_how_any:
        dominant_pattern = "tutorial"
    elif saw_digit_any:
        dominant_pattern = "listicle"
    else:
        dominant_pattern = "generic"

    return {
        "top_keywords": top_keywords,
        "dominant_pattern": dominant_pattern,
    }


def compute_content_clusters(videos: List[VideoData]) -> Dict:
    beginner_keywords = ["beginner", "start", "basics", "intro"]
    advanced_keywords = ["advanced", "deep", "expert"]

    clusters = {"beginner": 0, "advanced": 0, "general": 0}

    for v in videos:
        raw_tokens = v.title.lower().split()
        cleaned = {_clean_token(t) for t in raw_tokens if _clean_token(t)}

        if any(k in cleaned for k in beginner_keywords):
            clusters["beginner"] += 1
        elif any(k in cleaned for k in advanced_keywords):
            clusters["advanced"] += 1
        else:
            clusters["general"] += 1

    weak_cluster = min(clusters.items(), key=lambda kv: kv[1])[0]
    return {"clusters": clusters, "weak_cluster": weak_cluster}


def compute_freshness(videos: List[VideoData]) -> Dict:
    recent = sum(1 for v in videos if v.age_days < 90)
    total = len(videos)
    old = total - recent

    recent_ratio = (recent / total) if total > 0 else 0.0
    if recent_ratio > 0.4:
        trend_status = "ACTIVE"
    elif recent_ratio > 0.2:
        trend_status = "MODERATE"
    else:
        trend_status = "STALE"

    return {"recent": recent, "old": old, "trend_status": trend_status}


def compute_velocity_metrics(videos: List[VideoData]) -> Dict:
    if not videos:
        return {
            "avg_views_per_day": 0,
            "avg_title_length": 0,
            "top_vs_avg_ratio": 0,
        }
    
    # Average views per day
    total_views_per_day = 0
    valid_videos = 0
    
    for v in videos:
        if v.age_days and v.age_days > 0 and v.view_count:
            total_views_per_day += v.view_count / v.age_days
            valid_videos += 1
    
    avg_views_per_day = total_views_per_day / valid_videos if valid_videos > 0 else 0
    
    # Average title length
    avg_title_length = sum(len(v.title.split()) for v in videos) / len(videos) if videos else 0
    
    # Top vs average ratio
    if videos:
        views = [v.view_count for v in videos if v.view_count]
        if views:
            top_views = max(views)
            avg_views = sum(views) / len(views)
            top_vs_avg_ratio = top_views / avg_views if avg_views > 0 else 0
        else:
            top_vs_avg_ratio = 0
    else:
        top_vs_avg_ratio = 0
    
    return {
        "avg_views_per_day": round(avg_views_per_day, 2),
        "avg_title_length": round(avg_title_length, 1),
        "top_vs_avg_ratio": round(top_vs_avg_ratio, 2),
    }


def compute_consistency(videos: List[VideoData]) -> Dict:
    views = [v.view_count for v in videos if v.view_count]
    
    if len(views) < 2:
        return {"consistency": "LOW"}

    variance = statistics.pstdev(views)
    avg = sum(views) / len(views)

    if avg == 0:
        return {"consistency": "LOW"}

    ratio = variance / avg

    if ratio < 0.5:
        return {"consistency": "HIGH"}
    elif ratio < 1.5:
        return {"consistency": "MEDIUM"}
    else:
        return {"consistency": "LOW"}


def compute_transcript_analysis(videos: List[VideoData]) -> Dict:
    """Analyze transcript patterns from top videos"""
    if not videos:
        return {"transcript_summary": {"hook_style": "Unknown", "pacing": "Unknown", "tone": "Unknown"}}
    
    # Get top videos by view count
    top_videos = sorted(videos, key=lambda v: v.view_count or 0, reverse=True)[:2]
    
    all_transcripts = ""
    for v in top_videos:
        if hasattr(v, 'transcript') and v.transcript:
            all_transcripts += " " + v.transcript
    
    if not all_transcripts.strip():
        return {"transcript_summary": {"hook_style": "Unknown", "pacing": "Unknown", "tone": "Unknown"}}
    
    # Basic heuristics
    transcript_lower = all_transcripts.lower()
    
    # Hook style analysis
    hook_style = "question_based"
    if "?" in transcript_lower and "what if" in transcript_lower:
        hook_style = "curiosity_driven"
    elif any(word in transcript_lower for word in ["shocking", "unbelievable", "never"]):
        hook_style = "sensational"
    elif any(word in transcript_lower for word in ["step by step", "tutorial", "how to"]):
        hook_style = "educational"
    else:
        hook_style = "conversational"
    
    # Pacing analysis
    sentences = transcript_lower.count(".") + transcript_lower.count("!") + transcript_lower.count("?")
    avg_sentence_length = len(all_transcripts.split()) / max(sentences, 1)
    
    if avg_sentence_length > 20:
        pacing = "slow"
    elif avg_sentence_length < 10:
        pacing = "fast"
    else:
        pacing = "moderate"
    
    # Tone analysis
    you_count = len(re.findall(r"\byou\b", transcript_lower))
    we_count = len(re.findall(r"\bwe\b", transcript_lower))
    i_count = len(re.findall(r"\bi\b", transcript_lower))
    
    if you_count > i_count * 2:
        tone = "direct_address"
    elif we_count > i_count:
        tone = "collaborative"
    elif i_count > you_count + we_count:
        tone = "personal"
    else:
        tone = "neutral"
    
    return {
        "transcript_summary": {
            "hook_style": hook_style,
            "pacing": pacing,
            "tone": tone
        }
    }


def extract_features(videos: List[VideoData]) -> Dict:
    breakout_summary = compute_breakout_summary(videos)
    creator_distribution = compute_creator_distribution(videos)
    title_patterns = compute_title_patterns(videos)
    content_clusters = compute_content_clusters(videos)
    freshness = compute_freshness(videos)
    velocity_metrics = compute_velocity_metrics(videos)
    consistency = compute_consistency(videos)
    transcript_analysis = compute_transcript_analysis(videos)
    
    # Generate transcript sample from top videos
    transcript_sample = ""
    if videos:
        top_videos = sorted(videos, key=lambda v: v.view_count or 0, reverse=True)[:2]
        transcript_parts = []
        for v in top_videos:
            if hasattr(v, 'transcript') and v.transcript:
                transcript_parts.append(v.transcript[:200])
        transcript_sample = " | ".join(transcript_parts)

    total_creators = (
        creator_distribution["small"]
        + creator_distribution["mid"]
        + creator_distribution["large"]
    )
    large_share = (
        (creator_distribution["large"] / total_creators) if total_creators > 0 else 0.0
    )
    competition_level = "HIGH" if large_share > 0.5 else "MEDIUM"
    entry_barrier = (
        "HIGH"
        if competition_level == "HIGH"
        and creator_distribution["small_creator_success_rate"] == "LOW"
        else "MEDIUM"
    )
    
    # Market dynamics abstraction
    market_dynamics = "STABLE"
    if velocity_metrics.get("top_vs_avg_ratio", 0) > 10:
        market_dynamics = "WINNER_TAKES_ALL"
    elif consistency.get("consistency") == "LOW":
        market_dynamics = "VOLATILE"

    features: Dict = {
        "breakout_summary": breakout_summary,
        "creator_distribution": creator_distribution,
        "title_patterns": title_patterns,
        "content_clusters": content_clusters,
        "freshness": freshness,
        "velocity_metrics": velocity_metrics,
        "consistency": consistency,
        "transcript_sample": transcript_sample,
        "transcript_analysis": transcript_analysis,
        "market_dynamics": market_dynamics,
        "market_summary": {
            "competition_level": competition_level,
            "entry_barrier": entry_barrier,
        },
    }

    print({
        "stage": "feature_extractor",
        "action": "extraction_complete",
        "video_count": len(videos),
        "features": features
    })
    return features

