const express = require("express");

function healthRouter(service, checks = {}) {
  const router = express.Router();
  router.get("/health", (req, res) => {
    res.json({ status: "ok", service, uptime: process.uptime() });
  });
  router.get("/ready", async (req, res) => {
    const results = {};
    let ready = true;
    for (const [name, fn] of Object.entries(checks)) {
      try {
        await fn();
        results[name] = "ok";
      } catch (err) {
        ready = false;
        results[name] = err.message;
      }
    }
    res.status(ready ? 200 : 503).json({ status: ready ? "ready" : "not_ready", service, checks: results });
  });
  return router;
}

module.exports = { healthRouter };
