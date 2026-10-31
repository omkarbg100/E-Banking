let started = false;

function startTracing(service) {
  if (started) return;
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint) return;
  started = true;
  try {
    const { NodeSDK } = require("@opentelemetry/sdk-node");
    const { getNodeAutoInstrumentations } = require("@opentelemetry/auto-instrumentations-node");
    const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-http");
    const { resourceFromAttributes } = require("@opentelemetry/resources");
    const {
      ATTR_SERVICE_NAME,
      ATTR_SERVICE_VERSION
    } = require("@opentelemetry/semantic-conventions");

    const sdk = new NodeSDK({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: service,
        [ATTR_SERVICE_VERSION]: "1.0.0"
      }),
      traceExporter: new OTLPTraceExporter({ url: endpoint }),
      instrumentations: [
        getNodeAutoInstrumentations({
          "@opentelemetry/instrumentation-fs": { enabled: false }
        })
      ]
    });
    sdk.start();
    process.on("SIGTERM", () => {
      sdk.shutdown().catch(() => {});
    });
    console.log(`[${service}] tracing enabled`);
  } catch (err) {
    console.error(`[${service}] tracing failed`, err.message);
  }
}

module.exports = { startTracing };
