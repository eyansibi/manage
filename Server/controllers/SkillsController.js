const Skill = require('../models/Skills');
const { validateSkill } = require('../validators/SkillsValidators');

// Obtenir toutes les compétences
exports.getAllSkills = async (req, res) => {
  try {
    const skills = await Skill.find();
    res.status(200).json(skills);
  } catch (err) {
    console.error('Error fetching all skills:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getSkillById = async (req, res) => {
  try {
    const skill = await Skill.findOne({ _id: req.params.id, userId: req.user._id });
    if (!skill) return res.status(404).json({ message: 'Skill not found or unauthorized' });
    res.status(200).json(skill);
  } catch (err) {
    console.error('Error fetching skill by ID:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.createSkill = async (req, res) => {
  console.log('Requête reçue, en-têtes :', req.headers);
  console.log('Données reçues dans req.body :', req.body);

  const { error } = validateSkill(req.body);
  if (error) {
    console.log('Validation errors:', error.details);
    return res.status(400).json({ errors: error.details.map((err) => err.message) });
  }

  if (!req.user || !req.user._id) {
    console.log('Utilisateur non authentifié, req.user :', req.user);
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    console.log('Creating skill with data:', req.body, 'for userId:', req.user._id);
    const newSkill = new Skill({
      ...req.body,
      userId: req.user._id
    });
    await newSkill.save();
    res.status(201).json(newSkill);
  } catch (err) {
    console.error('Error creating skill:', err.message, err.stack);
    res.status(500).json({ message: 'Failed to create skill', error: err.message });
  }
};

exports.updateSkill = async (req, res) => {
  const { error } = validateSkill(req.body);
  if (error) {
    console.log('Validation errors:', error.details);
    return res.status(400).json({ errors: error.details.map((err) => err.message) });
  }

  try {
    console.log('Updating skill with ID:', req.params.id, 'Data:', req.body);
    const skill = await Skill.findOne({ _id: req.params.id, userId: req.user._id });
    if (!skill) return res.status(404).json({ message: 'Skill not found or unauthorized' });

    const updatedSkill = await Skill.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updatedSkill);
  } catch (err) {
    console.error('Error updating skill:', err.message);
    res.status(500).json({ message: 'Failed to update skill', error: err.message });
  }
};
exports.deleteSkill = async (req, res) => {
  try {
    const skill = await Skill.findOne({ _id: req.params.id, userId: req.user._id });
    if (!skill) return res.status(404).json({ message: 'Skill not found or unauthorized' });

    const deletedSkill = await Skill.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Skill deleted successfully' });
  } catch (err) {
    console.error('Error deleting skill:', err.message);
    res.status(500).json({ message: 'Failed to delete skill', error: err.message });
  }
};

// Obtenir toutes les compétences de l'utilisateur connecté
exports.getUserSkills = async (req, res) => {
  console.log('Request received, headers:', req.headers);
  console.log('Request user:', req.user);

  if (!req.user || !req.user._id) {
    console.log('User not authenticated, req.user:', req.user, 'Headers:', req.headers);
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    const skills = await Skill.find({ userId: req.user._id });
    console.log('Found skills for userId:', req.user._id, skills);
    if (!skills.length) {
      return res.status(200).json({ message: 'No skills found for this user', skills: [] });
    }
    res.status(200).json(skills);
  } catch (err) {
    console.error('Error fetching user skills:', err.message, err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};