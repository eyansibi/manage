const express = require('express');
const router = express.Router();

const projectController = require('../controllers/ProjectController');

router.post('/addProject', projectController.createProject);
router.put('/updateProject/:id', projectController.updateProject);
router.get('/', projectController.getAllProjects);
router.get('/count', projectController.getProjectCount);

router.get('/:id', projectController.getProjectById);
router.delete('/:id', projectController.deleteProject);

module.exports = router;

