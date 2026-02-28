module.exports = (sequelize, DataTypes) => {
    const EventTagAssignment = sequelize.define('event_tag_assignments', {
        event_tag_assignment_id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        event_id: { type: DataTypes.UUID, allowNull: false },
        event_tag_id: { type: DataTypes.UUID, allowNull: false }
    }, {
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ['event_id', 'event_tag_id']
            }
        ]
    });

    return EventTagAssignment;
};
