from datetime import datetime, timedelta
from typing import List, Dict, Any


def bucket_readings(readings: List[Any], bucket_minutes: int = 5) -> List[Dict]:
    if not readings:
        return []

    buckets: Dict[datetime, List[float]] = {}
    for r in readings:
        ts = r.timestamp
        bucket_key = ts.replace(
            minute=(ts.minute // bucket_minutes) * bucket_minutes,
            second=0,
            microsecond=0,
        )
        buckets.setdefault(bucket_key, []).append(r.value)

    result = []
    for ts in sorted(buckets.keys()):
        vals = buckets[ts]
        result.append({
            "timestamp": ts.isoformat(),
            "value": sum(vals) / len(vals),
            "min": min(vals),
            "max": max(vals),
            "count": len(vals),
        })
    return result


def interpolate_gaps(readings: List[Dict], max_gap_seconds: int = 30) -> List[Dict]:
    if len(readings) < 2:
        return readings

    result = [readings[0]]
    for i in range(1, len(readings)):
        prev = result[-1]
        curr = readings[i]
        prev_ts = datetime.fromisoformat(prev["timestamp"])
        curr_ts = datetime.fromisoformat(curr["timestamp"])
        gap = (curr_ts - prev_ts).total_seconds()

        if gap > max_gap_seconds and gap < max_gap_seconds * 10:
            steps = int(gap / max_gap_seconds)
            for step in range(1, steps):
                frac = step / steps
                interp_ts = prev_ts + timedelta(seconds=gap * frac)
                interp_val = prev["value"] + frac * (curr["value"] - prev["value"])
                result.append({
                    "timestamp": interp_ts.isoformat(),
                    "value": round(interp_val, 3),
                    "interpolated": True,
                })
        result.append(curr)
    return result
