const Notification = require('../models/Notification');
const socketUtils = require('../Socket');

// Create a new notification
exports.createNotification = async (data) => {
  try {
    const notification = new Notification({
      recipient: data.recipient,
      type: data.type,
      message: data.message,
      relatedWorkspace: data.workspaceId,
      relatedProject: data.projectId,
      relatedTask: data.taskId,
      relatedInvitation: data.invitationId,
      actionLink: data.actionLink
    });

    await notification.save();

    // Get socket.io instance
    const io = socketUtils.getIO();
    const recipientId = data.recipient.toString();
    
    console.log(`Creating notification for user ${recipientId}:`, data.message);
    
    // Use our debug function for more reliable emission
    const emitted = socketUtils.emitNotification(recipientId, {
      ...notification.toObject(),
      workspace_name: data.workspaceName 
    });
    
    console.log('Notification emission status:', emitted ? 'SUCCESS' : 'FAILED');

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Get all notifications for logged-in user
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 }) // Sort by newest first
      .limit(50); // Limit to avoid overwhelming the client
    
    // Return just the array of notifications directly, without wrapping in an object
    // This is what the frontend expects
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Mark a notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ status: 'error', message: 'Notification not found' });
    }
    
    // Check if the notification belongs to the current user
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ status: 'error', message: 'You do not have permission to update this notification' });
    }
    
    notification.read = true;
    await notification.save();
    
    res.status(200).json({
      status: 'success',
      data: notification
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { $set: { read: true } }
    );
    
    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ status: 'error', message: 'Notification not found' });
    }
    
    // Check if the notification belongs to the current user
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ status: 'error', message: 'You do not have permission to delete this notification' });
    }
    
    await notification.deleteOne();
    
    // For 204 No Content responses, don't include a response body
    return res.status(204).end();
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

// Clear all notifications
exports.clearAllNotifications = async (req, res) => {
  try {
    console.log('clearAllNotifications called with user:', req.user ? req.user._id : 'undefined user');
    
    // Check if user exists in the request
    if (!req.user || !req.user._id) {
      console.error('User not found in request');
      return res.status(401).json({ 
        status: 'error', 
        message: 'Authentication required' 
      });
    }
    
    console.log('Attempting to delete notifications for user:', req.user._id);
    
    // Use a try/catch specifically for the database operation
    try {
      const result = await Notification.deleteMany({ recipient: req.user._id });
      console.log('Delete result:', JSON.stringify(result));
      
      return res.status(200).json({
        status: 'success',
        message: 'All notifications cleared successfully',
        result: result
      });
    } catch (dbError) {
      console.error('Database error when deleting notifications:', dbError);
      return res.status(500).json({ 
        status: 'error', 
        message: 'Database error: ' + dbError.message,
        details: dbError.toString()
      });
    }
  } catch (error) {
    console.error('Unexpected error in clearAllNotifications:', error);
    return res.status(500).json({ 
      status: 'error', 
      message: 'Server error: ' + error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};