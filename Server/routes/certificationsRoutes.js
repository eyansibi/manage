const express = require('express');
const router = express.Router();
const certificationController = require('../controllers/CertifiacationsController');
const authController = require('../controllers/AuthController');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configurer Cloudinary
cloudinary.config({
  cloud_name: 'dwbccq2j6',
  api_key: '511441296244864',
  api_secret: 'mDc4YVFPtkiyB2eMa8_FlXRX8QU',
});

// Configurer MulterStorage avec Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'certifications',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

const upload = multer({ storage: storage });

router.get('/', authController.protection, certificationController.getUserCertifications);
router.get('/:id', authController.protection, certificationController.getCertificationById);
router.post('/add', authController.protection, upload.single('image'), certificationController.createCertification);
router.put('/update/:id', authController.protection, upload.single('image'), certificationController.updateCertification);
router.delete('/:id', authController.protection, certificationController.deleteCertification);

module.exports = router;