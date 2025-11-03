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