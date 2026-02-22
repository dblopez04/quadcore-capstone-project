module.exports = (sequelize, DataTypes) => {
    const PointOfInterest = sequelize.define('points_of_interest', {
        poi_id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        location_id: { type: DataTypes.UUID, allowNull: false },
        name: { type: DataTypes.STRING(255), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        category: {
            type: DataTypes.ENUM(
                'ACADEMIC BUILDING',
                'LIBRARY',
                'DINING HALL',
                'PARKING',
                'DORMITORY',
                'RECREATION',
                'MEDICAL',
                'LANDMARK',
                'BATHROOM',
                'RESTAURANT',
                'OTHER'
            ),
            allowNull: false
        },
        building_name: { type: DataTypes.STRING(255), allowNull: true },
        floor_number: { type: DataTypes.INTEGER, allowNull: true },
        room_number: { type: DataTypes.STRING(50), allowNull: true },
        is_indoor: { type: DataTypes.BOOLEAN, defaultValue: false },
        operating_hours: { type: DataTypes.STRING(255), allowNull: true },
        contact_info: { type: DataTypes.TEXT, allowNull: true },
        is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
    }, {
        timestamps: false,
        tableName: 'points_of_interest'
    });
    return PointOfInterest;
}
