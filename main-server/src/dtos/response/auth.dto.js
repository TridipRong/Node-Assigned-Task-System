/**
 * Auth API response shapes.
 */

function toLoginResponse(data) {
  return {
    token: data.token,
  };
}

module.exports = {
  toLoginResponse,
};
