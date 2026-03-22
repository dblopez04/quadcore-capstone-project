const db = require("../models");
const Location = db.Location;
const PointOfInterest = db.PointOfInterest;
const Event = db.Event;
const Report = db.Report;
const User = db.User;
const Admin = db.Admin;
const { Op } = require("sequelize");

const NON_ADMIN_ROLES = new Set(["STUDENT", "FACULTY", "VISITOR"]);

const normalizePreviousRole = (role) => {
    if (NON_ADMIN_ROLES.has(role)) {
        return role;
    }
    return "VISITOR";
};

// --- LOCATIONS ---

exports.getAllLocations = async (req, res) => {
    try {
        const { search } = req.query;
        let whereClause = {};

        if (search) {
            whereClause = {
                name: { [Op.iLike]: `%${search}%` }
            };
        }

        const locations = await Location.findAll({ where: whereClause });
        res.send(locations);
    } catch (err) {
        res.status(500).send({ message: err.message || "Error retrieving locations." });
    }
};

exports.createLocation = async (req, res) => {
    if (!req.body.name || !req.body.coordinates) {
        return res.status(400).send({ message: "Content can not be empty!" });
    }

    try {
        const location = {
            name: req.body.name,
            description: req.body.description,
            coordinates: req.body.coordinates
        };

        const data = await Location.create(location);
        res.send(data);
    } catch (err) {
        res.status(500).send({ message: err.message || "Error creating location." });
    }
};

exports.updateLocation = async (req, res) => {
    const id = req.params.id;

    try {
        const [num] = await Location.update(req.body, { where: { location_id: id } });
        if (num == 1) {
            res.send({ message: "Location updated successfully." });
        } else {
            res.send({ message: `Cannot update Location with id=${id}. Maybe Location was not found or req.body is empty!` });
        }
    } catch (err) {
        res.status(500).send({ message: "Error updating Location with id=" + id });
    }
};

exports.deleteLocation = async (req, res) => {
    const id = req.params.id;

    try {
        const num = await Location.destroy({ where: { location_id: id } });
        if (num == 1) {
            res.send({ message: "Location was deleted successfully!" });
        } else {
            res.send({ message: `Cannot delete Location with id=${id}. Maybe Location was not found!` });
        }
    } catch (err) {
        res.status(500).send({ message: "Could not delete Location with id=" + id });
    }
};

// --- POINTS OF INTEREST ---

exports.getAllPois = async (req, res) => {
    try {
        const { category } = req.query;
        let whereClause = {};

        if (category) {
            whereClause.category = category;
        }

        const pois = await PointOfInterest.findAll({ where: whereClause });
        res.send(pois);
    } catch (err) {
        res.status(500).send({ message: err.message || "Error retrieving POIs." });
    }
};

exports.createPoi = async (req, res) => {
    if (!req.body.name || !req.body.location_id || !req.body.category) {
        return res.status(400).send({ message: "Name, location_id, and category are required!" });
    }

    try {
        const poi = {
            location_id: req.body.location_id,
            name: req.body.name,
            description: req.body.description,
            category: req.body.category,
            building_name: req.body.building_name,
            floor_number: req.body.floor_number,
            room_number: req.body.room_number,
            is_indoor: req.body.is_indoor,
            operating_hours: req.body.operating_hours,
            contact_info: req.body.contact_info,
            is_active: req.body.is_active
        };

        const data = await PointOfInterest.create(poi);
        res.send(data);
    } catch (err) {
        res.status(500).send({ message: err.message || "Error creating POI." });
    }
};

exports.updatePoi = async (req, res) => {
    const id = req.params.id;
    try {
        const [num] = await PointOfInterest.update(req.body, { where: { poi_id: id } });
        if (num == 1) {
            res.send({ message: "POI updated successfully." });
        } else {
            res.send({ message: `Cannot update POI with id=${id}. Maybe POI was not found or req.body is empty!` });
        }
    } catch (err) {
        res.status(500).send({ message: "Error updating POI with id=" + id });
    }
};

exports.deletePoi = async (req, res) => {
    const id = req.params.id;
    try {
        const num = await PointOfInterest.destroy({ where: { poi_id: id } });
        if (num == 1) {
            res.send({ message: "POI was deleted successfully!" });
        } else {
            res.send({ message: `Cannot delete POI with id=${id}. Maybe POI was not found!` });
        }
    } catch (err) {
        res.status(500).send({ message: "Could not delete POI with id=" + id });
    }
};

// --- EVENTS ---

exports.getAllEvents = async (req, res) => {
    try {
        const { status } = req.query;
        let whereClause = {};
        if (status) whereClause.status = status;

        const events = await Event.findAll({ where: whereClause });
        res.send(events);
    } catch (err) {
        res.status(500).send({ message: err.message || "Error retrieving events." });
    }
};

exports.createEvent = async (req, res) => {
    try {
        const event = await Event.create(req.body);
        res.send(event);
    } catch (err) {
        res.status(500).send({ message: err.message || "Error creating event." });
    }
};

exports.updateEvent = async (req, res) => {
    const id = req.params.id;
    try {
        const [num] = await Event.update(req.body, { where: { event_id: id } });
        if (num == 1) {
            res.send({ message: "Event updated successfully." });
        } else {
            res.send({ message: `Cannot update Event with id=${id}. Maybe Event was not found or req.body is empty!` });
        }
    } catch (err) {
        res.status(500).send({ message: "Error updating Event with id=" + id });
    }
};

exports.deleteEvent = async (req, res) => {
    const id = req.params.id;
    try {
        const num = await Event.destroy({ where: { event_id: id } });
        if (num == 1) {
            res.send({ message: "Event was deleted successfully!" });
        } else {
            res.send({ message: `Cannot delete Event with id=${id}. Maybe Event was not found!` });
        }
    } catch (err) {
        res.status(500).send({ message: "Could not delete Event with id=" + id });
    }
};

// --- REPORTS ---

exports.getAllReports = async (req, res) => {
    try {
        const { status, priority, type } = req.query;
        let whereClause = {};
        if (status) whereClause.status = status;
        if (priority) whereClause.priority = priority;
        if (type) whereClause.report_type = type;

        const reports = await Report.findAll({ where: whereClause });
        res.send(reports);
    } catch (err) {
        res.status(500).send({ message: err.message || "Error retrieving reports." });
    }
};

exports.updateReport = async (req, res) => {
    const id = req.params.id;
    try {
        let updateData = { ...req.body };

        // Auto-set resolution fields if status is RESOLVED
        if (updateData.status === 'RESOLVED') {
            updateData.resolved_at = new Date();
            updateData.resolved_by = req.admin_id;
        }

        const [num] = await Report.update(updateData, { where: { report_id: id } });
        if (num == 1) {
            res.send({ message: "Report updated successfully." });
        } else {
            res.send({ message: `Cannot update Report with id=${id}. Maybe Report was not found or req.body is empty!` });
        }
    } catch (err) {
        res.status(500).send({ message: "Error updating Report with id=" + id });
    }
};

exports.deleteReport = async (req, res) => {
    const id = req.params.id;
    try {
        const num = await Report.destroy({ where: { report_id: id } });
        if (num == 1) {
            res.send({ message: "Report was deleted successfully!" });
        } else {
            res.send({ message: `Cannot delete Report with id=${id}. Maybe Report was not found!` });
        }
    } catch (err) {
        res.status(500).send({ message: "Could not delete Report with id=" + id });
    }
};

// --- USERS ---

exports.getAllUsers = async (req, res) => {
    try {
        const [users, admins] = await Promise.all([
            User.findAll({
                attributes: { exclude: ["password_hash", "refresh_token"] }
            }),
            Admin.findAll({
                attributes: ["admin_id", "user_id", "is_owner"]
            })
        ]);

        const adminByUserId = new Map(
            admins.map((admin) => [admin.user_id, admin])
        );

        const usersWithPrivileges = users.map((user) => {
            const userJson = user.toJSON();
            const adminInfo = adminByUserId.get(user.user_id);
            return {
                ...userJson,
                is_admin: Boolean(adminInfo),
                is_owner: Boolean(adminInfo && adminInfo.is_owner)
            };
        });

        res.send(usersWithPrivileges);
    } catch (err) {
        res.status(500).send({ message: err.message || "Error retrieving users." });
    }
};

exports.grantAdmin = async (req, res) => {
    const userId = req.params.id;
    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).send({ message: "User not found." });
        }

        const existingAdmin = await Admin.findOne({ where: { user_id: userId } });
        if (existingAdmin) {
            return res.status(400).send({ message: "User is already an admin." });
        }

        const previousRole = normalizePreviousRole(user.user_role);

        await db.sequelize.transaction(async (transaction) => {
            await Admin.create(
                {
                    user_id: userId,
                    is_owner: false,
                    previous_role: previousRole
                },
                { transaction }
            );

            await user.update({ user_role: "ADMIN" }, { transaction });
        });

        res.send({
            message: "Admin privileges granted successfully.",
            user_id: userId,
            previous_role: previousRole
        });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error granting admin privileges." });
    }
};

exports.revokeAdmin = async (req, res) => {
    const userId = req.params.id;
    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).send({ message: "User not found." });
        }

        const admin = await Admin.findOne({ where: { user_id: userId } });
        if (!admin) {
            return res.status(400).send({ message: "User is not an admin." });
        }

        if (admin.is_owner) {
            return res.status(400).send({
                message: "Owner privileges must be revoked before admin privileges can be removed."
            });
        }

        const restoredRole = normalizePreviousRole(admin.previous_role);

        await db.sequelize.transaction(async (transaction) => {
            await Admin.destroy({
                where: { user_id: userId },
                transaction
            });

            await user.update({ user_role: restoredRole }, { transaction });
        });

        res.send({
            message: "Admin privileges revoked successfully.",
            user_id: userId,
            restored_role: restoredRole
        });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error revoking admin privileges." });
    }
};

exports.grantOwner = async (req, res) => {
    const userId = req.params.id;

    try {
        const admin = await Admin.findOne({ where: { user_id: userId } });
        if (!admin) {
            return res.status(400).send({
                message: "User must be an admin before owner privileges can be granted."
            });
        }

        if (admin.is_owner) {
            return res.status(400).send({ message: "User is already a site owner." });
        }

        await admin.update({ is_owner: true });

        res.send({
            message: "Owner privileges granted successfully.",
            user_id: userId
        });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error granting owner privileges." });
    }
};

exports.revokeOwner = async (req, res) => {
    const userId = req.params.id;

    try {
        const admin = await Admin.findOne({ where: { user_id: userId } });
        if (!admin) {
            return res.status(400).send({ message: "User is not an admin." });
        }

        if (!admin.is_owner) {
            return res.status(400).send({ message: "User is not a site owner." });
        }

        const ownerCount = await Admin.count({ where: { is_owner: true } });
        if (ownerCount <= 1) {
            return res.status(400).send({
                message: "Cannot revoke owner privileges from the last remaining owner."
            });
        }

        await admin.update({ is_owner: false });

        res.send({
            message: "Owner privileges revoked successfully.",
            user_id: userId
        });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error revoking owner privileges." });
    }
};
