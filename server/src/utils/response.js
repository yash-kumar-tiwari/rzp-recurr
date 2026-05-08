/**
 * Standardized API response helpers
 * Ensures consistent shape: { success, message, data?, meta? }
 */

const sendSuccess = (res, data = {}, message = 'Success', statusCode = 200, meta = null) => {
  const payload = { success: true, message };
  if (data && Object.keys(data).length > 0) payload.data = data;
  if (meta) payload.meta = meta;
  return res.status(statusCode).json(payload);
};

const sendCreated = (res, data = {}, message = 'Created successfully') => {
  return sendSuccess(res, data, message, 201);
};

const sendError = (res, message = 'Something went wrong', statusCode = 500, errors = null) => {
  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

const sendUnauthorized = (res, message = 'Unauthorized') => {
  return sendError(res, message, 401);
};

const sendForbidden = (res, message = 'Forbidden') => {
  return sendError(res, message, 403);
};

const sendNotFound = (res, message = 'Not found') => {
  return sendError(res, message, 404);
};

const sendBadRequest = (res, message = 'Bad request', errors = null) => {
  return sendError(res, message, 400, errors);
};

module.exports = {
  sendSuccess,
  sendCreated,
  sendError,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
  sendBadRequest,
};
