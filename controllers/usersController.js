const User = require('../models/User');
const Note = require('../models/Note');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');

// @desc Get all users
// @route GET /users
// @access Private
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select('-password').lean(); // exclude password and lean returns plain JS instead of Mongoose documents
    if (!users?.length)
        return res.status(400).json({ message: 'No users found.' });
    res.json(users);
});

// @desc Create new user
// @route POST /users
// @access Private
const createNewUser = asyncHandler(async (req, res) => {
    const { username, password, roles } = req.body;

    // * confirm data
    if (!username || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    // * check for duplicate
    const duplicate = await User.findOne({ username })
        .collation({ locale: 'en', strength: 2 }) // case insensitivity
        .lean()
        .exec();
    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate username' });
    }

    // * hash password
    const hashedPwd = await bcrypt.hash(password, 10); // salt rounds

    // * create and store new user
    const userObject =
        !Array.isArray(roles) || !roles.length
            ? { username, password: hashedPwd }
            : { username, password: hashedPwd, roles };

    const user = await User.create(userObject);

    // ! since we are at the bottom and we are using ELSE, we don't use "RETURN"
    if (user) {
        res.status(201).json({ message: `New user ${username} created` });
    } else {
        res.status(400).json({ message: `Invalid user data received` });
    }
});

// @desc Update user
// @route PATCH /users
// @access Private
const updateUser = asyncHandler(async (req, res) => {
    const { id, username, roles, active, password } = req.body;

    // * confirm data
    if (
        !id ||
        !username ||
        !Array.isArray(roles) ||
        !roles.length ||
        typeof active !== 'boolean'
    ) {
        return res
            .status(400)
            .json({ message: 'All fields except password are required' });
    }

    const user = await User.findById(id).exec();
    if (!user) {
        return res.status(400).json({ message: 'User not found' });
    }

    // * check for duplicate
    const duplicate = await User.findOne({ username })
        .collation({ locale: 'en', strength: 2 })
        .lean()
        .exec();

    // * Allow updates to the original user
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate user' });
    }

    user.username = username;
    user.roles = roles;
    user.active = active;

    if (password) {
        // Hash password
        user.password = await bcrypt.hash(password, 10); // salt rounds
    }

    const updatedUser = await user.save();
    // ! if we request lean method in the user we wouldn't have save method

    res.json({ message: `${updatedUser.username} updated` });
});

// @desc Delete user
// @route DELETE /users
// @access Private
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.body;
    if (!id) {
        return res.status(400).json({ message: 'User ID Required' });
    }

    // * check if user have a note
    const note = await Note.findOne({ user: id }).lean().exec();
    if (note?.length) {
        return res.status(400).json({ message: 'User has assigned notes' });
    }

    // * check user
    const user = await User.findById(id).exec();
    if (!user) {
        return res.status(400).json({ message: 'User not found' });
    }

    await user.deleteOne();

    const reply = `Username '${user.username}' with ID '${id}' deleted`;
    res.json(reply);
});

module.exports = {
    getAllUsers,
    createNewUser,
    updateUser,
    deleteUser,
};
