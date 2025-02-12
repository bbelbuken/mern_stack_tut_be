const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const noteSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User', // referring User Schema
        },
        title: {
            type: String,
            required: true,
        },
        text: {
            type: String,
            required: true,
        },
        completed: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true, // mongodb provides dates (created, updated) automatically
    }
);

noteSchema.plugin(AutoIncrement, {
    inc_field: 'ticket', // this will create a ticket field in our schema that'll get seq number
    id: 'ticketNums', // we will see this in counter collection
    start_seq: 500,
});

module.exports = mongoose.model('Note', noteSchema);
