const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId, // Référence à l'ID de l'utilisateur
    ref: "User", // Référence au modèle User
    required: true, // Ce champ est obligatoire
  },
  job_title: {
    type: String,
    required: true,
    trim: true,
  },
  company: {
    type: String,
    required: true,
    trim: true,
  },
  start_date: {
    type: Date,
    required: true,
  },
  end_date: {
    type: Date,
  
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },

  employment_type: {
    type: String,
    enum: ['Temps plein', 'Temps partiel', 'Freelance', 'Stage', 'Contrat', 'Bénévolat'],
    default: 'Temps plein',
  },
  is_current: {
    type: Boolean,
    default: false,
  },

  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot be more than 100 characters'],
  },
  location_type: {
    type: String,
    enum: ['Sur place', 'À distance', 'Hybride'],
    default: 'Sur place',
  },
  job_source: {
    type: String,
    enum: [
      'LinkedIn',
      'Indeed',
      'Glassdoor',
      'Directement sur le site de l\'entreprise',
      'Recommandation',
      'Autre',
      '', // Permet une valeur vide (correspond à "Veuillez sélectionner")
    ],
    default: '',
  },

}, {
  timestamps: true,
});

module.exports = mongoose.model('Experience', experienceSchema);
