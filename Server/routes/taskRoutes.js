const express = require('express');
const router = express.Router();
const taskController = require('../controllers/TaskController');
const { protection, allowTo } =require('../controllers/AuthController');

// Get tasks by project
router.get('/projects/:projectId/tasks', protection, taskController.getTasksByProject);

// Create new task
router.post('/projects/:projectId/tasks', protection, taskController.createTask);

// Update task
router.put('/tasks/:id', protection, taskController.updateTask);

// Delete task
router.delete('/tasks/:id', protection, taskController.deleteTask);

module.exports = router;