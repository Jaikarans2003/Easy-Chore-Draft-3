const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    profileImage: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        trim: true,
        default: ''
    },
    upiId: {
        type: String,
        trim: true,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    homes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Home' }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);