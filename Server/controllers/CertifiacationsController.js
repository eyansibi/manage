require('dotenv').config(); // Assure que .env est chargé

const Certification = require('../models/Certifications');
const { validateCertification } = require('../validators/CertificationsValidators');

const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// ✅ Config Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Config Storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'certifications',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

const upload = multer({ storage });

// 📤 Middleware exporté si besoin dans routes
exports.upload = upload;

// ✅ GET - Toutes les certifications de l'utilisateur
exports.getUserCertifications = async (req, res) => {
  try {
    const certifications = await Certification.find({ userId: req.user._id });
    return res.status(200).json(certifications);
  } catch (err) {
    console.error('Error fetching certifications:', err.message);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ✅ GET - Certification par ID
exports.getCertificationById = async (req, res) => {
  try {
    const certification = await Certification.findOne({ _id: req.params.id, userId: req.user._id });
    if (!certification) {
      return res.status(404).json({ message: 'Certification not found or unauthorized' });
    }
    return res.status(200).json(certification);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ✅ POST - Créer une certification (image facultative)
exports.createCertification = async (req, res) => {
  const { error } = validateCertification(req.body);
  if (error) {
    return res.status(400).json({ errors: error.details.map(err => err.message) });
  }

  try {
    const newCertification = {
      ...req.body,
      userId: req.user._id,
      image: req.file?.path || null,
    };

    const created = await Certification.create(newCertification);
    return res.status(201).json(created);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create certification', error: err.message });
  }
};

// ✅ PUT - Mettre à jour une certification (image facultative)
exports.updateCertification = async (req, res) => {
  const { error } = validateCertification(req.body);
  if (error) {
    return res.status(400).json({ errors: error.details.map(err => err.message) });
  }

  try {
    const certification = await Certification.findOne({ _id: req.params.id, userId: req.user._id });
    if (!certification) {
      return res.status(404).json({ message: 'Certification not found or unauthorized' });
    }

    // Mise à jour des champs
    certification.title = req.body.title;
    certification.description = req.body.description;
    certification.date = req.body.date;
    if (req.file?.path) {
      certification.image = req.file.path;
    }

    await certification.save();
    return res.status(200).json(certification);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update certification', error: err.message });
  }
};

// ✅ DELETE - Supprimer une certification
exports.deleteCertification = async (req, res) => {
  try {
    const certification = await Certification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!certification) {
      return res.status(404).json({ message: 'Certification not found or unauthorized' });
    }

    return res.status(200).json({ message: 'Certification deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete certification', error: err.message });
  }
};
