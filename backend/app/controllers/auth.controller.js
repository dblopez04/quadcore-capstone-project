const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const db = require("../models");
const {
    getAccessCookieOptions,
    getRefreshCookieOptions,
    getClearCookieOptions
} = require("../config/cookie.config");
const { sendPasswordResetEmail } = require("../services/email.service");
const {
    buildPasswordResetUrl,
    generatePasswordResetToken,
    getPasswordResetTtlMinutes,
    hashPasswordResetToken,
} = require("../services/passwordReset.service");
const User = db.User;
const PasswordResetToken = db.PasswordResetToken;
const REGISTERABLE_ROLES = new Set(["STUDENT", "FACULTY", "VISITOR"]);

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

const generateAccessToken = (user) => {
    return jwt.sign(
        { user_id: user.user_id },
        JWT_SECRET, 
        { expiresIn: "30m" }
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        { user_id: user.user_id },
        JWT_REFRESH_SECRET, 
        { expiresIn: "7d" }
    );
};

const GENERIC_FORGOT_PASSWORD_RESPONSE = {
    message: "If an account exists for that email, a reset link has been sent.",
};

exports.register = async (req, res) => {
    const requestedRole = req.body.user_role;
    if (!REGISTERABLE_ROLES.has(requestedRole)) {
        return res.status(400).send({
            message: "Invalid role. Registration supports STUDENT, FACULTY, or VISITOR only."
        });
    }

    try {
        const user = await User.create({
            email: req.body.email,
            password_hash: bcrypt.hashSync(req.body.password, 10),
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            phone_number: req.body.phone_number,
            user_role: requestedRole
        });

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        await user.update({ refresh_token: refreshToken });

        res.cookie("accessToken", accessToken, getAccessCookieOptions());
        res.cookie("refreshToken", refreshToken, getRefreshCookieOptions());

        res.status(201).send({
            message: "User registered successfully!",
            accessToken: accessToken,
            refreshToken: refreshToken,
            user: {
                id: user.user_id,
                user_id: user.user_id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                phone_number: user.phone_number,
                user_role: user.user_role
            }
        });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

exports.login = async (req, res) => {
  try {
    const user = await User.findOne({
        where: { email: req.body.email }
    });

    if (!user) {
        return res.status(404).send({ message: "User not found" });
    }

    const validPassword = bcrypt.compareSync(
        req.body.password,
        user.password_hash
    );

    if (!validPassword) {
        return res.status(401).send({
            message: "Invalid Password"
        });
    }


    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await user.update({ refresh_token: refreshToken });

    res.cookie("accessToken", accessToken, getAccessCookieOptions());
    res.cookie("refreshToken", refreshToken, getRefreshCookieOptions());

    res.status(200).send({
        message: "Login successful",
        accessToken: accessToken,
        refreshToken: refreshToken,
        user: {
        id: user.id,
        user_id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number,
        user_role: user.user_role
      }
    });
  } catch (err) {
        res.status(500).send({ message: err.message });
  }
};

exports.refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ message: "No token provided" });
        }

        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

        const user = await User.findOne({
            where: {
                user_id: decoded.user_id,
                refresh_token: refreshToken
        }
        });

        if (!user) {
            return res.status(403).json({ message: "Invalid refresh token" });
        }

        const newAccessToken = generateAccessToken(user);

        res.cookie("accessToken", newAccessToken, getAccessCookieOptions());
        res.status(200).json({ message: "Token refreshed successfully" });
    } catch (err) {
        return res.status(403).json({ message: "Invalid or expired refresh token" });
    }
};

exports.forgotPassword = async (req, res) => {
    const email = String(req.body.email || "").trim();

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    try {
        const user = await User.findOne({
            where: {
                email,
            },
        });

        if (!user) {
            return res.status(200).json(GENERIC_FORGOT_PASSWORD_RESPONSE);
        }

        const rawToken = generatePasswordResetToken();
        const tokenHash = hashPasswordResetToken(rawToken);
        const ttlMinutes = getPasswordResetTtlMinutes();
        const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
        const resetUrl = buildPasswordResetUrl(rawToken);
        const now = new Date();

        await PasswordResetToken.update(
            { used_at: now },
            {
                where: {
                    user_id: user.user_id,
                    used_at: null,
                    expires_at: {
                        [Op.gt]: now,
                    },
                },
            }
        );

        const resetRecord = await PasswordResetToken.create({
            user_id: user.user_id,
            token_hash: tokenHash,
            expires_at: expiresAt,
        });

        try {
            await sendPasswordResetEmail({
                to: user.email,
                resetUrl,
                ttlMinutes,
            });
        } catch (emailError) {
            await resetRecord.destroy();
            throw emailError;
        }

        return res.status(200).json(GENERIC_FORGOT_PASSWORD_RESPONSE);
    } catch (err) {
        return res.status(500).json({ message: "Failed to process password reset request" });
    }
};

exports.resetPassword = async (req, res) => {
    const token = String(req.body.token || "").trim();
    const newPassword = String(req.body.newPassword || "");

    if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    try {
        const tokenHash = hashPasswordResetToken(token);
        const resetRecord = await PasswordResetToken.findOne({
            where: {
                token_hash: tokenHash,
                used_at: null,
                expires_at: {
                    [Op.gt]: new Date(),
                },
            },
        });

        if (!resetRecord) {
            return res.status(400).json({ message: "Reset link is invalid or expired" });
        }

        const user = await User.findOne({
            where: {
                user_id: resetRecord.user_id,
            },
        });

        if (!user) {
            return res.status(400).json({ message: "Reset link is invalid or expired" });
        }

        const now = new Date();

        await user.update({
            password_hash: bcrypt.hashSync(newPassword, 10),
            refresh_token: null,
        });

        await PasswordResetToken.update(
            { used_at: now },
            {
                where: {
                    user_id: user.user_id,
                    used_at: null,
                },
            }
        );

        res.clearCookie("accessToken", getClearCookieOptions());
        res.clearCookie("refreshToken", getClearCookieOptions());
        return res.status(200).json({ message: "Password reset successful" });
    } catch (err) {
        return res.status(500).json({ message: "Failed to reset password" });
    }
};

exports.logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (refreshToken) {
            await User.update(
                { refresh_token: null },
                { where: { refresh_token: refreshToken } }
            );
        }

        res.clearCookie("accessToken", getClearCookieOptions());
        res.clearCookie("refreshToken", getClearCookieOptions());
        res.status(200).json({ message: "Logout successful" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
