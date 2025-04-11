const Joi = require('joi');

const ressourceSchema = Joi.object({
  project_id: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      'string.hex': 'Project ID must be a valid ObjectId',
      'any.required': 'Project ID is required',
    }),

  resource_type: Joi.string()
    .valid('Matériel', 'Humain', 'Financier')
    .required()
    .messages({
      'any.only': 'Resource type must be one of Matériel, Humain, or Financier',
      'any.required': 'Resource type is required',
    }),

  estimated_cost: Joi.number()
    .required()
    .messages({
      'number.base': 'Estimated cost must be a number',
      'any.required': 'Estimated cost is required',
    }),

  estimated_time: Joi.number()
    .required()
    .messages({
      'number.base': 'Estimated time must be a number',
      'any.required': 'Estimated time is required',
    }),

  team_size: Joi.number()
    .required()
    .messages({
      'number.base': 'Team size must be a number',
      'any.required': 'Team size is required',
    }),

  allocated_cost: Joi.number()
    .required()
    .messages({
      'number.base': 'Allocated cost must be a number',
      'any.required': 'Allocated cost is required',
    }),

  allocated_time: Joi.number()
    .required()
    .messages({
      'number.base': 'Allocated time must be a number',
      'any.required': 'Allocated time is required',
    }),
});

module.exports = {
  validateRessource: (data) => ressourceSchema.validate(data, { abortEarly: false }),
};
