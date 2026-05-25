const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', notificationController.getMine);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:id/read', notificationController.markRead);

module.exports = router;
