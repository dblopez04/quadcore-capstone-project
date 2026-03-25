const { Op } = require('sequelize');
const jwt = require("jsonwebtoken");
const db = require("../models");
const { getAccessCookieOptions } = require("../config/cookie.config");
const User = db.User;
const Admin = db.Admin;

function normalizeOptionalString(value) {
    if (typeof value !== "string") {
        return value;
    }

    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
}

const issueAccessToken = (res, userId) => {
    const accessToken = jwt.sign(
        { user_id: userId },
        process.env.JWT_SECRET,
        { expiresIn: "30m" }
    );

    res.cookie("accessToken", accessToken, getAccessCookieOptions());
};

const attachUserFromCookies = async (req, res) => {
    const accessToken = req.cookies.accessToken;

    if (accessToken) {
        try {
            const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
            req.user_id = decoded.user_id;
            return decoded;
        } catch (_err) {
            // Access token missing/expired falls back to refresh token.
        }
    }

    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        if (!accessToken) {
            res.status(403).send({ message: "No token provided" });
        } else {
            res.status(401).send({ message: "Invalid or expired token" });
        }
        return null;
    }

    try {
        const decodedRefresh = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findOne({
            where: {
                user_id: decodedRefresh.user_id,
                refresh_token: refreshToken
            }
        });

        if (!user) {
            res.status(401).send({ message: "Invalid or expired token" });
            return null;
        }

        req.user_id = user.user_id;
        issueAccessToken(res, user.user_id);
        return { user_id: user.user_id };
    } catch (_err) {
        res.status(401).send({ message: "Invalid or expired token" });
        return null;
    }
};

exports.verifyToken = async (req, res, next) => {
    const decoded = await attachUserFromCookies(req, res);
    if (!decoded) {
        return;
    }

    next();
};

exports.requireAdmin = async (req, res, next) => {
    const decoded = await attachUserFromCookies(req, res);
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
            const decoded = await attachUserFromCookies(req, res);
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
        const email = typeof req.body.email === "string" ? req.body.email.trim() : req.body.email;
        const phoneNumber = normalizeOptionalString(req.body.phone_number);

        req.body.email = email;
        req.body.phone_number = phoneNumber;

        const orConditions = [{ email }];
        if (phoneNumber) {
            orConditions.push({ phone_number: phoneNumber });
        }

        const user = await User.findOne({
            where: {
                [Op.or]: orConditions
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

        if (phoneNumber && user.phone_number === phoneNumber) {
            return res.status(400).send({
                message: "Phone number already in use"
            });
        }

        next();
    } catch (error) {
        return res.status(500).send({ message: "Error validating registration input" });
    }
};
