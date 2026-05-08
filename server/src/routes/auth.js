const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validate = require('../middlewares/validate');
const { signupSchema, loginSchema } = require('../validators/authValidators');
const { verifyToken } = require('../middlewares/auth');

router.post('/signup', validate(signupSchema), authController.signup);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', verifyToken, authController.logout);

module.exports = router;
