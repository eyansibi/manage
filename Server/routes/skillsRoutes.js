const express = require('express');
const router = express.Router();
const skillController = require('../controllers/SkillsController');
const authController = require('../controllers/AuthController');

router.get('/', authController.protection, skillController.getUserSkills); // Protégé
router.get('/:id', authController.protection, skillController.getSkillById); // Protégé
router.get('/mySkills', authController.protection, skillController.getUserSkills); // Protégé (redondant, peut être supprimé)
router.post('/add', authController.protection, skillController.createSkill); // Protégé
router.put('/update/:id', authController.protection, skillController.updateSkill); // Protégé
router.delete('/:id', authController.protection, skillController.deleteSkill); // Protégé

module.exports = router;