module.exports = (sequelize, DataTypes) => {
    const WellLitPath = sequelize.define("well_lit_paths", {
        path_id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        name: { type: DataTypes.STRING(255), allowNull: false },
        path_type: { type: DataTypes.STRING(50), allowNull: false },
        lighting_level: { type: DataTypes.STRING(50), allowNull: false, defaultValue: "GOOD" },
        is_preferred: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        notes: { type: DataTypes.TEXT, allowNull: true },
        geom: { type: DataTypes.GEOMETRY("LINESTRING", 4326), allowNull: false },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, {
        timestamps: false
    });

    return WellLitPath;
};
