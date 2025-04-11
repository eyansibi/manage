const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    project_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    assigned_to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'],
        default: 'TODO'
    },
    priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        default: 'MEDIUM'
    },
    estimated_time: {
        type: Number, // in hours
        required: true
    },
    actual_time: {
        type: Number, // in hours
        default: 0
    },
    id_ai_analysis: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AIAnalysis'
    },
    deadline: {
        type: Date,
        required: true
    }
}, {
    timestamps: true // This will add createdAt and updatedAt fields automatically
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
