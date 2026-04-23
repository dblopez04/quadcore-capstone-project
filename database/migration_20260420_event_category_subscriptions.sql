CREATE TABLE event_category_subscriptions (
    subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    event_type VARCHAR(255) NOT NULL,
    last_digest_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, event_type)
);

CREATE INDEX idx_event_category_subscriptions_user_id
    ON event_category_subscriptions(user_id);

CREATE INDEX idx_event_category_subscriptions_event_type
    ON event_category_subscriptions(event_type);
