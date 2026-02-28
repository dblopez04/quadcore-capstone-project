module.exports = (sequelize, DataTypes) => {
    const EventTag = sequelize.define('event_tags', {
        event_tag_id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    }, {
        timestamps: false
    });

    return EventTag;
};
