module.exports = (sequelize, DataTypes) => {
    const Event = sequelize.define('events', {
        event_id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        title: { type: DataTypes.STRING(255), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        location_id: { type: DataTypes.UUID, allowNull: false },
        start_date_time: { type: DataTypes.DATE, allowNull: false },
        end_date_time: { type: DataTypes.DATE, allowNull: false },
        event_type: {
            type: DataTypes.ENUM(
                'ACADEMIC',
                'SOCIAL',
                'CAREER FAIR',
                'SPORTS',
                'CULTURAL',
                'WORKSHOP',
                'CONFERENCE',
                'SEMINAR',
                'OTHER'
            ),
            allowNull: false
        },
        organizer_id: { type: DataTypes.UUID, allowNull: false },
        capacity: { type: DataTypes.INTEGER, allowNull: true },
        registered_count: { type: DataTypes.INTEGER, defaultValue: 0 },
        is_public: { type: DataTypes.BOOLEAN, defaultValue: true },
        status: {
            type: DataTypes.ENUM('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'POSTPONED'),
            defaultValue: 'SCHEDULED'
        }
    }, {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });
    return Event;
}
