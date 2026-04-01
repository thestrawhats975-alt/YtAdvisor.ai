import re
import statistics
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from typing import Dict, List, Set

from competitor_scraper import CompetitorIntelligence, VideoNode

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
    "how",
    "what",
    "why",
    "when",
    "i",
    "my",
    "your",
    "we",
    "from",
    "it",
    "at",
    "by",
    "an",
    "be",
    "are",
    "was",
    "do",
    "did",
    "get",
    "got",
    "full",
    "part",
    "new",
    "using",
    "use",
    "build",
    "building",
    "create",
    "creating",
    "make",
    "making",
}


@dataclass
class GraphNode:
    video_id: str
    title: str
    channel_id: str
    subscriber_count: int
    breakout_multiplier: float
    age_days: int
    category_id: str
    keywords: List[str]  # extracted from title


@dataclass
class MarketCluster:
    cluster_id: int
    video_ids: List[str]
    dominant_channel_id: str  # channel_id with most videos in cluster
    dominant_keywords: List[str]  # top 3 keywords shared in cluster
    avg_breakout: float  # average breakout multiplier in cluster
    is_opportunity: bool  # True if avg_breakout > 2.0 AND no single channel > 50% of videos


@dataclass
class MarketGraphSignals:
    # Overall market structure
    total_videos: int
    unique_channels: int
    unique_categories: int

    # Monopoly detection
    is_monopoly: bool  # True if one channel has > 40% of all videos
    monopoly_channel_id: str  # channel_id of dominant player, empty string if not monopoly
    monopoly_share_pct: float  # percentage of videos owned by top channel (0.0-100.0)

    # Fragmentation detection
    is_fragmented: bool  # True if unique_categories >= 4
    is_personality_driven: bool  # True if category_id 22 or 24 appears in > 50% of videos

    # Cluster analysis
    clusters: List[MarketCluster]
    cluster_count: int
    has_opportunity_cluster: bool  # True if any cluster has is_opportunity=True

    # Bridge videos — videos that connect multiple clusters
    bridge_video_ids: List[str]  # video IDs that share keywords with 2+ clusters

    # Keyword intelligence
    dominant_keywords: List[str]  # top 5 keywords across all videos
    rare_keywords: List[str]  # keywords appearing in only 1 video (potential gap indicators)
    keyword_saturation: str  # "LOW", "MEDIUM", or "HIGH"

    # Breakout intelligence
    top_breakout_multiplier: float  # highest breakout in the dataset
    avg_breakout_multiplier: float  # average across all videos
    breakout_distribution: Dict[str, int]  # {"low": N, "normal": N, "high": N, "viral": N}

    # Age intelligence
    avg_age_days: float
    trend_status: str  # "ACTIVE", "MODERATE", or "STALE"
    recent_video_count: int  # videos published in last 90 days

    # Human-readable summary for analyst prompt injection
    analyst_summary: str  # 3-5 sentence paragraph describing market signals

    # Structured fields for analyst agent
    market_dynamics: str  # "WINNER_TAKES_ALL", "VOLATILE", or "STABLE"
    small_creator_success_rate: str  # "LOW", "MEDIUM", or "HIGH"

    median_subscriber_count: float = 0.0


def _extract_keywords(title: str) -> List[str]:
    """
    Lowercases the title, strips non-alphanumeric characters, splits into tokens,
    removes stopwords and tokens shorter than 3 characters. Returns remaining
    tokens (duplicates preserved).
    """
    title = title.lower()
    title = re.sub(r"[^a-z0-9 ]", " ", title)
    tokens = title.split()
    out: List[str] = []
    for t in tokens:
        if len(t) < 3:
            continue
        if t in STOPWORDS:
            continue
        out.append(t)
    return out


def _classify_breakout(multiplier: float) -> str:
    """Maps breakout multiplier to low / normal / high / viral buckets."""
    if multiplier < 1.0:
        return "low"
    if multiplier < 2.0:
        return "normal"
    if multiplier < 5.0:
        return "high"
    return "viral"


def _build_clusters(nodes: List[GraphNode]) -> List[MarketCluster]:
    """
    Clusters videos by keyword overlap (edge if at least 2 shared keywords).
    Returns MarketCluster objects sorted by cluster size descending.
    """
    if not nodes:
        return []

    node_keywords: Dict[str, Set[str]] = {
        n.video_id: set(n.keywords) for n in nodes
    }
    ids = [n.video_id for n in nodes]
    adj: Dict[str, Set[str]] = defaultdict(set)
    for i in range(len(ids)):
        for j in range(i + 1, len(ids)):
            a, b = ids[i], ids[j]
            if len(node_keywords[a] & node_keywords[b]) >= 2:
                adj[a].add(b)
                adj[b].add(a)

    visited: Set[str] = set()
    components: List[List[str]] = []
    for vid in ids:
        if vid in visited:
            continue
        comp: List[str] = []
        queue = [vid]
        visited.add(vid)
        while queue:
            cur = queue.pop(0)
            comp.append(cur)
            for nb in adj[cur]:
                if nb not in visited:
                    visited.add(nb)
                    queue.append(nb)
        components.append(comp)

    nodes_by_id: Dict[str, GraphNode] = {n.video_id: n for n in nodes}
    clusters_out: List[MarketCluster] = []

    for idx, video_ids in enumerate(components):
        channel_counts = Counter(nodes_by_id[v].channel_id for v in video_ids)
        max_c = max(channel_counts.values()) if channel_counts else 0
        tied_channels = [c for c, cnt in channel_counts.items() if cnt == max_c]

        if len(tied_channels) == 1:
            dominant_channel_id = tied_channels[0]
        else:
            best_ch = tied_channels[0]
            best_sum = sum(
                nodes_by_id[v].breakout_multiplier
                for v in video_ids
                if nodes_by_id[v].channel_id == best_ch
            )
            for ch in tied_channels[1:]:
                s = sum(
                    nodes_by_id[v].breakout_multiplier
                    for v in video_ids
                    if nodes_by_id[v].channel_id == ch
                )
                if s > best_sum:
                    best_sum = s
                    best_ch = ch
            dominant_channel_id = best_ch

        kw_flat: List[str] = []
        for v in video_ids:
            kw_flat.extend(nodes_by_id[v].keywords)
        top3_kw = [w for w, _ in Counter(kw_flat).most_common(3)]

        breakouts = [nodes_by_id[v].breakout_multiplier for v in video_ids]
        avg_breakout = (
            float(statistics.mean(breakouts)) if breakouts else 0.0
        )

        channel_share = max_c / len(video_ids) if video_ids else 0.0
        is_opportunity = avg_breakout > 2.0 and channel_share <= 0.5

        clusters_out.append(
            MarketCluster(
                cluster_id=idx,
                video_ids=video_ids,
                dominant_channel_id=dominant_channel_id,
                dominant_keywords=top3_kw,
                avg_breakout=avg_breakout,
                is_opportunity=is_opportunity,
            )
        )

    clusters_out.sort(key=lambda c: len(c.video_ids), reverse=True)
    for new_id, c in enumerate(clusters_out):
        c.cluster_id = new_id
    return clusters_out


def _find_bridge_videos(
    nodes: List[GraphNode],
    clusters: List[MarketCluster],
) -> List[str]:
    """
    Returns video IDs whose keywords map to at least two distinct clusters.
    """
    keyword_to_clusters: Dict[str, Set[int]] = defaultdict(set)
    for cluster in clusters:
        cid = cluster.cluster_id
        for vid in cluster.video_ids:
            node = next((n for n in nodes if n.video_id == vid), None)
            if not node:
                continue
            for kw in node.keywords:
                keyword_to_clusters[kw].add(cid)

    bridges: List[str] = []
    for node in nodes:
        union_clusters: Set[int] = set()
        for kw in node.keywords:
            union_clusters |= keyword_to_clusters.get(kw, set())
        if len(union_clusters) >= 2:
            bridges.append(node.video_id)
    return bridges


def _build_analyst_summary(signals: MarketGraphSignals) -> str:
    """
    Builds a 3–5 sentence analyst-facing paragraph from computed graph signals.
    """
    sentences: List[str] = []

    if signals.is_monopoly:
        sentences.append(
            f"This market is monopolised: one channel controls "
            f"{signals.monopoly_share_pct:.0f}% of top-ranking content, making "
            f"organic discovery extremely difficult for new entrants."
        )
    elif signals.is_fragmented:
        sentences.append(
            f"This market is fragmented across {signals.unique_categories} content "
            f"categories, suggesting no single creator has established authority "
            f"— an opening for a focused entrant."
        )
    elif signals.cluster_count == 1:
        sentences.append(
            "This market is unified with a single dominant content cluster, meaning "
            "creators compete head-to-head on the same keywords and format."
        )
    else:
        sentences.append(
            f"This market has {signals.cluster_count} distinct content clusters, "
            f"suggesting multiple audience sub-groups with different needs — each a "
            f"potential entry point."
        )

    if signals.top_breakout_multiplier >= 10.0:
        sentences.append(
            f"The top video has a breakout multiplier of "
            f"{signals.top_breakout_multiplier:.1f}x, indicating winner-takes-all "
            f"dynamics where one piece of content dominates all traffic."
        )
    elif signals.avg_breakout_multiplier >= 2.0:
        sentences.append(
            f"The average breakout multiplier is {signals.avg_breakout_multiplier:.1f}x, "
            f"suggesting the market rewards quality content with above-average reach."
        )
    else:
        sentences.append(
            f"The average breakout multiplier is {signals.avg_breakout_multiplier:.1f}x, "
            f"indicating most content in this niche performs at or below channel "
            f"average — low upside for generic entries."
        )

    if signals.trend_status == "ACTIVE":
        sentences.append(
            f"{signals.recent_video_count} of {signals.total_videos} competitor videos "
            f"were published in the last 90 days, confirming this is an actively "
            f"contested niche right now."
        )
    elif signals.trend_status == "MODERATE":
        sentences.append(
            f"Content activity is moderate — {signals.recent_video_count} recent "
            f"videos suggest the niche is stable but not surging."
        )
    else:
        sentences.append(
            f"Only {signals.recent_video_count} of {signals.total_videos} videos were "
            f"published recently, indicating a stale or declining interest in this topic."
        )

    if signals.has_opportunity_cluster:
        sentences.append(
            "At least one content cluster shows above-average breakout with no single "
            "dominant channel — a clear entry window for a differentiated creator."
        )
    elif len(signals.bridge_video_ids) > 0:
        sentences.append(
            f"{len(signals.bridge_video_ids)} video(s) bridge multiple content "
            f"clusters, suggesting cross-niche appeal is possible if the right angle "
            f"is found."
        )

    if signals.small_creator_success_rate == "HIGH":
        sentences.append(
            "Small creators have broken out successfully in this niche — the market "
            "is accessible."
        )
    elif signals.small_creator_success_rate == "MEDIUM":
        sentences.append(
            "Small creator breakouts exist but are rare — differentiation is essential "
            "to avoid being buried by established channels."
        )
    else:
        sentences.append(
            "Small creators have not broken out meaningfully in this data — entering "
            "without a sharp differentiation strategy carries high risk."
        )

    return " ".join(sentences)


def _empty_signals() -> MarketGraphSignals:
    return MarketGraphSignals(
        total_videos=0,
        unique_channels=0,
        unique_categories=0,
        is_monopoly=False,
        monopoly_channel_id="",
        monopoly_share_pct=0.0,
        is_fragmented=False,
        is_personality_driven=False,
        clusters=[],
        cluster_count=0,
        has_opportunity_cluster=False,
        bridge_video_ids=[],
        dominant_keywords=[],
        rare_keywords=[],
        keyword_saturation="Insufficient data",
        top_breakout_multiplier=0.0,
        avg_breakout_multiplier=0.0,
        breakout_distribution={},
        avg_age_days=0.0,
        trend_status="Insufficient data",
        recent_video_count=0,
        analyst_summary="Insufficient competitor data — graph analysis unavailable.",
        market_dynamics="STABLE",
        small_creator_success_rate="LOW",
        median_subscriber_count=0.0,
    )


def build_market_graph(intel: CompetitorIntelligence) -> MarketGraphSignals:
    """
    Builds graph-based market signals from competitor intelligence for the analyst agent.
    """
    if not intel.all_videos or not intel.scrape_successful:
        return _empty_signals()

    # Stage A — GraphNodes
    nodes: List[GraphNode] = []
    for v in intel.all_videos:
        nodes.append(
            GraphNode(
                video_id=v.video_id,
                title=v.title,
                channel_id=v.channel_id,
                subscriber_count=v.subscriber_count,
                breakout_multiplier=v.breakout_multiplier,
                age_days=v.age_days,
                category_id=v.category_id,
                keywords=_extract_keywords(v.title),
            )
        )

    total_videos = len(nodes)
    unique_channels = len({n.channel_id for n in nodes})
    unique_categories = len({n.category_id for n in nodes if n.category_id})

    # Stage C — Monopoly
    channel_counts = Counter(n.channel_id for n in nodes)
    top_channel_id, max_count = channel_counts.most_common(1)[0]
    monopoly_share_pct = (max_count / total_videos) * 100.0
    is_monopoly = monopoly_share_pct > 40.0
    monopoly_channel_id = top_channel_id if is_monopoly else ""

    # Stage D
    is_fragmented = unique_categories >= 4
    personality_count = sum(1 for n in nodes if n.category_id in {"22", "24"})
    is_personality_driven = (
        (personality_count / total_videos) > 0.5 if total_videos > 0 else False
    )

    # Stage E — Keywords
    all_keywords: List[str] = []
    for n in nodes:
        all_keywords.extend(n.keywords)
    keyword_counter = Counter(all_keywords)
    dominant_keywords = [w for w, _ in keyword_counter.most_common(5)]
    rare_keywords = [w for w, c in keyword_counter.items() if c == 1][:10]

    saturation_hits = 0
    if dominant_keywords and total_videos > 0:
        for w in dominant_keywords:
            vids_with = sum(1 for n in nodes if w in n.keywords)
            if (vids_with / total_videos) > 0.5:
                saturation_hits += 1
    if saturation_hits >= 4:
        keyword_saturation = "HIGH"
    elif saturation_hits >= 2:
        keyword_saturation = "MEDIUM"
    else:
        keyword_saturation = "LOW"

    # Stage F — Breakout
    multipliers = [n.breakout_multiplier for n in nodes]
    breakout_distribution: Dict[str, int] = defaultdict(int)
    for m in multipliers:
        breakout_distribution[_classify_breakout(m)] += 1
    top_breakout_multiplier = max(multipliers) if nodes else 0.0
    avg_breakout_multiplier = (
        round(statistics.mean(multipliers), 2) if nodes else 0.0
    )

    # Stage G — Age / trend
    ages = [n.age_days for n in nodes]
    avg_age_days = round(statistics.mean(ages), 1) if nodes else 0.0
    recent_video_count = sum(1 for n in nodes if n.age_days < 90)
    recent_ratio = recent_video_count / total_videos if total_videos > 0 else 0.0
    if recent_ratio > 0.4:
        trend_status = "ACTIVE"
    elif recent_ratio > 0.2:
        trend_status = "MODERATE"
    else:
        trend_status = "STALE"

    # Stage H — Small creator success
    total_breakout_videos = sum(1 for n in nodes if n.breakout_multiplier >= 2.0)
    small_breakout_videos = sum(
        1
        for n in nodes
        if n.breakout_multiplier >= 2.0 and n.subscriber_count < 10_000
    )
    small_ratio = (
        small_breakout_videos / total_breakout_videos
        if total_breakout_videos > 0
        else 0.0
    )
    if small_ratio >= 0.6:
        small_creator_success_rate = "HIGH"
    elif small_ratio >= 0.3:
        small_creator_success_rate = "MEDIUM"
    else:
        small_creator_success_rate = "LOW"

    # Stage I — Market dynamics
    if (
        avg_breakout_multiplier > 0
        and top_breakout_multiplier / avg_breakout_multiplier > 10
    ):
        market_dynamics = "WINNER_TAKES_ALL"
    elif len(nodes) >= 2:
        mean_mul = statistics.mean(multipliers)
        std_mul = statistics.stdev(multipliers)
        if std_mul > mean_mul:
            market_dynamics = "VOLATILE"
        else:
            market_dynamics = "STABLE"
    else:
        market_dynamics = "STABLE"

    # Stage J — Clusters
    clusters = _build_clusters(nodes)
    cluster_count = len(clusters)
    has_opportunity_cluster = any(c.is_opportunity for c in clusters)

    # Stage K — Bridges
    bridge_video_ids = _find_bridge_videos(nodes, clusters)

    # Stage L — Assemble
    signals = MarketGraphSignals(
        total_videos=total_videos,
        unique_channels=unique_channels,
        unique_categories=unique_categories,
        is_monopoly=is_monopoly,
        monopoly_channel_id=monopoly_channel_id,
        monopoly_share_pct=monopoly_share_pct,
        is_fragmented=is_fragmented,
        is_personality_driven=is_personality_driven,
        clusters=clusters,
        cluster_count=cluster_count,
        has_opportunity_cluster=has_opportunity_cluster,
        bridge_video_ids=bridge_video_ids,
        dominant_keywords=dominant_keywords,
        rare_keywords=rare_keywords,
        keyword_saturation=keyword_saturation,
        top_breakout_multiplier=top_breakout_multiplier,
        avg_breakout_multiplier=avg_breakout_multiplier,
        breakout_distribution=dict(breakout_distribution),
        avg_age_days=avg_age_days,
        trend_status=trend_status,
        recent_video_count=recent_video_count,
        analyst_summary="",
        market_dynamics=market_dynamics,
        small_creator_success_rate=small_creator_success_rate,
        median_subscriber_count=float(intel.median_subscriber_count),
    )
    signals.analyst_summary = _build_analyst_summary(signals)

    print(
        f"[graph] complete — {cluster_count} clusters, monopoly={is_monopoly}, "
        f"trend={trend_status}, small_creator={small_creator_success_rate}, "
        f"dynamics={market_dynamics}"
    )
    return signals


def signals_to_analyst_context(signals: MarketGraphSignals) -> str:
    """
    Formats MarketGraphSignals into a labelled string block
    for injection into the analyst agent user prompt.
    """
    lines = [
        "MARKET GRAPH SIGNALS:",
        f"- Total competitor videos analysed: {signals.total_videos}",
        f"- Unique channels: {signals.unique_channels}",
        f"- Market dynamics: {signals.market_dynamics}",
        f"- Monopoly detected: {signals.is_monopoly} ({signals.monopoly_share_pct:.0f}% share)",
        f"- Fragmented market: {signals.is_fragmented}",
        f"- Personality driven: {signals.is_personality_driven}",
        f"- Cluster count: {signals.cluster_count}",
        f"- Opportunity cluster exists: {signals.has_opportunity_cluster}",
        f"- Bridge videos: {len(signals.bridge_video_ids)}",
        f"- Dominant keywords: {', '.join(signals.dominant_keywords)}",
        f"- Keyword saturation: {signals.keyword_saturation}",
        f"- Top breakout multiplier: {signals.top_breakout_multiplier:.2f}x",
        f"- Average breakout multiplier: {signals.avg_breakout_multiplier:.2f}x",
        f"- Breakout distribution: {signals.breakout_distribution}",
        f"- Trend status: {signals.trend_status}",
        f"- Recent videos (last 90 days): {signals.recent_video_count}",
        f"- Small creator success rate: {signals.small_creator_success_rate}",
        f"- Median competitor subscriber count: {signals.median_subscriber_count:,.0f}",
        "",
        "MARKET INTELLIGENCE SUMMARY:",
        signals.analyst_summary,
    ]
    return "\n".join(lines)


if __name__ == "__main__":
    import os
    import sys

    sys.stdout.reconfigure(encoding="utf-8")
    from dotenv import load_dotenv

    from competitor_scraper import scrape_competitor_intelligence

    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))
    api_key = os.getenv("YOUTUBE_API_KEY")

    if not api_key:
        print("ERROR: YOUTUBE_API_KEY not found in .env")
    else:
        queries = [
            "how to build SaaS with Next.js and Stripe",
            "Next.js Stripe subscription tutorial",
            "Stripe webhook handling Next.js tutorial",
        ]
        print("[test] scraping competitor data...")
        intel = scrape_competitor_intelligence(queries, api_key)
        print(f"[test] scrape_successful: {intel.scrape_successful}")

        print("[test] building market graph...")
        signals = build_market_graph(intel)

        print("\n--- MARKET GRAPH SIGNALS ---")
        print(f"total_videos: {signals.total_videos}")
        print(f"unique_channels: {signals.unique_channels}")
        print(f"is_monopoly: {signals.is_monopoly} ({signals.monopoly_share_pct:.0f}%)")
        print(f"is_fragmented: {signals.is_fragmented}")
        print(f"cluster_count: {signals.cluster_count}")
        print(f"has_opportunity_cluster: {signals.has_opportunity_cluster}")
        print(f"dominant_keywords: {signals.dominant_keywords}")
        print(f"keyword_saturation: {signals.keyword_saturation}")
        print(f"top_breakout: {signals.top_breakout_multiplier:.2f}x")
        print(f"avg_breakout: {signals.avg_breakout_multiplier:.2f}x")
        print(f"trend_status: {signals.trend_status}")
        print(f"market_dynamics: {signals.market_dynamics}")
        print(f"small_creator_success_rate: {signals.small_creator_success_rate}")
        print(f"\n--- ANALYST CONTEXT ---")
        print(signals_to_analyst_context(signals))
