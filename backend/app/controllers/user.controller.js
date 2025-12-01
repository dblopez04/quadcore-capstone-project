const db = require('../models');
const User = db.User;

exports.getProfile = async (req, res) => {
    const user = await User.findOne({
        where: { user_id: req.user_id }
    });

    if(!user) {
        return res.status(404).send({ message: "User not found" });
    }

    res.status(200).send({
        user: {
            id: user.user_id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            phone_number: user.phone_number,
            user_role: user.user_role
        }
    })
};

exports.getSearchHistory = async (req, res) => {
    try{
        const accessToken = req.cookies.accessToken;

        if (!accessToken) {
            return res.status(403).json({ message: "Access Token not found" });
        }

        const refreshToken = req.cookies.refreshToken;

        if(!refreshToken) {
            return res.status(403).json({ message: "Refresh token not found"});
        }

        const user = await User.findOne({
            where: { refresh_token: refreshToken }
        });

        if (!user) {
            return res.status(403).json({ message: "User not found" });
        }

        res.status(200).send({
            search_history: user.search_history
        })

    } catch (err) {
        return res.status(403).json({ message: "Could not get search history" });
    }
};

exports.addSearchToSearchHistory = async (req, res) => {
    try{
        const accessToken = req.cookies.accessToken;

        if (!accessToken) {
            return res.status(403).json({ message: "Access Token not found" });
        }

        const refreshToken = req.cookies.refreshToken;

        if(!refreshToken) {
            return res.status(403).json({ message: "Refresh token not found"});
        }

        const user = await User.findOne({
            where: { refresh_token: refreshToken }
        });

        if (!user) {
            return res.status(403).json({ message: "User not found" });
        }

        const search = req.body.search;

        if (!search) {
            return res.status(403).json({ message: "No search found" })
        }

        let historyArray = user.search_history || [];
        historyArray.unshift(search);

        await user.update({ search_history: historyArray });

        res.status(200).send({
            message: "Added new search to history",
            search_history: historyArray
        })

    } catch (err) {
        return res.status(403).json({ message: "Could not add to search history" });
    }
};

exports.clearSearchHistory = async (req, res) => {
    try {
        const accessToken = req.cookies.accessToken;

        if (!accessToken) {
            return res.status(403).json({ message: "Access Token not found" });
        }

        const refreshToken = req.cookies.refreshToken;

        if(!refreshToken) {
            return res.status(403).json({ message: "Refresh token not found"});
        }

        const user = await User.findOne({
            where: { refresh_token: refreshToken }
        });

        if (!user) {
            return res.status(403).json({ message: "User not found" });
        }

        await user.update({ search_history: [] });

        res.status(200).json({ message: "Search history cleared successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};