const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const signup = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }

  const user = await User.create({ name, email, passwordHash: password });
  const token = generateToken(user._id);

  return {
    token,
    user: { id: user._id, name: user.name, email: user.email },
  };
};

const login = async ({ email, password }) => {
  // Include passwordHash for comparison (it's select:false by default)
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const token = generateToken(user._id);

  return {
    token,
    user: { id: user._id, name: user.name, email: user.email },
  };
};

module.exports = { signup, login };
