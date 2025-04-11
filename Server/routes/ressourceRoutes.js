const express = require('express');
const router = express.Router();
const ressourceController = require('../controllers/RessourceController');


router.post('/addRessource', ressourceController.createRessource);
router.get('/', ressourceController.getAllRessources);
router.get('/:id', ressourceController.getRessourceById);
router.put('/updateRessource/:id', ressourceController.updateRessource);
router.delete('/:id', ressourceController.deleteRessource);

module.exports = router;
