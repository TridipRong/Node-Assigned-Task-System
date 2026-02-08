const Joi = require('joi');
const { STATUS } = require('../../models/Task.model');

const createTaskSchema = Joi.object({
  task_type: Joi.string().required().trim(),
  task_details: Joi.object().default({}),
  assigned_node_id: Joi.string().required().trim(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid(STATUS.COMPLETED, STATUS.FAILED)
    .required(),
  version: Joi.number().integer().min(1).required(),
});

const reassignSchema = Joi.object({
  new_node_id: Joi.string().required().trim(),
});

function validateWithSchema(schema, data, label) {
  const { error, value } = schema.validate(data, {
    stripUnknown: true,
    abortEarly: false,
  });
  if (error) {
    const err = new Error(
      label ? `${label}: ${error.details.map((d) => d.message).join('; ')}` : error.message
    );
    err.statusCode = 400;
    err.details = error.details;
    throw err;
  }
  return value;
}

function validateCreateTask(body) {
  return validateWithSchema(createTaskSchema, body, 'Create task');
}

function validateUpdateStatus(body) {
  return validateWithSchema(updateStatusSchema, body, 'Update status');
}

function validateReassign(body) {
  return validateWithSchema(reassignSchema, body, 'Reassign');
}

module.exports = {
  validateCreateTask,
  validateUpdateStatus,
  validateReassign,
};
