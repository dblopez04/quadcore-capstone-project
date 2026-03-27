module.exports = (sequelize, DataTypes) => {
    const EventDetail = sequelize.define("event_details", {
        event_id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
        source_url: { type: DataTypes.TEXT, allowNull: true },
        source_location_name: { type: DataTypes.STRING(255), allowNull: true },
        room_detail: { type: DataTypes.STRING(255), allowNull: true },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} }
    }, {
        tableName: "event_details",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at"
    });

    return EventDetail;
};
