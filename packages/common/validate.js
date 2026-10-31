const { ApiError } = require("./errors");

function validate(schemas = {}) {
  return (req, res, next) => {
    try {
      for (const part of ["body", "query", "params"]) {
        if (!schemas[part]) continue;
        const result = schemas[part].safeParse(req[part]);
        if (!result.success) {
          throw new ApiError(
            400,
            "Validation failed",
            result.error.issues.map((i) => ({
              path: i.path.join("."),
              message: i.message
            }))
          );
        }
        if (part === "body") req.body = result.data;
        if (part === "query") req.query = result.data;
        if (part === "params") req.params = result.data;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { validate };
