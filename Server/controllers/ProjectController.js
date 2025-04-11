const Project = require('../models/Project');
const { validateProject } = require('../validators/validatorProject');
const mongoose = require('mongoose'); // Add this import

exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find().populate('id_teamMembre').populate('id_tasks');
    res.status(200).json(projects);
  } catch (err) {
    console.error('Error fetching all projects:', err);

    res.status(500).json({ message: 'Server error', error: err });
  }
};
exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Add this validation to prevent the error
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid project ID format' });
    }
    
    const project = await Project.findById(id)
      .populate('id_teamMembre')
      .populate({
        path: 'id_tasks',
        select: 'title description status priority estimated_time actual_time deadline assigned_to'
      });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.status(200).json(project);
  } catch (error) {
    console.error('Error fetching project details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createProject = async (req, res) => {
  try {
    const { id } = req.params; // Workspace ID
    
    // Make sure to include ALL fields from the request body
    const projectData = {
      project_name: req.body.project_name,
      description: req.body.description,
      start_date: req.body.start_date,
      end_date: req.body.end_date,
      status: req.body.status || 'not started',
      // Other fields as needed
    };
    
    console.log("Project data being passed to validation:", JSON.stringify(projectData));
    
    // Use project controller directly
    const projectController = require('./ProjectController');
    return projectController.createProject(req, res);
  } catch (error) {
    console.error('Error creating project:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateProject = async (req, res) => {
    const { error } = validateProject(req.body);
    if (error) {
      return res.status(400).json({ errors: error.details.map((err) => err.message) });
    }
  try {
    const updatedProject = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedProject) return res.status(404).json({ message: 'Project not found' });
    res.status(200).json(updatedProject);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update project', error: err });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const deletedProject = await Project.findByIdAndDelete(req.params.id);
    if (!deletedProject) return res.status(404).json({ message: 'Project not found' });
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete project', error: err });
  }
};
exports.getProjectCount = async (req, res) => {
  try {
    const count = await Project.countDocuments();
    res.status(200).json({ count });
  } catch (err) {
    console.error('Error fetching project count:', err);
    res.status(500).json({ message: 'Server error', error: err });
  }
};


