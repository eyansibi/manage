const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protection, allowTo } =require('../controllers/AuthController');

// Get all notifications for the authenticated user
router.get('/', protection, notificationController.getNotifications);

// Mark a notification as read
router.patch('/:id/read', protection, notificationController.markAsRead);

// Mark all notifications as read
router.patch('/read-all', protection, notificationController.markAllAsRead);
router.delete('/clear', protection, notificationController.clearAllNotifications);

// Delete a notification
router.delete('/:id', protection, notificationController.deleteNotification);
// Clear all notifications
module.exports = router;