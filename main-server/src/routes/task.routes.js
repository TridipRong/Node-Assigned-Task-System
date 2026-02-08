const express = require('express');
const { verifyNode, verifyAdmin } = require('../middleware/auth');
const router = express.Router();
const taskHandler = require('../handlers/task.handler');

router.post('/', verifyAdmin, taskHandler.createTask);
router.get('/assigned', verifyNode, taskHandler.getAssignedTasks);
router.patch('/:id/status', verifyNode, taskHandler.updateTaskStatus);
router.patch('/:id/reassign', verifyAdmin, taskHandler.reassignTask);

module.exports = router;
