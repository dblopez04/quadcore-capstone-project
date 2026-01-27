module.exports = (sequelize, DataTypes) => {
    const Admin = sequelize.define('admin', {
        admin_id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        user_id: { type: DataTypes.UUID, unique: true, allowNull: false }
    }, {
        timestamps: false
    });
    return Admin;
}
