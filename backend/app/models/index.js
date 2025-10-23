const { sequelize, Sequelize } = require('../config/db.config');
const defineUser = require('./user.model');
const defineStudent = require('./student.model');
const defineFaculty = require('./faculty.model');
const defineVisitor = require('./visitor.model');

const db = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.User = defineUser(sequelize, Sequelize.DataTypes);
db.Student = defineStudent(sequelize, Sequelize.DataTypes);
db.Faculty = defineFaculty(sequelize, Sequelize.DataTypes);
db.Visitor = defineVisitor(sequelize, Sequelize.DataTypes);

module.exports = db;