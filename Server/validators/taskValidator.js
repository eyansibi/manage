const Joi = require('joi');

const taskValidator = {
    createTask: Joi.object({
        project_id: Joi.string()
            .required()
            .messages({
                'any.required': 'Project ID is required'
            }),

        assigned_to: Joi.string()
            .required()
            .messages({
                'any.required': 'Assigned user ID is required'
            }),

        title: Joi.string()
            .required()
            .min(3)
            .max(100)
            .trim()
            .messages({
                'string.min': 'Title must be at least 3 characters long',
                'string.max': 'Title cannot exceed 100 characters',
                'any.required': 'Title is required'
            }),

        description: Joi.string()
            .required()
            .min(10)
            .max(1000)
            .trim()
            .messages({
                'string.min': 'Description must be at least 10 characters long',
                'string.max': 'Description cannot exceed 1000 characters',
                'any.required': 'Description is required'
            }),

        status: Joi.string()
            .valid('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE')
            .default('TODO')
            .messages({
                'any.only': 'Status must be one of: TODO, IN_PROGRESS, REVIEW, DONE'
            }),

        priority: Joi.string()
            .valid('LOW', 'MEDIUM', 'HIGH', 'URGENT')
            .default('MEDIUM')
            .messages({
                'any.only': 'Priority must be one of: LOW, MEDIUM, HIGH, URGENT'
            }),

        estimated_time: Joi.number()
            .required()
            .min(0)
            .messages({
                'number.min': 'Estimated time cannot be negative',
                'any.required': 'Estimated time is required'
            }),

        actual_time: Joi.number()
            .min(0)
            .default(0)
            .messages({
                'number.min': 'Actual time cannot be negative'
            }),

        id_ai_analysis: Joi.string()
            .allow(null)
            .messages({
                'string.pattern.base': 'Invalid AI analysis ID format'
            }),

        deadline: Joi.date()
            .required()
            .min('now')
            .messages({
                'date.min': 'Deadline must be in the future',
                'any.required': 'Deadline is required'
            })
    }),

    updateTask: Joi.object({
        project_id: Joi.string()
            .messages({
            }),

        assigned_to: Joi.string()
            .messages({
            }),

        title: Joi.string()
            .min(3)
            .max(100)
            .trim()
            .messages({
                'string.min': 'Title must be at least 3 characters long',
                'string.max': 'Title cannot exceed 100 characters'
            }),

        description: Joi.string()
            .min(10)
            .max(1000)
            .trim()
            .messages({
                'string.min': 'Description must be at least 10 characters long',
                'string.max': 'Description cannot exceed 1000 characters'
            }),

        status: Joi.string()
            .valid('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE')
            .messages({
                'any.only': 'Status must be one of: TODO, IN_PROGRESS, REVIEW, DONE'
            }),

        priority: Joi.string()
            .valid('LOW', 'MEDIUM', 'HIGH', 'URGENT')
            .messages({
                'any.only': 'Priority must be one of: LOW, MEDIUM, HIGH, URGENT'
            }),

        estimated_time: Joi.number()
            .min(0)
            .messages({
                'number.min': 'Estimated time cannot be negative'
            }),

        actual_time: Joi.number()
            .min(0)
            .messages({
                'number.min': 'Actual time cannot be negative'
            }),

        deadline: Joi.date()
            .min('now')
            .messages({
                'date.min': 'Deadline must be in the future'
            })
    }),

    updateStatus: Joi.object({
        status: Joi.string()
            .required()
            .valid('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE')
            .messages({
                'any.only': 'Status must be one of: TODO, IN_PROGRESS, REVIEW, DONE',
                'any.required': 'Status is required'
            })
    })
};

module.exports = taskValidator; 