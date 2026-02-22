module.exports = (sequelize, DataTypes) => {
    const Report = sequelize.define('reports', {
        report_id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        reporter_id: { type: DataTypes.UUID, allowNull: false },
        report_type: {
            type: DataTypes.ENUM(
                'INCORRECT INFORMATION',
                'MISSING CONTENT',
                'SAFETY ISSUE',
                'ACCESSIBILITY ISSUE',
                'MISSING LOCATION',
                'OTHER'
            ),
            allowNull: false
        },
        target_type: { type: DataTypes.STRING(50), allowNull: false },
        target_id: { type: DataTypes.UUID, allowNull: false },
        title: { type: DataTypes.STRING(255), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: false },
        location_id: { type: DataTypes.UUID, allowNull: true },
        priority: {
            type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
            defaultValue: 'MEDIUM'
        },
        status: {
            type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'),
            defaultValue: 'PENDING'
        },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        assigned_to: { type: DataTypes.UUID, allowNull: true },
        resolved_at: { type: DataTypes.DATE, allowNull: true },
        resolved_by: { type: DataTypes.UUID, allowNull: true },
        resolution_notes: { type: DataTypes.TEXT, allowNull: true }
    }, {
        timestamps: false
    });
    return Report;
}
