module.exports = (sequelize, DataTypes) => {
    const Visitor = sequelize.define('visitors', {
        visitor_id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        user_id: { type: DataTypes.UUID, unique: true, allowNull: false }
    }, {
        timestamps: false
    });
    return Visitor;
}
