const logger = require("../Infrastructure/logger");
const env = require("../Config/env");

function notFound(req, res) {
  res.status(404).json({ message: "Route not found", requestId: req.id });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  const status = error.status || error.statusCode || 500;
  const isServerError = status >= 500;

  if (isServerError) {
    logger.error(
      { err: error.message, stack: error.stack, requestId: req.id, method: req.method, path: req.path },
      "request failed"
    );
  } else {
    logger.warn({ err: error.message, requestId: req.id, status }, "request rejected");
  }

  res.status(status).json({
    message: isServerError && env.NODE_ENV === "production" ? "Internal server error" : error.message,
    requestId: req.id
  });
}

module.exports = { notFound, errorHandler };
