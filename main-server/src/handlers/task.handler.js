const taskService = require('../services/task.service');
const taskRequestDto = require('../dtos/request/task.dto');
const taskResponseDto = require('../dtos/response/task.dto');

async function createTask(req, res, next) {
  try {
    const body = taskRequestDto.validateCreateTask(req.body);
    const result = await taskService.createTask(body);
    res.json(taskResponseDto.toCreateTaskResponse(result));
  } catch (err) {
    next(err);
  }
}

async function getAssignedTasks(req, res, next) {
  try {
    const nodeId = req.node.node_id;
    const tasks = await taskService.fetchAndLockAssigned(nodeId);
    res.json(taskResponseDto.toTaskListResponse(tasks));
  } catch (err) {
    next(err);
  }
}

async function updateTaskStatus(req, res, next) {
  try {
    const body = taskRequestDto.validateUpdateStatus(req.body);
    const taskId = req.params.id;
    const nodeId = req.node.node_id;
    const result = await taskService.updateStatus(taskId, nodeId, body);
    res.json(taskResponseDto.toSuccessResponse(result));
  } catch (err) {
    next(err);
  }
}

async function reassignTask(req, res, next) {
  try {
    const body = taskRequestDto.validateReassign(req.body);
    const taskId = req.params.id;
    const result = await taskService.reassignTask(taskId, body.new_node_id);
    res.json(taskResponseDto.toSuccessResponse(result));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createTask,
  getAssignedTasks,
  updateTaskStatus,
  reassignTask,
};
