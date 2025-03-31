const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
    homeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Home',
        required: true
    },
    payer: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    reason: {
        type: String,
        required: true,
        trim: true
    },
    splitType: {
        type: String,
        enum: ['equal', 'custom'],
        default: 'equal'
    },
    debtors: [
        {
            name: {
                type: String,
                required: true
            },
            amount: {
                type: Number,
                required: true
            },
            paid: {
                type: Boolean,
                default: false
            },
            paidMethod: {
                type: String,
                enum: ['cash', 'upi', 'other'],
                default: 'cash'
            },
            paidDate: {
                type: Date,
                default: null
            }
        }
    ],
    date: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Expense', ExpenseSchema);