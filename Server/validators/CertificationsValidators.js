const Joi = require('joi');

const certificationSchema = Joi.object({
  certifications_name: Joi.string().trim().required().messages({
    'string.empty': 'Certification name cannot be empty',
    'any.required': 'Certification name is required',
  }),
  issued_by: Joi.string().trim().required().messages({
    'string.empty': 'Issued by cannot be empty',
    'any.required': 'Issued by is required',
  }),
  obtained_date: Joi.date().iso().required().messages({
    'date.base': 'Obtained date must be a valid date',
    'any.required': 'Obtained date is required',
  }),
  description: Joi.string().trim().allow('').optional().messages({
    'string.empty': 'Description cannot be empty',
  }),
  // image: Joi.string().uri().optional().messages({
  //   'string.uri': 'Image URL must be a valid URI',
  // }),
}).messages({
  'object.base': 'Certification data must be an object',
});

module.exports = {
  validateCertification: (data) => certificationSchema.validate(data, { abortEarly: false }),
};
