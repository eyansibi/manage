const mongoose = require('mongoose');

const ressourceSchema = new mongoose.Schema({
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',  
    required: true,
  },
  resource_type: {
    type: String,
    enum: ['Matériel', 'Humain', 'Financier'],
    required: true,
  },
  estimated_cost: {
    type: Number,
    required: true,
  },
  estimated_time: {
    type: Number, 
    required: true,
  },
  team_size: {
    type: Number,
    required: true,
  },
  allocated_cost: {
    type: Number,
    required: true,
  },
  allocated_time: {
    type: Number, 
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Ressource', ressourceSchema);
