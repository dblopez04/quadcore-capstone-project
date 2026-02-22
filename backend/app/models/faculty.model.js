module.exports = (sequelize, DataTypes) => {
    const Faculty = sequelize.define('faculty', {
        faculty_id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        user_id: { type: DataTypes.UUID, unique: true, allowNull: false },
        euid: { type: DataTypes.STRING(10), unique: true, allowNull: false },
        department: { type: DataTypes.STRING(100), allowNull: true },
        office_hours: { type: DataTypes.STRING(255), allowNull: true },
        title: { type: DataTypes.STRING(100), allowNull: true }
    }, {
        timestamps: false
    });
    return Faculty;
}
