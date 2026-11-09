# 24: CLOUD & DEVOPS ENGINEERING CAREER ROADMAPS

> **The Definitive Engineering Curriculum: From Zero to Senior Job-Ready**  
> *Complete step-by-step progressions, capstone deliverables, CLI cheatsheets, and interview traps for Cloud Engineers and DevOps/SRE Engineers.*

---

## Part 1: Cloud Engineer Pathway

**Target Role**: Cloud Engineer / AWS Solutions Architect / Cloud Systems Engineer  
**Compensation Benchmark**: $115,000 – $175,000 USD  
**Timeline**: 6 – 9 Months (15-20 hours/week)

```
[1. Linux & Networking] ──▶ [2. Python Basics] ──▶ [3. AWS Fundamentals] ──▶ [4. IAM & Security]
                                                                                   │
                                                                                   ▼
[8. Terraform] ◀── [7. Lambda & API GW] ◀── [6. EC2 & S3] ◀── [5. VPC & Subnets]
       │
       ▼
[9. Deploy Cloud Project] ──▶ [10. Portfolio] ──▶ [11. Job Ready]
```

### Milestone Breakdown

#### Step 01: Linux & Networking
- **Focus**: POSIX hierarchy, systemd services, SSH keys, TCP/IP, CIDR subnetting, DNS records (A, CNAME, ALIAS), TLS termination.
- **Capstone Deliverable**: Hardened dual-homed Linux server with UFW firewall rules and an Nginx reverse-proxy terminating Let's Encrypt TLS.
- **Interview Question**: *"What happens under the hood when a browser requests https://example.com?"* (DNS resolution, TCP 3-way handshake, TLS 1.3 cryptographic key exchange, HTTP GET streaming).

#### Step 02: Python Basics
- **Focus**: Clean automation scripting, JSON/YAML parsing, `requests`, and AWS SDK (`boto3`) client paginators.
- **Capstone Deliverable**: Automated Boto3 CLI auditing an AWS account for unattached EBS volumes, unassociated Elastic IPs, and idle snapshots.

#### Step 03: AWS Fundamentals
- **Focus**: Global infrastructure topology (Regions, Availability Zones, Edge Locations), Shared Responsibility Model, AWS Organizations, Multi-Account OUs.
- **Capstone Deliverable**: Multi-account AWS Organization structure with consolidated billing and central CloudTrail logging to an isolated Log Archive account.

#### Step 04: IAM & Security
- **Focus**: Least privilege authorization, Identity vs Resource policies, STS temporary tokens, IMDSv2 hardening, KMS envelope encryption.
- **Capstone Deliverable**: EC2 Instance Profile accessing KMS-encrypted S3 data with zero static access keys, protected by mandatory IMDSv2 token enforcement.

#### Step 05: VPC & Subnets
- **Focus**: IPv4 CIDR allocation, Public vs Private vs Database subnets across 2+ AZs, NAT Gateways, Gateway VPC Endpoints for S3.
- **Capstone Deliverable**: Air-gapped 3-tier VPC with chained Security Groups (ALB -> App -> Database) with zero direct internet access to databases.

#### Step 06: EC2 & S3
- **Focus**: Nitro instance types, `gp3` IOPS/throughput tuning, S3 11-nines durability, Block Public Access, S3 Lifecycle Policies, Pre-signed URLs.
- **Capstone Deliverable**: Private S3 bucket with automated Glacier archiving and a Python Lambda generating 5-minute pre-signed upload URLs.

#### Step 07: Lambda & API Gateway
- **Focus**: Serverless event-driven architecture, Firecracker microVM execution lifecycle, Graviton ARM64 runtime, Reserved Concurrency limits.
- **Capstone Deliverable**: Webhook processing microservice using API Gateway HTTP API and a Lambda function writing to DynamoDB with 20 reserved concurrent executions.

#### Step 08: Terraform
- **Focus**: Declarative HCL, S3 remote state with KMS encryption, DynamoDB mutex locking, reusable child modules, lifecycle rules (`prevent_destroy`).
- **Capstone Deliverable**: Complete modular Terraform codebase deploying a VPC, ALB, Auto Scaling Group, and Multi-AZ RDS instance.

#### Step 09: Deploy Cloud Project
- **Focus**: Route 53 Anycast routing -> CloudFront CDN with OAC -> ALB -> Multi-AZ Auto Scaling Group -> Multi-AZ Aurora PostgreSQL.
- **Capstone Deliverable**: 100% Terraform-managed multi-tier cloud platform subjected to simulated traffic spikes and multi-AZ node termination.

#### Step 10: Portfolio
- **Focus**: Professional GitHub showcase, C4 architecture diagrams, Infracost budget analysis, Loom walkthrough, and disaster recovery runbooks.
- **Capstone Deliverable**: Public GitHub repo with reproducible Terraform code and an architectural case study detailing trade-offs and failure modes.

#### Step 11: Job Ready
- **Focus**: Live whiteboard systems design (scaling to 1 million daily active users), behavioral STAR interviews, and AWS Solutions Architect Associate alignment.

---

## Part 2: DevOps Engineer Pathway

**Target Role**: DevOps Engineer / Site Reliability Engineer (SRE) / Platform Engineer  
**Compensation Benchmark**: $120,000 – $185,000 USD  
**Timeline**: 7 – 10 Months (15-20 hours/week)

```
[1. Linux & Bash] ──▶ [2. Git & GitHub] ──▶ [3. Python Scripting] ──▶ [4. Docker]
                                                                            │
                                                                            ▼
[8. AWS Deployment] ◀── [7. Terraform] ◀── [6. CI/CD Pipelines] ◀── [5. Kubernetes]
        │
        ▼
[9. Monitoring & Logging] ──▶ [10. Portfolio] ──▶ [11. Job Ready]
```

### Milestone Breakdown

#### Step 01: Linux & Bash
- **Focus**: Bash strict mode (`set -euo pipefail`), process lifecycle, signals (`SIGTERM`, `SIGKILL`), zombie process reaping, text parsing (`awk`, `sed`, `grep`).
- **Capstone Deliverable**: Autonomous bash watchdog daemon parsing Nginx logs for HTTP 5xx error spikes and alerting on memory/disk saturation.

#### Step 02: Git & GitHub
- **Focus**: Trunk-based development, commit object graphs, interactive rebasing, GPG commit signing, Conventional Commits (`feat:`, `fix:`).
- **Capstone Deliverable**: Repository governance setup with branch protection rules, required CI status checks, and automated Semantic Versioning.

#### Step 03: Python Scripting
- **Focus**: Advanced automation, JSON/YAML parsing, `subprocess.run(check=True)`, Pydantic validation, and REST API error handling.
- **Capstone Deliverable**: CLI tool validating Kubernetes manifests for security compliance (blocking root execution and mutable `:latest` tags).

#### Step 04: Docker
- **Focus**: Linux namespaces, cgroups, BuildKit caching, multi-stage builds, non-root execution (`USER 10001`), Distroless images.
- **Capstone Deliverable**: Multi-stage Dockerfile shrinking a Node.js full-stack app from 1.4GB to 85MB on Distroless with 0 Trivy vulnerabilities.

#### Step 05: Kubernetes
- **Focus**: Pods, Deployments, Services, Ingress, ConfigMaps, Secrets, HPA autoscaling, zero-downtime rolling updates (`maxUnavailable: 0`, `preStop: sleep 10`).
- **Capstone Deliverable**: Microservices cluster running on Kubernetes with automated CPU autoscaling and graceful connection draining.

#### Step 06: CI/CD Pipelines
- **Focus**: GitHub Actions DAG workflows (`needs`), lockfile dependency caching, sharded test matrices, OIDC cloud federation, Cosign image signing.
- **Capstone Deliverable**: Complete GitHub Actions CI/CD pipeline building, testing, signing, and committing new container digests to an ArgoCD GitOps repository.

#### Step 07: Terraform
- **Focus**: Modular infrastructure as code, remote backends with DynamoDB locking, declarative `import {}` blocks, Checkov security linting.
- **Capstone Deliverable**: Modular Terraform scripts provisioning an Amazon EKS cluster with IAM Roles for Service Accounts (IRSA) and private subnets.

#### Step 08: AWS Deployment
- **Focus**: Enterprise container ingress: Application Load Balancers, Route 53 DNS, AWS WAF rate-limiting, private Amazon ECR registries.
- **Capstone Deliverable**: Hardened container ingress fronted by AWS WAF blocking SQL injection and rate-limiting IP floods to 100 req/5m.

#### Step 09: Monitoring & Logging
- **Focus**: Prometheus metrics, PromQL quantiles (`histogram_quantile`), Grafana RED/USE dashboards, Loki structured logs, Alertmanager multi-burn-rate SLO alerting.
- **Capstone Deliverable**: Full-stack observability cockpit monitoring microservice latencies (P50/P90/P99) with automated Slack/PagerDuty alerts.

#### Step 10: Portfolio
- **Focus**: Enterprise GitOps platform repository (Terraform + ArgoCD + Helm + Prometheus), blameless postmortem case study, and recorded terminal demos.
- **Capstone Deliverable**: Complete public GitOps repository demonstrating autonomous deployment convergence and disaster recovery runbooks.

#### Step 11: Job Ready
- **Focus**: Live terminal troubleshooting challenges (broken DNS, crashed etcd, OOM-killed pods), SRE error budget negotiation, and senior behavioral loops.

