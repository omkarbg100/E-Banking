class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function notFound(req, res) {
  res.status(404).json({ message: "Route not found" });
}

function errorHandler(logger) {
  return (err, req, res, next) => {
    if (res.headersSent) return next(err);
    const status = err.status || 500;
    const payload = {
      message: status >= 500 ? "Internal server error" : err.message,
      requestId: req.id
    };
    if (err.details) payload.details = err.details;
    if (status >= 500 && logger) logger.error({ err, requestId: req.id }, err.message);
    res.status(status).json(payload);
  };
}

module.exports = { ApiError, asyncHandler, notFound, errorHandler };
