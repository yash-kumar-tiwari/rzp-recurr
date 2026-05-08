const authService = require('../services/authService');
const { sendSuccess, sendCreated } = require('../utils/response');

const signup = async (req, res, next) => {
  try {
    const result = await authService.signup(req.body);
    return sendCreated(res, result, 'Account created successfully');
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return sendSuccess(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
};

// Logout is handled client-side (discard JWT from storage)
// This endpoint exists for completeness and logging purposes
const logout = (req, res) => {
  return res.json({ success: true, message: 'Logged out successfully' });
};

module.exports = { signup, login, logout };
