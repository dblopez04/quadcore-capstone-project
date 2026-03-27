module.exports = (sequelize, DataTypes) => {
    const EventBookmark = sequelize.define('event_bookmarks', {
        user_id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
        event_id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
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
