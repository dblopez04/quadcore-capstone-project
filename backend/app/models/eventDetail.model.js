module.exports = (sequelize, DataTypes) => {
    const EventDetail = sequelize.define("event_details", {
        event_detail_id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        event_id: { type: DataTypes.UUID, allowNull: false, unique: true },
        source_url: { type: DataTypes.TEXT, allowNull: true },
        source_location_name: { type: DataTypes.STRING(255), allowNull: true },
        source_location_url: { type: DataTypes.TEXT, allowNull: true },
        room_detail: { type: DataTypes.STRING(255), allowNull: true },
        address: { type: DataTypes.TEXT, allowNull: true },
        image_url: { type: DataTypes.TEXT, allowNull: true },
        website_url: { type: DataTypes.TEXT, allowNull: true },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} }
    }, {
        tableName: "event_details",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at"
    });

    return EventDetail;
};
