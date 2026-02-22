const { Op } = require('sequelize');
const jwt = require("jsonwebtoken");
const db = require("../models");
const User = db.User;
const Admin = db.Admin;

exports.verifyToken = (req, res, next) => {
    const token = req.cookies.accessToken;

    if (!token) {
        return res.status(403).send({ message: "No token provided" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: "Invalid or expired token" })
        }

        req.user_id = decoded.user_id;
        next();
    });
};

exports.requireAdmin = (req, res, next) => {
    const token = req.cookies.accessToken;

    if (!token) {
        return res.status(403).send({ message: "No token provided" });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: "Invalid or expired token" })
        }

        req.user_id = decoded.user_id;

        try {
            const admin = await Admin.findOne({ where: { user_id: req.user_id } });
            if (!admin) {
                return res.status(403).send({ message: "Admin privileges required" });
            }
            req.admin_id = admin.admin_id;
            next();
        } catch (error) {
            return res.status(500).send({ message: "Error verifying admin privileges" });
        }
    });
};

exports.duplicateRegistration = async (req, res, next) => {
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
};