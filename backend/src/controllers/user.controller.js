import { User } from '../models/User.model.js';

// @desc    Get current user's profile
// @route   GET /api/users/profile
export const getUserProfile = async (req, res) => {
  try {
    // req.user is attached by the 'protect' middleware
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: Could not fetch profile.' });
  }
};

// @desc    Update user profile and basic settings
// @route   PUT /api/users/profile
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.company = req.body.company || user.company;
      
      if (req.body.sessionTimeout) {
        user.sessionTimeout = req.body.sessionTimeout;
      }
      
      const updatedUser = await user.save();
      res.status(200).json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error: Could not update profile.' });
  }
};