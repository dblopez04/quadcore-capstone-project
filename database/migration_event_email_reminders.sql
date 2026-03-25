ALTER TABLE event_reminders
    ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS failed_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS last_error TEXT;

ALTER TABLE event_reminders
    DROP CONSTRAINT IF EXISTS event_reminders_user_id_event_id_remind_at_key;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'event_reminders_user_id_event_id_remind_at_channel_key'
    ) THEN
        ALTER TABLE event_reminders
            ADD CONSTRAINT event_reminders_user_id_event_id_remind_at_channel_key
            UNIQUE (user_id, event_id, remind_at, channel);
    END IF;
END $$;
