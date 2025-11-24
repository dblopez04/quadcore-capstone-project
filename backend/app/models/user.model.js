module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('users', {
        user_id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        email: { type: DataTypes.STRING(255), unique: true, allowNull: false, validate: { isEmail: true } },
        password_hash: { type: DataTypes.STRING(255), allowNull: false },
        first_name: { type: DataTypes.STRING(100), allowNull: false },
        last_name: { type: DataTypes.STRING(100), allowNull: false },
        phone_number: { type: DataTypes.STRING(20), allowNull: true },
        user_role: { type: DataTypes.ENUM('STUDENT','FACULTY','ADMIN','VISITOR'), allowNull: false },
        refresh_token: { type: DataTypes.TEXT, allowNull: true },
    }, {
        timestamps: true
    });
    return User;
}

