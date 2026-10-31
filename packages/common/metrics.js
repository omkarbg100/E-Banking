const client = require("prom-client");

const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });

const httpDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["service", "method", "route", "status"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [registry]
});

const httpTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["service", "method", "route", "status"],
  registers: [registry]
});

const domainEvents = new client.Counter({
  name: "domain_events_total",
  help: "Domain events consumed or published",
  labelNames: ["service", "event", "direction"],
  registers: [registry]
});

function metricsMiddleware(service) {
  return (req, res, next) => {
    const start = process.hrtime.bigint();
    res.on("finish", () => {
      const seconds = Number(process.hrtime.bigint() - start) / 1e9;
      const route = req.route ? req.baseUrl + req.route.path : req.path;
      const labels = { service, method: req.method, route, status: String(res.statusCode) };
      httpDuration.observe(labels, seconds);
      httpTotal.inc(labels);
    });
    next();
  };
}

function metricsRouter(service) {
  const express = require("express");
  const router = express.Router();
  router.get("/metrics", async (req, res) => {
    res.set("Content-Type", registry.contentType);
    res.end(await registry.metrics());
  });
  return router;
}

function countEvent(service, event, direction) {
  domainEvents.inc({ service, event, direction });
}

module.exports = {
  registry,
  metricsMiddleware,
  metricsRouter,
  countEvent,
  httpDuration,
  httpTotal,
  domainEvents
};
