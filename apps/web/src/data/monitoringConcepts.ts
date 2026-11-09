export interface MonitoringConcept {
  id: string;
  name: string;
  subtitle: string;
  category: "Telemetry Pillars" | "Engines & Tooling" | "SRE & Reliability Metrics" | "Dashboards & Visualization" | "Incident & On-Call Operations" | "Resilience & Capacity";
  mentalModel: string;
  coreMechanism: string;
  keySyntax: {
    label: string;
    code: string;
    explanation: string;
  }[];
  productionCommands: {
    cmd: string;
    desc: string;
    level: "read" | "write" | "hazardous";
  }[];
  productionRules: string[];
  failureModes: {
    pitfall: string;
    impact: string;
    resolution: string;
  }[];
  realWorldScenario: {
    title: string;
    situation: string;
    investigation: string;
    fix: string;
  };
}

export const MONITORING_CONCEPTS: MonitoringConcept[] = [
  {
    id: "metrics",
    name: "1. Metrics",
    subtitle: "Numeric Time-Series: Counters, Gauges, Histograms & Summaries",
    category: "Telemetry Pillars",
    mentalModel: "Metrics are structured, append-only numeric measurements sampled over uniform time intervals. They answer 'What is happening right now?' with minimal storage overhead.",
    coreMechanism: "Metrics record 4 fundamental OTel/Prometheus types: **Counter** (monotonically increasing value, e.g. total HTTP requests; resets to 0 on restart), **Gauge** (fluctuating value, e.g. memory usage, active connections), **Histogram** (samples observations into configurable bucket arrays for calculating percentiles like P95 and P99), and **Summary** (client-side calculated quantiles).",
    keySyntax: [
      {
        label: "Prometheus Metric Exposition Format (OpenMetrics)",
        code: `# HELP http_requests_total Total number of HTTP requests processed.
# TYPE http_requests_total counter
http_requests_total{method="POST",handler="/checkout",status="200"} 142857
http_requests_total{method="POST",handler="/checkout",status="500"} 42

# HELP node_memory_utilization_bytes Current active memory consumption.
# TYPE node_memory_utilization_bytes gauge
node_memory_utilization_bytes{instance="worker-01"} 17179869184

# HELP http_request_duration_seconds Latency histogram with buckets.
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.05"} 2400
http_request_duration_seconds_bucket{le="0.1"} 4200
http_request_duration_seconds_bucket{le="0.5"} 6100
http_request_duration_seconds_bucket{le="+Inf"} 6150
http_request_duration_seconds_sum 482.15
http_request_duration_seconds_count 6150`,
        explanation: "Histograms use `le` (less-than-or-equal) boundary buckets to allow servers to compute global P99 latencies mathematically."
      }
    ],
    productionCommands: [
      { cmd: "curl -s http://localhost:9090/metrics | grep -E '^# TYPE'", desc: "Query application metrics endpoint to inspect declared metric types and descriptions", level: "read" },
      { cmd: "promtool check metrics < metrics.prom", desc: "Validate Prometheus OpenMetrics formatting syntax and label compliance", level: "read" }
    ],
    productionRules: [
      "Never put high-cardinality attributes (UUIDs, user IDs, email addresses, order IDs) into metric labels: high cardinality causes an explosive memory crash in Prometheus.",
      "Always calculate rates over counters using `rate()`, never `irate()` for alerting: `rate()` averages over the window, smoothing transient false spikes."
    ],
    failureModes: [
      {
        pitfall: "Adding `user_id` as a label on `http_requests_total`",
        impact: "Millions of unique time series are created in TSDB storage, causing Prometheus memory to spike to 64GB and crash with an OutOfMemory panic.",
        resolution: "Move high-cardinality values strictly to Logs or Traces."
      }
    ],
    realWorldScenario: {
      title: "The Exploding Cardinality TSDB Crash",
      situation: "Prometheus began crashing every 8 minutes with `OOMKilled exit code 137` during a customer onboarding surge.",
      investigation: "A developer added `tenant_subdomain` as a Prometheus label on an API counter. Marketing launched a campaign generating 250,000 subdomains.",
      fix: "Removed the dynamic subdomain label from the metric and relied on Grafana Loki logs for per-subdomain traffic slicing."
    }
  },
  {
    id: "logs",
    name: "2. Logs",
    subtitle: "Structured Event Streams: JSON, Contextual Metadata & Correlation IDs",
    category: "Telemetry Pillars",
    mentalModel: "A Log is an immutable, timestamped record of a discrete event that occurred within an application. Modern logs are not plain text files; they are structured JSON event streams.",
    coreMechanism: "Applications stream structured JSON objects to STDOUT. Each log entry carries contextual key-value pairs (`timestamp`, `level`, `service`, `message`, `trace_id`, `span_id`). Centralized collectors (Vector, Fluent Bit) ingest streams, buffer them, and ship them to indexing backends (Loki, Elasticsearch) where queries filter by structured fields.",
    keySyntax: [
      {
        label: "Production Structured JSON Log Envelope",
        code: `{
  "timestamp": "2026-11-09T14:32:01.412Z",
  "level": "error",
  "service": "payment-api",
  "environment": "production",
  "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
  "span_id": "00f067aa0ba902b7",
  "user_id": "usr_998142",
  "message": "Payment gateway processing timed out",
  "error": {
    "name": "GatewayTimeoutError",
    "message": "Stripe API failed to respond within 5000ms",
    "stack": "Error: Stripe API failed... at Object.charge (/app/dist/stripe.js:42:15)"
  },
  "http": {
    "method": "POST",
    "route": "/v1/charges",
    "status_code": 504,
    "duration_ms": 5002.4
  }
}`,
        explanation: "Embedding `trace_id` directly in JSON logs bridges the gap between logging and distributed tracing, enabling 1-click jumps from logs to traces."
      }
    ],
    productionCommands: [
      { cmd: "tail -f /var/log/app/app.log | jq -r 'select(.level==\"error\") | .message'", desc: "Filter and parse real-time error messages from JSON logs using jq", level: "read" },
      { cmd: "vector --config /etc/vector/vector.yaml validate", desc: "Validate log collector ingestion pipelines, transforms, and sink endpoints", level: "read" }
    ],
    productionRules: [
      "Always write structured JSON logs directly to `stdout`/`stderr`: never write logs to rotating files on local container filesystems.",
      "Never log raw credentials, authorization bearer tokens, passwords, or customer credit card PAN numbers: configure log scrubbers at the collector level."
    ],
    failureModes: [
      {
        pitfall: "Logging unstructured multiline stack traces directly to stdout in Docker containers",
        impact: "Log collectors parse each line of the stack trace as an independent event, scattering the error context and ruining log aggregation.",
        resolution: "Serialize error stack traces as escaped single-line strings inside JSON `error.stack` fields."
      }
    ],
    realWorldScenario: {
      title: "The $14,000 Unmasked Authorization Header Log Leak",
      situation: "A security audit discovered 85,000 plaintext customer JWT session tokens stored in an internal Elasticsearch cluster.",
      investigation: "A developer logged incoming request headers with `logger.info({ headers: req.headers })` during debugging.",
      fix: "Deployed an OpenTelemetry log transform that automatically masks `authorization` and `cookie` headers, and rotated all compromised user tokens."
    }
  },
  {
    id: "traces",
    name: "3. Traces",
    subtitle: "Distributed Context Propagation: Traces, Spans & Causality",
    category: "Telemetry Pillars",
    mentalModel: "A Distributed Trace tells the story of an end-to-end user request as it traverses across dozens of microservices, serverless functions, database queries, and message brokers.",
    coreMechanism: "A **Trace** is a Directed Acyclic Graph (DAG) composed of one or more **Spans**. Each Span represents a single unit of contiguous work (e.g. an HTTP handler, an SQL query). Context propagation passes metadata (`traceparent: 00-4bf92f3577b3...-00f067aa0ba902b7-01`) across network boundaries via HTTP headers or message attributes according to the W3C Trace Context standard.",
    keySyntax: [
      {
        label: "W3C Trace Context Header Propagation",
        code: `# Incoming HTTP Header:
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
              │  └─────────────┬─────────────┘ └───────┬──────┘ └─┬┘
              │                │                       │          │
           Version         Trace ID                 Span ID     Flags (01 = Sampled)

# Distributed Execution Timeline:
[Frontend Web App: 420ms]
  ├── [API Gateway: 380ms]
  │     ├── [Auth Service: 45ms] -> (Postgres Query: 12ms)
  │     └── [Order Service: 310ms]
  │           ├── [Inventory RPC: 35ms]
  │           └── [Stripe External Call: 240ms] <--- Bottleneck isolated!`,
        explanation: "Distributed tracing instantly reveals that 240ms of the 420ms user latency was consumed by an external Stripe API call."
      }
    ],
    productionCommands: [
      { cmd: "curl -v -H 'traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01' http://api.internal/v1/orders", desc: "Inject synthetic W3C traceparent header to track manual test request across microservice trace backends", level: "read" },
      { cmd: "grpcurl -plaintext localhost:4317 list", desc: "Inspect active gRPC OpenTelemetry Collector ingestion service endpoints", level: "read" }
    ],
    productionRules: [
      "Always propagate incoming `traceparent` headers to outbound HTTP and gRPC calls: dropping headers breaks the trace graph into isolated orphan spans.",
      "Use head-based or tail-based sampling in high-throughput systems: capturing 100% of traces at 50,000 req/sec will saturate network and storage infrastructure."
    ],
    failureModes: [
      {
        pitfall: "Publishing a message to Kafka or RabbitMQ without injecting trace context into message headers",
        impact: "The trace terminates at the producer; the asynchronous background worker appears as a disconnected, isolated root span with zero context.",
        resolution: "Use OpenTelemetry message carrier injectors to serialize trace headers into message metadata."
      }
    ],
    realWorldScenario: {
      title: "The Mystery 4-Second P99 Latency Needle in a 40-Service Haystack",
      situation: "Users experienced intermittent 4-second page hangs on product listings, but individual service metrics showed normal 30ms CPU times.",
      investigation: "Jaeger tracing revealed a sequential N+1 database query loop: a single API call was making 120 sequential 35ms Redis calls inside a loop.",
      fix: "Batched the 120 calls into a single Redis `MGET` query, dropping P99 trace duration from 4,200ms to 48ms."
    }
  },
  {
    id: "prometheus",
    name: "4. Prometheus",
    subtitle: "Pull-Based Time-Series Engine, PromQL & Service Discovery",
    category: "Engines & Tooling",
    mentalModel: "Prometheus is a high-performance, pull-based time-series monitoring system. It discovers scrape targets dynamically (via Kubernetes API or AWS tags), scrapes `/metrics` endpoints over HTTP, and stores samples in an optimized local TSDB.",
    coreMechanism: "Prometheus uses a pull model: it initiates HTTP GET requests to targets at configured `scrape_interval` rates (e.g. 15s). Data points `(timestamp, float64)` are compressed into 2-hour TSDB blocks using Gorilla compression (~1.37 bytes per sample). **PromQL** executes vector math, rate calculations, and quantile approximations across multi-dimensional time series.",
    keySyntax: [
      {
        label: "Essential Production PromQL Expressions",
        code: `# 1. Calculate Per-Second Request Rate:
rate(http_requests_total{status=~"5.."}[5m])

# 2. HTTP Error Percentage (% of 5xx errors across total requests):
sum(rate(http_requests_total{status=~"5.."}[5m])) 
  / 
sum(rate(http_requests_total[5m])) * 100

# 3. Calculate Global P99 Latency from Histogram Buckets:
histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))

# 4. Predict Disk Full Exhaustion in 4 Hours:
predict_linear(node_filesystem_free_bytes[1h], 4 * 3600) < 0`,
        explanation: "`histogram_quantile` computes the 99th percentile across multiple container replicas mathematically from bucket counters."
      }
    ],
    productionCommands: [
      { cmd: "promtool check config /etc/prometheus/prometheus.yml", desc: "Validate Prometheus configuration file syntax and scrape target schemas", level: "read" },
      { cmd: "promtool query instant http://localhost:9090 'up == 0'", desc: "Execute PromQL query via CLI to list all targets currently unreachable by Prometheus", level: "read" },
      { cmd: "curl -X POST http://localhost:9090/-/reload", desc: "Hot-reload Prometheus scrape targets and alerting rules without restarting the process", level: "write" }
    ],
    productionRules: [
      "Always wrap `rate()` queries in a range window at least 4 times the scrape interval (e.g. for a 15s scrape interval, use at least `[1m]`).",
      "Do not query long time ranges (e.g. `rate(metric[30d])`) directly in real-time dashboards: use Prometheus Recording Rules to pre-compute heavy aggregations."
    ],
    failureModes: [
      {
        pitfall: "Using `irate()` instead of `rate()` in alerting rule expressions",
        impact: "`irate()` only looks at the last two data points, triggering noisy false-positive alerts on single-packet anomalies or brief network blips.",
        resolution: "Use `rate(metric[5m])` for alerting rules to average over time."
      }
    ],
    realWorldScenario: {
      title: "Prometheus TSDB Corrupted by Abrupt Host Power Loss",
      situation: "Following an AWS EC2 host reboot, Prometheus failed to start with `panic: err: open block failed: corrupted chunk`.",
      investigation: "Prometheus had uncommitted WAL (Write-Ahead-Log) segments in local storage that were partially written during host termination.",
      fix: "Repaired the TSDB using `promtool tsdb analyze` and deployed Thanos to tier historical metrics directly to immutable Amazon S3 buckets."
    }
  },
  {
    id: "grafana",
    name: "5. Grafana",
    subtitle: "Unified Visualization, Dynamic Templating & Incident Dashboards",
    category: "Dashboards & Visualization",
    mentalModel: "Grafana is the operational visualization standard. It decouples metric storage from visual representation, providing unified dashboards querying Prometheus, Loki, Tempo, Elasticsearch, and CloudWatch within a single pane of glass.",
    coreMechanism: "Grafana translates dashboard panel configurations into backend queries via pluggable Data Source drivers. It features dynamic variables (dropdown menus populated by queries like `label_values(namespace)`), alerting engines that evaluate visual thresholds, and dashboard-as-code automation via Terraform or Jsonnet.",
    keySyntax: [
      {
        label: "Dynamic Templated PromQL in Grafana Panels",
        code: `# Panel Query with Variables ($namespace, $service):
sum(rate(http_requests_total{namespace="$namespace", service="$service"}[$__rate_interval])) by (status)

# Grafana Auto-Interval:
# Using '$__rate_interval' ensures that when the user zooms out
# from 1 hour to 30 days, the calculation window expands automatically
# to prevent returning 500,000 data points to the browser!`,
        explanation: "`$__rate_interval` dynamically scales the PromQL window based on panel pixel width and zoom level, avoiding browser crashes."
      }
    ],
    productionCommands: [
      { cmd: "grafana-cli plugins list-remote", desc: "List all official and community Grafana data source and panel plugins available for installation", level: "read" },
      { cmd: "curl -H 'Authorization: Bearer <token>' http://localhost:3000/api/dashboards/uid/<uid>", desc: "Export raw JSON schema definition of an active Grafana dashboard", level: "read" }
    ],
    productionRules: [
      "Manage all production Grafana dashboards as code using Terraform, Git, or Jsonnet: never rely on manual edits in the Grafana UI.",
      "Use `$__rate_interval` instead of hardcoded windows like `[5m]` in dashboard queries to ensure optimal rendering across all zoom levels."
    ],
    failureModes: [
      {
        pitfall: "Creating a Grafana panel with 50 individual PromQL series queries on a 30-day time window",
        impact: "The panel sends 50 massive TSDB scan requests, exhausting Prometheus CPU and freezing the browser tab.",
        resolution: "Pre-aggregate long-term data using Prometheus Recording Rules or use Thanos/Cortex downsampling."
      }
    ],
    realWorldScenario: {
      title: "The Accidental Dashboard Overwrite During Live Outage",
      situation: "During an ongoing SEV-1 outage, an engineer edited the main production dashboard to investigate an issue and accidentally saved over the template.",
      investigation: "The dashboard had no version control or write protection. Other on-call engineers lost their operational graphs.",
      fix: "Configured Grafana dashboard provisioning from Git repositories with read-only UI enforcement."
    }
  },
  {
    id: "alertmanager",
    name: "6. Alertmanager",
    subtitle: "Deduplication, Grouping, Inhibition & Notification Routing",
    category: "Engines & Tooling",
    mentalModel: "Alertmanager sits between Prometheus and human operators. Its job is not to detect failures, but to manage alerts: deduplicating, grouping related failures into a single notification, silencing maintenance windows, and routing to PagerDuty or Slack.",
    coreMechanism: "Prometheus fires alerts continuously whenever an expression evaluates to true. Alertmanager receives alerts, buffers them for `group_wait` seconds, combines alerts sharing labels (e.g. same `cluster` and `alertname`) into a single grouped message, checks active **Silences** and **Inhibition** rules (e.g. mute node alerts if the entire data center is down), and routes to the appropriate receiver.",
    keySyntax: [
      {
        label: "Alertmanager Routing Tree with Inhibition & Grouping",
        code: `route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 30s        # Buffer 30s before sending first notification
  group_interval: 5m     # Wait 5m before sending new alerts for same group
  repeat_interval: 4h    # Resend unacknowledged alerts after 4 hours
  receiver: 'slack-notifications'
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty-oncall' # Wake up human on critical alerts

# Inhibition: Mute container alerts if the underlying Node is already down!
inhibit_rules:
  - source_match:
      alertname: 'NodeNetworkDown'
    target_match:
      alertname: 'InstanceDown'
    equal: ['node']`,
        explanation: "Inhibition rules prevent notification storms by silencing downstream symptom alerts when the root cause alert is already firing."
      }
    ],
    productionCommands: [
      { cmd: "amtool check-config /etc/alertmanager/alertmanager.yml", desc: "Validate Alertmanager configuration routing trees and receiver schemas", level: "read" },
      { cmd: "amtool silence add --alertname=HighCpuUsage --duration=2h --comment='Maintenance window'", desc: "Create an active 2-hour silence to suppress alerting during planned maintenance", level: "write" },
      { cmd: "amtool alert --active", desc: "List all alerts currently active and firing in Alertmanager", level: "read" }
    ],
    productionRules: [
      "Every fired alert must be actionable: if an alert wakes up an engineer and there is no clear action to take, delete the alert immediately.",
      "Always configure alert grouping (`group_by: ['alertname', 'cluster']`) to prevent 50 individual microservice alerts when a single network switch fails."
    ],
    failureModes: [
      {
        pitfall: "Configuring `repeat_interval: 5m` on critical PagerDuty notifications",
        impact: "On-call engineers are paged every 5 minutes while actively debugging the incident, causing severe alert fatigue and impaired cognitive function.",
        resolution: "Set `repeat_interval: 4h` and acknowledge (ACK) alerts in PagerDuty during triage."
      }
    ],
    realWorldScenario: {
      title: "The 3,000-SMS Alert Avalanche Knocks Out On-Call Phone",
      situation: "An AWS AZ network partition triggered 3,200 individual SMS alerts to the on-call engineer within 4 minutes, freezing their phone.",
      investigation: "Prometheus alerting rules had no `group_by` configured in Alertmanager, and SMS was configured as a raw leaf receiver.",
      fix: "Introduced grouping by `cluster` and `region`, routing alerts to PagerDuty with automatic deduplication."
    }
  },
  {
    id: "elk-stack",
    name: "7. ELK Stack",
    subtitle: "Enterprise Log Analytics: Elasticsearch, Logstash & Kibana",
    category: "Engines & Tooling",
    mentalModel: "The ELK Stack (Elasticsearch, Logstash, Kibana) is an enterprise search and log analytics platform. Logstash processes and enriches log events, Elasticsearch indexes them into Lucene inverted indexes, and Kibana provides interactive search and dashboarding.",
    coreMechanism: "Logstash pipelines receive logs, apply filter plugins (`grok` parsing, GeoIP lookup, field stripping), and batch ingest into Elasticsearch. Elasticsearch indexes text fields into inverted indexes and numeric/keyword fields into columnar doc_values. Index Lifecycle Management (ILM) rolls over indexes automatically from Hot (NVMe) to Warm (HDD) to Cold (Snapshot/S3) storage.",
    keySyntax: [
      {
        label: "Elasticsearch Index Lifecycle Management (ILM) Policy",
        code: `{
  "policy": {
    "phases": {
      "hot": {
        "min_age": "0ms",
        "actions": {
          "rollover": {
            "max_primary_shard_size": "50gb",
            "max_age": "7d"
          }
        }
      },
      "warm": {
        "min_age": "7d",
        "actions": {
          "shrink": { "number_of_shards": 1 },
          "forcemerge": { "max_num_segments": 1 }
        }
      },
      "delete": {
        "min_age": "30d",
        "actions": { "delete": {} }
      }
    }
  }
}`,
        explanation: "ILM automatically rolls over shards when they reach 50GB and deletes indices older than 30 days to bound disk consumption."
      }
    ],
    productionCommands: [
      { cmd: "curl -s http://localhost:9200/_cluster/health?pretty", desc: "Inspect Elasticsearch cluster health status (Green, Yellow, Red) and unassigned shards", level: "read" },
      { cmd: "curl -s http://localhost:9200/_cat/indices?v&s=pri.store.size:desc", desc: "List all indices sorted by primary disk storage consumption", level: "read" }
    ],
    productionRules: [
      "Keep primary shard sizes between 20GB and 50GB: oversized shards (>65GB) cause slow recovery, while undersized shards waste heap memory.",
      "Always define explicit Index Templates with strict field mappings: letting Elasticsearch guess types via dynamic mapping can cause field mapping explosions."
    ],
    failureModes: [
      {
        pitfall: "Allowing unbounded dynamic mapping on JSON logs containing arbitrary user keys",
        impact: "Elasticsearch cluster state explodes with tens of thousands of fields, exhausting master node JVM heap and causing cluster-wide red outages.",
        resolution: "Disable dynamic field mapping (`dynamic: false` or `dynamic: runtime`) on incoming log indexes."
      }
    ],
    realWorldScenario: {
      title: "Elasticsearch Cluster Turns Red During Cyber Monday",
      situation: "All logging and security audit search features failed with `503 Service Unavailable`; Kibana stopped responding.",
      investigation: "A single index shard exceeded 180GB on an unmonitored node, running out of disk space and corrupting shard allocation across the cluster.",
      fix: "Enforced strict ILM 50GB rollover limits and added disk watermarks alerting at 80% capacity."
    }
  },
  {
    id: "loki",
    name: "8. Loki",
    subtitle: "Cloud-Native Log Aggregation: Labels-Only Indexing & LogQL",
    category: "Engines & Tooling",
    mentalModel: "Grafana Loki is a horizontally scalable, multi-tenant log aggregation system inspired by Prometheus. Unlike Elasticsearch, Loki does NOT index the full text of logs. It indexes only the labels, storing raw compressed log chunks directly in cheap object storage (S3, GCS).",
    coreMechanism: "Loki groups log entries into **streams** sharing the exact same label set (e.g. `{app=\"api\", env=\"prod\"}`). Streams are compressed with gzip/snappy and written to object storage as immutable chunks. By avoiding inverted text indexes, Loki slashes RAM and storage costs by up to 85% compared to Elasticsearch. **LogQL** queries filter and parse logs dynamically at query time.",
    keySyntax: [
      {
        label: "Production LogQL Queries & Metric Extraction",
        code: `# 1. Filter Logs by Labels and Regex Pattern:
{app="payment-service", env="production"} |= "error" |~ "status=[45].."

# 2. Extract JSON Fields and Filter by Numeric Expression:
{app="order-api"} 
  | json 
  | latency_ms > 2000 
  | line_format "{{.timestamp}} - {{.route}} took {{.latency_ms}}ms"

# 3. Derive Real-Time Metric from Log Events (Error Rate per second):
sum(rate({app="checkout-service"} |= "connection refused" [5m])) by (pod)`,
        explanation: "LogQL allows you to dynamically derive Prometheus-compatible metric graphs directly from raw log output at query time."
      }
    ],
    productionCommands: [
      { cmd: "logcli query --addr=http://localhost:3100 '{app=\"api\"}' --limit=50", desc: "Query Loki logs directly from terminal using logcli", level: "read" },
      { cmd: "logcli series --addr=http://localhost:3100 '{env=\"production\"}'", desc: "List all active log streams and label combinations currently registered in Loki", level: "read" }
    ],
    productionRules: [
      "Keep Loki label cardinality low: label only static metadata (cluster, namespace, service, environment). Never put user IDs or IP addresses into Loki stream labels.",
      "Store chunks in cloud object storage (Amazon S3, Google Cloud Storage) with a local BoltDB-Shipper or TSDB index for petabyte-scale cost efficiency."
    ],
    failureModes: [
      {
        pitfall: "Adding `order_id` or `client_ip` as a Loki stream label in Promtail / Fluent Bit",
        impact: "Generates millions of micro-streams, causing Loki ingester memory to explode and query latency to slow from 200ms to 45 seconds.",
        resolution: "Leave high-cardinality fields in the raw log body and filter them via LogQL line filters (`|= \"order_123\"`)."
      }
    ],
    realWorldScenario: {
      title: "Saving $80,000/Year by Migrating Logs from Elasticsearch to Loki",
      situation: "A company spent $7,000/month hosting a 24-node Elasticsearch cluster strictly for debugging microservice logs.",
      investigation: "99% of log queries only looked at the last 6 hours of logs for specific services, rendering full-text indexing unnecessary.",
      fix: "Migrated to Grafana Loki backed by AWS S3, reducing the cluster footprint to 3 small nodes and cutting monthly log infrastructure costs to $450."
    }
  },
  {
    id: "opentelemetry",
    name: "9. OpenTelemetry (OTel)",
    subtitle: "Vendor-Neutral Telemetry Framework: Collector, SDKs & Pipelines",
    category: "Engines & Tooling",
    mentalModel: "OpenTelemetry (OTel) is the CNCF industry standard for instrumenting, generating, collecting, and exporting telemetry data (Metrics, Logs, Traces). It decouples application instrumentation from backend vendors.",
    coreMechanism: "Applications use the vendor-neutral OpenTelemetry SDK to instrument code once. Telemetry is exported over standard OTLP (OpenTelemetry Protocol, gRPC/Protobuf on port 4317 or HTTP on port 4318) to the **OpenTelemetry Collector**. The Collector processes, batches, samples, scrubs PII, and exports data simultaneously to any backend (Prometheus, Jaeger, Loki, Datadog).",
    keySyntax: [
      {
        label: "OpenTelemetry Collector Production Pipeline (`otel-collector.yaml`)",
        code: `receivers:
  otlp:
    protocols:
      grpc: { endpoint: "0.0.0.0:4317" }
      http: { endpoint: "0.0.0.0:4318" }

processors:
  memory_limiter:
    check_interval: 1s
    limit_percentage: 75
    spike_limit_percentage: 15
  batch:
    send_batch_size: 1000
    timeout: 5s
  resourcedetection:
    detectors: [env, system, k8snode]

exporters:
  prometheus:
    endpoint: "0.0.0.0:8889"
  otlp/tempo:
    endpoint: "tempo:4317"
    tls: { insecure: true }

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [otlp/tempo]
    metrics:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [prometheus]`,
        explanation: "`memory_limiter` protects the Collector from crashing during unexpected telemetry traffic spikes."
      }
    ],
    productionCommands: [
      { cmd: "curl -s http://localhost:13133/", desc: "Health check probe to verify OpenTelemetry Collector liveness and operational readiness", level: "read" },
      { cmd: "curl -s http://localhost:8888/metrics", desc: "Inspect internal self-monitoring metrics of the OpenTelemetry Collector daemon", level: "read" }
    ],
    productionRules: [
      "Always configure `memory_limiter` as the very first processor in every OpenTelemetry Collector pipeline to prevent container OOM kills.",
      "Instrument applications exclusively with vendor-neutral OpenTelemetry APIs; never couple application source code directly to proprietary vendor SDKs."
    ],
    failureModes: [
      {
        pitfall: "Running OTel Collector without batching or queueing under high traffic",
        impact: "The collector opens thousands of outbound connections to backends, dropping telemetry samples and increasing application latency.",
        resolution: "Configure `batch` processor with `send_batch_size: 1000` and generous buffer queues."
      }
    ],
    realWorldScenario: {
      title: "Vendor Lock-In Escape via OpenTelemetry Migration",
      situation: "A SaaS provider faced a 300% price hike from a commercial APM vendor, but their codebase was deeply coupled to proprietary agents across 80 repos.",
      investigation: "Extracting the vendor SDK would require 6 months of manual code rewrites across multiple teams.",
      fix: "Standardized on OpenTelemetry SDKs with an in-cluster OTel Collector, allowing backends to be swapped or multi-homed via a single YAML config change."
    }
  },
  {
    id: "slis",
    name: "10. SLIs",
    subtitle: "Service Level Indicators: Quantifiable Telemetry Measurements",
    category: "SRE & Reliability Metrics",
    mentalModel: "A Service Level Indicator (SLI) is a carefully chosen quantitative measure of service performance delivered directly to users. It answers: 'What was the exact quality of service delivered over a given time window?'",
    coreMechanism: "In SRE discipline, an SLI is almost always expressed as a percentage: `SLI = (Count of Good Events / Total Count of Valid Events) * 100`. Common SLI archetypes follow the Google SRE handbook: **Availability SLI** (ratio of successful HTTP 2xx/3xx requests vs total requests) and **Latency SLI** (ratio of requests completed in < 200ms vs total requests).",
    keySyntax: [
      {
        label: "Availability and Latency SLI PromQL Formulations",
        code: `# 1. Availability SLI (Target: % of requests returning non-5xx over 30 days):
sum(rate(http_requests_total{job="checkout-api", status!~"5.."}[30d]))
  /
sum(rate(http_requests_total{job="checkout-api"}[30d])) * 100

# 2. Latency SLI (Target: % of requests faster than 250ms):
sum(rate(http_request_duration_seconds_bucket{job="checkout-api", le="0.25"}[30d]))
  /
sum(rate(http_request_duration_seconds_count{job="checkout-api"}[30d])) * 100`,
        explanation: "Formulating SLIs as (Good / Total) ratios creates a standardized foundation for calculating error budgets."
      }
    ],
    productionCommands: [
      { cmd: "promtool query instant http://localhost:9090 'sum(rate(http_requests_total{status!~\"5..\"}[5m])) / sum(rate(http_requests_total[5m]))'", desc: "Compute instant availability SLI percentage over the last 5 minutes", level: "read" },
      { cmd: "curl -s http://localhost:9090/api/v1/rules?type=alert", desc: "Inspect active SLI burn-rate alert evaluation rules", level: "read" }
    ],
    productionRules: [
      "Measure SLIs from the customer perspective (e.g. at the load balancer or client app), not from internal database CPU metrics.",
      "Filter out invalid client errors (HTTP 4xx like bad credentials or invalid inputs) from availability SLIs: client errors do not represent service unreliability."
    ],
    failureModes: [
      {
        pitfall: "Counting HTTP 404 (Not Found) or 401 (Unauthorized) as failed events in an Availability SLI",
        impact: "A customer running a security scanner or typing broken URLs degrades your SLI, triggering false alerts for a completely healthy service.",
        resolution: "Filter by `status!~'5..'` so only server-side failures count against availability."
      }
    ],
    realWorldScenario: {
      title: "The Inverted SLI that Masked a Complete Frontend Outage",
      situation: "Users reported that the web app was completely blank, but the backend SLI dashboard reported 100% availability.",
      investigation: "The SLI was measuring backend API HTTP 200 responses. The frontend CDN had a corrupted bundle that failed to boot client-side JavaScript.",
      fix: "Deployed synthetic client-side browser SLIs measuring real-user page interaction readiness."
    }
  },
  {
    id: "slos",
    name: "11. SLOs",
    subtitle: "Service Level Objectives: Internal Reliability Targets & Guardrails",
    category: "SRE & Reliability Metrics",
    mentalModel: "A Service Level Objective (SLO) is the agreed-upon target reliability goal for an SLI over a rolling compliance window (e.g. 99.9% availability over 30 days). It defines how reliable the service needs to be to keep customers happy.",
    coreMechanism: "SLOs are defined internally by engineering and product teams. An SLO should always be stricter than your contractual SLA to give engineering time to react before financial penalties trigger. A rolling 30-day window prevents a bad hour on the 1st of the month from penalizing the team for the entire calendar month.",
    keySyntax: [
      {
        label: "The Standard Reliability Tiering Matrix",
        code: `Availability Level | Downtime per 30 Days | Typical Workload
-------------------|----------------------|------------------------------------
99.0%  (2 Nines)   | 7 hours, 12 minutes  | Internal staging, batch analytics
99.9%  (3 Nines)   | 43 minutes, 12 sec   | Standard B2B SaaS web applications
99.95% (3.5 Nines) | 21 minutes, 36 sec   | E-commerce checkout, payment APIs
99.99% (4 Nines)   | 4 minutes, 19 sec    | Telecom, banking core ledger infrastructure`,
        explanation: "Every extra 'Nine' of reliability exponentially increases infrastructure redundancy costs and slows deployment velocity."
      }
    ],
    productionCommands: [
      { cmd: "sloth generate -i /etc/sloth/slo.yaml -o /etc/prometheus/rules/slo-rules.yaml", desc: "Generate multi-window multi-burn-rate Prometheus alerting rules from high-level SLO definitions", level: "write" },
      { cmd: "pyrra generate -f /etc/pyrra/slo.yaml", desc: "Generate SLO recording rules and Grafana dashboard manifests using Pyrra", level: "write" }
    ],
    productionRules: [
      "Never target 100% reliability: 100% is the wrong target because the user's ISP, mobile network, and device are never 100% reliable.",
      "Always set SLOs tighter than SLAs: for an external 99.5% SLA, set an internal 99.9% SLO to provide a buffer for remediation."
    ],
    failureModes: [
      {
        pitfall: "Setting an unrealistic 99.99% (4 Nines) SLO on a monolithic service running on single-AZ databases",
        impact: "The SLO is breached every month during routine maintenance, destroying team morale and making the metric meaningless.",
        resolution: "Align SLO targets with physical architectural realities (Multi-AZ, automated failover)."
      }
    ],
    realWorldScenario: {
      title: "The Four-Nines Promise that Paralyzed Feature Development",
      situation: "An executive promised enterprise customers 99.99% availability without consulting engineering.",
      investigation: "4 Nines allows only 4 minutes of downtime per month. The team spent 100% of their time on manual deployment ceremonies, halting all product features.",
      fix: "Renegotiated the contractual SLO to a realistic 99.9% with scheduled maintenance windows, restoring feature delivery velocity."
    }
  },
  {
    id: "slas",
    name: "12. SLAs",
    subtitle: "Service Level Agreements: Legally Binding Customer Contracts",
    category: "SRE & Reliability Metrics",
    mentalModel: "A Service Level Agreement (SLA) is a formal, legally binding business contract between a service provider and its customers that explicitly defines penalties (billing refunds, service credits, contract termination) if the agreed service level is breached.",
    coreMechanism: "Unlike an internal SLO (which guides engineering velocity), an SLA is written by legal and business teams. SLAs specify exclusion clauses (scheduled maintenance, customer misconfiguration, force majeure) and tiered credit schedules (e.g. 10% credit if availability drops below 99.9%, 25% credit below 99.0%).",
    keySyntax: [
      {
        label: "Standard Cloud SLA Credit Matrix Contract",
        code: `Monthly Uptime Percentage | Service Credit Percentage
--------------------------|--------------------------
< 99.9% but >= 99.0%      | 10% of monthly bill
< 99.0% but >= 95.0%      | 25% of monthly bill
< 95.0%                   | 100% of monthly bill (Full refund)

# SLA Calculation Formula:
Uptime % = (Total Minutes in Month - Downtime Minutes) / Total Minutes in Month * 100
# (Excludes scheduled maintenance announced 5 business days in advance)`,
        explanation: "SLAs dictate the direct financial consequences of production downtime."
      }
    ],
    productionCommands: [
      { cmd: "curl -s http://status.mycompany.com/api/v1/sla/monthly-summary", desc: "Query automated public status page API for historical monthly uptime percentages", level: "read" },
      { cmd: "kubectl get slas -A", desc: "Inspect registered enterprise customer SLA tier CRDs across cluster namespaces", level: "read" }
    ],
    productionRules: [
      "Engineering must review every customer SLA before sales signs contracts: never allow sales to promise SLAs higher than internal SLOs.",
      "Explicitly exclude customer-side failures, third-party ISP outages, and announced scheduled maintenance windows in contract terms."
    ],
    failureModes: [
      {
        pitfall: "Writing an SLA that measures uptime at the server level rather than end-to-end customer reachability",
        impact: "Customers cannot checkout due to a DNS routing failure, but the provider refuses credits because 'servers were running', triggering legal disputes and churn.",
        resolution: "Define unambiguous SLA measurement points using third-party synthetic probes."
      }
    ],
    realWorldScenario: {
      title: "The $300,000 SLA Penalty Payout from a 2-Hour Black Friday Outage",
      situation: "An e-commerce infrastructure provider went down for 2 hours during Black Friday, triggering mandatory enterprise SLA penalty clauses.",
      investigation: "The company signed an aggressive 99.95% SLA with no exclusions for peak seasonal volume caps.",
      fix: "Introduced rate-limiting safeguards, Multi-Region active-active failover, and updated contract terms with fair-use capacity limits."
    }
  },
  {
    id: "error-budgets",
    name: "13. Error Budgets",
    subtitle: "The Currency of Innovation: Balancing Reliability vs Feature Velocity",
    category: "SRE & Reliability Metrics",
    mentalModel: "An Error Budget is the allowed unreliability of a service over time: `Error Budget = 100% - SLO`. For a 99.9% SLO, you have an error budget of 0.1% (43 minutes of downtime per month). It is the budget you are explicitly allowed to spend on feature releases, experiments, and architectural changes.",
    coreMechanism: "The Error Budget acts as an objective, mathematical referee between Product Managers (who want to ship features fast) and SREs (who want stability). If the error budget is healthy (>20%), the team ships features aggressively. If the error budget is exhausted (0%), all feature deployments are frozen and 100% of engineering effort pivots to reliability, bug fixes, and infrastructure resilience.",
    keySyntax: [
      {
        label: "Multi-Window Multi-Burn-Rate Alerting Architecture",
        code: `# Google SRE Multi-Burn-Rate Alerting Strategy:
# Burn Rate 1 = Consuming 100% of budget over the entire 30-day window.
# Burn Rate 14.4 = Consuming 100% of budget in 2 days (Page On-Call immediately!)
# Burn Rate 6 = Consuming 100% of budget in 5 days (Alert team ticket)

# PromQL Multi-Burn Alert (Fires if BOTH 1h and 5m burn rates exceed 14.4x):
(
  sum(rate(http_requests_total{status=~"5.."}[1h])) 
  / 
  sum(rate(http_requests_total[1h])) 
  > (1 - 0.999) * 14.4
)
and
(
  sum(rate(http_requests_total{status=~"5.."}[5m])) 
  / 
  sum(rate(http_requests_total[5m])) 
  > (1 - 0.999) * 14.4
)`,
        explanation: "Multi-window burn-rate alerting eliminates false alarms by requiring both short-term (5m) and long-term (1h) budget consumption spikes to fire a page."
      }
    ],
    productionCommands: [
      { cmd: "promtool query instant http://localhost:9090 '1 - (sum(rate(http_requests_total{status!~\"5..\"}[30d])) / sum(rate(http_requests_total[30d]))) / (1 - 0.999)'", desc: "Calculate current Error Budget consumed percentage over 30-day rolling window", level: "read" },
      { cmd: "sloth generate -i slo.yaml", desc: "Compile declarative error budget burn rates into production Prometheus alert rules", level: "read" }
    ],
    productionRules: [
      "Enforce explicit consequences when an error budget is burned: freeze non-critical feature releases until the budget replenishes.",
      "Use **Multi-Window Multi-Burn-Rate Alerting**: never alert on simple single-minute error spikes."
    ],
    failureModes: [
      {
        pitfall: "Treating error budgets as a vanity dashboard with zero organizational consequences when exhausted",
        impact: "Teams continue pushing risky features while the platform is unstable, leading to cascading failures and customer attrition.",
        resolution: "Establish a formal executive policy halting feature deployments upon budget exhaustion."
      }
    ],
    realWorldScenario: {
      title: "How an Error Budget Freeze Saved a FinTech Platform",
      situation: "A team shipped 5 major features in two weeks, causing 4 production outages and consuming 110% of their 30-day error budget.",
      investigation: "The company enforced an automated deployment freeze: for the next 10 days, engineers were barred from merging features and assigned to patch connection pooling and write tests.",
      fix: "The team resolved the root causes, the budget replenished, and subsequent feature releases deployed with zero downtime."
    }
  },
  {
    id: "dashboards",
    name: "14. Dashboards",
    subtitle: "Visual Cognitive Ergonomics: USE Method & RED Method",
    category: "Dashboards & Visualization",
    mentalModel: "A dashboard should not be a junkyard of 50 random graphs. A production dashboard is an intuitive visual cockpit designed around proven mental frameworks: the **RED Method** for request-driven services and the **USE Method** for resource infrastructure.",
    coreMechanism: "The **RED Method** (Brendan Gregg / Tom Wilkie) monitors user-facing services: **Rate** (requests per second), **Errors** (failed requests per second), **Duration** (latency distribution). The **USE Method** monitors hardware/resources: **Utilization** (percentage of time resource was busy), **Saturation** (queue backlog/throttling), **Errors** (hardware/driver error events).",
    keySyntax: [
      {
        label: "The RED & USE Dashboard Layout Architecture",
        code: `Top Row (Global Business Health):
┌─────────────────────────┬─────────────────────────┬─────────────────────────┐
│ Rate: 4,250 req/sec     │ Errors: 0.02% (5xx)     │ Duration: P99 85ms      │
└─────────────────────────┴─────────────────────────┴─────────────────────────┘

Second Row (Component Slicing):
┌───────────────────────────────────────────────────┬─────────────────────────┐
│ Latency Distribution (P50, P90, P99, Max)         │ Error Breakdown by Path │
└───────────────────────────────────────────────────┴─────────────────────────┘

Third Row (USE Infrastructure Health):
┌─────────────────────────┬─────────────────────────┬─────────────────────────┐
│ CPU Utilization (%)     │ Memory Saturation (Swap)│ Disk I/O Throttling     │
└─────────────────────────┴─────────────────────────┴─────────────────────────┘`,
        explanation: "Organizing dashboards from high-level business impact down to underlying infrastructure allows on-call engineers to triage root causes in seconds."
      }
    ],
    productionCommands: [
      { cmd: "curl -s -H 'Authorization: Bearer <key>' http://grafana:3000/api/search?starred=true", desc: "List all production golden-signal dashboards starred by SRE team", level: "read" },
      { cmd: "grafana-cli admin reset-admin-password <password>", desc: "Reset Grafana administrative master password via local server console", level: "write" }
    ],
    productionRules: [
      "Place the 3 Golden Signals (Rate, Errors, Duration) in the top row: an engineer should understand system health within 5 seconds of opening the page.",
      "Limit each dashboard to no more than 12-16 focused panels to prevent visual clutter and browser performance degradation."
    ],
    failureModes: [
      {
        pitfall: "Creating a massive 80-graph dashboard that displays every internal variable and thread count",
        impact: "During an active incident, engineers panic, drown in irrelevant visual noise, and fail to spot the actual bottleneck.",
        resolution: "Follow the RED/USE methods and split complex subsystems into dedicated drill-down dashboards."
      }
    ],
    realWorldScenario: {
      title: "Triaging a Memory Leak in 45 Seconds via USE Dashboard",
      situation: "An on-call engineer was paged for elevated P99 latency on the payments service at 3:00 AM.",
      investigation: "The RED row showed error rates at 0%, but latency was 1,200ms. Scanning the USE row below immediately showed node memory at 99% and disk swap utilization spiking.",
      fix: "Identified a memory leak in a newly introduced reporting endpoint and restarted the service within 60 seconds."
    }
  },
  {
    id: "on-call",
    name: "15. On-Call",
    subtitle: "Human Engineering: Rotations, Escalation Policies & Fatigue Defense",
    category: "Incident & On-Call Operations",
    mentalModel: "On-call is the operational responsibility of engineers supporting their own production code. Sustainable on-call programs protect engineers from burnout through sensible rotations, secondary backups, and zero tolerance for noisy non-actionable pages.",
    coreMechanism: "Incident platforms (PagerDuty, Opsgenie, VictorOps) manage scheduling calendars. When an alert fires, it triggers an **Escalation Policy**: the primary on-call is paged via push/SMS/phone. If unacknowledged within 10 minutes, it automatically escalates to the secondary on-call, and subsequently to the engineering manager.",
    keySyntax: [
      {
        label: "Production Escalation Policy Topology",
        code: `Level 1: Primary On-Call Engineer (App Dev)
  ├── Page via Push Notification + High-Priority Sound
  └── If unacknowledged in 10 minutes:
       │
       ▼
Level 2: Secondary On-Call Engineer (Staff SRE / Backup)
  ├── Page via Automated Phone Call + SMS
  └── If unacknowledged in 15 minutes:
       │
       ▼
Level 3: Engineering Director / On-Call Incident Commander
  └── Escalate directly to executive engineering leadership`,
        explanation: "Automatic escalation ensures production alerts are never dropped if a primary engineer is sleeping or out of cellular coverage."
      }
    ],
    productionCommands: [
      { cmd: "pd oncall --current", desc: "Query PagerDuty CLI to display currently active primary and secondary on-call engineers", level: "read" },
      { cmd: "pd incident list --status triggered,acknowledged", desc: "List all active, unassigned, or in-flight production incident pages", level: "read" }
    ],
    productionRules: [
      "You build it, you run it: software engineering teams that author features must participate in their own on-call rotations.",
      "Cap on-call interruptions: if an engineer receives more than 2 pages per shift, the team must prioritize alert tuning and technical debt over new features."
    ],
    failureModes: [
      {
        pitfall: "Leaving low-priority, non-actionable warning alerts configured to page on-call engineers at 3:00 AM",
        impact: "Severe sleep deprivation and alert fatigue lead to engineers turning their phones on silent, missing a critical database failure.",
        resolution: "Reserve high-priority sound pages strictly for critical user-facing SLO breaches; route non-urgent warnings to Slack."
      }
    ],
    realWorldScenario: {
      title: "Mass Resignations Caused by 40 Pages Per Night",
      situation: "Three senior backend engineers resigned within two months, citing intolerable on-call conditions.",
      investigation: "The team had 80 alerts alerting on CPU warnings and transient cache misses, averaging 42 pages per night.",
      fix: "Deleted 70 non-actionable alerts, implemented multi-window burn-rate SLO paging, and reduced average pages per shift to 0.4."
    }
  },
  {
    id: "incident-response",
    name: "16. Incident Response",
    subtitle: "Severity Tiers, Incident Commander (IC) & War Room Triage",
    category: "Incident & On-Call Operations",
    mentalModel: "Incident Response is the organized emergency protocol for restoring service operations as quickly as possible. During an active incident, engineering shifts from normal work to a disciplined command structure.",
    coreMechanism: "Incidents are classified by Severity: **SEV-1** (Catastrophic: total system down, direct financial loss), **SEV-2** (Major: core functionality broken for large percentage of users), **SEV-3** (Minor: degraded performance or non-critical edge case). An **Incident Commander (IC)** leads the response, delegating investigation to Technical Leads and customer updates to Communications Leads.",
    keySyntax: [
      {
        label: "Incident Command Structure & Roles",
        code: `Role                    | Primary Responsibility
------------------------|---------------------------------------------------------
Incident Commander (IC) | Owns the incident; directs strategy; delegates tasks;
                        | prevents chaos; does NOT write code or run commands.
Technical Lead (TL)     | Directs root-cause investigation; coordinates patches.
Scribe                  | Documents every action, command, and timestamp in real time.
Communications Lead     | Writes public status page updates and customer emails.

Incident Lifecycle:
Detect -> Triage (SEV-1/2) -> Mobilize War Room -> Mitigate -> Verify -> Resolve`,
        explanation: "The Incident Commander never debugs code during an incident; their sole duty is maintaining strategic situational awareness."
      }
    ],
    productionCommands: [
      { cmd: "curl -X POST -H 'Authorization: Bearer <key>' https://api.statuspage.io/v1/pages/<page>/incidents -d 'incident[name]=Investigating API Degraded Performance&incident[status]=investigating'", desc: "Create public status page incident notification for customer transparency", level: "write" }
    ],
    productionRules: [
      "Focus strictly on **Mitigation** first, not root cause analysis: roll back, scale up, or disable the broken feature before trying to understand why it failed.",
      "Maintain a single source of truth: open a dedicated Slack channel (`#inc-20261109-payment-down`) and video bridge for all incident communications."
    ],
    failureModes: [
      {
        pitfall: "Spending 45 minutes analyzing an application stack trace during an ongoing SEV-1 outage instead of immediately rolling back",
        impact: "Customers remain offline for an extra hour while developers debug code in production.",
        resolution: "Mitigate first (roll back to previous version); debug root cause later in staging."
      }
    ],
    realWorldScenario: {
      title: "The 8-Executive War Room Crossfire",
      situation: "During an outage, 8 vice presidents and directors joined the technical debugging call, asking questions and demanding updates every 2 minutes.",
      investigation: "With no designated Incident Commander, technical leads spent 100% of their time answering executive questions instead of executing rollbacks.",
      fix: "Instituted the Incident Commander role: the IC immediately moved all executives to a passive listening channel and appointed a Comms Lead."
    }
  },
  {
    id: "postmortems",
    name: "17. Postmortems",
    subtitle: "Blameless Culture: Root Cause Analysis, 5 Whys & Action Items",
    category: "Incident & On-Call Operations",
    mentalModel: "A Postmortem (or Retrospective) is a structured learning process conducted after an incident has been resolved. Its goal is not to punish human error, but to understand systemic architectural weaknesses and prevent the failure from ever happening again.",
    coreMechanism: "The postmortem document includes: Executive Summary, Impact Assessment (downtime, lost revenue, affected users), Comprehensive Chronological Timeline, **5 Whys Analysis** (probing deep systemic root causes), What Went Well / What Went Poorly, and Prioritized Action Items with assigned owners and Jira ticket deadlines.",
    keySyntax: [
      {
        label: "The 5 Whys Systemic Investigation Framework",
        code: `Problem: Database ran out of disk space, taking down production for 42 minutes.

Why 1? The database host root disk filled to 100% capacity.
Why 2? A debug log file was logging every SQL query to local disk.
Why 3? A developer enabled verbose SQL logging to troubleshoot a staging issue.
Why 4? Staging configuration variables were accidentally copied into production environment secrets.
Why 5? Secrets were managed manually via copy-paste rather than automated via Terraform & KMS.

Root Cause: Lack of automated, environment-isolated secret management pipelines.
Action Item: Migrate all database connection secrets to AWS Secrets Manager via Terraform (P0, Owner: Alice).`,
        explanation: "The 5 Whys moves the focus away from blaming the developer and isolates the underlying systemic failure."
      }
    ],
    productionCommands: [
      { cmd: "gh issue create --title 'Postmortem Action Item: Add disk volume auto-expand' --label 'p0-reliability,postmortem'", desc: "Create trackable GitHub issue directly from postmortem action items", level: "write" }
    ],
    productionRules: [
      "Enforce **Blameless Culture**: assume people made the best decisions possible given the information they had at the time.",
      "Assign explicit owners and hard deadlines to every action item; untracked postmortem action items guarantee repeated incidents."
    ],
    failureModes: [
      {
        pitfall: "Concluding that the root cause was 'human error' (e.g. 'Bob ran the wrong command')",
        impact: "Engineers hide mistakes, systemic flaws remain unfixed, and the exact same incident recurs when someone else makes a typo.",
        resolution: "Ask: 'Why did the system allow a single command to take down production without guardrails?'"
      }
    ],
    realWorldScenario: {
      title: "The Accidental `DROP TABLE` that Banned Manual Production Access",
      situation: "An engineer accidentally ran a drop script against production instead of staging.",
      investigation: "In the blameless postmortem, the team did not fire the engineer. Instead, they asked why any human had direct write access to the production database from a personal laptop.",
      fix: "Revoked direct developer credentials to production DBs; mandated all schema migrations run via automated CI/CD pipelines with dry-run verification."
    }
  },
  {
    id: "uptime-checks",
    name: "18. Uptime Checks",
    subtitle: "Blackbox Probing: Multi-Region Synthetics & Ingress Health",
    category: "Resilience & Capacity",
    mentalModel: "Internal metrics and whitebox monitoring only tell you what your servers think is happening. Uptime Checks (Synthetics / Blackbox Probing) test your service from the outside world exactly like a real customer across multiple global networks.",
    coreMechanism: "External probing probes (Prometheus Blackbox Exporter, Better Uptime, Pingdom) send synthetic HTTP GET/POST, TCP handshake, DNS resolution, and TLS handshake requests from 10+ geographic regions every 30 seconds. Probes assert HTTP 200, valid response bodies, and TLS certificate expiration dates.",
    keySyntax: [
      {
        label: "Prometheus Blackbox Exporter Configuration",
        code: `# Blackbox Exporter Module (HTTP Probe with TLS Verification):
modules:
  http_2xx:
    prober: http
    timeout: 5s
    http:
      valid_http_versions: ["HTTP/1.1", "HTTP/2"]
      valid_status_codes: [200]
      method: GET
      fail_if_ssl: false
      fail_if_not_ssl: true # Mandates valid HTTPS
      tls_config:
        insecure_skip_verify: false

# Prometheus Scrape Config for Blackbox Targets:
scrape_configs:
  - job_name: 'blackbox-external-uptime'
    metrics_path: /probe
    params:
      module: [http_2xx]
    static_configs:
      - targets:
        - https://api.mycompany.com/health
        - https://checkout.mycompany.com/ping
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - target_label: __address__
        replacement: blackbox-exporter:9115`,
        explanation: "The Blackbox Exporter simulates external web traffic from the Internet into your cluster's public Ingress."
      }
    ],
    productionCommands: [
      { cmd: "curl -s -o /dev/null -w 'HTTP: %{http_code} | Total Time: %{time_total}s | SSL: %{time_appconnect}s\\n' https://api.mycompany.com/health", desc: "Execute detailed command-line synthetic latency probe measuring DNS, TLS, and response time", level: "read" },
      { cmd: "echo | openssl s_client -servername api.mycompany.com -connect api.mycompany.com:443 2>/dev/null | openssl x509 -noout -dates", desc: "Inspect remote SSL/TLS certificate validity dates to prevent surprise certificate expiration", level: "read" }
    ],
    productionRules: [
      "Always probe services from outside your cloud provider's network: internal probes cannot detect external CDN or DNS outages.",
      "Configure SSL certificate expiration alerts at 30 days, 14 days, and 7 days to eliminate outages from expired TLS certs."
    ],
    failureModes: [
      {
        pitfall: "Running synthetic uptime probes only from the same AWS VPC where the application is hosted",
        impact: "If the AWS Internet Gateway or CloudFront CDN fails, internal probes report 100% healthy while all external customers cannot connect.",
        resolution: "Use globally distributed third-party probing networks spanning multiple cloud providers."
      }
    ],
    realWorldScenario: {
      title: "The Expired Wildcard TLS Certificate Outage",
      situation: "At 00:00 UTC on Sunday, all customer traffic crashed with browser `NET::ERR_CERT_DATE_INVALID` warnings.",
      investigation: "The company relied on internal Prometheus metrics, which did not monitor external TLS certificate expiration dates.",
      fix: "Deployed Blackbox Exporter alerting on `probe_ssl_earliest_cert_expiry - time() < 86400 * 14`."
    }
  },
  {
    id: "capacity-planning",
    name: "19. Capacity Planning",
    subtitle: "Resource Forecasting: Saturation Thresholds & Scaling Runways",
    category: "Resilience & Capacity",
    mentalModel: "Capacity Planning is the practice of forecasting future compute, storage, memory, and database connection demands to ensure systems never hit resource exhaustion walls during business growth.",
    coreMechanism: "Teams track **Resource Saturation** (the point where a component operates beyond its optimal throughput, resulting in queueing and latency spikes). Linear regression models (`predict_linear` in PromQL) calculate the **Runway**: the exact number of days remaining before disk space, IOPS, or database connection limits are breached.",
    keySyntax: [
      {
        label: "PromQL Capacity Runway Forecasting",
        code: `# 1. Predict Disk Exhaustion within 14 Days (Based on 7-Day Trend):
predict_linear(node_filesystem_free_bytes{mountpoint="/"}[7d], 14 * 86400) < 0

# 2. Database Connection Pool Saturation Ratio:
sum(pg_stat_activity_count) 
  / 
sum(pg_settings_max_connections) * 100 > 80

# 3. Network Interface Bandwidth Saturation:
sum(rate(node_network_transmit_bytes_total[5m])) 
  / 
node_network_speed_bytes * 100 > 75`,
        explanation: "`predict_linear` evaluates historical growth velocity and alerts engineers weeks before a disk reaches 100% capacity."
      }
    ],
    productionCommands: [
      { cmd: "promtool query instant http://localhost:9090 'predict_linear(node_filesystem_free_bytes[7d], 30*86400)'", desc: "Forecast disk capacity levels 30 days into the future based on last 7 days of consumption", level: "read" }
    ],
    productionRules: [
      "Alert on resource saturation at 70-80% capacity: once a database or SSD hits 95% capacity, performance degrades non-linearly.",
      "Conduct quarterly load testing (stress tests) at 3x peak anticipated traffic to identify the next architectural bottleneck."
    ],
    failureModes: [
      {
        pitfall: "Scaling application compute (EC2/Kubernetes) without planning for downstream database connection capacity",
        impact: "Auto-scaling spins up 50 new pods to handle traffic; the 50 pods exhaust PostgreSQL's `max_connections`, crashing the database for everyone.",
        resolution: "Deploy connection poolers (PgBouncer, AWS RDS Proxy) and factor database connection limits into auto-scaling maximums."
      }
    ],
    realWorldScenario: {
      title: "The Sudden AWS EBS IOPS Starvation Wall",
      situation: "An e-commerce database transaction latency surged from 4ms to 1,800ms during a planned product launch.",
      investigation: "The team was using standard `gp2` EBS volumes. Under peak load, the database exhausted its burst balance credits and was throttled to baseline IOPS.",
      fix: "Migrated to `gp3` with provisioned 12,000 baseline IOPS and instituted IOPS saturation monitoring in Grafana."
    }
  },
  {
    id: "chaos-engineering",
    name: "20. Chaos Engineering",
    subtitle: "Controlled Failure Injection: Chaos Mesh, Litmus & Blast Radius",
    category: "Resilience & Capacity",
    mentalModel: "Chaos Engineering is the discipline of experimenting on a system in order to build confidence in the system's capability to withstand turbulent conditions in production. You do not create chaos; you simulate failures in a controlled manner to uncover hidden weaknesses before they cause real outages.",
    coreMechanism: "Engineers formulate a hypothesis (e.g. 'If we terminate a Redis node, checkout latency will remain < 200ms via cache-fallback'). Tools (Chaos Mesh, LitmusChaos, AWS Fault Injection Service) inject controlled faults: killing pods, inducing CPU stress, injecting 200ms network packet latency, or dropping DNS queries. If the steady state degrades, the experiment halts immediately.",
    keySyntax: [
      {
        label: "Chaos Mesh Network Latency Injection Manifest",
        code: `apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: payment-gateway-latency-experiment
  namespace: production
spec:
  action: delay # Injects synthetic network delay
  mode: fixed
  value: '1' # Targets 1 pod replica at a time (controlled blast radius!)
  selector:
    namespaces: ['production']
    labelSelectors:
      app: 'payment-gateway'
  delay:
    latency: '500ms'
    jitter: '50ms'
  duration: '5m' # Automatically aborts after 5 minutes
  scheduler:
    cron: '@every 2h'`,
        explanation: "Injects 500ms latency into payment pods for 5 minutes to test whether upstream timeouts and circuit breakers function correctly."
      }
    ],
    productionCommands: [
      { cmd: "kubectl get networkchaos,podchaos -A", desc: "List all active Chaos Mesh fault-injection experiments running in the cluster", level: "read" },
      { cmd: "kubectl delete networkchaos <experiment_name>", desc: "EMERGENCY: Instantly abort and remove a running network chaos injection experiment", level: "hazardous" }
    ],
    productionRules: [
      "Always define a clear **Hypothesis** and measure the steady state using production SLIs before running any chaos experiment.",
      "Start in non-production environments with minimal blast radius (e.g. 1 pod) before running experiments in production.",
      "Always ensure an automated emergency kill switch is tested and ready to abort the experiment immediately if user metrics degrade."
    ],
    failureModes: [
      {
        pitfall: "Running chaos experiments in production without defining automated stop conditions or steady-state metrics",
        impact: "The injected fault triggers a cascading failure that takes down the entire customer-facing platform.",
        resolution: "Enforce automated halt conditions that terminate the chaos experiment if error rates exceed 0.5%."
      }
    ],
    realWorldScenario: {
      title: "Uncovering a Broken Circuit Breaker Before Black Friday",
      situation: "An SRE team ran a Chaos Mesh experiment injecting 3-second latency into their recommendation engine.",
      investigation: "The main product page was supposed to time out and hide recommendations. Instead, the main thread hung and crashed the entire storefront.",
      fix: "Fixed the broken circuit breaker timeout in the frontend gateway, preventing a catastrophic multi-million dollar outage during Black Friday."
    }
  }
];

