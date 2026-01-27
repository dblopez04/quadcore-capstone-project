const { sequelize, Sequelize } = require('../config/db.config');
const defineUser = require('./user.model');
const defineStudent = require('./student.model');
const defineFaculty = require('./faculty.model');
const defineVisitor = require('./visitor.model');
const defineAdmin = require('./admin.model');
const defineLocation = require('./location.model');
const definePointOfInterest = require('./poi.model');
const defineEvent = require('./event.model');
const defineEventRegistration = require('./eventRegistration.model');
const defineBookmark = require('./bookmark.model');
const defineReport = require('./report.model');

const db = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.User = defineUser(sequelize, Sequelize.DataTypes);
db.Student = defineStudent(sequelize, Sequelize.DataTypes);
db.Faculty = defineFaculty(sequelize, Sequelize.DataTypes);
db.Visitor = defineVisitor(sequelize, Sequelize.DataTypes);
db.Admin = defineAdmin(sequelize, Sequelize.DataTypes);
db.Location = defineLocation(sequelize, Sequelize.DataTypes);
db.PointOfInterest = definePointOfInterest(sequelize, Sequelize.DataTypes);
db.Event = defineEvent(sequelize, Sequelize.DataTypes);
db.EventRegistration = defineEventRegistration(sequelize, Sequelize.DataTypes);
db.Bookmark = defineBookmark(sequelize, Sequelize.DataTypes);
db.Report = defineReport(sequelize, Sequelize.DataTypes);

// User associations
db.User.hasOne(db.Student, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.User.hasOne(db.Faculty, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.User.hasOne(db.Visitor, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.User.hasOne(db.Admin, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.Student.belongsTo(db.User, { foreignKey: 'user_id' });
db.Faculty.belongsTo(db.User, { foreignKey: 'user_id' });
db.Visitor.belongsTo(db.User, { foreignKey: 'user_id' });
db.Admin.belongsTo(db.User, { foreignKey: 'user_id' });

// Location associations
db.Location.hasMany(db.PointOfInterest, { foreignKey: 'location_id', onDelete: 'CASCADE' });
db.PointOfInterest.belongsTo(db.Location, { foreignKey: 'location_id' });

// Event associations
db.Location.hasMany(db.Event, { foreignKey: 'location_id' });
db.Event.belongsTo(db.Location, { foreignKey: 'location_id' });
db.User.hasMany(db.Event, { foreignKey: 'organizer_id' });
db.Event.belongsTo(db.User, { as: 'organizer', foreignKey: 'organizer_id' });

// Event registration associations
db.Event.hasMany(db.EventRegistration, { foreignKey: 'event_id', onDelete: 'CASCADE' });
db.EventRegistration.belongsTo(db.Event, { foreignKey: 'event_id' });
db.User.hasMany(db.EventRegistration, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.EventRegistration.belongsTo(db.User, { foreignKey: 'user_id' });

// Bookmark associations
db.User.hasMany(db.Bookmark, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.Bookmark.belongsTo(db.User, { foreignKey: 'user_id' });
db.PointOfInterest.hasMany(db.Bookmark, { foreignKey: 'poi_id', onDelete: 'CASCADE' });
db.Bookmark.belongsTo(db.PointOfInterest, { foreignKey: 'poi_id' });

// Report associations
db.User.hasMany(db.Report, { as: 'reports', foreignKey: 'reporter_id' });
db.Report.belongsTo(db.User, { as: 'reporter', foreignKey: 'reporter_id' });
db.Location.hasMany(db.Report, { foreignKey: 'location_id' });
db.Report.belongsTo(db.Location, { foreignKey: 'location_id' });
db.Admin.hasMany(db.Report, { as: 'assignedReports', foreignKey: 'assigned_to' });
db.Report.belongsTo(db.Admin, { as: 'assignee', foreignKey: 'assigned_to' });
db.Admin.hasMany(db.Report, { as: 'resolvedReports', foreignKey: 'resolved_by' });
db.Report.belongsTo(db.Admin, { as: 'resolver', foreignKey: 'resolved_by' });

module.exports = db;