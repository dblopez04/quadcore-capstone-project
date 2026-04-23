module.exports = (sequelize, DataTypes) => {
    const EventCategorySubscription = sequelize.define("event_category_subscriptions", {
        subscription_id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        user_id: { type: DataTypes.UUID, allowNull: false },
        event_type: { type: DataTypes.STRING(255), allowNull: false },
        last_digest_sent_at: { type: DataTypes.DATE, allowNull: true },
    }, {
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        indexes: [
            {
                unique: true,
                fields: ["user_id", "event_type"],
            },
            {
                fields: ["event_type"],
            },
        ],
    });

    return EventCategorySubscription;
};
