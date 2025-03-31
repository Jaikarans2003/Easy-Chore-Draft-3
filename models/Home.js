const mongoose = require('mongoose');

const homeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  homeId: { type: String, required: true, unique: true },
  accessCode: { type: String, required: true },
  createdBy: { type: String, ref: 'User', required: true },
  members: [
    {
      uid: { type: String, required: true },
      name: { type: String, required: true },
      upiId: { type: String, default: '' },
      joinedAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Home', homeSchema);