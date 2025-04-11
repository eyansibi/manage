const Joi = require("joi");

const validateExperience = (data) => {
  const schema = Joi.object({
    job_title: Joi.string().trim().max(100).required().messages({
      "string.empty": "Job title cannot be empty",
      "string.max": "Job title cannot be more than 100 characters",
      "any.required": "Job title is required",
    }),

    company: Joi.string().trim().max(100).required().messages({
      "string.empty": "Company name cannot be empty",
      "string.max": "Company name cannot be more than 100 characters",
      "any.required": "Company name is required",
    }),

    employment_type: Joi.string()
      .valid(
        "Temps plein",
        "Temps partiel",
        "Freelance",
        "Stage",
        "Contrat",
        "Bénévolat"
      )
      .default("Temps plein")
      .messages({
        "any.only":
          "Employment type must be one of: Temps plein, Temps partiel, Freelance, Stage, Contrat, Bénévolat",
      }),

    is_current: Joi.boolean().default(false),

    start_date: Joi.date().required().messages({
      "date.base": "Start date must be a valid date",
      "any.required": "Start date is required",
    }),

    end_date: Joi.date()
      .min(Joi.ref("start_date"))
      .allow(null)
      .when("is_current", {
        is: true,
        then: Joi.allow(null).optional(),
        otherwise: Joi.date().optional(),
      })
      .messages({
        "date.base": "End date must be a valid date",
        "date.min": "End date must be after start date",
      }),

    location: Joi.string().trim().max(100).allow("").optional().messages({
      "string.max": "Location cannot be more than 100 characters",
    }),

    location_type: Joi.string()
      .valid("Sur place", "À distance", "Hybride")
      .default("Sur place")
      .messages({
        "any.only":
          "Location type must be one of: Sur place, À distance, Hybride",
      }),

    description: Joi.string().trim().max(1000).required().messages({
      "string.empty": "Description cannot be empty",
      "string.max": "Description cannot be more than 1000 characters",
      "any.required": "Description is required",
    }),

    job_source: Joi.string()
      .valid(
        "LinkedIn",
        "Indeed",
        "Glassdoor",
        "Directement sur le site de l'entreprise",
        "Recommandation",
        "Autre",
        ""
      )
      .default("")
      .messages({
        "any.only":
          "Job source must be one of: LinkedIn, Indeed, Glassdoor, Directement sur le site de l'entreprise, Recommandation, Autre, or empty",
      }),
  });

  return schema.validate(data, { abortEarly: false });
};

module.exports = { validateExperience };
