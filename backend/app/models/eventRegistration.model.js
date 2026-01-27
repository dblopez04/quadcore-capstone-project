module.exports = (sequelize, DataTypes) => {
    const EventRegistration = sequelize.define('event_registrations', {
        registration_id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        event_id: { type: DataTypes.UUID, allowNull: false },
        user_id: { type: DataTypes.UUID, allowNull: false },
        registered_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        registration_status: { type: DataTypes.STRING(50), defaultValue: 'REGISTERED' }
    }, {
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ['event_id', 'user_id']
            }
        ]
    });
    return EventRegistration;
}
