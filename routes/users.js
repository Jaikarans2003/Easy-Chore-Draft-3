const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Home = require('../models/Home');

// Get current user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findOne({ uid: req.user.uid }).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        return res.json({ user });
    } catch (error) {
        console.error('Error getting user profile:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update user profile (including UPI ID)
router.patch('/profile', auth, async (req, res) => {
    try {
        const { name, email, phone, upiId } = req.body;
        
        // Find user and update
        const user = await User.findOne({ uid: req.user.uid });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Update fields if provided
        if (name) user.name = name;
        if (email) user.email = email;
        if (phone) user.phone = phone;
        if (upiId !== undefined) user.upiId = upiId;
        
        await user.save();
        
        // If user is in any homes, update their name in those homes
        if (name) {
            await updateUserNameInHomes(req.user.uid, name);
        }
        
        // If user has set or updated their UPI ID, update it in all homes they belong to
        if (upiId !== undefined) {
            await updateUserUpiInHomes(req.user.uid, upiId);
        }
        
        return res.json({ 
            message: 'User profile updated successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                upiId: user.upiId
            }
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Helper function to update user name in all homes they belong to
async function updateUserNameInHomes(userId, newName) {
    try {
        // Find all homes where the user is a member
        const homes = await Home.find({ 'members.uid': userId });
        
        for (const home of homes) {
            // Update the user's name in this home
            const memberIndex = home.members.findIndex(member => member.uid === userId);
            if (memberIndex !== -1) {
                home.members[memberIndex].name = newName;
                await home.save();
            }
        }
    } catch (error) {
        console.error('Error updating user name in homes:', error);
        throw error;
    }
}

// Helper function to update user UPI ID in all homes they belong to
async function updateUserUpiInHomes(userId, upiId) {
    try {
        // Find all homes where the user is a member
        const homes = await Home.find({ 'members.uid': userId });
        
        for (const home of homes) {
            // Update the user's UPI ID in this home
            const memberIndex = home.members.findIndex(member => member.uid === userId);
            if (memberIndex !== -1) {
                home.members[memberIndex].upiId = upiId;
                await home.save();
            }
        }
    } catch (error) {
        console.error('Error updating user UPI ID in homes:', error);
        throw error;
    }
}

module.exports = router; 