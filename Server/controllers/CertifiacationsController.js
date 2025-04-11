const Certification = require('../models/Certifications');
const { validateCertification } = require('../validators/CertificationsValidators');
const cloudinary = require('cloudinary').v2;
// Configurer Cloudinary si ce n'est pas déjà fait ailleurs
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Obtenir toutes les certifications de l'utilisateur connecté
exports.getUserCertifications = async (req, res) => {
  console.log('Request received for getUserCertifications, headers:', req.headers);
  console.log('Request user:', req.user);

  if (!req.user || !req.user._id) {
    console.log('User not authenticated, req.user:', req.user, 'Headers:', req.headers);
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    const certifications = await Certification.find({ userId: req.user._id });
    console.log('Found certifications for userId:', req.user._id, certifications);
    if (!certifications.length) {
      return res.status(200).json({ message: 'No certifications found for this user', certifications: [] });
    }
    res.status(200).json(certifications);
  } catch (err) {
    console.error('Error fetching user certifications:', err.message, err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Obtenir une certification par ID
exports.getCertificationById = async (req, res) => {
  try {
    const certification = await Certification.findOne({ _id: req.params.id, userId: req.user._id });
    if (!certification) return res.status(404).json({ message: 'Certification not found or unauthorized' });
    res.status(200).json(certification);
  } catch (err) {
    console.error('Error fetching certification by ID:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Créer une nouvelle certification avec upload d'image
exports.createCertification = async (req, res) => {
  console.log('Requête reçue pour createCertification');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('File:', req.file);

  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    const certificationData = {
      certifications_name: req.body.certifications_name,
      issued_by: req.body.issued_by,
      obtained_date: req.body.obtained_date,
      description: req.body.description || '',
      userId: req.user._id,
      image: req.file ? 'test_image_url' : '', // Test sans Cloudinary
    };

    const newCertification = new Certification(certificationData);
    await newCertification.save();
    res.status(201).json(newCertification);
  } catch (err) {
    console.error('Error creating certification:', err.message, err.stack);
    res.status(500).json({ message: 'Failed to create certification', error: err.message });
  }
};
// Mettre à jour une certification avec upload d'image
exports.updateCertification = async (req, res) => {
  const { error } = validateCertification(req.body);
  if (error) {
    console.log('Validation errors:', error.details);
    return res.status(400).json({ errors: error.details.map((err) => err.message) });
  }

  try {
    const certification = await Certification.findOne({ _id: req.params.id, userId: req.user._id });
    if (!certification) return res.status(404).json({ message: 'Certification not found or unauthorized' });

    let imageUrl = certification.image; // Garder l'image existante par défaut
    if (req.files && req.files.image) {
      const file = req.files.image;
      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ message: 'File size exceeds 5MB limit' });
      }

      const result = await cloudinary.uploader.upload(file.tempFilePath || file.path, {
        folder: 'certifications',
        public_id: `cert_${req.user._id}_${req.params.id}`, // Nom unique basé sur l'ID
        overwrite: true,
      });
      imageUrl = result.secure_url;
    }

    const updatedData = {
      ...req.body,
      image: imageUrl,
    };

    const updatedCertification = await Certification.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    res.status(200).json(updatedCertification);
  } catch (err) {
    console.error('Error updating certification:', err.message);
    res.status(500).json({ message: 'Failed to update certification', error: err.message });
  }
};

// Supprimer une certification
exports.deleteCertification = async (req, res) => {
  try {
    const certification = await Certification.findOne({ _id: req.params.id, userId: req.user._id });
    if (!certification) return res.status(404).json({ message: 'Certification not found or unauthorized' });

    // Optionnel : Supprimer l'image de Cloudinary si elle existe
    if (certification.image) {
      const publicId = `certifications/cert_${req.user._id}_${req.params.id}`;
      await cloudinary.uploader.destroy(publicId);
    }

    await Certification.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Certification deleted successfully' });
  } catch (err) {
    console.error('Error deleting certification:', err.message);
    res.status(500).json({ message: 'Failed to delete certification', error: err.message });
  }
};