from typing import List, Optional

from pydantic import BaseModel, Field


class CreatorProfile(BaseModel):
    channel_id: Optional[str]
    niche: Optional[str]
    subscriber_count: Optional[int]
    avg_views: Optional[int]
    recent_videos: Optional[List[str]] = Field(default_factory=list)


class DerivedCreatorProfile(BaseModel):
    mode: str  # "generic" or "personalized"

    # raw
    subscriber_count: Optional[int]
    avg_views: Optional[int]
    niche: Optional[str]

    # derived
    channel_size_bucket: str  # "small", "growing", "large"
    growth_stage: str  # "early", "mid", "established"
    performance_ratio: float  # avg_views / subs (safe division)
    competition_tolerance: str  # low / medium / high

