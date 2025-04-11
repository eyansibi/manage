const Task = require('../models/Task');
const Project = require('../models/Project');
const taskValidator = require('../validators/taskValidator');

const TaskController = {
    // Create a new task
    createTask: async (req, res) => {
        try {
            const { projectId } = req.params;
            const taskData = { ...req.body, project_id: projectId };
            
            const task = new Task(taskData);
            await task.save();
            
            // Add task to project's tasks array - FIXED: Convert string ID to ObjectId if needed
            await Project.findByIdAndUpdate(
                projectId,
                { $push: { id_tasks: task._id } }
            );
            
            // Log to verify the operation
            console.log(`Added task ${task._id} to project ${projectId}`);
            
            // Return the populated task
            const populatedTask = await Task.findById(task._id)
              .populate('assigned_to', 'name email profile_picture');
              
            res.status(201).json(populatedTask);
        } catch (error) {
            console.error('Error creating task:', error);
            console.error('Details:', error.stack);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    },

    // Get all tasks
    getAllTasks: async (req, res) => {
        try {
            const tasks = await Task.find()
                .populate('assigned_to', 'name email')
                .populate('project_id', 'name');

            res.status(200).json({
                success: true,
                data: tasks
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Get tasks by project ID
    getTasksByProject: async (req, res) => {
        try {
            const { projectId } = req.params;
            
            const tasks = await Task.find({ project_id: projectId })
              .populate('assigned_to', 'name email profile_picture')
              .sort({ createdAt: -1 });
            
            res.status(200).json(tasks);
          } catch (error) {
            console.error('Error fetching tasks for project:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
          }
    },

    // Get tasks assigned to a specific user
    getUserTasks: async (req, res) => {
        try {
            const { userId } = req.params;
            const tasks = await Task.find({ assigned_to: userId })
                .populate('project_id', 'name')
                .populate('assigned_to', 'name email');

            res.status(200).json({
                success: true,
                data: tasks
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Get a single task by ID
    getTaskById: async (req, res) => {
        try {
            const { taskId } = req.params;
            const task = await Task.findById(taskId)
                .populate('assigned_to', 'name email')
                .populate('project_id', 'name');

            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                });
            }

            res.status(200).json({
                success: true,
                data: task
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    updateTask: async (req, res) => {
        try {
            // Validate request body
            const { error } = taskValidator.updateTask.validate(req.body, { abortEarly: false });
            if (error) {
                const errors = error.details.map(detail => ({
                    field: detail.path[0],
                    message: detail.message
                }));
                return res.status(400).json({
                    success: false,
                    errors: errors
                });
            }
    
            // Change this line - use id instead of taskId to match the route parameter
            const { id } = req.params;  // Was using taskId, needs to be id
            const updates = req.body;
    
            const task = await Task.findByIdAndUpdate(
                id,  // Use id instead of taskId
                updates,
                { new: true, runValidators: true }
            ).populate('assigned_to', 'name email profile_picture')
             .populate('project_id', 'name');
    
            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                });
            }
    
            res.status(200).json({
                success: true,
                data: task,
                message: 'Task updated successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // Update task status
    updateTaskStatus: async (req, res) => {
        try {
            // Validate request body
            const { error } = taskValidator.updateStatus.validate(req.body, { abortEarly: false });
            if (error) {
                const errors = error.details.map(detail => ({
                    field: detail.path[0],
                    message: detail.message
                }));
                return res.status(400).json({
                    success: false,
                    errors: errors
                });
            }
    
            // Change this line too
            const { id } = req.params;  // Was using taskId, needs to be id
            const { status } = req.body;
    
            const task = await Task.findByIdAndUpdate(
                id,  // Use id instead of taskId
                { status },
                { new: true, runValidators: true }
            ).populate('assigned_to', 'name email profile_picture')
             .populate('project_id', 'name');
    
            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                });
            }
    
            res.status(200).json({
                success: true,
                data: task,
                message: 'Task status updated successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // Delete a task
    deleteTask: async (req, res) => {
        try {
            // Change this line as well
            const { id } = req.params;  // Was using taskId, needs to be id
            const task = await Task.findById(id);
    
            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                });
            }
    
            // Remove task from project's tasks array
            await Project.findByIdAndUpdate(task.project_id, {
              $pull: { id_tasks: id }  // Use id instead of taskId
            });
            
            // Delete the task
            await Task.findByIdAndDelete(id);  // Use id instead of taskId
    
            res.status(200).json({
                success: true,
                message: 'Task deleted successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = TaskController;