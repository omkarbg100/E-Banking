function validate({ body, query, params }) {
  return (req, res, next) => {
    try {
      if (body) req.body = body.parse(req.body);
      if (query) req.query = query.parse(req.query);
      if (params) req.params = params.parse(req.params);
      next();
    } catch (error) {
      const issues = error.issues || [];
      res.status(400).json({
        message: "Validation failed",
        errors: issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      });
    }
  };
}

module.exports = validate;
