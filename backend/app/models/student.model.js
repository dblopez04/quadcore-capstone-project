const User = require('./user.model.js');
module.exports = (sequelize, DataTypes) => {
    const Student = sequelize.define('students', {
        student_id: { type: DataTypes.UUID, primaryKey: true, defaultValue: sequelize.uuidv4 },
        user_id: { type: DataTypes.UUID, unique: true, allowNull: false, references: { model: User, key: 'user_id'}, onDelete: 'CASCADE' },
        euid: { type: DataTypes.STRING(10), unique: true, allowNull: false },
        major: { type: DataTypes.STRING(50) },
        year: { type: DataTypes.INTEGER, validate: { min: 1, max: 6 } },
        enrollment_date: { type: DataTypes.DATE },
        graduation_date: { type: DataTypes.DATE }
    });
    return Student;
}
