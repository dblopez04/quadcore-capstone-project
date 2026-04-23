const { sequelize, Sequelize } = require('../config/db.config');
const defineUser = require('./user.model');
const defineStudent = require('./student.model');
const defineFaculty = require('./faculty.model');
const defineVisitor = require('./visitor.model');
const defineAdmin = require('./admin.model');
const defineLocation = require('./location.model');
const definePointOfInterest = require('./poi.model');
const defineEvent = require('./event.model');
const defineEventDetail = require('./eventDetail.model');
const defineEventRegistration = require('./eventRegistration.model');
const defineEventBookmark = require('./eventBookmark.model');
const defineEventReminder = require('./eventReminder.model');
const defineEventCategorySubscription = require('./eventCategorySubscription.model');
const defineLocationBookmark = require('./locationBookmark.model');
const defineLocationList = require('./locationList.model');
const defineLocationListItem = require('./locationListItem.model');
const defineRecentlyViewedLocation = require('./recentlyViewedLocation.model');
const defineReport = require('./report.model');
const definePasswordResetToken = require('./passwordResetToken.model');
const defineWellLitPath = require('./wellLitPath.model');

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
db.EventDetail = defineEventDetail(sequelize, Sequelize.DataTypes);
db.EventRegistration = defineEventRegistration(sequelize, Sequelize.DataTypes);
db.EventBookmark = defineEventBookmark(sequelize, Sequelize.DataTypes);
db.EventReminder = defineEventReminder(sequelize, Sequelize.DataTypes);
db.EventCategorySubscription = defineEventCategorySubscription(sequelize, Sequelize.DataTypes);
db.LocationBookmark = defineLocationBookmark(sequelize, Sequelize.DataTypes);
db.LocationList = defineLocationList(sequelize, Sequelize.DataTypes);
db.LocationListItem = defineLocationListItem(sequelize, Sequelize.DataTypes);
db.RecentlyViewedLocation = defineRecentlyViewedLocation(sequelize, Sequelize.DataTypes);
db.Report = defineReport(sequelize, Sequelize.DataTypes);
db.PasswordResetToken = definePasswordResetToken(sequelize, Sequelize.DataTypes);
db.WellLitPath = defineWellLitPath(sequelize, Sequelize.DataTypes);

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
db.Event.hasOne(db.EventDetail, { as: 'details', foreignKey: 'event_id', onDelete: 'CASCADE' });
db.EventDetail.belongsTo(db.Event, { foreignKey: 'event_id' });

// Event registration associations
db.Event.hasMany(db.EventRegistration, { foreignKey: 'event_id', onDelete: 'CASCADE' });
db.EventRegistration.belongsTo(db.Event, { foreignKey: 'event_id' });
db.User.hasMany(db.EventRegistration, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.EventRegistration.belongsTo(db.User, { foreignKey: 'user_id' });

// Event bookmark associations
db.User.hasMany(db.EventBookmark, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.EventBookmark.belongsTo(db.User, { foreignKey: 'user_id' });
db.Event.hasMany(db.EventBookmark, { foreignKey: 'event_id', onDelete: 'CASCADE' });
db.EventBookmark.belongsTo(db.Event, { foreignKey: 'event_id' });

// Event reminder associations
db.User.hasMany(db.EventReminder, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.EventReminder.belongsTo(db.User, { foreignKey: 'user_id' });
db.Event.hasMany(db.EventReminder, { foreignKey: 'event_id', onDelete: 'CASCADE' });
db.EventReminder.belongsTo(db.Event, { foreignKey: 'event_id' });

// Event category subscription associations
db.User.hasMany(db.EventCategorySubscription, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.EventCategorySubscription.belongsTo(db.User, { foreignKey: 'user_id' });

// Location bookmark associations
db.User.hasMany(db.LocationBookmark, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.LocationBookmark.belongsTo(db.User, { foreignKey: 'user_id' });
db.Location.hasMany(db.LocationBookmark, { foreignKey: 'location_id', onDelete: 'CASCADE' });
db.LocationBookmark.belongsTo(db.Location, { foreignKey: 'location_id' });

// Custom location list associations
db.User.hasMany(db.LocationList, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.LocationList.belongsTo(db.User, { foreignKey: 'user_id' });
db.LocationList.hasMany(db.LocationListItem, { as: 'items', foreignKey: 'list_id', onDelete: 'CASCADE' });
db.LocationListItem.belongsTo(db.LocationList, { as: 'list', foreignKey: 'list_id' });
db.Location.hasMany(db.LocationListItem, { foreignKey: 'location_id', onDelete: 'CASCADE' });
db.LocationListItem.belongsTo(db.Location, { foreignKey: 'location_id' });

// Recently viewed location associations
db.User.hasMany(db.RecentlyViewedLocation, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.RecentlyViewedLocation.belongsTo(db.User, { foreignKey: 'user_id' });
db.Location.hasMany(db.RecentlyViewedLocation, { foreignKey: 'location_id', onDelete: 'CASCADE' });
db.RecentlyViewedLocation.belongsTo(db.Location, { foreignKey: 'location_id' });

// Report associations
db.User.hasMany(db.Report, { as: 'reports', foreignKey: 'reporter_id' });
db.Report.belongsTo(db.User, { as: 'reporter', foreignKey: 'reporter_id' });
db.Location.hasMany(db.Report, { foreignKey: 'location_id' });
db.Report.belongsTo(db.Location, { foreignKey: 'location_id' });
db.Admin.hasMany(db.Report, { as: 'assignedReports', foreignKey: 'assigned_to' });
db.Report.belongsTo(db.Admin, { as: 'assignee', foreignKey: 'assigned_to' });
db.Admin.hasMany(db.Report, { as: 'resolvedReports', foreignKey: 'resolved_by' });
db.Report.belongsTo(db.Admin, { as: 'resolver', foreignKey: 'resolved_by' });

// Password reset associations
db.User.hasMany(db.PasswordResetToken, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.PasswordResetToken.belongsTo(db.User, { foreignKey: 'user_id' });

module.exports = db;
