module.exports = function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';
  if (!err.isOperational) console.error(err);
  res.status(status).json({ success: false, message });
};
