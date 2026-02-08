const Joi = require('joi');

const nodeLoginSchema = Joi.object({
  node_id: Joi.string().required().trim(),
  node_secret: Joi.string().required(),
});

const adminLoginSchema = Joi.object({
  username: Joi.string().required().trim(),
  password: Joi.string().required(),
});

/**
 * Validate node login request body.
 * @param {object} body - req.body
 * @returns {{ node_id: string, node_secret: string }}
 * @throws {Error} statusCode 400 with validation details
 */
function validateNodeLogin(body) {
  const { error, value } = nodeLoginSchema.validate(body, {
    stripUnknown: true,
    abortEarly: false,
  });
  if (error) {
    const err = new Error(error.details.map((d) => d.message).join('; '));
    err.statusCode = 400;
    err.details = error.details;
    throw err;
  }
  return value;
}

function validateAdminLogin(body) {
  const { error, value } = adminLoginSchema.validate(body, {
    stripUnknown: true,
    abortEarly: false,
  });
  if (error) {
    const err = new Error(error.details.map((d) => d.message).join('; '));
    err.statusCode = 400;
    err.details = error.details;
    throw err;
  }
  return value;
}

module.exports = {
  validateNodeLogin,
  validateAdminLogin,
};
