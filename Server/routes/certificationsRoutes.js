const express = require('express');
const router = express.Router();
const certificationController = require('../controllers/CertifiacationsController');
const authController = require('../controllers/AuthController');
const multer = require('multer');

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  dest: 'uploads/',
});

router.get('/', authController.protection, certificationController.getUserCertifications);
router.get('/:id', authController.protection, certificationController.getCertificationById);
router.post('/add', authController.protection, upload.single('image'), certificationController.createCertification);
router.put('/update/:id', authController.protection, upload.single('image'), certificationController.updateCertification);
router.delete('/:id', authController.protection, certificationController.deleteCertification);

module.exports = router;