const authService = require('../services/auth.service');
const authRequestDto = require('../dtos/request/auth.dto');
const authResponseDto = require('../dtos/response/auth.dto');

async function nodeLogin(req, res, next) {
  try {
    const body = authRequestDto.validateNodeLogin(req.body);
    const result = await authService.loginNode(body.node_id, body.node_secret);
    res.json(authResponseDto.toLoginResponse(result));
  } catch (err) {
    next(err);
  }
}

async function adminLogin(req, res, next) {
  try {
    const body = authRequestDto.validateAdminLogin(req.body);
    const result = await authService.loginAdmin(body.username, body.password);
    res.json(authResponseDto.toLoginResponse(result));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  nodeLogin,
  adminLogin,
};
