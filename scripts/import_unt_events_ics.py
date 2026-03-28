#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass, field
from datetime import date, datetime, time, timedelta, timezone
from difflib import SequenceMatcher
from pathlib import Path
from typing import Iterable, Optional, Sequence
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

DEFAULT_CALENDAR_URL = (
    "https://calendar.unt.edu/calendar.ics"
    "?card_size=small&days=120&experience=inperson"
)
DEFAULT_IGNORE_LOCATIONS = (
    "UNIVERSITY OF NORTH TEXAS",
    "ALL DINING HALLS",
    "ANY DINING HALL",
    "DISCOVERY PARK BUILDING",
    "UNT COLAB",
    "FRISCO LANDING -- UNT AT FRISCO",
)
DEFAULT_OUTPUT_PATH = Path("database/seed_unt_events.sql")
DEFAULT_REQUEST_TIMEOUT = 60
LOCAL_TIME_ZONE = ZoneInfo("America/Chicago")

SINGULAR_OVERRIDES = {
    "halls": "hall",
    "fields": "field",
    "buildings": "building",
    "centers": "center",
    "centres": "center",
}
EXPLICIT_LOCATION_OVERRIDES = {
    "UNIVERSITY UNION SOUTH LAWN": "University Union",
    "LIBRARY MALL": "Willis Library",
    "14C - SAGEMORE LAWN C": "Sage Hall",
    "SAGEMORE LAWN C": "Sage Hall",
    "SAGEMORE LAWN": "Sage Hall",
}
ICS_STATUS_MAP = {
    "CANCELLED": "CANCELLED",
    "CONFIRMED": "SCHEDULED",
    "TENTATIVE": "SCHEDULED",
}
AUTO_CREATED_LOCATION_DESCRIPTION = "Auto-created from UNT calendar event import."
REQUEST_HEADERS = {
    "Accept": "text/calendar, text/plain;q=0.9, */*;q=0.1",
    "User-Agent": "quadcore-capstone-project/ics-importer",
}


@dataclass(frozen=True)
class Candidate:
    location_id: str
    kind: str
    name: str
    location_name: str
    building_name: str
    room_number: str
    latitude: Optional[float]
    longitude: Optional[float]
    aliases: set[str] = field(default_factory=set)


@dataclass
class ImportedEvent:
    source_uid: str
    source_recurrence_id: str
    source_url: str
    title: str
    description: str
    start_time: datetime
    end_time: datetime
    status: str
    location_name: str
    categories: list[str]
    all_day: bool
    event_type: str
    latitude: Optional[float]
    longitude: Optional[float]
    room_hint: str = ""
    match: Optional[Candidate] = None
    match_reason: str = ""


@dataclass
class SkippedEvent:
    title: str
    reason: str
    source_url: str
    source_location: str
    room_hint: str


def clean_text(value: str) -> str:
    normalized = (value or "").replace("\xa0", " ")
    normalized = re.sub(r"\s+", " ", normalized)
    return normalized.strip()


def sql_literal(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def sql_text_or_null(value: str) -> str:
    return sql_literal(value) if value else "NULL"


def sql_timestamp(value: datetime) -> str:
    return "TIMESTAMP " + sql_literal(value.strftime("%Y-%m-%d %H:%M:%S"))


def sql_jsonb(value: object) -> str:
    return sql_literal(json.dumps(value, sort_keys=True)) + "::jsonb"


def dedupe_preserving_order(values: Iterable[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for value in values:
        if not value or value in seen:
            continue
        seen.add(value)
        ordered.append(value)
    return ordered


def normalize_text(value: str) -> str:
    cleaned = clean_text(value).lower()
    cleaned = cleaned.replace("&", " and ")
    cleaned = cleaned.replace("@", " at ")
    cleaned = cleaned.replace("’", "")
    cleaned = cleaned.replace("'", "")
    cleaned = re.sub(r"\b(center|centre)\b", "center", cleaned)
    cleaned = re.sub(r"\b(bldg|bld)\b", "building", cleaned)
    cleaned = re.sub(r"\bbuilding\b", " ", cleaned)
    cleaned = re.sub(r"[^a-z0-9]+", " ", cleaned)
    return " ".join(SINGULAR_OVERRIDES.get(token, token) for token in cleaned.split())


def alias_variants(value: str) -> set[str]:
    cleaned = clean_text(value)
    if not cleaned:
        return set()

    variants = {
        cleaned,
        re.sub(r"\([^)]*\)", " ", cleaned).strip(),
        re.sub(r"\bBuilding\b", " ", cleaned, flags=re.IGNORECASE).strip(),
        re.sub(r"\bFields\b", "Field", cleaned, flags=re.IGNORECASE).strip(),
        re.sub(r"\bHalls\b", "Hall", cleaned, flags=re.IGNORECASE).strip(),
    }
    for paren_value in re.findall(r"\(([^)]*)\)", cleaned):
        variants.add(paren_value)

    return {
        normalize_text(candidate)
        for candidate in variants
        if normalize_text(candidate)
    }


def room_alias_variants(building_name: str, room_number: str) -> set[str]:
    room_number = clean_text(room_number)
    if not room_number:
        return set()

    variants: set[str] = set()
    base_name = clean_text(building_name)
    if not base_name:
        return variants
    variants.update(alias_variants(f"{base_name} {room_number}"))
    variants.update(alias_variants(f"{base_name}, {room_number}"))
    variants.update(alias_variants(f"{base_name} room {room_number}"))
    return variants


def extract_room_number(value: str) -> str:
    cleaned = clean_text(value)
    if not cleaned:
        return ""

    room_number_match = re.search(
        r"\broom\s+(?P<room>[A-Za-z]?\d[\w-]*)\b",
        cleaned,
        flags=re.IGNORECASE,
    )
    if room_number_match:
        return clean_text(room_number_match.group("room"))

    standalone_match = re.fullmatch(r"[A-Za-z]?\d[\w-]*", cleaned)
    if standalone_match:
        return cleaned

    embedded_match = re.search(r"\b(?P<room>[A-Za-z]?\d[\w-]*)\b", cleaned)
    if embedded_match:
        return clean_text(embedded_match.group("room"))

    return ""


def room_hint_priority(value: str) -> int:
    cleaned = clean_text(value)
    if not cleaned:
        return 0
    if re.fullmatch(r"[A-Za-z]?\d[\w-]*", cleaned):
        return 3
    if re.search(r"\b[A-Za-z]?\d[\w-]*\b", cleaned):
        return 2
    return 1


def alias_priority(value: str) -> tuple[int, int, int, str]:
    cleaned = clean_text(value)
    token_count = len(cleaned.split())
    has_room_number = 1 if re.search(r"\b[A-Za-z]?\d[\w-]*\b", cleaned) else 0
    return (has_room_number, token_count, len(cleaned), cleaned)


def parse_room_location(raw_location: str) -> tuple[str, str]:
    cleaned = clean_text(raw_location)
    if not cleaned:
        return "", ""

    at_match = re.match(
        r"^(?P<room>.+?)\s+at\s+(?:the\s+)?(?P<building>.+?)(?:\s*\((?P<paren>[^)]+)\))?$",
        cleaned,
        flags=re.IGNORECASE,
    )
    if at_match:
        paren_room = extract_room_number(clean_text(at_match.group("paren") or ""))
        room = paren_room or extract_room_number(clean_text(at_match.group("room")))
        return clean_text(at_match.group("building")), room

    paren_match = re.match(
        r"^(?P<building>.+?)\s*\((?P<room>[^)]+)\)$",
        cleaned,
        flags=re.IGNORECASE,
    )
    if paren_match:
        return clean_text(paren_match.group("building")), extract_room_number(clean_text(paren_match.group("room")))

    comma_match = re.match(
        r"^(?P<building>.+?),\s*(?P<room>[^,]+)$",
        cleaned,
        flags=re.IGNORECASE,
    )
    if comma_match:
        return clean_text(comma_match.group("building")), extract_room_number(clean_text(comma_match.group("room")))

    room_match = re.match(
        r"^(?P<building>.+?)\s+(?:room\s+)?(?P<room>[A-Za-z]?\d[\w-]*)$",
        cleaned,
        flags=re.IGNORECASE,
    )
    if room_match:
        return clean_text(room_match.group("building")), extract_room_number(clean_text(room_match.group("room")))

    return "", ""


def normalize_calendar_url(calendar_url: str, days: int) -> str:
    split_url = urlsplit(calendar_url)
    scheme = "https" if split_url.scheme == "webcal" else (split_url.scheme or "https")
    query = dict(parse_qsl(split_url.query, keep_blank_values=True))
    if days > 0:
        query["days"] = str(days)
    return urlunsplit((scheme, split_url.netloc, split_url.path, urlencode(query), split_url.fragment))


def fetch_calendar_text(calendar_url: str) -> str:
    request = Request(calendar_url, headers=REQUEST_HEADERS)
    with urlopen(request, timeout=DEFAULT_REQUEST_TIMEOUT) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


def unfold_ics_lines(calendar_text: str) -> list[str]:
    lines: list[str] = []
    for raw_line in calendar_text.splitlines():
        if raw_line[:1] in {" ", "\t"} and lines:
            lines[-1] += raw_line[1:]
        else:
            lines.append(raw_line.rstrip("\r"))
    return lines


def parse_property_line(line: str) -> tuple[str, dict[str, str], str]:
    if ":" not in line:
        return "", {}, ""
    name_and_params, value = line.split(":", 1)
    parts = name_and_params.split(";")
    params = {}
    for part in parts[1:]:
        if "=" not in part:
            continue
        key, raw_value = part.split("=", 1)
        params[key.upper()] = raw_value
    return parts[0].upper(), params, value


def decode_ics_text(value: str) -> str:
    decoded: list[str] = []
    index = 0
    while index < len(value):
        char = value[index]
        if char == "\\" and index + 1 < len(value):
            next_char = value[index + 1]
            if next_char in {"n", "N"}:
                decoded.append("\n")
                index += 2
                continue
            if next_char in {",", ";", "\\"}:
                decoded.append(next_char)
                index += 2
                continue
        decoded.append(char)
        index += 1
    return "".join(decoded)


def split_ics_list(value: str) -> list[str]:
    items: list[str] = []
    current: list[str] = []
    escaped = False
    for char in value:
        if escaped:
            current.append("\n" if char in {"n", "N"} else char)
            escaped = False
            continue
        if char == "\\":
            escaped = True
            continue
        if char == ",":
            item = clean_text("".join(current))
            if item:
                items.append(item)
            current = []
            continue
        current.append(char)

    item = clean_text("".join(current))
    if item:
        items.append(item)
    return items


def parse_ics_datetime(value: str, params: dict[str, str]) -> tuple[datetime, bool]:
    if params.get("VALUE", "").upper() == "DATE" or re.fullmatch(r"\d{8}", value):
        parsed_date = date.fromisoformat(f"{value[0:4]}-{value[4:6]}-{value[6:8]}")
        return datetime.combine(parsed_date, time.min), True

    for format_candidate in ("%Y%m%dT%H%M%SZ", "%Y%m%dT%H%M%S", "%Y%m%dT%H%M"):
        try:
            parsed = datetime.strptime(value, format_candidate)
        except ValueError:
            continue
        if format_candidate.endswith("Z"):
            parsed = parsed.replace(tzinfo=timezone.utc).astimezone(LOCAL_TIME_ZONE).replace(tzinfo=None)
        else:
            parsed = parsed.replace(tzinfo=LOCAL_TIME_ZONE).replace(tzinfo=None)
        return parsed, False
    raise ValueError(f"Unsupported ICS datetime value: {value}")


def parse_geo(value: str) -> tuple[Optional[float], Optional[float]]:
    if ";" not in value:
        return None, None
    raw_latitude, raw_longitude = value.split(";", 1)
    try:
        return float(raw_latitude), float(raw_longitude)
    except ValueError:
        return None, None


def first_property(
    properties: dict[str, list[tuple[dict[str, str], str]]],
    name: str,
) -> tuple[dict[str, str], str]:
    values = properties.get(name.upper(), [])
    return values[0] if values else ({}, "")


def derive_event_type(categories: Sequence[str]) -> str:
    primary_category = next((clean_text(value) for value in categories if clean_text(value)), "")
    return primary_category or "Other"


def build_event_from_properties(properties: dict[str, list[tuple[dict[str, str], str]]]) -> ImportedEvent:
    _, raw_summary = first_property(properties, "SUMMARY")
    dtstart_params, raw_start = first_property(properties, "DTSTART")
    dtend_params, raw_end = first_property(properties, "DTEND")
    _, raw_description = first_property(properties, "DESCRIPTION")
    _, raw_location = first_property(properties, "LOCATION")
    _, raw_status = first_property(properties, "STATUS")
    _, raw_url = first_property(properties, "URL")
    _, raw_uid = first_property(properties, "UID")
    _, raw_recurrence_id = first_property(properties, "RECURRENCE-ID")
    _, raw_geo = first_property(properties, "GEO")

    title = clean_text(decode_ics_text(raw_summary))
    if not title or not raw_start:
        raise ValueError("Event is missing SUMMARY or DTSTART")

    start_time, is_all_day = parse_ics_datetime(raw_start, dtstart_params)
    if raw_end:
        end_time, end_is_all_day = parse_ics_datetime(raw_end, dtend_params)
        if is_all_day and not end_is_all_day:
            raise ValueError("All-day event has mixed DATE and DATE-TIME boundaries")
    else:
        end_time = start_time + (timedelta(days=1) if is_all_day else timedelta(hours=1))
    if end_time <= start_time:
        end_time = start_time + (timedelta(days=1) if is_all_day else timedelta(hours=1))

    categories: list[str] = []
    for _, raw_categories in properties.get("CATEGORIES", []):
        categories.extend(split_ics_list(raw_categories))
    categories = dedupe_preserving_order(clean_text(value) for value in categories if clean_text(value))

    location_name = clean_text(decode_ics_text(raw_location))
    description = re.sub(r"\n{3,}", "\n\n", decode_ics_text(raw_description).strip())
    latitude, longitude = parse_geo(raw_geo)

    return ImportedEvent(
        source_uid=decode_ics_text(raw_uid),
        source_recurrence_id=raw_recurrence_id,
        source_url=decode_ics_text(raw_url),
        title=title,
        description=description,
        start_time=start_time,
        end_time=end_time,
        status=ICS_STATUS_MAP.get(clean_text(raw_status.upper()), "SCHEDULED"),
        location_name=location_name,
        categories=categories,
        all_day=is_all_day,
        event_type=derive_event_type(categories),
        latitude=latitude,
        longitude=longitude,
        room_hint="",
    )


def parse_calendar_events(calendar_text: str) -> list[ImportedEvent]:
    raw_events: list[dict[str, list[tuple[dict[str, str], str]]]] = []
    current_event: Optional[dict[str, list[tuple[dict[str, str], str]]]] = None

    for line in unfold_ics_lines(calendar_text):
        if line == "BEGIN:VEVENT":
            current_event = {}
            continue
        if line == "END:VEVENT":
            if current_event is not None:
                raw_events.append(current_event)
            current_event = None
            continue
        if current_event is None:
            continue
        name, params, value = parse_property_line(line)
        if name:
            current_event.setdefault(name, []).append((params, value))

    deduped_events: dict[tuple[str, str], ImportedEvent] = {}
    for properties in raw_events:
        event = build_event_from_properties(properties)
        dedupe_key = (
            event.source_uid or f"{event.title}|{event.start_time.isoformat()}",
            event.source_recurrence_id,
        )
        deduped_events[dedupe_key] = event
    return list(deduped_events.values())


def load_database_url(cli_value: str) -> str:
    if cli_value:
        return cli_value
    if os.environ.get("DATABASE_URL"):
        return os.environ["DATABASE_URL"]

    env_path = Path(".env")
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            if line.startswith("DATABASE_URL="):
                return line.split("=", 1)[1].strip()
    return ""


def build_psql_command(
    database_url: str,
    psql_bin: str,
    *,
    docker_container: str,
) -> list[str]:
    if psql_bin != "psql":
        if not database_url:
            raise ValueError("DATABASE_URL or --database-url is required when using a custom psql binary")
        return [psql_bin, database_url]

    if database_url and shutil.which("psql"):
        return [psql_bin, database_url]

    if not shutil.which("docker"):
        raise FileNotFoundError(
            "Neither a usable local 'psql' configuration nor Docker is available. "
            "Install psql, add it to PATH with DATABASE_URL set, or run with Docker installed "
            "and the database container running."
        )

    return [
        "docker",
        "exec",
        "-i",
        docker_container,
        "sh",
        "-lc",
        'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"',
    ]


def load_candidates(database_url: str, psql_bin: str) -> list[Candidate]:
    query = """
    SELECT
      source_kind,
      location_id,
      source_name,
      location_name,
      building_name,
      room_number,
      latitude,
      longitude
    FROM (
      SELECT
        'location' AS source_kind,
        l.location_id::text AS location_id,
        l.name AS source_name,
        l.name AS location_name,
        '' AS building_name,
        '' AS room_number,
        COALESCE(ST_Y(l.coordinates)::text, '') AS latitude,
        COALESCE(ST_X(l.coordinates)::text, '') AS longitude
      FROM locations l
      UNION ALL
      SELECT
        'poi' AS source_kind,
        p.location_id::text AS location_id,
        p.name AS source_name,
        l.name AS location_name,
        COALESCE(p.building_name, '') AS building_name,
        COALESCE(p.room_number, '') AS room_number,
        COALESCE(ST_Y(l.coordinates)::text, '') AS latitude,
        COALESCE(ST_X(l.coordinates)::text, '') AS longitude
      FROM points_of_interest p
      JOIN locations l ON l.location_id = p.location_id
      WHERE COALESCE(p.is_active, true)
    ) candidates
    ORDER BY source_kind, location_name, source_name;
    """

    psql_command = build_psql_command(
        database_url,
        psql_bin,
        docker_container=os.environ.get("IMPORT_EVENTS_DB_CONTAINER", "db"),
    )
    result = subprocess.run(
        [*psql_command, "-X", "-A", "-F", "\t", "-t", "-c", query],
        check=True,
        capture_output=True,
        text=True,
    )

    candidates: list[Candidate] = []
    for line in result.stdout.splitlines():
        if not line.strip():
            continue
        kind, location_id, source_name, location_name, building_name, room_number, latitude, longitude = line.split("\t")
        aliases = set()
        aliases.update(alias_variants(source_name))
        aliases.update(alias_variants(location_name))
        aliases.update(alias_variants(building_name))
        aliases.update(room_alias_variants(building_name, room_number))
        candidates.append(
            Candidate(
                location_id=location_id,
                kind=kind,
                name=source_name,
                location_name=location_name,
                building_name=building_name,
                room_number=room_number,
                latitude=float(latitude) if latitude else None,
                longitude=float(longitude) if longitude else None,
                aliases=aliases,
            )
        )
    return candidates


def event_source_aliases(event: ImportedEvent) -> tuple[set[str], str]:
    aliases = set(alias_variants(event.location_name))
    override_target = EXPLICIT_LOCATION_OVERRIDES.get(event.location_name.upper())
    if override_target:
        aliases.update(alias_variants(override_target))

    room_hint = ""
    building_name, parsed_room_hint = parse_room_location(event.location_name)
    if building_name:
        aliases.update(alias_variants(building_name))
        if room_hint_priority(parsed_room_hint) >= 2:
            aliases.update(room_alias_variants(building_name, parsed_room_hint))
    if room_hint_priority(parsed_room_hint) > room_hint_priority(room_hint):
        room_hint = parsed_room_hint
    return aliases, room_hint


def distance_meters(
    source_lat: Optional[float],
    source_lon: Optional[float],
    target_lat: Optional[float],
    target_lon: Optional[float],
) -> Optional[float]:
    if None in (source_lat, source_lon, target_lat, target_lon):
        return None

    from math import asin, cos, radians, sin, sqrt

    source_lat_r = radians(source_lat)
    source_lon_r = radians(source_lon)
    target_lat_r = radians(target_lat)
    target_lon_r = radians(target_lon)
    lat_delta = target_lat_r - source_lat_r
    lon_delta = target_lon_r - source_lon_r
    haversine = sin(lat_delta / 2) ** 2 + cos(source_lat_r) * cos(target_lat_r) * sin(lon_delta / 2) ** 2
    arc = 2 * asin(min(1.0, sqrt(haversine)))
    return 6371000 * arc


def pick_best_candidate(event: ImportedEvent, options: Sequence[Candidate]) -> Candidate:
    if len(options) == 1:
        return options[0]

    def sort_key(candidate: Candidate) -> tuple[float, int, str, str]:
        distance = distance_meters(event.latitude, event.longitude, candidate.latitude, candidate.longitude)
        return (
            distance if distance is not None else float("inf"),
            0 if candidate.kind == "location" else 1,
            candidate.location_name,
            candidate.name,
        )

    return sorted(options, key=sort_key)[0]


def match_event_location(event: ImportedEvent, candidates: Sequence[Candidate]) -> tuple[Optional[Candidate], str, str]:
    source_aliases, room_hint = event_source_aliases(event)
    if not source_aliases:
        return None, "missing source aliases", room_hint

    exact_alias_map: dict[str, list[Candidate]] = {}
    for candidate in candidates:
        for alias in candidate.aliases:
            exact_alias_map.setdefault(alias, []).append(candidate)

    for alias in sorted(source_aliases, key=alias_priority, reverse=True):
        options = exact_alias_map.get(alias, [])
        if options:
            return pick_best_candidate(event, options), f"exact alias match on '{alias}'", room_hint

    best_candidate: Optional[Candidate] = None
    best_score = 0.0
    best_reason = ""
    for candidate in candidates:
        for source_alias in source_aliases:
            source_tokens = set(source_alias.split())
            if not source_tokens:
                continue
            for candidate_alias in candidate.aliases:
                candidate_tokens = set(candidate_alias.split())
                if not candidate_tokens:
                    continue
                ratio = SequenceMatcher(None, source_alias, candidate_alias).ratio()
                overlap = len(source_tokens & candidate_tokens) / max(len(source_tokens), len(candidate_tokens))
                if source_tokens == candidate_tokens:
                    score = 0.98
                    reason = f"token-equal '{source_alias}'"
                elif source_tokens.issubset(candidate_tokens) or candidate_tokens.issubset(source_tokens):
                    score = max(0.93, ratio)
                    reason = f"token-subset '{source_alias}' ~ '{candidate_alias}'"
                else:
                    score = max(ratio, overlap)
                    reason = f"fuzzy '{source_alias}' ~ '{candidate_alias}'"

                distance = distance_meters(event.latitude, event.longitude, candidate.latitude, candidate.longitude)
                if distance is not None and distance <= 250:
                    score += 0.02
                    reason += f", {int(distance)}m away"

                if score > best_score:
                    best_score = score
                    best_candidate = candidate
                    best_reason = reason

    if best_candidate and best_score >= 0.94:
        return best_candidate, best_reason, room_hint
    return None, "no confident location match", room_hint


def should_ignore_event(event: ImportedEvent, ignored_locations: set[str]) -> bool:
    return normalize_text(event.location_name) in ignored_locations


def build_event_metadata(event: ImportedEvent) -> dict[str, object]:
    metadata: dict[str, object] = {
        "source_uid": event.source_uid,
        "source_recurrence_id": event.source_recurrence_id,
        "source_status": event.status,
        "all_day": event.all_day,
        "categories": event.categories,
    }
    if event.latitude is not None and event.longitude is not None:
        metadata["source_geo"] = {
            "latitude": event.latitude,
            "longitude": event.longitude,
        }
    return metadata


def can_auto_create_location(event: ImportedEvent) -> bool:
    return bool(event.location_name) and event.latitude is not None and event.longitude is not None


def render_location_ctes(event: ImportedEvent) -> list[str]:
    if event.match is not None:
        return [
            "\n".join(
                [
                    "resolved_location AS (",
                    f"    SELECT {sql_literal(event.match.location_id)}::uuid AS location_id",
                    ")",
                ]
            )
        ]

    if not can_auto_create_location(event):
        raise ValueError(f"Cannot render event SQL without a resolved location for {event.title}")

    return [
        "\n".join(
            [
                "existing_import_location AS (",
                "    SELECT location_id",
                "    FROM locations",
                f"    WHERE lower(name) = lower({sql_literal(event.location_name)})",
                "    LIMIT 1",
                ")",
            ]
        ),
        "\n".join(
            [
                "inserted_import_location AS (",
                "    INSERT INTO locations (name, description, coordinates)",
                "    SELECT",
                f"        {sql_literal(event.location_name)},",
                f"        {sql_literal(AUTO_CREATED_LOCATION_DESCRIPTION)},",
                "        ST_SetSRID(",
                f"            ST_MakePoint({event.longitude:.6f}, {event.latitude:.6f}),",
                "            4326",
                "        )",
                "    WHERE NOT EXISTS (",
                "        SELECT 1 FROM existing_import_location",
                "    )",
                "    RETURNING location_id",
                ")",
            ]
        ),
        "\n".join(
            [
                "resolved_location AS (",
                "    SELECT location_id FROM existing_import_location",
                "    UNION ALL",
                "    SELECT location_id FROM inserted_import_location",
                "    LIMIT 1",
                ")",
            ]
        ),
    ]


def render_event_sql(event: ImportedEvent) -> str:
    metadata = build_event_metadata(event)
    cte_blocks = render_location_ctes(event)

    statements = [
        f"-- {event.title}",
        f"-- Source URL: {event.source_url}",
    ]
    if event.match is not None:
        statements.append(
            f"-- Location match: {event.location_name} -> {event.match.location_name} ({event.match.location_id})"
        )
        if event.match_reason:
            statements.append(f"-- Match reason: {event.match_reason}")
    elif can_auto_create_location(event):
        statements.append(
            f"-- Auto-created location: {event.location_name} ({event.latitude:.6f}, {event.longitude:.6f})"
        )
        if event.match_reason:
            statements.append(f"-- Match reason: {event.match_reason}")

    cte_blocks.append(
        "\n".join(
            [
                "existing_event AS (",
                "    SELECT e.event_id",
                "    FROM events e",
                "    JOIN event_details d ON d.event_id = e.event_id",
                f"    WHERE d.metadata ->> 'source_uid' = {sql_literal(event.source_uid)}",
                "      AND COALESCE(d.metadata ->> 'source_recurrence_id', '') = "
                f"{sql_literal(event.source_recurrence_id)}",
                "    LIMIT 1",
                ")",
            ]
        )
    )
    cte_blocks.append(
        "\n".join(
            [
                "updated_existing_event AS (",
                "    UPDATE events",
                "    SET",
                f"        title = {sql_literal(event.title)},",
                f"        description = {sql_text_or_null(event.description.strip())},",
                "        location_id = (SELECT location_id FROM resolved_location),",
                f"        start_date_time = {sql_timestamp(event.start_time)},",
                f"        end_date_time = {sql_timestamp(event.end_time)},",
                f"        event_type = {sql_literal(event.event_type)},",
                f"        status = {sql_literal(event.status)}::event_status,",
                "        updated_at = CURRENT_TIMESTAMP",
                "    WHERE event_id IN (SELECT event_id FROM existing_event)",
                "    RETURNING event_id",
                ")",
            ]
        )
    )
    cte_blocks.append(
        "\n".join(
            [
                "inserted_event AS (",
                "    INSERT INTO events (",
                "        title,",
                "        description,",
                "        location_id,",
                "        start_date_time,",
                "        end_date_time,",
                "        event_type,",
                "        status",
                "    )",
                "    SELECT",
                f"        {sql_literal(event.title)},",
                f"        {sql_literal(event.description.strip())},",
                "        (SELECT location_id FROM resolved_location),",
                f"        {sql_timestamp(event.start_time)},",
                f"        {sql_timestamp(event.end_time)},",
                f"        {sql_literal(event.event_type)},",
                f"        {sql_literal(event.status)}::event_status",
                "    WHERE NOT EXISTS (SELECT 1 FROM existing_event)",
                "    RETURNING event_id",
                ")",
            ]
        )
    )
    cte_blocks.append(
        "\n".join(
            [
                "resolved_event AS (",
                "    SELECT event_id FROM inserted_event",
                "    UNION ALL",
                "    SELECT event_id FROM updated_existing_event",
                "    LIMIT 1",
                ")",
            ]
        )
    )
    cte_blocks.append(
        "\n".join(
            [
                "upserted_details AS (",
                "    INSERT INTO event_details (",
                "        event_id,",
                "        source_url,",
                "        source_location_name,",
                "        room_detail,",
                "        metadata",
                "    )",
                "    SELECT",
                "        (SELECT event_id FROM resolved_event),",
                f"        {sql_text_or_null(event.source_url)},",
                f"        {sql_text_or_null(event.location_name)},",
                f"        {sql_text_or_null(event.room_hint)},",
                f"        {sql_jsonb(metadata)}",
                "    WHERE EXISTS (SELECT 1 FROM resolved_event)",
                "    ON CONFLICT (event_id) DO UPDATE",
                "    SET",
                "        source_url = EXCLUDED.source_url,",
                "        source_location_name = EXCLUDED.source_location_name,",
                "        room_detail = EXCLUDED.room_detail,",
                "        metadata = EXCLUDED.metadata,",
                "        updated_at = CURRENT_TIMESTAMP",
                "    RETURNING event_id",
                ")",
            ]
        )
    )

    statements.append("WITH")
    statements.append(",\n".join(cte_blocks))
    statements.append("SELECT event_id FROM resolved_event;")
    return "\n".join(statements)


def render_sql(calendar_url: str, events: Sequence[ImportedEvent], skipped_events: Sequence[SkippedEvent]) -> str:
    lines = [
        "-- Generated by scripts/import_unt_events_ics.py",
        f"-- Generated at: {datetime.now().isoformat(timespec='seconds')}",
        f"-- Source calendar: {calendar_url}",
        f"-- Imported events: {len(events)}",
        f"-- Skipped events: {len(skipped_events)}",
        "BEGIN;",
        "",
    ]

    for event in events:
        lines.append(render_event_sql(event))
        lines.append("")

    if skipped_events:
        lines.append("-- Skipped events summary:")
        for skipped_event in skipped_events:
            lines.append(
                f"-- {skipped_event.title}: {skipped_event.reason}"
                + (f" | location={skipped_event.source_location}" if skipped_event.source_location else "")
                + (f" | url={skipped_event.source_url}" if skipped_event.source_url else "")
            )
        lines.append("")

    lines.append("COMMIT;")
    return "\n".join(lines)


def write_output(path: str, content: str) -> None:
    if path == "-":
        sys.stdout.write(content)
        if not content.endswith("\n"):
            sys.stdout.write("\n")
        return

    output_path = Path(path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(content, encoding="utf-8")


def apply_sql(database_url: str, psql_bin: str, content: str) -> None:
    psql_command = build_psql_command(
        database_url,
        psql_bin,
        docker_container=os.environ.get("IMPORT_EVENTS_DB_CONTAINER", "db"),
    )
    subprocess.run(
        [*psql_command, "-v", "ON_ERROR_STOP=1"],
        input=content,
        check=True,
        text=True,
    )


def parse_args(argv: Optional[Sequence[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Import UNT events from the official ICS feed and emit SQL inserts."
    )
    parser.add_argument("--calendar-url", default=DEFAULT_CALENDAR_URL)
    parser.add_argument("--days", type=int, default=120, help="Look-ahead window to request from the ICS feed.")
    parser.add_argument("--database-url", default="")
    parser.add_argument("--psql-bin", default="psql")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT_PATH))
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument(
        "--no-apply",
        action="store_true",
        help="Only generate the SQL file; do not apply it to Postgres.",
    )
    parser.add_argument(
        "--ignore-location",
        action="append",
        default=[],
        help="Location name to skip entirely. Can be passed multiple times.",
    )
    return parser.parse_args(argv)


def main(argv: Optional[Sequence[str]] = None) -> int:
    args = parse_args(argv)
    database_url = load_database_url(args.database_url)
    candidates = load_candidates(database_url, args.psql_bin)
    calendar_url = normalize_calendar_url(args.calendar_url, args.days)
    ignored_locations = {
        normalize_text(value)
        for value in [*DEFAULT_IGNORE_LOCATIONS, *args.ignore_location]
        if normalize_text(value)
    }

    calendar_events = parse_calendar_events(fetch_calendar_text(calendar_url))
    calendar_events.sort(key=lambda item: (item.start_time, item.title.lower()))
    if args.limit > 0:
        calendar_events = calendar_events[: args.limit]

    imported_events: list[ImportedEvent] = []
    skipped_events: list[SkippedEvent] = []

    for calendar_event in calendar_events:
        if should_ignore_event(calendar_event, ignored_locations):
            skipped_events.append(
                SkippedEvent(
                    title=calendar_event.title,
                    reason=f"ignored location '{calendar_event.location_name}'",
                    source_url=calendar_event.source_url,
                    source_location=calendar_event.location_name,
                    room_hint=calendar_event.room_hint,
                )
            )
            continue

        match, reason, room_hint = match_event_location(calendar_event, candidates)
        calendar_event.room_hint = room_hint
        if match is None:
            if can_auto_create_location(calendar_event):
                calendar_event.match_reason = "auto-created location from ICS coordinates"
                imported_events.append(calendar_event)
                continue
            skipped_events.append(
                SkippedEvent(
                    title=calendar_event.title,
                    reason=f"unmatched location: {calendar_event.location_name}",
                    source_url=calendar_event.source_url,
                    source_location=calendar_event.location_name,
                    room_hint=calendar_event.room_hint,
                )
            )
            continue

        calendar_event.match = match
        calendar_event.match_reason = reason
        imported_events.append(calendar_event)

    if not imported_events:
        print("No events were imported. Check the calendar URL or ignore filters.", file=sys.stderr)
        for skipped_event in skipped_events:
            print(f"- {skipped_event.title}: {skipped_event.reason}", file=sys.stderr)
        return 1

    sql_output = render_sql(calendar_url=calendar_url, events=imported_events, skipped_events=skipped_events)
    write_output(args.output, sql_output)
    if not args.no_apply:
        apply_sql(database_url, args.psql_bin, sql_output)

    print(
        json.dumps(
            {
                "calendar_url": calendar_url,
                "imported_events": len(imported_events),
                "skipped_events": len(skipped_events),
                "output": args.output,
                "applied": not args.no_apply,
            },
            indent=2,
        ),
        file=sys.stderr,
    )
    for skipped_event in skipped_events:
        print(f"- {skipped_event.title}: {skipped_event.reason}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
