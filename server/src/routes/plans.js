const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');

router.get('/', planController.getPlans);
router.get('/:slug', planController.getPlanBySlug);

module.exports = router;
