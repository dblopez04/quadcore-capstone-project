module.exports = (sequelize, DataTypes) => {
    const Location = sequelize.define('locations', {
        location_id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        name: { type: DataTypes.STRING(255), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        coordinates: { type: DataTypes.GEOMETRY('POINT', 4326), allowNull: false },
        building_name: { type: DataTypes.STRING(255), allowNull: true },
        floor_number: { type: DataTypes.INTEGER, allowNull: true },
        room_number: { type: DataTypes.STRING(50), allowNull: true },
        is_indoor: { type: DataTypes.BOOLEAN, defaultValue: false }
    }, {
        timestamps: false
    });
    return Location;
}
