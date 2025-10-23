const User = require('./user.model.js');
module.exports = (sequelize, DataTypes) => {
    const Visitor = sequelize.define('visitors', {
        visitor_id: { type: DataTypes.UUID, primaryKey: true, defaultValue: sequelize.uuidv4 },
        user_id: { type: DataTypes.UUID, unique: true, allowNull: false, references: { model: User, key: 'user_id'}, onDelete: 'CASCADE' },
    });
    return Visitor;
}
