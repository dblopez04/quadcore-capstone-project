const db = require("../models");
const User = db.User;
const Student = db.Student;
const Faculty = db.Faculty;
const Visitor = db.Visitor;

var bcrypt = require("bcrypt");

exports.register = (req, res) => {
    User.create({
        user_id: req.body.user_id,
        email: req.body.email,
        password_hash: bcrypt.hashSync(req.body.password, 10),
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        phone_number: req.body.phone_number,
        role: req.body.role
    }).then(() => {
        res.send({message: "User registered successfully!"});
    });
}

exports.login = (req, res) => {
    User.findOne({
        where: {
            user_id: req.body.user_id
        }
    }).then(user =>{
        if(!user) {
            return res.status(404).send({ message: "User not found" });
        }

        var validPassword = bcrypt.compareSync(
            req.body.password_hash,
            user.password_hash
        );

        if (!validPassword) {
            return res.status(401).send({
                accessToken: null,
                message: "Invalid Password!"
            });
        }

        res.status(200).send({
          id: user.id,
          username: user.username,
          email: user.email,
        });
    }).catch(err => {
        res.status(500).send({ message: err.message });
    });
}