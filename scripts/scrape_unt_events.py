#!/usr/bin/env python3

from __future__ import annotations

import argparse
import html
import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass, field
from datetime import date, datetime, time, timedelta
from difflib import SequenceMatcher
from html.parser import HTMLParser
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence, Set, Tuple
from urllib.parse import urlsplit, urlunsplit
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

DEFAULT_WIDGET_URL = (
    "https://calendar.unt.edu/widget/view"
    "?schools=unt&days=31&num=50&experience=inperson&format=html&template=modern"
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
DEFAULT_REPORTER_EMAIL = "calendar-import@unt.local"
DEFAULT_REPORTER_FIRST_NAME = "Calendar"
DEFAULT_REPORTER_LAST_NAME = "Import"
DEFAULT_PASSWORD_HASH = (
    "$2b$10$7EqJtq98hPqEX7fNZaFWoOHiSTtKT4m0TzY4nG8bAh0uJc7kdFN1m"
)
LOCAL_TIME_ZONE = ZoneInfo("America/Chicago")

META_SKIP_CLASSES = {
    "em-event-meta-data-component",
    "em-event-meta-data-container",
    "em-event-meta-data-custom-fields",
}
SINGULAR_OVERRIDES = {
    "halls": "hall",
    "fields": "field",
    "buildings": "building",
    "centers": "center",
    "centres": "center",
}
SCHEMA_STATUS_MAP = {
    "EventScheduled": "SCHEDULED",
    "EventCancelled": "CANCELLED",
    "EventPostponed": "POSTPONED",
    "EventRescheduled": "POSTPONED",
    "EventMovedOnline": "SCHEDULED",
    "EventCompleted": "COMPLETED",
}
EVENT_TYPE_HINTS: Sequence[Tuple[str, Tuple[str, ...]]] = (
    ("CAREER FAIR", ("career fair", "job fair", "recruiter", "recruitment", "hiring")),
    (
        "SPORTS",
        (
            "athletic",
            "athletics",
            "golf",
            "volleyball",
            "soccer",
            "basketball",
            "softball",
            "baseball",
            "tennis",
            "football",
            "intramural",
            "rec sports",
            "recsports",
            "zipline",
            "outdoor pursuits",
            "match",
            "tournament",
            "vs ",
            " versus ",
        ),
    ),
    (
        "WORKSHOP",
        ("workshop", "training", "bootcamp", "lab", "hands-on"),
    ),
    (
        "CONFERENCE",
        ("conference", "symposium", "summit", "colloquium"),
    ),
    (
        "SEMINAR",
        ("seminar", "lecture", "talk", "panel", "presentation"),
    ),
    (
        "CULTURAL",
        (
            "cultural",
            "culture",
            "gallery",
            "exhibit",
            "museum",
            "music",
            "concert",
            "dance",
            "film",
            "poetry",
            "theater",
            "theatre",
            "art exhibit",
            "art gallery",
            "art show",
            "artist",
        ),
    ),
    (
        "ACADEMIC",
        (
            "academic",
            "class",
            "classes begin",
            "registration",
            "late registration",
            "drop with a grade",
            "prerequisite",
            "deadline",
            "advising",
            "orientation",
            "semester",
            "graduation",
            "commencement",
            "exam",
            "finals",
        ),
    ),
    (
        "SOCIAL",
        (
            "student life",
            "social",
            "meeting",
            "mixer",
            "community",
            "welcome",
            "game night",
            "jeopardy",
            "club",
        ),
    ),
)
EXPLICIT_LOCATION_OVERRIDES = {
    "UNIVERSITY UNION SOUTH LAWN": "University Union",
    "LIBRARY MALL": "Willis Library",
    "14C - SAGEMORE LAWN C": "Sage Hall",
    "SAGEMORE LAWN C": "Sage Hall",
    "SAGEMORE LAWN": "Sage Hall",
}
AUTO_CREATED_LOCATION_DESCRIPTION = "Auto-created from UNT calendar event import."


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
    aliases: Set[str] = field(default_factory=set)


@dataclass
class WidgetEvent:
    url: str
    title: str
    description: str
    location_name: str
    display_time: str
    display_date: str


@dataclass
class ScrapedEvent:
    source_url: str
    title: str
    description: str
    start_time: datetime
    end_time: datetime
    status: str
    location_name: str
    widget_location_name: str
    location_url: str
    address: str
    latitude: Optional[float]
    longitude: Optional[float]
    image_url: str
    website_url: str
    metadata: Dict[str, List[str]]
    event_type: str
    room_hint: str = ""
    match: Optional[Candidate] = None
    match_reason: str = ""


@dataclass
class SkippedEvent:
    title: str
    reason: str
    source_url: str
    source_location: str
    address: str
    room_hint: str
    priority: str


class WidgetParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.events: List[WidgetEvent] = []
        self.current: Optional[Dict[str, List[str] | str]] = None
        self.item_depth = 0
        self.capture_field: Optional[str] = None
        self.capture_depth = 0

    def handle_starttag(self, tag: str, attrs: List[Tuple[str, Optional[str]]]) -> None:
        attrs_dict = dict(attrs)
        classes = set((attrs_dict.get("class") or "").split())

        if tag == "li" and "lw_event_item" in classes:
            self.current = {
                "url": "",
                "title": [],
                "description": [],
                "location": [],
                "time": [],
                "date": [],
            }
            self.item_depth = 1
            return

        if self.current is None:
            return

        self.item_depth += 1

        if self.capture_field is not None:
            self.capture_depth += 1

        href = attrs_dict.get("href") or ""
        if tag == "a" and href and (
            "lw_event_item_image" in classes or self.capture_field == "title"
        ):
            self.current["url"] = strip_tracking(href)

        if tag == "div" and "lw_event_item_title" in classes:
            self._start_capture("title")
        elif tag == "div" and "lw_event_item_description" in classes:
            self._start_capture("description")
        elif tag == "div" and "lw_event_item_location" in classes:
            self._start_capture("location")
        elif tag == "div" and "lw_event_item_time" in classes:
            self._start_capture("time")
        elif tag == "span" and "lw_event_item_date" in classes:
            self._start_capture("date")

    def handle_endtag(self, tag: str) -> None:
        if self.current is None:
            return

        if self.capture_field is not None:
            self.capture_depth -= 1
            if self.capture_depth == 0:
                self.capture_field = None

        self.item_depth -= 1
        if tag == "li" and self.item_depth == 0:
            event = WidgetEvent(
                url=str(self.current.get("url", "")),
                title=clean_text("".join(self.current["title"])),  # type: ignore[index]
                description=clean_text(" ".join(self.current["description"])),  # type: ignore[index]
                location_name=clean_text(" ".join(self.current["location"])),  # type: ignore[index]
                display_time=clean_text(" ".join(self.current["time"])),  # type: ignore[index]
                display_date=clean_text(" ".join(self.current["date"])),  # type: ignore[index]
            )
            if event.url:
                self.events.append(event)
            self.current = None

    def handle_data(self, data: str) -> None:
        if self.current is None or self.capture_field is None:
            return
        cast_list = self.current[self.capture_field]
        if isinstance(cast_list, list):
            cast_list.append(data)

    def _start_capture(self, field_name: str) -> None:
        self.capture_field = field_name
        self.capture_depth = 1


class DetailParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.json_ld_chunks: List[str] = []
        self.capture_json_ld = False
        self.capture_field: Optional[str] = None
        self.capture_depth = 0
        self.field_chunks: Dict[str, List[str]] = {
            "description": [],
            "address": [],
        }
        self.location_website = ""
        self.meta: Dict[str, List[str]] = {}
        self.current_meta_section: Optional[Dict[str, List[str] | str]] = None
        self.meta_section_depth = 0
        self.meta_label_depth = 0
        self.meta_value_depth = 0
        self.meta_value_chunks: List[str] = []

    def handle_starttag(self, tag: str, attrs: List[Tuple[str, Optional[str]]]) -> None:
        attrs_dict = dict(attrs)
        classes = set((attrs_dict.get("class") or "").split())

        if self.capture_field is not None:
            self.capture_depth += 1

        if self.capture_json_ld:
            return

        if tag == "script" and (attrs_dict.get("type") or "") == "application/ld+json":
            self.capture_json_ld = True
            return

        if tag == "div" and "em-about_description" in classes:
            self._start_field_capture("description")
            return

        if tag == "p" and "em-about_location__address" in classes:
            self._start_field_capture("address")
            return

        if tag == "a" and "em-about_location__website" in classes:
            self.location_website = strip_tracking(attrs_dict.get("href") or "")

        meta_class = next(
            (
                class_name
                for class_name in classes
                if class_name.startswith("em-event-meta-data-")
                and class_name not in META_SKIP_CLASSES
            ),
            "",
        )
        if tag == "div" and meta_class and self.current_meta_section is None:
            self.current_meta_section = {"label": [], "values": []}
            self.meta_section_depth = 1
            return

        if self.current_meta_section is None:
            return

        self.meta_section_depth += 1
        if self.meta_label_depth > 0:
            self.meta_label_depth += 1
            return

        if self.meta_value_depth > 0:
            self.meta_value_depth += 1
            return

        if tag == "p":
            self.meta_label_depth = 1
            return

        if tag in {"a", "span"}:
            self.meta_value_depth = 1
            self.meta_value_chunks = []

    def handle_endtag(self, tag: str) -> None:
        if self.capture_json_ld and tag == "script":
            self.capture_json_ld = False
            return

        if self.capture_field is not None:
            self.capture_depth -= 1
            if self.capture_depth == 0:
                self.capture_field = None

        if self.current_meta_section is None:
            return

        if self.meta_label_depth > 0:
            self.meta_label_depth -= 1

        if self.meta_value_depth > 0:
            self.meta_value_depth -= 1
            if self.meta_value_depth == 0:
                value = clean_text("".join(self.meta_value_chunks))
                if value:
                    values = self.current_meta_section["values"]
                    if isinstance(values, list):
                        values.append(value)
                self.meta_value_chunks = []

        self.meta_section_depth -= 1
        if self.meta_section_depth == 0:
            label = clean_text("".join(self.current_meta_section["label"]))  # type: ignore[index]
            values = dedupe_preserving_order(
                clean_text(value)
                for value in self.current_meta_section["values"]  # type: ignore[index]
            )
            if label and values:
                self.meta[label] = values
            self.current_meta_section = None

    def handle_data(self, data: str) -> None:
        if self.capture_json_ld:
            self.json_ld_chunks.append(data)

        if self.capture_field is not None:
            self.field_chunks[self.capture_field].append(data)

        if self.current_meta_section is not None:
            if self.meta_label_depth > 0:
                label = self.current_meta_section["label"]
                if isinstance(label, list):
                    label.append(data)
            elif self.meta_value_depth > 0:
                self.meta_value_chunks.append(data)

    def _start_field_capture(self, field_name: str) -> None:
        self.capture_field = field_name
        self.capture_depth = 1


def clean_text(value: str) -> str:
    normalized = html.unescape(value or "").replace("\xa0", " ")
    normalized = re.sub(r"\s+", " ", normalized)
    return normalized.strip()


def strip_tags(value: str) -> str:
    return clean_text(re.sub(r"<[^>]+>", " ", value or ""))


def extract_html_text(html_text: str, pattern: str) -> str:
    match = re.search(pattern, html_text, flags=re.IGNORECASE | re.DOTALL)
    if not match:
        return ""
    return strip_tags(match.group(1))


def extract_href(html_text: str, pattern: str) -> str:
    match = re.search(pattern, html_text, flags=re.IGNORECASE | re.DOTALL)
    if not match:
        return ""
    return strip_tracking(html.unescape(match.group(1)))


def strip_tracking(url: str) -> str:
    split_url = urlsplit(url)
    return urlunsplit((split_url.scheme, split_url.netloc, split_url.path, "", ""))


def sql_literal(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def sql_text_or_null(value: str) -> str:
    return sql_literal(value) if value else "NULL"


def sql_timestamp(value: datetime) -> str:
    return "TIMESTAMP " + sql_literal(value.strftime("%Y-%m-%d %H:%M:%S"))


def sql_jsonb(value: object) -> str:
    return sql_literal(json.dumps(value, sort_keys=True)) + "::jsonb"


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
    tokens = []
    for token in cleaned.split():
        tokens.append(SINGULAR_OVERRIDES.get(token, token))
    return " ".join(tokens)


def alias_variants(value: str) -> Set[str]:
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

    normalized = {
        normalize_text(candidate)
        for candidate in variants
        if normalize_text(candidate)
    }
    return normalized


def room_alias_variants(building_name: str, room_number: str, location_name: str = "") -> Set[str]:
    room_number = clean_text(room_number)
    if not room_number:
        return set()

    variants: Set[str] = set()
    for base_name in dedupe_preserving_order([building_name, location_name]):
        base_name = clean_text(base_name)
        if not base_name:
            continue
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


def select_room_hint(*values: str) -> str:
    for value in values:
        room_number = extract_room_number(value)
        if room_number:
            return room_number
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


def alias_priority(value: str) -> Tuple[int, int, int, str]:
    cleaned = clean_text(value)
    token_count = len(cleaned.split())
    has_room_number = 1 if re.search(r"\b[A-Za-z]?\d[\w-]*\b", cleaned) else 0
    return (has_room_number, token_count, len(cleaned), cleaned)


def slug_alias(url: str) -> Set[str]:
    if not url:
        return set()
    slug = urlsplit(url).path.rsplit("/", 1)[-1]
    slug_text = slug.replace("_", " ").replace("-", " ")
    return alias_variants(slug_text)


def dedupe_preserving_order(values: Iterable[str]) -> List[str]:
    seen: Set[str] = set()
    ordered: List[str] = []
    for value in values:
        if not value or value in seen:
            continue
        seen.add(value)
        ordered.append(value)
    return ordered


def first_present(*values: str) -> str:
    for value in values:
        if clean_text(value):
            return clean_text(value)
    return ""


def source_location_name(event: ScrapedEvent) -> str:
    return clean_text(first_present(event.location_name, event.widget_location_name))


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


def fetch_html(url: str) -> str:
    request = Request(
        url,
        headers={
            "User-Agent": "quadcore-event-scraper/1.0",
            "Accept": "text/html,application/xhtml+xml",
        },
    )
    with urlopen(request, timeout=30) as response:
        encoding = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(encoding, errors="replace")


def load_candidates(database_url: str, psql_bin: str) -> List[Candidate]:
    if not database_url:
        return []

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

    result = subprocess.run(
        [psql_bin, database_url, "-X", "-A", "-F", "\t", "-t", "-c", query],
        check=True,
        capture_output=True,
        text=True,
    )

    candidates: List[Candidate] = []
    for line in result.stdout.splitlines():
        if not line.strip():
            continue
        (
            kind,
            location_id,
            source_name,
            location_name,
            building_name,
            room_number,
            latitude,
            longitude,
        ) = line.split("\t")
        aliases = set()
        aliases.update(alias_variants(source_name))
        aliases.update(alias_variants(location_name))
        aliases.update(alias_variants(building_name))
        aliases.update(room_alias_variants(building_name, room_number, location_name))
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


def parse_widget_events(html_text: str) -> List[WidgetEvent]:
    parser = WidgetParser()
    parser.feed(html_text)

    deduped: List[WidgetEvent] = []
    seen_urls: Set[str] = set()
    for event in parser.events:
        if event.url in seen_urls:
            continue
        seen_urls.add(event.url)
        deduped.append(event)
    return deduped


def parse_widget_start_date(widget_event: WidgetEvent) -> Optional[date]:
    display_date = clean_text(widget_event.display_date)
    if not display_date:
        return None

    start_text = clean_text(display_date.split("-", 1)[0])
    today = datetime.now(LOCAL_TIME_ZONE).date()
    try:
        parsed = datetime.strptime(f"{start_text} {today.year}", "%b %d %Y")
    except ValueError:
        return None

    candidate = parsed.date()
    if candidate < today - timedelta(days=180):
        candidate = date(today.year + 1, parsed.month, parsed.day)
    elif candidate > today + timedelta(days=180):
        candidate = date(today.year - 1, parsed.month, parsed.day)
    return candidate


def parse_widget_start_time(widget_event: WidgetEvent) -> Optional[time]:
    display_time = clean_text(widget_event.display_time)
    if not display_time:
        return None

    compact = display_time.upper().replace("CDT", "").replace("CST", "").strip()
    for time_format in ("%I%p", "%I:%M%p"):
        try:
            return datetime.strptime(compact, time_format).time()
        except ValueError:
            continue
    return None


def select_event_json(
    json_ld: object,
    widget_event: WidgetEvent,
) -> Dict[str, object]:
    event_items: List[Dict[str, object]] = []
    if isinstance(json_ld, list):
        event_items = [
            item
            for item in json_ld
            if isinstance(item, dict) and item.get("@type") == "Event"
        ]
    elif isinstance(json_ld, dict) and json_ld.get("@type") == "Event":
        event_items = [json_ld]

    if not event_items:
        raise ValueError(f"JSON-LD Event payload missing for {widget_event.url}")

    widget_date = parse_widget_start_date(widget_event)
    widget_time = parse_widget_start_time(widget_event)

    if widget_date is not None:
        exact_matches: List[Dict[str, object]] = []
        date_matches: List[Dict[str, object]] = []
        for item in event_items:
            start_value = str(item.get("startDate") or "")
            if not start_value:
                continue
            start_time = parse_event_datetime(start_value, is_end=False)
            if start_time.date() != widget_date:
                continue
            date_matches.append(item)
            if widget_time is None or start_time.time() == widget_time:
                exact_matches.append(item)

        if exact_matches:
            return exact_matches[0]
        if date_matches:
            return date_matches[0]

    return event_items[0]


def parse_room_location(raw_location: str) -> Tuple[str, str]:
    cleaned = clean_text(raw_location)
    if not cleaned:
        return "", ""

    at_match = re.match(
        r"^(?P<room>.+?)\s+at\s+(?:the\s+)?(?P<building>.+?)(?:\s*\((?P<paren>[^)]+)\))?$",
        cleaned,
        flags=re.IGNORECASE,
    )
    if at_match:
        room_hint = select_room_hint(
            clean_text(at_match.group("paren") or ""),
            clean_text(at_match.group("room")),
        )
        return clean_text(at_match.group("building")), room_hint

    paren_match = re.match(
        r"^(?P<building>.+?)\s*\((?P<room>[^)]+)\)$",
        cleaned,
        flags=re.IGNORECASE,
    )
    if paren_match:
        room_hint = select_room_hint(clean_text(paren_match.group("room")))
        return clean_text(paren_match.group("building")), room_hint

    comma_match = re.match(
        r"^(?P<building>.+?),\s*(?P<room>[^,]+)$",
        cleaned,
        flags=re.IGNORECASE,
    )
    if comma_match:
        room_hint = select_room_hint(clean_text(comma_match.group("room")))
        return clean_text(comma_match.group("building")), room_hint

    room_match = re.match(
        r"^(?P<building>.+?)\s+(?:room\s+)?(?P<room>[A-Za-z]?\d[\w-]*)$",
        cleaned,
        flags=re.IGNORECASE,
    )
    if room_match:
        return clean_text(room_match.group("building")), select_room_hint(clean_text(room_match.group("room")))

    return "", ""


def parse_detail_page(html_text: str, widget_event: WidgetEvent) -> ScrapedEvent:
    parser = DetailParser()
    parser.feed(html_text)

    json_ld_payload = "".join(parser.json_ld_chunks).strip()
    if not json_ld_payload:
        raise ValueError(f"Missing JSON-LD payload for {widget_event.url}")

    json_ld = json.loads(json_ld_payload)
    event_json = select_event_json(json_ld, widget_event)

    location = event_json.get("location") or {}
    location_name = clean_text(str(location.get("name") or widget_event.location_name))
    address = clean_text(
        str(location.get("address") or extract_html_text(html_text, r'<p class="em-about_location__address">(.*?)</p>'))
    )
    image_value = event_json.get("image") or ""
    image_url = strip_tracking(image_value[0] if isinstance(image_value, list) else str(image_value))
    status_token = str(event_json.get("eventStatus") or "").rsplit("/", 1)[-1]
    metadata = {key: dedupe_preserving_order(values) for key, values in parser.meta.items()}
    description = clean_text(
        extract_html_text(
            html_text,
            r'<div class="em-about_description">\s*(.*?)\s*</div>\s*</div>\s*<div class="em-section_map">',
        )
        or str(event_json.get("description") or widget_event.description)
    )
    location_url = strip_tracking(str(location.get("sameAs") or location.get("url") or ""))

    latitude: Optional[float] = None
    longitude: Optional[float] = None
    geo = location.get("geo") or {}
    if geo.get("latitude") not in (None, "") and geo.get("longitude") not in (None, ""):
        latitude = float(geo["latitude"])
        longitude = float(geo["longitude"])

    start_time = parse_event_datetime(str(event_json.get("startDate") or ""), is_end=False)
    end_time = parse_event_datetime(str(event_json.get("endDate") or ""), is_end=True)
    if end_time <= start_time:
        if is_date_only(str(event_json.get("startDate") or "")):
            end_time = start_time + timedelta(days=1)
        else:
            end_time = start_time + timedelta(hours=1)

    event = ScrapedEvent(
        source_url=strip_tracking(str(event_json.get("url") or widget_event.url)),
        title=clean_text(str(event_json.get("name") or widget_event.title)),
        description=description,
        start_time=start_time,
        end_time=end_time,
        status=SCHEMA_STATUS_MAP.get(status_token, "SCHEDULED"),
        location_name=location_name,
        widget_location_name=widget_event.location_name,
        location_url=location_url,
        address=address,
        latitude=latitude,
        longitude=longitude,
        image_url=image_url,
        website_url=extract_href(
            html_text,
            r'<a[^>]*class="[^"]*em-about_location__website[^"]*"[^>]*href="([^"]+)"',
        )
        or parser.location_website,
        metadata=metadata,
        event_type="OTHER",
    )
    event.event_type = derive_event_type(event)
    override_key = first_present(event.location_name, event.widget_location_name).upper()
    if override_key in EXPLICIT_LOCATION_OVERRIDES:
        event.room_hint = event.room_hint
    return event


def is_date_only(value: str) -> bool:
    return bool(re.fullmatch(r"\d{4}-\d{2}-\d{2}", value or ""))


def parse_event_datetime(value: str, is_end: bool) -> datetime:
    if not value:
        raise ValueError("Event is missing a start or end date")

    if is_date_only(value):
        base_date = date.fromisoformat(value)
        if is_end:
            base_date += timedelta(days=1)
        return datetime.combine(base_date, time.min)

    parsed = datetime.fromisoformat(value)
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone(LOCAL_TIME_ZONE).replace(tzinfo=None)
    return parsed.replace(microsecond=0)


def derive_event_type(event: ScrapedEvent) -> str:
    event_types = event.metadata.get("Event Type", [])
    tag_values = event.metadata.get("Tags", [])
    groups = event.metadata.get("Group", []) + event.metadata.get("Groups", [])

    haystack = " ".join(
        [
            event.title,
            event.description,
            event.location_name,
            " ".join(event_types),
            " ".join(tag_values),
            " ".join(groups),
        ]
    ).lower()

    for enum_name, hints in EVENT_TYPE_HINTS:
        if any(hint in haystack for hint in hints):
            return enum_name

    if any("student life" in value.lower() for value in event_types):
        return "SOCIAL"
    if any("academic" in value.lower() for value in event_types):
        return "ACADEMIC"
    if any("athletic" in value.lower() for value in event_types):
        return "SPORTS"
    return "OTHER"


def build_exact_alias_map(candidates: Sequence[Candidate]) -> Dict[str, List[Candidate]]:
    alias_map: Dict[str, List[Candidate]] = {}
    for candidate in candidates:
        for alias in candidate.aliases:
            alias_map.setdefault(alias, []).append(candidate)
    return alias_map


def event_source_aliases(event: ScrapedEvent) -> Tuple[Set[str], str]:
    aliases = set()
    aliases.update(alias_variants(event.location_name))
    aliases.update(alias_variants(event.widget_location_name))
    aliases.update(slug_alias(event.location_url))

    override_target = EXPLICIT_LOCATION_OVERRIDES.get(first_present(event.location_name, event.widget_location_name).upper())
    if override_target:
        aliases.update(alias_variants(override_target))

    room_hint = ""
    room_alias_bases: List[str] = []
    for raw_location in dedupe_preserving_order(
        [event.location_name, event.widget_location_name]
    ):
        building_name, parsed_room_hint = parse_room_location(raw_location)
        room_alias_base = clean_text(first_present(building_name, raw_location))
        if room_alias_base:
            room_alias_bases.append(room_alias_base)
        if building_name:
            aliases.update(alias_variants(building_name))
            if room_hint_priority(parsed_room_hint) >= 2:
                aliases.update(room_alias_variants(building_name, parsed_room_hint, building_name))
        if room_hint_priority(parsed_room_hint) > room_hint_priority(room_hint):
            room_hint = parsed_room_hint

    address_room_hint = select_room_hint(event.address)
    if room_hint_priority(address_room_hint) >= 2:
        for room_alias_base in dedupe_preserving_order(room_alias_bases):
            aliases.update(room_alias_variants(room_alias_base, address_room_hint, room_alias_base))
    if room_hint_priority(address_room_hint) > room_hint_priority(room_hint):
        room_hint = address_room_hint

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


def pick_best_candidate(event: ScrapedEvent, options: Sequence[Candidate]) -> Candidate:
    if len(options) == 1:
        return options[0]

    def sort_key(candidate: Candidate) -> Tuple[float, int, str, str]:
        distance = distance_meters(event.latitude, event.longitude, candidate.latitude, candidate.longitude)
        effective_distance = distance if distance is not None else float("inf")
        prefer_location = 0 if candidate.kind == "location" else 1
        return (effective_distance, prefer_location, candidate.location_name, candidate.name)

    return sorted(options, key=sort_key)[0]


def match_event_location(event: ScrapedEvent, candidates: Sequence[Candidate]) -> Tuple[Optional[Candidate], str, str]:
    source_aliases, room_hint = event_source_aliases(event)
    if not source_aliases:
        return None, "missing source aliases", room_hint

    exact_alias_map = build_exact_alias_map(candidates)
    for alias in sorted(source_aliases, key=alias_priority, reverse=True):
        options = exact_alias_map.get(alias, [])
        if options:
            best = pick_best_candidate(event, options)
            return best, f"exact alias match on '{alias}'", room_hint

    best_candidate: Optional[Candidate] = None
    best_score = 0.0
    best_reason = ""
    for candidate in candidates:
        for source_alias in source_aliases:
            for candidate_alias in candidate.aliases:
                ratio = SequenceMatcher(None, source_alias, candidate_alias).ratio()
                source_tokens = set(source_alias.split())
                candidate_tokens = set(candidate_alias.split())
                if not source_tokens or not candidate_tokens:
                    continue

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

                distance = distance_meters(
                    event.latitude,
                    event.longitude,
                    candidate.latitude,
                    candidate.longitude,
                )
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


def should_ignore_event(event: ScrapedEvent, ignored_locations: Set[str]) -> bool:
    location_candidates = {
        normalize_text(event.location_name),
        normalize_text(event.widget_location_name),
    }
    return any(candidate in ignored_locations for candidate in location_candidates if candidate)


def build_event_description(event: ScrapedEvent) -> str:
    return event.description.strip()


def slugify_label(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    slug = slug.replace("expected-attendance", "attendance")
    slug = slug.replace("alcohol-will-be-served", "alcohol-served")
    slug = slug.replace("event-security-needed", "security-needed")
    slug = slug.replace("large-event-parking-needed", "parking-needed")
    slug = slug.replace("minor-participants", "minor-participants")
    return slug


def build_event_tags(event: ScrapedEvent) -> List[str]:
    tag_names: List[str] = []
    tag_names.extend(event.metadata.get("Tags", []))
    if event.room_hint:
        tag_names.append(f"room:{event.room_hint}")
    source_location = source_location_name(event)
    if source_location:
        tag_names.append(f"source-location:{source_location}")
    for value in event.metadata.get("Audience", []):
        tag_names.append(f"audience:{value}")
    for value in event.metadata.get("Group", []) + event.metadata.get("Groups", []):
        tag_names.append(f"group:{value}")
    for value in event.metadata.get("Event Type", []):
        tag_names.append(f"source-type:{value}")
    for label in (
        "Expected Attendance",
        "Minor Participants",
        "Alcohol Will Be Served",
        "Event Security Needed",
        "Large Event Parking Needed",
        "Cost",
    ):
        for value in event.metadata.get(label, []):
            tag_names.append(f"{slugify_label(label)}:{value}")

    truncated = []
    for tag_name in tag_names:
        clean_tag = clean_text(tag_name)
        if not clean_tag:
            continue
        truncated.append(clean_tag[:100])
    return sorted(dedupe_preserving_order(truncated), key=str.lower)


def can_auto_create_location(event: ScrapedEvent) -> bool:
    return (
        bool(source_location_name(event))
        and event.latitude is not None
        and event.longitude is not None
    )


def render_location_ctes(event: ScrapedEvent) -> List[str]:
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

    location_name = source_location_name(event)
    return [
        "\n".join(
            [
                "existing_import_location AS (",
                "    SELECT location_id",
                "    FROM locations",
                f"    WHERE lower(name) = lower({sql_literal(location_name)})",
                "    LIMIT 1",
                ")",
            ]
        ),
        "\n".join(
            [
                "inserted_import_location AS (",
                "    INSERT INTO locations (name, description, coordinates)",
                "    SELECT",
                f"        {sql_literal(location_name)},",
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


def render_event_sql(event: ScrapedEvent) -> str:
    description = build_event_description(event)
    tags = build_event_tags(event)
    cte_blocks = render_location_ctes(event)
    event_source_location_name = source_location_name(event)

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
            f"-- Auto-created location: {event_source_location_name} ({event.latitude:.6f}, {event.longitude:.6f})"
        )
        if event.match_reason:
            statements.append(f"-- Match reason: {event.match_reason}")

    cte_blocks.append(
        "\n".join(
            [
                "existing_event AS (",
                "    SELECT event_id",
                "    FROM events",
                f"    WHERE title = {sql_literal(event.title)}",
                f"      AND start_date_time = {sql_timestamp(event.start_time)}",
                f"      AND end_date_time = {sql_timestamp(event.end_time)}",
                "      AND location_id = (SELECT location_id FROM resolved_location)",
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
                f"        description = {sql_text_or_null(description)},",
                f"        event_type = {sql_literal(event.event_type)}::event_type,",
                f"        status = {sql_literal(event.status)}::event_status,",
                "        capacity = NULL,",
                "        is_public = TRUE,",
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
                "        capacity,",
                "        registered_count,",
                "        is_public,",
                "        status",
                "    )",
                "    SELECT",
                f"        {sql_literal(event.title)},",
                f"        {sql_literal(description)},",
                "        (SELECT location_id FROM resolved_location),",
                f"        {sql_timestamp(event.start_time)},",
                f"        {sql_timestamp(event.end_time)},",
                f"        {sql_literal(event.event_type)}::event_type,",
                "        NULL,",
                "        0,",
                "        TRUE,",
                f"        {sql_literal(event.status)}::event_status",
                "    WHERE NOT EXISTS (",
                "        SELECT 1 FROM existing_event",
                "    )",
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
                "        source_location_url,",
                "        room_detail,",
                "        address,",
                "        image_url,",
                "        website_url,",
                "        metadata",
                "    )",
                "    SELECT",
                "        (SELECT event_id FROM resolved_event),",
                f"        {sql_text_or_null(event.source_url)},",
                f"        {sql_text_or_null(event_source_location_name)},",
                f"        {sql_text_or_null(event.location_url)},",
                f"        {sql_text_or_null(event.room_hint)},",
                f"        {sql_text_or_null(event.address)},",
                f"        {sql_text_or_null(event.image_url)},",
                f"        {sql_text_or_null(event.website_url)},",
                f"        {sql_jsonb(event.metadata or {})}",
                "    WHERE EXISTS (SELECT 1 FROM resolved_event)",
                "    ON CONFLICT (event_id) DO UPDATE",
                "    SET",
                "        source_url = EXCLUDED.source_url,",
                "        source_location_name = EXCLUDED.source_location_name,",
                "        source_location_url = EXCLUDED.source_location_url,",
                "        room_detail = EXCLUDED.room_detail,",
                "        address = EXCLUDED.address,",
                "        image_url = EXCLUDED.image_url,",
                "        website_url = EXCLUDED.website_url,",
                "        metadata = EXCLUDED.metadata,",
                "        updated_at = CURRENT_TIMESTAMP",
                "    RETURNING event_detail_id",
                ")",
            ]
        )
    )

    if tags:
        tag_list = ", ".join(sql_literal(tag_name) for tag_name in tags)
        cte_blocks.append(
            "\n".join(
                [
                    "assigned_tags AS (",
                    "    INSERT INTO event_tag_assignments (event_id, event_tag_id)",
                    "    SELECT",
                    "        (SELECT event_id FROM resolved_event),",
                    "        t.event_tag_id",
                    "    FROM event_tags t",
                    f"    WHERE t.name IN ({tag_list})",
                    "      AND EXISTS (SELECT 1 FROM resolved_event)",
                    "    ON CONFLICT DO NOTHING",
                    "    RETURNING event_tag_assignment_id",
                    ")",
                ]
            )
        )

    statements.append("WITH")
    statements.append(",\n".join(cte_blocks))
    statements.append("SELECT event_id FROM resolved_event;")
    return "\n".join(statements)


def render_sql(
    widget_url: str,
    reporter_email: str,
    reporter_first_name: str,
    reporter_last_name: str,
    events: Sequence[ScrapedEvent],
    skipped_events: Sequence[SkippedEvent],
) -> str:
    all_tags = sorted(
        {
            tag_name
            for event in events
            for tag_name in build_event_tags(event)
        },
        key=str.lower,
    )

    lines = [
        "-- Generated by scripts/scrape_unt_events.py",
        f"-- Generated at: {datetime.now().isoformat(timespec='seconds')}",
        f"-- Source widget: {widget_url}",
        f"-- Imported events: {len(events)}",
        f"-- Skipped events: {len(skipped_events)}",
        "BEGIN;",
        "",
        "-- Stable reporter account for skipped import reports.",
        "INSERT INTO users (email, password_hash, first_name, last_name, user_role)",
        "SELECT",
        f"    {sql_literal(reporter_email)},",
        f"    {sql_literal(DEFAULT_PASSWORD_HASH)},",
        f"    {sql_literal(reporter_first_name)},",
        f"    {sql_literal(reporter_last_name)},",
        "    'VISITOR'::role",
        "WHERE NOT EXISTS (",
        "    SELECT 1 FROM users WHERE email = " + sql_literal(reporter_email),
        ");",
        "",
        "-- Refresh generated import-review reports so they reflect the latest match rules.",
        "DELETE FROM reports WHERE target_type = 'EVENT_IMPORT';",
        "",
    ]

    if all_tags:
        tag_values = ",\n".join(f"    ({sql_literal(tag_name)})" for tag_name in all_tags)
        lines.extend(
            [
                "-- Ensure source-derived event tags exist.",
                "INSERT INTO event_tags (name)",
                "VALUES",
                tag_values,
                "ON CONFLICT (name) DO NOTHING;",
                "",
            ]
        )

    for event in events:
        lines.append(render_event_sql(event))
        lines.append("")

    if skipped_events:
        lines.extend(
            [
                "-- Import review reports for skipped events.",
                "INSERT INTO reports (",
                "    reporter_id,",
                "    report_type,",
                "    target_type,",
                "    target_id,",
                "    title,",
                "    description,",
                "    location_id,",
                "    priority,",
                "    status",
                ")",
            ]
        )
        report_rows = []
        for skipped_event in skipped_events:
            description_lines = [
                f"Reason: {skipped_event.reason}",
            ]
            if skipped_event.source_location:
                description_lines.append(f"Source location: {skipped_event.source_location}")
            if skipped_event.room_hint:
                description_lines.append(f"Source room detail: {skipped_event.room_hint}")
            if skipped_event.address:
                description_lines.append(f"Source address: {skipped_event.address}")
            if skipped_event.source_url:
                description_lines.append(f"Source URL: {skipped_event.source_url}")
            report_rows.append(
                "SELECT "
                f"(SELECT user_id FROM users WHERE email = {sql_literal(reporter_email)} LIMIT 1), "
                "'MISSING LOCATION'::report_type, "
                "'EVENT_IMPORT', "
                "gen_random_uuid(), "
                f"{sql_literal('Review skipped imported event: ' + skipped_event.title[:220])}, "
                f"{sql_literal(chr(10).join(description_lines))}, "
                "NULL::uuid, "
                f"{sql_literal(skipped_event.priority)}::priority_level, "
                "'PENDING'::report_status "
                "WHERE NOT EXISTS ("
                "SELECT 1 FROM reports "
                f"WHERE target_type = 'EVENT_IMPORT' AND title = {sql_literal('Review skipped imported event: ' + skipped_event.title[:220])}"
                f" AND description = {sql_literal(chr(10).join(description_lines))}"
                ")"
            )
        lines.append("\nUNION ALL\n".join(report_rows) + ";")
        lines.append("")
        lines.append("-- Skipped events summary:")
        for skipped_event in skipped_events:
            lines.append(f"-- {skipped_event.title}: {skipped_event.reason}")
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
    if not database_url:
        raise ValueError("DATABASE_URL is required when applying SQL to Postgres")

    subprocess.run(
        [psql_bin, database_url, "-v", "ON_ERROR_STOP=1"],
        input=content,
        check=True,
        text=True,
    )


def parse_args(argv: Optional[Sequence[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Scrape the UNT calendar widget and emit SQL inserts for events."
    )
    parser.add_argument("--widget-url", default=DEFAULT_WIDGET_URL)
    parser.add_argument("--database-url", default="")
    parser.add_argument("--psql-bin", default="psql")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT_PATH))
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--reporter-email", default=DEFAULT_REPORTER_EMAIL)
    parser.add_argument("--reporter-first-name", default=DEFAULT_REPORTER_FIRST_NAME)
    parser.add_argument("--reporter-last-name", default=DEFAULT_REPORTER_LAST_NAME)
    parser.add_argument("--organizer-email", dest="reporter_email", help=argparse.SUPPRESS)
    parser.add_argument("--organizer-first-name", dest="reporter_first_name", help=argparse.SUPPRESS)
    parser.add_argument("--organizer-last-name", dest="reporter_last_name", help=argparse.SUPPRESS)
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

    ignored_locations = {
        normalize_text(value)
        for value in [*DEFAULT_IGNORE_LOCATIONS, *args.ignore_location]
        if normalize_text(value)
    }

    widget_html = fetch_html(args.widget_url)
    widget_events = parse_widget_events(widget_html)
    if args.limit > 0:
        widget_events = widget_events[: args.limit]

    imported_events: List[ScrapedEvent] = []
    skipped_events: List[SkippedEvent] = []

    for widget_event in widget_events:
        try:
            detail_html = fetch_html(widget_event.url)
            scraped_event = parse_detail_page(detail_html, widget_event)
        except Exception as exc:  # noqa: BLE001
            skipped_events.append(
                SkippedEvent(
                    title=widget_event.title or widget_event.url,
                    reason=f"detail fetch/parse failed: {exc}",
                    source_url=widget_event.url,
                    source_location=widget_event.location_name,
                    address="",
                    room_hint="",
                    priority="MEDIUM",
                )
            )
            continue

        if should_ignore_event(scraped_event, ignored_locations):
            skipped_events.append(
                SkippedEvent(
                    title=scraped_event.title,
                    reason=f"ignored location '{scraped_event.location_name or scraped_event.widget_location_name}'",
                    source_url=scraped_event.source_url,
                    source_location=first_present(scraped_event.location_name, scraped_event.widget_location_name),
                    address=scraped_event.address,
                    room_hint=scraped_event.room_hint,
                    priority="LOW",
                )
            )
            continue

        match, reason, room_hint = match_event_location(scraped_event, candidates)
        scraped_event.room_hint = room_hint
        if match is None:
            if can_auto_create_location(scraped_event):
                scraped_event.match_reason = "auto-created location from source coordinates"
                imported_events.append(scraped_event)
                continue
            skipped_events.append(
                SkippedEvent(
                    title=scraped_event.title,
                    reason=f"unmatched location: {source_location_name(scraped_event)}",
                    source_url=scraped_event.source_url,
                    source_location=source_location_name(scraped_event),
                    address=scraped_event.address,
                    room_hint=scraped_event.room_hint,
                    priority="MEDIUM",
                )
            )
            continue
        scraped_event.match = match
        scraped_event.match_reason = reason
        imported_events.append(scraped_event)

    if not imported_events:
        print("No events were imported. Check the widget URL or ignore filters.", file=sys.stderr)
        for skipped_event in skipped_events:
            print(f"- {skipped_event.title}: {skipped_event.reason}", file=sys.stderr)
        return 1

    imported_events.sort(key=lambda item: (item.start_time, item.title.lower()))
    sql_output = render_sql(
        widget_url=args.widget_url,
        reporter_email=args.reporter_email,
        reporter_first_name=args.reporter_first_name,
        reporter_last_name=args.reporter_last_name,
        events=imported_events,
        skipped_events=skipped_events,
    )
    write_output(args.output, sql_output)
    if not args.no_apply:
        apply_sql(database_url, args.psql_bin, sql_output)

    print(
        f"Wrote {len(imported_events)} events to {args.output} "
        f"({len(skipped_events)} skipped){'' if args.no_apply else '; applied to database'}.",
        file=sys.stderr,
    )
    for skipped_event in skipped_events:
        print(f"- {skipped_event.title}: {skipped_event.reason}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
