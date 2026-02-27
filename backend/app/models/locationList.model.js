module.exports = (sequelize, DataTypes) => {
    const LocationList = sequelize.define("location_lists", {
        list_id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        user_id: { type: DataTypes.UUID, allowNull: false },
        name: { type: DataTypes.STRING(100), allowNull: false },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    }, {
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ["user_id", "name"]
            }
        ]
    });

    return LocationList;
};
