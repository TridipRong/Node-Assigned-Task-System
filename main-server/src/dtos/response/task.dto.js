const TaskModel = require('../../models/Task.model');

/**
 * Single task in response (uses model to avoid leaking internal fields).
 */
function toTaskResponse(row) {
  return TaskModel.toResponse(row);
}

/**
 * List of tasks (e.g. GET /tasks/assigned).
 */
function toTaskListResponse(rows) {
  return TaskModel.toListResponse(rows);
}

/**
 * POST /tasks response.
 */
function toCreateTaskResponse(data) {
  return {
    task_id: data.task_id,
  };
}

/**
 * PATCH status / reassign success response.
 */
function toSuccessResponse() {
  return { success: true };
}

module.exports = {
  toTaskResponse,
  toTaskListResponse,
  toCreateTaskResponse,
  toSuccessResponse,
};
