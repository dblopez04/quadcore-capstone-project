module.exports = (sequelize, DataTypes) => {
    const Location = sequelize.define('locations', {
        location_id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        name: { type: DataTypes.STRING(255), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        coordinates: { type: DataTypes.GEOMETRY('POINT', 4326), allowNull: false }
    }, {
        timestamps: false
    });
    return Location;
}
