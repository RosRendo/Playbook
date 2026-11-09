# 21: CLOUD & AWS SYSTEMS ARCHITECTURE PLAYBOOK

> **The 20 Architectural Pillars of Production Cloud Engineering**  
> *From IAM SigV4 Least-Privilege & Nitro VPC Topologies to Multi-AZ RDS Failover, DynamoDB Single-Table Scaling, CloudFront OAC, and the 6 Well-Architected Pillars.*

---

## Architecture Matrix: The 20 Pillars

| # | Pillar | Category | Primary Focus | Production Threat / Anti-Pattern |
|---|--------|----------|---------------|----------------------------------|
| **01** | **IAM** | Security & Identity | Policies, Roles, STS short-lived tokens, least privilege | Granting `AdministratorAccess` to instance profiles (SSRF takeover) |
| **02** | **EC2** | Compute & Serverless | Nitro hypervisor, EBS block storage, IMDSv2 hardening | Storing databases on ephemeral NVMe disks (wiped on reboot) |
| **03** | **S3** | Storage & Databases | 11 9s durability, Block Public Access, Lifecycle rules | Public bucket exposure and orphan incomplete multipart uploads |
| **04** | **VPC** | Networking & Edge | Subnets, Route Tables, NAT Gateways, VPC Endpoints | Putting databases in public subnets with public IPs |
| **05** | **Security Groups** | Networking & Edge | Stateful ENI firewalls, chained security group references | Hardcoding subnet CIDR IPs instead of referencing SG IDs |
| **06** | **Load Balancers** | Networking & Edge | Layer 7 ALB vs Layer 4 NLB, target health checks | Heavy database queries in health checks triggering 503 cascades |
| **07** | **Auto Scaling** | Compute & Serverless | Target tracking policies, ALB metric equilibrium | Zero scale-in cooldown resulting in rapid instance thrashing |
| **08** | **RDS** | Storage & Databases | Multi-AZ synchronous standby, automated backups, Aurora | Running blocking DDL migrations without connection pool timeouts |
| **09** | **DynamoDB** | Storage & Databases | Single-digit ms NoSQL, Partition/Sort keys, Streams | Using `Scan` across millions of rows instead of `Query` |
| **10** | **Lambda** | Compute & Serverless | Serverless Firecracker microVMs, concurrency governance | Direct Lambda surges exhausting RDS connection pools |
| **11** | **ECS and EKS** | Compute & Serverless | AWS-native ECS vs Kubernetes EKS on Fargate | Over-engineering small workloads with self-managed EKS |
| **12** | **Route 53** | Networking & Edge | 100% SLA DNS, Alias records, global health check failover | Standard CNAME on root apex domain breaking MX email records |
| **13** | **CloudFront** | Networking & Edge | Global Edge CDN, Origin Access Control (OAC), TLS 1.3 | Running wildcard `/*` invalidations on every git push |
| **14** | **CloudWatch** | Messaging & Observability | Metrics, structured log groups, threshold alarms | Default 'Never Expire' log retention generating massive bills |
| **15** | **SQS and SNS** | Messaging & Observability | Pub/Sub fan-out (SNS) vs decoupled buffer queue (SQS) | Visibility timeout shorter than worker processing (duplicate charges) |
| **16** | **Secrets Manager** | Security & Identity | KMS envelope encryption, automated database rotation | Fetching secrets on every HTTP request without memory caching |
| **17** | **Cost Management** | Governance & Architecture | Cost Explorer, FinOps, Budgets, Compute Savings Plans | Zombie unattached EBS volumes and abandoned idle NAT Gateways |
| **18** | **Regions and AZs** | Governance & Architecture | Physical fault domains, Multi-AZ resilience, cross-AZ costs | Single-AZ deployment wiped out by a single data center outage |
| **19** | **Backups** | Governance & Architecture | RTO/RPO targets, AWS Backup, immutable Vault Lock | Backups deleted by compromised root credentials in ransomware attacks |
| **20** | **Well-Architected** | Governance & Architecture | The 6 Pillars: Ops, Security, Reliability, Perf, Cost, Sus | Optimizing purely for cost at the expense of business reliability |

---

## Detailed Architectural Breakdown

### 1. IAM (Identity and Access Management)
- **Mental Model**: The universal control plane gatekeeper of AWS. Nothing can call an AWS API without cryptographic SigV4 signing. IAM evaluates permissions with an implicit 'deny by default' logic; an explicit Deny always overrides everything.
- **Production Standard**: Never use permanent access keys on EC2, ECS, or Lambda. Attach IAM Roles that issue short-lived temporary STS tokens. Mandate IMDSv2 (`HttpTokens: required`) to neutralize SSRF credential theft.

---

### 2. EC2 (Elastic Compute Cloud)
- **Mental Model**: Virtualized compute running on the hardware-offloaded AWS Nitro System. EBS volumes provide network-attached block storage with independent encryption keys.
- **Production Rule**: Never store stateful application data on ephemeral instance stores. Manage instances via AWS Systems Manager (SSM) Session Manager and close inbound port 22 completely.

---

### 3. S3 (Simple Storage Service)
- **Mental Model**: Globally distributed key-value object store delivering 11 9s of durability across 3+ Availability Zones with strong read-after-write consistency.
- **Security Rule**: Keep 'Block Public Access' enabled at both account and bucket levels. Route public assets strictly through CloudFront with Origin Access Control (OAC).

---

### 4. VPC (Virtual Private Cloud)
- **Mental Model**: Software-defined isolated network divided into Public, Private, and Database subnets across multiple AZs.
- **Cost & Security Rule**: Deploy databases in isolated subnets with no route to the Internet. Use Gateway VPC Endpoints for S3 and DynamoDB to keep traffic on the private AWS backbone and bypass NAT Gateway bandwidth fees.

---

### 5. Security Groups
- **Mental Model**: Stateful virtual firewalls operating at the hypervisor level. Return traffic is automatically allowed.
- **Production Pattern**: Chain security group IDs (`security_groups = [aws_security_group.app.id]`) between ALB, App, and Database tiers rather than hardcoding brittle CIDR IP blocks.

---

### 6. Load Balancers (ALB vs NLB)
- **Mental Model**: 
  - **ALB (Layer 7)**: HTTP/HTTPS routing, path/host multiplexing, and TLS offloading.
  - **NLB (Layer 4)**: TCP/UDP, ultra-low sub-millisecond latency, static Elastic IPs.
- **Health Check Rule**: Configure health checks to evaluate lightweight `/health` endpoints. Never run database queries inside a 15-second health probe.

---

### 7. Auto Scaling
- **Mental Model**: Maintains optimal application capacity across multiple Availability Zones, scaling out on demand and scaling in during lulls.
- **Target Tracking**: Scale on `ALBRequestCountPerTarget` for I/O-bound web APIs rather than CPU. Configure a 300-second scale-in cooldown to prevent rapid fleet thrashing.

---

### 8. RDS (Relational Database Service)
- **Mental Model**: Managed PostgreSQL/MySQL/MariaDB with synchronous Multi-AZ standby replication and automated snapshots.
- **Protection Rule**: Always set `deletion_protection = true` and `multi_az = true` on production databases. Deploy AWS RDS Proxy between serverless Lambda functions and RDS to prevent connection exhaustion.

---

### 9. DynamoDB
- **Mental Model**: Serverless NoSQL key-value store delivering single-digit millisecond latency at any scale.
- **Access Pattern**: Design partition keys with high cardinality (e.g. `USER#<uuid>`) to prevent hot partitions. Always use `Query`, never `Scan` in production applications.

---

### 10. Lambda
- **Mental Model**: Serverless event-driven compute billed in 1ms increments. Functions run in Firecracker microVMs.
- **Best Practice**: Use `arm64` (AWS Graviton) for up to 34% better price-performance. Initialize database pools outside the event handler to reuse warm connections.

---

### 11. ECS and EKS
- **Mental Model**: ECS is AWS's streamlined, deeply integrated container orchestrator; EKS is managed Kubernetes.
- **Serverless Compute**: Use **AWS Fargate** to run containers without managing, patching, or scaling underlying EC2 worker instances.

---

### 12. Route 53
- **Mental Model**: Anycast DNS web service delivering 100% SLA availability.
- **Alias Records**: Use Alias records rather than CNAMEs to point root apex domains directly to CloudFront, ALBs, and S3 buckets for free.

---

### 13. CloudFront
- **Mental Model**: Global Content Delivery Network caching static assets and terminating TLS at 600+ edge locations.
- **Cache Invalidation**: Use content-hashed filenames (`bundle.a8f9b.js`) with immutable caching headers (`max-age=31536000`) instead of expensive wildcard invalidations.

---

### 14. CloudWatch
- **Mental Model**: Metrics, logs, alarms, and tracing.
- **Retention Rule**: Enforce log retention policies (`retention_in_days = 30`) across all log groups to prevent permanent storage cost accumulation.

---

### 15. SQS and SNS
- **Mental Model**: SNS provides Pub/Sub fan-out (1 event to many queues); SQS provides point-to-point buffer queuing.
- **Dead Letter Queues**: Always attach a DLQ with `maxReceiveCount: 3` to isolate malformed messages, and ensure SQS visibility timeout exceeds worker processing time.

---

### 16. Secrets Manager
- **Mental Model**: KMS-encrypted secret vault with automated credential rotation for RDS and APIs.
- **Caching**: Always cache retrieved secrets in application memory for 5-15 minutes to avoid throttling and excessive API request costs.

---

### 17. Cost Management (FinOps)
- **Mental Model**: Cost allocation tags, Cost Explorer, and AWS Budgets with forecasted alerts.
- **Commitments**: Purchase Compute Savings Plans to save up to 72% across EC2, Fargate, and Lambda. Terminate unattached EBS volumes and idle NAT Gateways.

---

### 18. Regions and AZs
- **Mental Model**: Availability Zones are physically isolated data centers with redundant power and networking. Regions group 3+ AZs.
- **High Availability**: Always distribute production workloads across at least two AZs within a region to survive data center failures.

---

### 19. Backups
- **Mental Model**: Disaster recovery defined by RTO (Recovery Time Objective) and RPO (Recovery Point Objective).
- **Ransomware Defense**: Enable **AWS Backup Vault Lock** to enforce immutable WORM protection, preventing even root users from deleting backups during account compromises.

---

### 20. Well-Architected Framework
- **The 6 Pillars**:
  1. **Operational Excellence**: Infrastructure as Code, structured observability.
  2. **Security**: Zero Trust IAM, IMDSv2, KMS encryption at rest.
  3. **Reliability**: Multi-AZ, automated health check self-healing.
  4. **Performance Efficiency**: Serverless compute, global CDN edge caching.
  5. **Cost Optimization**: Right-sizing, Compute Savings Plans, S3 lifecycle rules.
  6. **Sustainability**: Graviton ARM64 architecture, resource efficiency.

