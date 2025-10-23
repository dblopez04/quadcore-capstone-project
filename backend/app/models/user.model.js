module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('users', {
        user_id: { type: DataTypes.UUID, primaryKey: true, defaultValue: sequelize.uuidv4 },
        email: { type: DataTypes.STRING, unique: true, allowNull: false, validate: { isEmail: true } },
        password_hash: { type: DataTypes.STRING, allowNull: false },
        first_name: { type: DataTypes.STRING(100), allowNull: false },
        last_name: { type: DataTypes.STRING(100), allowNull: false },
        phone_number: { type: DataTypes.STRING(20), allowNull: true },
        role: { type: DataTypes.ENUM(''), allowNull: false },

    });
    return User;
}

