const User = require('../models/User');
const Note = require('../models/Note');

const getAllNotes = async (req, res) => {
    const notes = await Note.find().lean();
    if (!notes?.length) {
        return res.status(400).json({ message: 'Notes not found.' });
    }

    // Hard Section
    const notesWithUser = await Promise.all(
        notes.map(async (note) => {
            const user = await User.findById(note.user).lean().exec();
            return { ...note, username: user.username };
        })
    );

    res.json(notesWithUser);
};

const createNewNote = async (req, res) => {
    const { user, title, text } = req.body;

    // confirm data
    if (!user || !title || !text) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    // check duplicate
    const duplicate = await Note.findOne({ title })
        .collation({ locale: 'en', strength: 2 }) // case insensitivity
        .lean()
        .exec();

    if (duplicate) {
        return res.status(400).json({ message: 'Duplicate note title' });
    }

    const note = await Note.create({ user, title, text });

    if (note) {
        // Created
        return res.status(201).json({ message: 'New note created' });
    } else {
        return res.status(400).json({ message: 'Invalid note data received' });
    }
};

const updateNote = async (req, res) => {
    const { id, user, title, text, completed } = req.body;

    // confirm data
    if (!id || !user || !title || !text || typeof completed !== 'boolean') {
        return res.status(400).json({ message: 'All fields are required' });
    }

    // confirm note exists to update
    const note = await Note.findById(id).exec();
    if (!note) {
        return res.status(400).json({ message: 'Note not found' });
    }

    // Check for duplicate title
    const duplicate = await Note.findOne({ title })
        .collation({ locale: 'en', strength: 2 })
        .lean()
        .exec();
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(400).json({ message: 'Duplicate note title' });
    }

    note.user = user;
    note.title = title;
    note.text = text;
    note.completed = completed;

    const updatedNote = await note.save();
    res.json(`${updatedNote.title} updated`);
};

const deleteNote = async (req, res) => {
    const { id } = req.body;

    if (!id) {
        res.status(400).json({ message: 'Note Id required' });
    }

    const note = await Note.findById(id).exec();
    if (!note) {
        return res.status(400).json({ message: 'Note not found' });
    }

    await note.deleteOne();
    const reply = `Note '${note.title}' with ID '${note._id}' deleted`;

    res.json(reply);
};

module.exports = { getAllNotes, createNewNote, updateNote, deleteNote };
