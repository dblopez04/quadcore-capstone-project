module.exports = (sequelize, DataTypes) => {
    const Student = sequelize.define('students', {
        student_id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        user_id: { type: DataTypes.UUID, unique: true, allowNull: false },
        euid: { type: DataTypes.STRING(10), unique: true, allowNull: false },
        major: { type: DataTypes.STRING(50), allowNull: true },
        year: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 1, max: 6 } },
        enrollment_date: { type: DataTypes.DATEONLY, allowNull: true },
        graduation_date: { type: DataTypes.DATEONLY, allowNull: true }
    }, {
        timestamps: false
    });
    return Student;
}
