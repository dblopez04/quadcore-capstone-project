module.exports = (sequelize, DataTypes) => {
    const RecentlyViewedLocation = sequelize.define("recently_viewed_locations", {
        recent_view_id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        user_id: { type: DataTypes.UUID, allowNull: false },
        location_id: { type: DataTypes.UUID, allowNull: false },
        viewed_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    }, {
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ["user_id", "location_id"]
            }
        ]
    });

    return RecentlyViewedLocation;
};
