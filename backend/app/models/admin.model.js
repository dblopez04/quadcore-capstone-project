module.exports = (sequelize, DataTypes) => {
    const Admin = sequelize.define('admin', {
        admin_id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        user_id: { type: DataTypes.UUID, unique: true, allowNull: false },
        is_owner: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        previous_role: {
            type: DataTypes.ENUM('STUDENT', 'FACULTY', 'VISITOR'),
            allowNull: false,
            defaultValue: 'VISITOR'
        }
    }, {
        timestamps: false,
        tableName: 'admin'
    });
    return Admin;
}
