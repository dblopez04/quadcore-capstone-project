const User = require('./user.model.js');
module.exports = (sequelize, DataTypes) => {
    const Faculty = sequelize.define('faculty', {
        faculty_id: { type: DataTypes.UUID, primaryKey: true, defaultValue: sequelize.uuidv4 },
        user_id: { type: DataTypes.UUID, unique: true, allowNull: false, references: { model: User, key: 'user_id'}, onDelete: 'CASCADE' },
        euid: { type: DataTypes.STRING(10), unique: true, allowNull: false },
        department: { type: DataTypes.STRING(100) },
        office_hours: { type: DataTypes.STRING(255) },
        title: { type: DataTypes.STRING(100) }
    });
    return Faculty;
}
