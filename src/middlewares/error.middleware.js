function notFoundHandler(req, res) {
  res.status(404).json({
    message: `Route ${req.method} ${req.originalUrl} was not found`,
  });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyPattern || {})[0] || 'field';
    const duplicateValue = err.keyValue?.[duplicateField];

    return res.status(409).json({
      message: `${duplicateField} '${duplicateValue}' already exists`,
    });
  }

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((error) => error.message);

    return res.status(400).json({
      message: 'Product data is invalid',
      errors,
    });
  }

  const statusCode = err.statusCode || 500;

  return res.status(statusCode).json({
    message: statusCode === 500 ? 'Internal server error' : err.message,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
