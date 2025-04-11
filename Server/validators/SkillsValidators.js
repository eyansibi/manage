const Joi = require('joi');

const skillSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'Name is required',
    'any.required': 'Name is required',
  }),
  description: Joi.string().trim().required().messages({
    'string.empty': 'Description is required',
    'any.required': 'Description is required',
  }),
  category: Joi.string().valid('Technical', 'Soft Skill', 'Management').required().messages({
    'any.only': 'Category must be either Technical, Soft Skill, or Management',
    'any.required': 'Category is required',
  }),
  tags: Joi.array().items(Joi.string().trim()).default([]),tags: Joi.number().min(0).max(100).default(0).messages({
    'number.base': 'Tags must be a number',
    'number.min': 'Tags must be at least 0',
    'number.max': 'Tags must not exceed 100',
  }),
});

module.exports = {
  validateSkill: (data) => skillSchema.validate(data, { abortEarly: false }),
};
