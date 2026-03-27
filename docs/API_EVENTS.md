# Events API

This document summarizes the current event endpoints used by the frontend calendar,
registration, bookmark, reminder, conflict, and ICS-export flows.

**Base URL**
`/api/events`

**Auth**
- Endpoints marked “Auth required” expect the `accessToken` cookie (`verifyToken` middleware).

## Response Shape

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
  "location_id": "uuid",
  "location": {
    "location_id": "uuid",
    "name": "Student Union",
    "description": "Main union",
    "coordinates": { "type": "Point", "coordinates": [-97.1526, 33.2070] }
  },
  "details": {
    "event_id": "uuid",
    "source_url": "https://calendar.unt.edu/event/example",
    "source_location_name": "Wooten Hall",
    "room_detail": "322",
    "metadata": { "audience": ["Students"] }
  }
}
```

**EventReminder**
```json
{
  "event_reminder_id": "uuid",
  "remind_at": "2026-02-10T09:00:00Z",
  "channel": "EMAIL",
  "sent_at": null,
  "event": { "event_id": "uuid" }
}
```

## Endpoints

**GET `/api/events`**
- Auth required: No
- Query params: `q`, `start`, `end`, `event_type`, `status`, `location_id`
- Search matches title, description, location name, imported source location name, and room detail.

**GET `/api/events/bookmarks`**
- Auth required: Yes
- Query params: `start`, `end`, `status`, `event_type`

**GET `/api/events/bookmarks.ics`**
- Auth required: Yes
- Query params: `start`, `end`
- Response: `text/calendar`

**POST `/api/events/:eventId/bookmark`**
- Auth required: Yes
- Idempotently bookmarks an event.

**DELETE `/api/events/:eventId/bookmark`**
- Auth required: Yes
- Removes the bookmark and deletes any email reminder tied to that saved event.

**GET `/api/events/registrations`**
- Auth required: Yes
- Query params: `start`, `end`, `status`, `event_type`

**POST `/api/events/:eventId/register`**
- Auth required: Yes
- Creates a registration row.
- Sends a confirmation email when the user has an email address and Resend is configured.

**DELETE `/api/events/:eventId/register`**
- Auth required: Yes
- Removes the user’s registration for the event.

**GET `/api/events/conflicts`**
- Auth required: Yes
- Query params: `start`, `end`, `source`
- `source` accepts `bookmarks`, `registrations`, or both.

**GET `/api/events/reminders`**
- Auth required: Yes
- Query params: `start`, `end`

**POST `/api/events/:eventId/reminders`**
- Auth required: Yes
- `IN_APP` reminders require `{ "remind_at": "...", "channel": "IN_APP" }`.
- `EMAIL` reminders use `{ "channel": "EMAIL" }`.
- `EMAIL` reminders are always scheduled for 24 hours before the event and require the event to already be bookmarked.

**DELETE `/api/events/reminders/:reminderId`**
- Auth required: Yes
- Deletes the reminder row.
