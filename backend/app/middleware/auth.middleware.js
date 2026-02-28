const { Op } = require('sequelize');
const jwt = require("jsonwebtoken");
const db = require("../models");
const User = db.User;
const Admin = db.Admin;

const attachUserFromAccessToken = (req, res) => {
    const token = req.cookies.accessToken;

    if (!token) {
        res.status(403).send({ message: "No token provided" });
        return null;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user_id = decoded.user_id;
        return decoded;
    } catch (err) {
        res.status(401).send({ message: "Invalid or expired token" });
        return null;
    }
};

exports.verifyToken = (req, res, next) => {
    const decoded = attachUserFromAccessToken(req, res);
    if (!decoded) {
        return;
    }

    next();
};

exports.requireAdmin = async (req, res, next) => {
    const decoded = attachUserFromAccessToken(req, res);
    if (!decoded) {
        return;
    }

    try {
        const admin = await Admin.findOne({ where: { user_id: req.user_id } });
        if (!admin) {
            return res.status(403).send({ message: "Admin privileges required" });
        }

        req.admin_id = admin.admin_id;
        req.is_owner = Boolean(admin.is_owner);
        next();
    } catch (error) {
        return res.status(500).send({ message: "Error verifying admin privileges" });
    }
};

exports.requireOwner = async (req, res, next) => {
    try {
        if (!req.admin_id) {
            const decoded = attachUserFromAccessToken(req, res);
            if (!decoded) {
                return;
            }

            const admin = await Admin.findOne({ where: { user_id: req.user_id } });
            if (!admin) {
                return res.status(403).send({ message: "Admin privileges required" });
            }

            req.admin_id = admin.admin_id;
            req.is_owner = Boolean(admin.is_owner);
        }

        if (req.is_owner) {
            next();
            return;
        }

        // Bootstrap mode for existing environments where no owner has been assigned yet.
        const ownerCount = await Admin.count({ where: { is_owner: true } });
        if (ownerCount === 0) {
            if (typeof req.path === "string" && req.path.endsWith("/grant-owner")) {
                next();
                return;
            }

            return res.status(403).send({
                message: "No site owner assigned yet. Promote an owner first."
            });
        }

        return res.status(403).send({ message: "Site owner privileges required" });
    } catch (error) {
        return res.status(500).send({ message: "Error verifying site owner privileges" });
    }
};

exports.duplicateRegistration = async (req, res, next) => {
    try {
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { email: req.body.email },
                    { phone_number: req.body.phone_number },
                ]
            }
        });

        if (!user) {
            return next();
        }

        if (user.email === req.body.email) {
            return res.status(400).send({
                message: "Email already in use"
            });
        }

        if (user.phone_number === req.body.phone_number) {
            return res.status(400).send({
                message: "Phone number already in use"
            });
        }

        next();
    } catch (error) {
        return res.status(500).send({ message: "Error validating registration input" });
    }
};
