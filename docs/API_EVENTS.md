# Events API

This document describes the backend event APIs used for calendar, bookmarks, registrations, reminders, tags, conflicts, and ICS export.

**Base URL**
`/api/events`

**Auth**
- Endpoints marked “Auth required” expect the `accessToken` cookie (`verifyToken` middleware).
- Admin endpoints require `requireAdmin`.

## Schemas

**EventSummary**
```json
{
  "event_id": "uuid",
  "title": "Career Fair",
  "description": "Spring hiring event",
  "start_date_time": "2026-02-10T10:00:00Z",
  "end_date_time": "2026-02-10T12:00:00Z",
  "event_type": "CAREER FAIR",
  "status": "SCHEDULED",
  "is_public": true,
  "location": {
    "location_id": "uuid",
    "name": "Student Union",
    "description": "Main union",
    "coordinates": { "type": "Point", "coordinates": [-97.1526, 33.2070] }
  },
  "tags": [{ "event_tag_id": "uuid", "name": "Career" }]
}
```

**EventListResponse**
```json
{ "events": [EventSummary] }
```

**EventReminder**
```json
{
  "event_reminder_id": "uuid",
  "remind_at": "2026-02-10T09:00:00Z",
  "channel": "IN_APP",
  "event": EventSummary
}
```

**EventReminderListResponse**
```json
{ "reminders": [EventReminder] }
```

**TagListResponse**
```json
{ "tags": [{ "event_tag_id": "uuid", "name": "Career" }] }
```

**EventConflictsResponse**
```json
{
  "conflicts": [
    { "event_a": EventSummary, "event_b": EventSummary }
  ]
}
```

## Endpoints

**GET `/api/events` — Search and filter events**
- Auth required: No
- Query params: `q`, `start`, `end`, `event_type`, `status`, `location_id`, `organizer_id`, `tags`
- Response: `EventListResponse`

**GET `/api/events/bookmarks.ics` — Export bookmarked events (ICS)**
- Auth required: Yes
- Query params: `start`, `end`
- Response: `text/calendar`

**GET `/api/events/bookmarks` — Get current user’s bookmarked events**
- Auth required: Yes
- Query params: `start`, `end`, `status`, `event_type`, `tags`
- Response: `EventListResponse`

**POST `/api/events/:eventId/bookmark` — Bookmark an event**
- Auth required: Yes
- Response 201:
```json
{ "message": "Event bookmarked.", "event_bookmark_id": "uuid" }
```

**DELETE `/api/events/:eventId/bookmark` — Remove an event bookmark**
- Auth required: Yes
- Response 200:
```json
{ "message": "Bookmark removed." }
```

**GET `/api/events/registrations` — Get current user’s registrations**
- Auth required: Yes
- Query params: `start`, `end`, `status`, `event_type`, `tags`
- Response: `EventListResponse`

**POST `/api/events/:eventId/register` — Register for an event**
- Auth required: Yes
- Response 201:
```json
{ "message": "Registered for event.", "registration_id": "uuid" }
```

**DELETE `/api/events/:eventId/register` — Unregister from an event**
- Auth required: Yes
- Response 200:
```json
{ "message": "Registration removed." }
```

**GET `/api/events/conflicts` — Detect conflicts**
- Auth required: Yes
- Query params: `start`, `end`, `source` (comma-separated values: `bookmarks`, `registrations`)
- Response: `EventConflictsResponse`

**GET `/api/events/reminders` — List reminders**
- Auth required: Yes
- Query params: `start`, `end`
- Response: `EventReminderListResponse`

**POST `/api/events/:eventId/reminders` — Create a reminder**
- Auth required: Yes
- Body:
```json
{ "remind_at": "2026-02-10T09:00:00Z", "channel": "IN_APP" }
```
- Response 201:
```json
{ "event_reminder_id": "uuid", "remind_at": "2026-02-10T09:00:00Z", "channel": "IN_APP" }
```

**DELETE `/api/events/reminders/:reminderId` — Delete a reminder**
- Auth required: Yes
- Response 200:
```json
{ "message": "Reminder deleted." }
```

**GET `/api/events/tags` — List tags**
- Auth required: No
- Response: `TagListResponse`

**POST `/api/events/tags` — Create tag**
- Auth required: Admin
- Body:
```json
{ "name": "Career" }
```
- Response 201:
```json
{ "event_tag_id": "uuid", "name": "Career" }
```

**POST `/api/events/:eventId/tags` — Assign tags to event**
- Auth required: Admin
- Body:
```json
{ "tags": ["Career", "Spring"] }
```
- Response 201:
```json
{ "tags": [{ "event_tag_id": "uuid", "name": "Career" }] }
```

**DELETE `/api/events/:eventId/tags/:tagId` — Remove tag from event**
- Auth required: Admin
- Response 200:
```json
{ "message": "Tag removed." }
```
