const client = require("prom-client");

const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry, prefix: "ebank_" });

const httpDuration = new client.Histogram({
  name: "ebank_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [registry]
});

const httpTotal = new client.Counter({
  name: "ebank_http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [registry]
});

const kafkaPublished = new client.Counter({
  name: "ebank_kafka_events_published_total",
  help: "Kafka events published",
  labelNames: ["topic", "status"],
  registers: [registry]
});

const queueJobs = new client.Counter({
  name: "ebank_queue_jobs_total",
  help: "Queue jobs processed",
  labelNames: ["queue", "status"],
  registers: [registry]
});

function metricsMiddleware(req, res, next) {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const route = req.route ? req.baseUrl + req.route.path : req.path;
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode)
    };
    httpTotal.inc(labels);
    httpDuration.observe(labels, Number(process.hrtime.bigint() - start) / 1e9);
  });
  next();
}

function metricsRouter() {
  return async (req, res) => {
    res.set("Content-Type", registry.contentType);
    res.end(await registry.metrics());
  };
}

module.exports = {
  registry,
  metricsMiddleware,
  metricsRouter,
  kafkaPublished,
  queueJobs
};
