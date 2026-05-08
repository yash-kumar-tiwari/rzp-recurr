const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendUnauthorized } = require('../utils/response');

/**
 * Middleware: Verify JWT from Authorization: Bearer <token>
 * Attaches req.user = { id, name, email } on success
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendUnauthorized(res, 'Access token is missing');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('name email');
    if (!user) {
      return sendUnauthorized(res, 'User no longer exists');
    }

    req.user = { id: user._id.toString(), name: user.name, email: user.email };
    next();
  } catch (error) {
    next(error); // Passes JWT errors to global errorHandler
  }
};

module.exports = { verifyToken };
