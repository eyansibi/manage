const Joi = require('joi');

const projectSchema = Joi.object({
  project_name: Joi.string().trim().required().messages({
    'string.empty': 'Project name cannot be empty',
    'any.required': 'Project name is required'
  }),
  status: Joi.string().valid('not started', 'in progress', 'completed').default('not started').messages({
    'any.only': 'Status must be either not started, in progress, or completed'
  }),
  // Remove the min('now') restriction causing problems
  start_date: Joi.date().required().messages({
    'date.base': 'Start date must be a valid date',
    'any.required': 'Start date is required'
  }),
  end_date: Joi.date().min(Joi.ref('start_date')).required().messages({
    'date.base': 'End date must be a valid date',
    'date.min': 'End date must be after start date',
    'any.required': 'End date is required'
  }),
  description: Joi.string().allow('').optional(),
  id_teamMembre: Joi.array().items(Joi.string().hex().length(24)).optional(),
  id_tasks: Joi.array().items(Joi.string().hex().length(24)).optional()
});

module.exports = {
  validateProject: (data) => {
    console.log("Validating project data:", JSON.stringify(data));
    const result = projectSchema.validate(data, { abortEarly: false });
    if (result.error) {
      console.log("Validation errors:", JSON.stringify(result.error.details));
    }
    return result;
  }
};
