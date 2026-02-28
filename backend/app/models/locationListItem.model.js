module.exports = (sequelize, DataTypes) => {
    const LocationListItem = sequelize.define("location_list_items", {
        list_item_id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        list_id: { type: DataTypes.UUID, allowNull: false },
        location_id: { type: DataTypes.UUID, allowNull: false },
        added_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    }, {
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ["list_id", "location_id"]
            }
        ]
    });

    return LocationListItem;
};
