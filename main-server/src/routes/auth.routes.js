const express = require('express');
const router = express.Router();
const authHandler = require('../handlers/auth.handler');

router.post('/node/login', authHandler.nodeLogin);
router.post('/admin/login', authHandler.adminLogin);

module.exports = router;
