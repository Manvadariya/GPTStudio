import { User } from '../models/User.model.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

export const signup = async (req, res) => {
  // 1. Remove 'role' from destructuring
  const { name, email, password, company } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`;

    // 2. Remove 'role' from the User.create call
    const user = await User.create({ name, email, password, company, avatar });

    const token = generateToken(user._id);

    // 3. Remove 'role' from the response payload
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        company: user.company,
        avatar: user.avatar,
        joinedAt: user.joinedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during signup', error: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.comparePassword(password))) {
      const token = generateToken(user._id);
      // 4. Remove 'role' from the response payload
      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          company: user.company,
          avatar: user.avatar,
          joinedAt: user.joinedAt,
        },
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};