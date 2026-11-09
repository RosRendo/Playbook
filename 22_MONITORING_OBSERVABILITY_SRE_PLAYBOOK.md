# 22: OBSERVABILITY, TELEMETRY & SRE OPERATIONS PLAYBOOK

> **The 20 Architectural Pillars of Production Reliability Engineering**  
> *From OpenTelemetry Context Propagation & PromQL Quantiles to Error Budget Burn-Rate Alerting, Blameless Postmortems, and Chaos Mesh Resilience Testing.*

---

## Architecture Matrix: The 20 Pillars

| # | Pillar | Category | Primary Focus | Production Threat / Anti-Pattern |
|---|--------|----------|---------------|----------------------------------|
| **01** | **Metrics** | Telemetry Pillars | Structured numeric time-series (Counter, Gauge, Histogram) | High-cardinality labels (user IDs) crashing TSDB with OOM |
| **02** | **Logs** | Telemetry Pillars | Immutable JSON event streams with trace/span context | Multiline stack traces scattered across unparsed raw lines |
| **03** | **Traces** | Telemetry Pillars | Distributed context propagation (W3C traceparent) | Dropping headers across asynchronous queues, breaking trace DAGs |
| **04** | **Prometheus** | Engines & Tooling | Pull-based TSDB, PromQL, Gorilla compression | Using `irate()` for alerting, causing noisy false-alarm paging |
| **05** | **Grafana** | Dashboards & Visualization | Unified visualization, dynamic variables, dashboards-as-code | Heavy 50-query panels freezing browsers on long time ranges |
| **06** | **Alertmanager** | Engines & Tooling | Deduplication, grouping, inhibition rules, routing | Ungrouped alerts triggering 3,000-SMS notification storms |
| **07** | **ELK Stack** | Engines & Tooling | Elasticsearch, Logstash, Kibana, ILM policies | Dynamic mapping explosion exhausting master node JVM heap |
| **08** | **Loki** | Engines & Tooling | Label-indexed log streams stored in cloud object storage | Adding high-cardinality IP/user labels into Loki stream indexes |
| **09** | **OpenTelemetry** | Engines & Tooling | Vendor-neutral SDKs, OTLP pipelines, memory limiters | Running OTel collector without `memory_limiter` processor |
| **10** | **SLIs** | SRE & Reliability Metrics | Quantifiable ratio of good events over total valid events | Counting client-side 4xx errors as service unreliability |
| **11** | **SLOs** | SRE & Reliability Metrics | Internal reliability targets over rolling 30-day windows | Targeting unrealistic 100% reliability, halting all velocity |
| **12** | **SLAs** | SRE & Reliability Metrics | Legally binding contracts with customer credit penalties | Promising SLAs stricter than internal engineering SLOs |
| **13** | **Error Budgets** | SRE & Reliability Metrics | Unreliability allowance (`100% - SLO`) governing velocity | Treating error budgets as vanity metrics with zero freeze policy |
| **14** | **Dashboards** | Dashboards & Visualization | Cognitive ergonomics: RED Method (services) & USE (resources) | Cluttered 80-panel dashboards obscuring the actual bottleneck |
| **15** | **On-Call** | Incident & On-Call Operations | Human rotations, secondary escalation, alert fatigue defense | Paging engineers at 3 AM for non-actionable warning alerts |
| **16** | **Incident Response** | Incident & On-Call Operations | SEV tiers, Incident Commander role, war room mitigation | Debugging root causes during live outages instead of rolling back |
| **17** | **Postmortems** | Incident & On-Call Operations | Blameless culture, 5 Whys analysis, tracked action items | Concluding root cause was 'human error' without fixing guardrails |
| **18** | **Uptime Checks** | Resilience & Capacity | External synthetic multi-region blackbox probing & TLS expiry | Internal-only probes reporting healthy during global CDN failure |
| **19** | **Capacity Planning** | Resilience & Capacity | Saturation thresholds, linear regression runway forecasting | Auto-scaling compute until downstream database connections exhaust |
| **20** | **Chaos Engineering** | Resilience & Capacity | Controlled fault injection (latency, pod kills, packet drops) | Injecting chaos in production without automated halt conditions |

---

## Detailed Architectural Breakdown

### 1. Metrics
- **Mental Model**: Numeric measurements recorded over time. Divided into **Counters** (monotonically increasing), **Gauges** (fluctuating values), **Histograms** (bucketed observations for percentile calculations), and **Summaries**.
- **Cardinality Warning**: Never put unbounded variables (UUIDs, email addresses, order IDs) into metric labels. High cardinality creates millions of unique time series, causing Prometheus memory to explode.

---

### 2. Logs
- **Mental Model**: Structured JSON event records streaming directly to STDOUT.
- **Trace Correlation**: Every log line should carry `trace_id` and `span_id` fields, enabling instantaneous 1-click jumps from an error log directly into the corresponding distributed trace waterfall in Grafana.

---

### 3. Traces
- **Mental Model**: An end-to-end trace graph composed of parent and child Spans tracking a user request across microservices, databases, and message brokers.
- **Context Propagation**: Applications must extract and inject the W3C `traceparent` header (`00-<trace_id>-<span_id>-<flags>`) on every outbound HTTP request, gRPC call, and asynchronous Kafka/RabbitMQ message.

---

### 4. Prometheus
- **Mental Model**: Pull-based time-series database scraping `/metrics` endpoints at fixed intervals and compressing samples using Gorilla encoding (~1.37 bytes/sample).
- **PromQL Standard**: Always calculate rates over counters using `rate()`, never `irate()` for alerting rules. Wrap `rate()` in a window at least 4x the scrape interval.

---

### 5. Grafana
- **Mental Model**: Operational visual cockpit querying Prometheus, Loki, Tempo, and CloudWatch.
- **Best Practice**: Use `$__rate_interval` in PromQL queries to dynamically expand the calculation window as users zoom out from 1 hour to 30 days. Manage dashboards as code using Terraform or Jsonnet.

---

### 6. Alertmanager
- **Mental Model**: Manages alert deduplication, grouping, silencing, and notification routing to PagerDuty or Slack.
- **Inhibition Rules**: Use inhibition to mute downstream symptom alerts (e.g. mute container restart alerts if the underlying physical node is already down).

---

### 7. ELK Stack (Elasticsearch, Logstash, Kibana)
- **Mental Model**: Enterprise log analytics indexing text into Lucene inverted indexes.
- **Index Lifecycle**: Enforce Index Lifecycle Management (ILM) to roll over shards at 50GB and automatically delete logs older than 30 days.

---

### 8. Loki
- **Mental Model**: Cloud-native log aggregation that indexes ONLY the stream labels (`{app="api", env="prod"}`), storing raw compressed logs directly in cheap cloud object storage (S3/GCS).
- **Cost Advantage**: Eliminates full-text indexing overhead, slashing RAM and storage costs by up to 85% compared to Elasticsearch.

---

### 9. OpenTelemetry (OTel)
- **Mental Model**: CNCF standard for vendor-neutral telemetry collection.
- **Architecture**: Application OTel SDK -> OTel Collector (via OTLP gRPC 4317 / HTTP 4318) -> Processors (`memory_limiter`, `batch`) -> Exporters (Prometheus, Loki, Tempo, Datadog).

---

### 10. SLIs (Service Level Indicators)
- **Mental Model**: Quantifiable customer-centric measurement expressed as a percentage:
  $$\text{SLI} = \frac{\text{Count of Good Events}}{\text{Total Count of Valid Events}} \times 100$$
- **Availability SLI**: $\frac{\text{HTTP Non-5xx Requests}}{\text{Total Requests}} \times 100$ (excludes client 4xx errors).

---

### 11. SLOs (Service Level Objectives)
- **Mental Model**: Internal reliability target agreed upon by Product and Engineering over a rolling 30-day compliance window (e.g. 99.9% availability).
- **Rule**: Never target 100% reliability; every additional 'Nine' exponentially increases infrastructure costs and throttles feature delivery.

---

### 12. SLAs (Service Level Agreements)
- **Mental Model**: Legally binding business contract with external customers defining service credits or refunds if breached.
- **Governance**: Always ensure internal SLOs are tighter than external SLAs to maintain a safety buffer before financial penalties apply.

---

### 13. Error Budgets
- **Mental Model**: The allowable unreliability over time:
  $$\text{Error Budget} = 100\% - \text{SLO}$$
- **Multi-Burn Alerting**: Page on-call engineers only when high burn-rate thresholds are sustained across both short (5m) and long (1h) evaluation windows simultaneously.
- **Consequence**: When the error budget is exhausted (0%), freeze non-critical feature releases and redirect engineering effort toward reliability.

---

### 14. Dashboards (RED & USE Methods)
- **Mental Model**:
  - **RED Method (Services)**: **Rate** (req/sec), **Errors** (failed req/sec), **Duration** (latency P90/P99).
  - **USE Method (Resources)**: **Utilization** (busy %), **Saturation** (queue length/throttling), **Errors** (hardware failures).

---

### 15. On-Call
- **Mental Model**: Engineering operational ownership.
- **Fatigue Defense**: Cap pages at 2 per shift. Every alert that wakes up an engineer must be actionable; non-urgent warnings belong in Slack channels, not PagerDuty.

---

### 16. Incident Response
- **Mental Model**: Organized command structure during live outages:
  - **Incident Commander (IC)**: Directs strategy, delegates tasks, and maintains focus; does not write code.
  - **Technical Lead (TL)**: Leads technical debugging and executes mitigations.
  - **Communications Lead**: Handles public status page updates and customer comms.
- **Golden Rule**: **Mitigate first** (roll back, fail over, scale up); investigate root causes later in staging.

---

### 17. Postmortems
- **Mental Model**: Blameless retrospective focused on systemic architectural weaknesses rather than human error.
- **5 Whys**: Drill down past symptoms to identify root systemic flaws and assign prioritized, deadline-driven action items.

---

### 18. Uptime Checks (Synthetics)
- **Mental Model**: Multi-region external blackbox probing from outside the cloud provider's network to test true end-to-end customer reachability, DNS resolution, and TLS certificate expiration.

---

### 19. Capacity Planning
- **Mental Model**: Forecasting resource saturation thresholds using linear regression (`predict_linear`).
- **Runway**: Calculate remaining days before disk space, network bandwidth, or database connection limits hit saturation walls.

---

### 20. Chaos Engineering
- **Mental Model**: Controlled fault injection (Chaos Mesh, Litmus) to verify that circuit breakers, retries, timeouts, and automated failover mechanisms function under turbulent conditions.
- **Blast Radius**: Always define an explicit hypothesis, start with a minimal blast radius (1 pod), and enforce automated stop conditions.

