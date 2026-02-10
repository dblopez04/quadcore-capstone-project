module.exports = (sequelize, DataTypes) => {
    const EventBookmark = sequelize.define('event_bookmarks', {
        event_bookmark_id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        user_id: { type: DataTypes.UUID, allowNull: false },
        event_id: { type: DataTypes.UUID, allowNull: false },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    }, {
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ['user_id', 'event_id']
            }
        ]
    });

    return EventBookmark;
};
