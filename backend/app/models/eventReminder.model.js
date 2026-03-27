module.exports = (sequelize, DataTypes) => {
    const EventReminder = sequelize.define("event_reminders", {
        event_reminder_id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        user_id: { type: DataTypes.UUID, allowNull: false },
        event_id: { type: DataTypes.UUID, allowNull: false },
        remind_at: { type: DataTypes.DATE, allowNull: false },
        channel: { type: DataTypes.STRING(50), allowNull: false, defaultValue: "IN_APP" },
        sent_at: { type: DataTypes.DATE, allowNull: true },
        failed_at: { type: DataTypes.DATE, allowNull: true },
        last_error: { type: DataTypes.TEXT, allowNull: true },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    }, {
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ["user_id", "event_id", "remind_at", "channel"],
            },
        ],
    });

    return EventReminder;
};
