const Joi = require('joi');

const workspaceSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'Workspace name cannot be empty',
    'any.required': 'Workspace name is required',
  }),
  description: Joi.string().trim().allow('').optional().messages({
    'string.empty': 'Description cannot be empty'
  }),
  owner: Joi.string().hex().length(24).required().messages({
    'string.hex': 'Owner ID must be a valid ObjectId',
    'any.required': 'Owner ID is required',
  }),
  members: Joi.array().items(
    Joi.object({
      user: Joi.string().hex().length(24).required().messages({
        'string.hex': 'User ID must be a valid ObjectId',
        'any.required': 'User ID is required',
      }),
      role: Joi.string().valid('admin', 'editor', 'viewer').default('viewer').messages({
        'any.only': 'Role must be either admin, editor, or viewer',
      }),
    })
  ).messages({
    'array.base': 'Members must be an array of user objects',
  }),
  projects: Joi.array().items(Joi.string().hex().length(24)).messages({
    'string.hex': 'Each project ID must be a valid ObjectId',
  }),
});

module.exports = {
  validateWorkspace: (data) => workspaceSchema.validate(data, { abortEarly: false }),
};
