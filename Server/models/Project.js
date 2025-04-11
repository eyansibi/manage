const mongoose = require('mongoose');
const Task = require('./Task');

const projectSchema = new mongoose.Schema(
  {
    project_name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['not started', 'in progress', 'completed'],
      default: 'not started',
    },
    start_date: {
      type: Date,
      required: true,
    },
    end_date: {
      type: Date,
      required: true,
    },
    id_teamMembre: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    id_tasks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    }],
  },
  {
    timestamps: true, 
  }
);

module.exports = mongoose.model('Project', projectSchema);