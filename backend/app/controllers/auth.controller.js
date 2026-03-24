const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../models");
const {
    getAccessCookieOptions,
    getRefreshCookieOptions,
    getClearCookieOptions
} = require("../config/cookie.config");
const User = db.User;
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
