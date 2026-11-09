export interface RoadmapStep {
  id: string;
  stepNumber: number;
  title: string;
  subtitle: string;
  phase: "Foundations" | "Core Engineering" | "Advanced Systems" | "Portfolio & Career";
  durationWeeks: string;
  overview: string;
  coreSkills: string[];
  handsOnProject: {
    title: string;
    objective: string;
    deliverables: string[];
    architectureTip: string;
  };
  commandsCheatsheet: {
    cmd: string;
    desc: string;
  }[];
  interviewQuestions: {
    question: string;
    answer: string;
    trap: string;
  }[];
  relatedEngineId?: string; // Links to our 20-concept engines!
  relatedEngineName?: string;
}

export interface CareerTrack {
  id: "cloud-engineer" | "devops-engineer";
  name: string;
  badge: string;
  description: string;
  salaryRange: string;
  timeline: string;
  targetRole: string;
  steps: RoadmapStep[];
}

export const CAREER_ROADMAPS: CareerTrack[] = [
  {
    id: "cloud-engineer",
    name: "Cloud Engineer",
    badge: "AWS Infrastructure & Systems",
    description: "The complete journey from foundational Linux and networking to enterprise AWS architectures, Terraform automation, multi-region disaster recovery, and hiring manager evaluation.",
    salaryRange: "$115,000 - $175,000",
    timeline: "6 - 9 Months (15-20 hrs/week)",
    targetRole: "Cloud Engineer / AWS Solutions Architect / Cloud Infrastructure Engineer",
    steps: [
      {
        id: "ce-linux-networking",
        stepNumber: 1,
        title: "Linux & Networking",
        subtitle: "The Cloud Compute & Packet Transport Bedrock",
        phase: "Foundations",
        durationWeeks: "Weeks 1-3",
        overview: "Before you touch AWS, you must understand the Linux kernel, systemd process trees, POSIX permissions, and L4/L7 networking protocols (TCP/IP, Subnets, DNS, TLS). Cloud is just someone else's Linux servers.",
        coreSkills: [
          "Linux Filesystem Hierarchy, Permissions (chmod/chown), Systemd daemons",
          "SSH Keypairs, public-key cryptography, port tunneling",
          "CIDR subnetting, TCP 3-way handshake, DNS records (A, CNAME, ALIAS)",
          "Network troubleshooting: curl, dig, netstat, ss, traceroute, tcpdump"
        ],
        handsOnProject: {
          title: "Hardened Linux Dual-Homed Web Gateway",
          objective: "Configure a minimal Debian/Ubuntu server with isolated users, SSH key-only access, UFW packet filters, and an Nginx reverse proxy terminating TLS with Let's Encrypt.",
          deliverables: [
            "Disabled root login and password authentication in `/etc/ssh/sshd_config`",
            "Configured systemd service supervision with auto-restart on failure",
            "Wrote a bash script testing network latency and MTU packet drops via `ping` and `traceroute`"
          ],
          architectureTip: "If you cannot explain what happens under the hood between a DNS query and a TLS handshake, you will fail senior cloud technical screens."
        },
        commandsCheatsheet: [
          { cmd: "ip addr show && ip route show", desc: "Inspect network interface IP addresses and kernel routing tables" },
          { cmd: "dig +trace +nodnssec api.domain.com", desc: "Trace full hierarchical DNS lookup from root servers to authoritative NS" },
          { cmd: "ss -tulpn | grep LISTEN", desc: "List all listening TCP/UDP sockets with process IDs and port bindings" },
          { cmd: "journalctl -u nginx.service -f -n 100", desc: "Tail the last 100 systemd logs for the Nginx daemon in real time" }
        ],
        interviewQuestions: [
          {
            question: "What happens when you type https://google.com into a browser and press Enter?",
            answer: "Browser DNS cache -> OS resolver -> Local router -> ISP recursive DNS -> Root NS -> TLD NS (.com) -> Authoritative NS -> IP returned -> TCP 3-way handshake (SYN, SYN-ACK, ACK) -> TLS 1.3 key exchange (ClientHello, Certificate, Finished) -> HTTP GET request -> Response streaming.",
            trap: "Jumping directly to the web server without mentioning ARP resolution, DNS hierarchy, or TCP handshakes."
          }
        ],
        relatedEngineId: "tool-linux",
        relatedEngineName: "Linux 20-Concept Mastery"
      },
      {
        id: "ce-python-basics",
        stepNumber: 2,
        title: "Python Basics",
        subtitle: "Cloud Automation & SDK Scripting",
        phase: "Foundations",
        durationWeeks: "Weeks 4-5",
        overview: "Cloud Engineers do not build monolithic Python web apps; they write clean, idempotent automation scripts, Lambda handlers, and API consumers using Boto3 to programmatically manage cloud resources.",
        coreSkills: [
          "Core data structures: Lists, Dictionaries, Sets, Tuples, List Comprehensions",
          "File I/O, JSON serialization, Environment variable handling via `os.environ`",
          "HTTP API consumption with `requests` and `urllib3`",
          "AWS SDK (`boto3`) fundamentals: Clients vs Resources, pagination, error handling"
        ],
        handsOnProject: {
          title: "Automated Zombie Resource Purge CLI",
          objective: "Build a Python CLI using Boto3 that scans an AWS account across all regions for unattached EBS volumes, unassociated Elastic IPs, and idle RDS snapshots, calculating total monthly wasted spend.",
          deliverables: [
            "Script accepting `--dry-run` and `--force-delete` flags",
            "Graceful handling of AWS API throttling via exponential backoff",
            "Exporting formatted audit reports in JSON and Markdown table formats"
          ],
          architectureTip: "Always use `boto3.client('ec2')` over `boto3.resource`: clients provide 1:1 mapping with AWS APIs and support paginators."
        },
        commandsCheatsheet: [
          { cmd: "python -m venv .venv && source .venv/bin/activate", desc: "Create and activate an isolated Python virtual environment" },
          { cmd: "pip install boto3 botocore mypy black", desc: "Install AWS SDK and static type checking/formatting tools" },
          { cmd: "python -c 'import boto3; print(boto3.client(\"sts\").get_caller_identity())'", desc: "One-liner testing AWS credentials and IAM session validity" }
        ],
        interviewQuestions: [
          {
            question: "How do you handle API pagination and rate limits when querying thousands of AWS resources with Boto3?",
            answer: "Use Boto3 Paginators (`client.get_paginator('describe_instances')`) instead of manual NextToken loops, and configure `botocore.config.Config(retries={'max_attempts': 10, 'mode': 'adaptive'})` for automatic exponential backoff.",
            trap: "Writing naive `while 'NextToken' in response:` loops that crash when rate limits are exceeded."
          }
        ],
        relatedEngineId: "tool-scripting-mastery",
        relatedEngineName: "Scripting 20-Concept Mastery"
      },
      {
        id: "ce-aws-fundamentals",
        stepNumber: 3,
        title: "AWS Fundamentals",
        subtitle: "Global Infrastructure & Core Service Mental Models",
        phase: "Core Engineering",
        durationWeeks: "Weeks 6-7",
        overview: "Master the global physical topology of AWS: Regions, Availability Zones, Edge Locations, and the shared responsibility model. Understand the fundamental billing and management building blocks.",
        coreSkills: [
          "AWS Global Infrastructure: Regions, AZs, Local Zones, Edge Locations",
          "AWS Shared Responsibility Model: Customer vs AWS boundaries",
          "AWS Organizations, Management Accounts, and Consolidated Billing",
          "AWS CLI v2 configuration, Named Profiles, and AWS CloudShell"
        ],
        handsOnProject: {
          title: "Multi-Account AWS Organization Hierarchy",
          objective: "Design and implement a multi-account structure using AWS Organizations with dedicated Root, Core (Security, Log Archive), and Workload (Dev, Prod) Organizational Units (OUs).",
          deliverables: [
            "Centralized AWS CloudTrail trail logging to an encrypted S3 bucket in the Log Archive account",
            "Service Control Policy (SCP) forbidding root user logins and blocking unauthorized regions",
            "Configured AWS CLI named profiles with role-chaining via `source_profile`"
          ],
          architectureTip: "Never deploy workloads to the AWS Organization Management (payer) account: keep it pristine for billing and governance only."
        },
        commandsCheatsheet: [
          { cmd: "aws configure --profile prod-admin", desc: "Configure named AWS CLI credentials and region defaults" },
          { cmd: "aws sts get-caller-identity", desc: "Verify current assumed account ID, role ARN, and session ID" },
          { cmd: "aws organizations list-roots", desc: "Query root identifier for the active AWS Organization" }
        ],
        interviewQuestions: [
          {
            question: "What is the difference between an Availability Zone (AZ) and an AWS Region?",
            answer: "A Region is a distinct geographic area (e.g. us-east-1 in N. Virginia). Each Region consists of at least three physically isolated, independent Availability Zones connected via ultra-low-latency private fiber. AZs have independent power, cooling, and physical security to isolate blast radiuses.",
            trap: "Thinking an AZ is just a single data center building: an AZ often consists of multiple physical data center facilities."
          }
        ],
        relatedEngineId: "tool-cloud-mastery",
        relatedEngineName: "Cloud 20-Concept Mastery"
      },
      {
        id: "ce-iam-security",
        stepNumber: 4,
        title: "IAM & Security",
        subtitle: "Zero-Trust Authorization & KMS Envelope Encryption",
        phase: "Core Engineering",
        durationWeeks: "Weeks 8-9",
        overview: "IAM is the gatekeeper of AWS. Master identity-based policies, resource-based policies, permission boundaries, IAM Roles with temporary STS credentials, and AWS KMS cryptographic envelope encryption.",
        coreSkills: [
          "IAM Policies: Statements, Actions, Resources, Conditions, and Explicit Deny logic",
          "IAM Roles vs IAM Users: Assuming roles via STS (`AssumeRole`)",
          "IMDSv2 (Instance Metadata Service v2) hardening against SSRF",
          "AWS KMS (Key Management Service): Customer Managed Keys, Key Policies, Envelope Encryption"
        ],
        handsOnProject: {
          title: "Zero-Static-Credential Microservice Role",
          objective: "Deploy an EC2 instance that assumes an IAM Instance Profile to read KMS-encrypted secrets from S3 with zero hardcoded API keys, protected by strict IMDSv2 token enforcement.",
          deliverables: [
            "JSON IAM Policy allowing `s3:GetObject` ONLY when `aws:SecureTransport: true`",
            "KMS Key Policy granting decrypt privileges strictly to the EC2 role ARN",
            "IMDSv2 configuration with `http_tokens: required` and `http_put_response_hop_limit: 1`"
          ],
          architectureTip: "If you have long-lived AWS Access Keys (`AKIA...`) on a developer laptop or EC2 instance, you are failing security baseline."
        },
        commandsCheatsheet: [
          { cmd: "aws iam get-account-authorization-details", desc: "Dump complete IAM snapshot including users, groups, roles, and policies" },
          { cmd: "TOKEN=`curl -X PUT \"http://169.254.169.254/latest/api/token\" -H \"X-aws-ec2-metadata-token-ttl-seconds: 21600\"` && curl -H \"X-aws-ec2-metadata-token: $TOKEN\" http://169.254.169.254/latest/meta-data/", desc: "Securely query EC2 IMDSv2 metadata using temporary session token" },
          { cmd: "aws kms encrypt --key-id <key_id> --plaintext fileb://secret.txt --output text --query CiphertextBlob", desc: "Encrypt sensitive data directly using an AWS KMS Customer Managed Key" }
        ],
        interviewQuestions: [
          {
            question: "How does IAM evaluate permissions when a user has an explicit Allow and an explicit Deny on the same action?",
            answer: "An explicit Deny ALWAYS wins, overriding any explicit Allow policies regardless of whether they are Identity policies, Resource policies, or SCPs. If no Deny exists, at least one explicit Allow must match; otherwise, the request is denied by default.",
            trap: "Thinking that resource policies take priority over identity policies: explicit Deny always wins."
          }
        ],
        relatedEngineId: "tool-cloud-mastery",
        relatedEngineName: "Cloud 20-Concept Mastery"
      },
      {
        id: "ce-vpc-subnet",
        stepNumber: 5,
        title: "VPC & Subnets",
        subtitle: "Production Virtual Data Center Topologies",
        phase: "Core Engineering",
        durationWeeks: "Weeks 10-12",
        overview: "Design production-grade enterprise VPCs. Understand public, private, and database subnets across multiple AZs, NAT Gateways, Internet Gateways, Route Tables, Security Groups, and VPC Endpoints.",
        coreSkills: [
          "IPv4 CIDR block allocation (`10.0.0.0/16`, `/24` subnets, host capacity math)",
          "Public Subnets (IGW) vs Private Subnets (NAT Gateway) vs Database Subnets (Air-Gapped)",
          "Security Groups (Stateful, ENI level) vs NACLs (Stateless, Subnet level)",
          "VPC Endpoints (Gateway for S3/DynamoDB, Interface PrivateLink for other AWS APIs)"
        ],
        handsOnProject: {
          title: "Multi-Tier Air-Gapped Enterprise VPC",
          objective: "Architect a 3-tier VPC spanning 2 AZs with public subnets (ALBs & NAT Gateways), private application subnets, and isolated database subnets with zero internet ingress/egress.",
          deliverables: [
            "Route tables routing private subnets to redundant NAT Gateways per AZ",
            "Gateway VPC Endpoint for S3 saving on NAT Gateway bandwidth charges",
            "Chained Security Group rules allowing DB traffic strictly from the application security group"
          ],
          architectureTip: "Never place a database in a subnet that has a default route (`0.0.0.0/0`) pointing to an Internet Gateway."
        },
        commandsCheatsheet: [
          { cmd: "aws ec2 describe-vpcs --filters 'Name=is-default,Values=false'", desc: "List all custom non-default VPCs in the region" },
          { cmd: "aws ec2 describe-route-tables --filters 'Name=vpc-id,Values=<vpc_id>'", desc: "Inspect route tables, gateway attachments, and local subnet associations" },
          { cmd: "aws ec2 describe-flow-logs", desc: "Verify active VPC Flow Logs capturing IP traffic across subnets" }
        ],
        interviewQuestions: [
          {
            question: "Why does an S3 Gateway VPC Endpoint save significant money in production?",
            answer: "Without an S3 VPC Endpoint, EC2 instances in private subnets must stream S3 data through a NAT Gateway, incurring both NAT Gateway hourly charges and $0.045 per GB data processing fees. S3 Gateway Endpoints route traffic across AWS's internal network completely free of charge.",
            trap: "Suggesting an Interface Endpoint (PrivateLink) for S3 when a free Gateway Endpoint is all that is needed."
          }
        ],
        relatedEngineId: "tool-networking-mastery",
        relatedEngineName: "Networking 20-Concept Mastery"
      },
      {
        id: "ce-ec2-s3",
        stepNumber: 6,
        title: "EC2 & S3",
        subtitle: "Compute Workhorses & 11-Nines Object Storage",
        phase: "Core Engineering",
        durationWeeks: "Weeks 13-14",
        overview: "Master compute instances and object storage. Deep-dive into Nitro instance families, EBS volume types (`gp3` vs `io2`), S3 storage classes, bucket policies, and cross-region replication.",
        coreSkills: [
          "EC2 Launch Templates, User-Data Cloud-Init scripts, and Nitro architectures",
          "EBS Block Storage: `gp3` (IOPS & Throughput tuning) vs `io2 Block Express`",
          "S3 Bucket Policies, Block Public Access, Pre-signed URLs for secure downloads",
          "S3 Lifecycle Rules: Transitioning to Infrequent Access and Glacier Deep Archive"
        ],
        handsOnProject: {
          title: "Auto-Tiered Secure Media Repository",
          objective: "Create a private S3 bucket with KMS encryption, automated lifecycle policies that transition files to Glacier after 90 days, and a Python Lambda function generating 5-minute pre-signed upload URLs.",
          deliverables: [
            "Bucket Policy mandating `aws:SecureTransport: true` and rejecting unencrypted uploads",
            "Lifecycle configuration aborting incomplete multipart uploads after 7 days",
            "CLI test validating that pre-signed URLs expire exactly after 300 seconds"
          ],
          architectureTip: "Always use `gp3` over legacy `gp2` for EBS: `gp3` is 20% cheaper and provides 3,000 IOPS and 125 MB/s baseline without needing to scale disk size."
        },
        commandsCheatsheet: [
          { cmd: "aws ec2 describe-images --owners amazon --filters 'Name=name,Values=al2023-ami-2023*' --query 'sort_by(Images, &CreationDate)[-1].ImageId'", desc: "Query latest official Amazon Linux 2023 AMI ID" },
          { cmd: "aws s3api put-public-access-block --bucket <bucket> --public-access-block-configuration 'BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true'", desc: "Enforce complete 4-point Block Public Access on an S3 bucket" },
          { cmd: "aws s3 presign s3://<bucket>/<file> --expires-in 300", desc: "Generate a temporary 5-minute pre-signed download URL for a private S3 object" }
        ],
        interviewQuestions: [
          {
            question: "What is the difference between EBS and S3, and when would you choose one over the other?",
            answer: "EBS is network-attached block storage attached to a single EC2 instance in a specific AZ, formatted with a filesystem (ext4, xfs) for high IOPS, low latency read/writes (databases, OS roots). S3 is a globally accessible, highly durable (11 9s) object store accessed over HTTP APIs, ideal for static assets, backups, and data lakes at massive scale and lower cost.",
            trap: "Thinking you can attach an EBS volume directly across multiple EC2 instances in different Availability Zones."
          }
        ],
        relatedEngineId: "tool-cloud-mastery",
        relatedEngineName: "Cloud 20-Concept Mastery"
      },
      {
        id: "ce-lambda-apigw",
        stepNumber: 7,
        title: "Lambda & API Gateway",
        subtitle: "Serverless Event-Driven Microservices",
        phase: "Advanced Systems",
        durationWeeks: "Weeks 15-16",
        overview: "Transition to serverless. Build scalable REST and HTTP APIs using Amazon API Gateway backed by AWS Lambda functions running on Graviton ARM64 architecture.",
        coreSkills: [
          "Lambda Execution Lifecycle: Init phase, warm vs cold starts, execution contexts",
          "Memory-to-CPU proportionality and Graviton2 (`arm64`) price-performance",
          "API Gateway (HTTP API vs REST API), Cognito authorizers, and CORS configuration",
          "Concurrency limits: Unreserved, Reserved Concurrency, and Provisioned Concurrency"
        ],
        handsOnProject: {
          title: "Serverless Payment Webhook Processor",
          objective: "Build a serverless microservice using API Gateway HTTP API and a Node.js Lambda function that validates incoming Stripe webhooks, stores transactions in DynamoDB, and sends confirmation emails via SES.",
          deliverables: [
            "API Gateway with request validation and rate limiting (100 req/sec throttle)",
            "Lambda configured with Reserved Concurrency = 20 to protect downstream databases",
            "Structured JSON logging capturing latency and execution metrics"
          ],
          architectureTip: "Use API Gateway HTTP APIs instead of REST APIs when you don't need WAF or request transformation: HTTP APIs are 70% cheaper and lower latency."
        },
        commandsCheatsheet: [
          { cmd: "aws lambda update-function-configuration --function-name <name> --memory-size 512", desc: "Scale Lambda allocated memory (which proportionally scales CPU allocation)" },
          { cmd: "aws apigatewayv2 get-apis", desc: "List all deployed API Gateway v2 HTTP APIs in the region" },
          { cmd: "aws logs tail /aws/lambda/<name> --follow", desc: "Live-stream tail of execution logs emitted by a Lambda function" }
        ],
        interviewQuestions: [
          {
            question: "How do you minimize cold starts in AWS Lambda functions?",
            answer: "1. Choose lightweight runtimes (Node.js/Go/Python over Java/C#). 2. Minimize deployment package size and strip unused dependencies. 3. Initialize SDK clients and database connection pools outside the handler function. 4. Run on Graviton ARM64. 5. For latency-critical APIs, configure Provisioned Concurrency.",
            trap: "Setting up a scheduled CloudWatch cron job pinging the function every 5 minutes: this only keeps a single container warm and fails during concurrent traffic spikes."
          }
        ],
        relatedEngineId: "tool-cloud-mastery",
        relatedEngineName: "Cloud 20-Concept Mastery"
      },
      {
        id: "ce-terraform",
        stepNumber: 8,
        title: "Terraform",
        subtitle: "Declarative Infrastructure as Code (IaC) Mastery",
        phase: "Advanced Systems",
        durationWeeks: "Weeks 17-19",
        overview: "Stop using the AWS Console. Everything you deploy must be written in declarative, version-controlled HCL. Master remote state, DynamoDB locking, modules, and lifecycle rules.",
        coreSkills: [
          "HCL syntax, providers, resources, inputs, outputs, and local variables",
          "Remote State backend in S3 with server-side encryption and DynamoDB locking",
          "Terraform execution lifecycle: `init`, `plan -out=tfplan`, `apply tfplan`",
          "Writing reusable child modules with version pinning and input validation"
        ],
        handsOnProject: {
          title: "Complete Modular Multi-Tier Cloud Architecture",
          objective: "Write reusable Terraform modules that provision a complete production environment: VPC, Subnets, ALB, Auto Scaling Group with EC2 instances, and Multi-AZ RDS PostgreSQL with zero manual console clicks.",
          deliverables: [
            "Root module consuming child modules with strict Semantic Versioning",
            "Remote S3 backend with DynamoDB state locking",
            "Clean `terraform plan` showing 0 errors with pre-commit Checkov security scanning"
          ],
          architectureTip: "Never run `terraform apply -auto-approve` in production: compile an immutable plan (`-out=tfplan`) and review the diff before applying."
        },
        commandsCheatsheet: [
          { cmd: "terraform init -backend-config=\"bucket=<bucket>\"", desc: "Initialize backend with dynamic S3 state storage settings" },
          { cmd: "terraform plan -out=tfplan && terraform show tfplan", desc: "Compile deterministic execution plan binary and view human-readable diff" },
          { cmd: "terraform state list", desc: "List all managed cloud resources currently tracked within the state file" }
        ],
        interviewQuestions: [
          {
            question: "What happens if two engineers run `terraform apply` on the same state file at the same time, and how do you prevent it?",
            answer: "Without state locking, race conditions occur: one engineer's apply overwrites the other's state changes, leading to state corruption and untracked cloud resources. We prevent this by configuring a remote backend (e.g. S3) backed by an Amazon DynamoDB table with a primary key `LockID`, which enforces a mutual exclusion (mutex) lock.",
            trap: "Thinking that version control (Git) locks the state file: Git tracks code, not live cloud state."
          }
        ],
        relatedEngineId: "tool-iac-mastery",
        relatedEngineName: "IaC 20-Concept Mastery"
      },
      {
        id: "ce-deploy-project",
        stepNumber: 9,
        title: "Deploy Cloud Project",
        subtitle: "Enterprise Production Capstone Deployment",
        phase: "Portfolio & Career",
        durationWeeks: "Weeks 20-22",
        overview: "Combine every single skill learned into one cohesive enterprise capstone project: a high-availability, fault-tolerant web platform deployed with Terraform, secured with IAM, monitored with CloudWatch, and fronted by CloudFront.",
        coreSkills: [
          "Application Load Balancers with ACM SSL/TLS offloading",
          "Multi-AZ Auto Scaling Groups with Target Tracking scaling policies",
          "Amazon CloudFront CDN with Origin Access Control (OAC)",
          "Amazon Route 53 Alias routing with health-check failover"
        ],
        handsOnProject: {
          title: "The Fault-Tolerant Enterprise E-Commerce Cloud Platform",
          objective: "Build and deploy an end-to-end cloud platform: Route 53 -> CloudFront (CDN) -> Application Load Balancer -> Auto Scaling Group (EC2 / ECS Fargate) -> Multi-AZ Aurora PostgreSQL -> S3 Asset Vault.",
          deliverables: [
            "100% declared in version-controlled Terraform modules in a public GitHub repo",
            "Load tested with 5,000 concurrent simulated requests demonstrating auto-scaling",
            "CloudWatch Alarms triggering PagerDuty/Slack notifications on elevated 5xx error rates"
          ],
          architectureTip: "Document your architecture with a professional Mermaid.js or Draw.io system diagram: diagrams prove architectural comprehension to hiring managers."
        },
        commandsCheatsheet: [
          { cmd: "terraform apply tfplan", desc: "Execute final production capstone infrastructure deployment" },
          { cmd: "curl -I https://api.myproject.com/health", desc: "Verify CloudFront CDN edge response headers and TLS termination" },
          { cmd: "aws cloudwatch describe-alarms --state-value OK", desc: "Verify all production operational health alarms are reporting healthy status" }
        ],
        interviewQuestions: [
          {
            question: "Walk me through how your capstone handles a total data center power failure in one Availability Zone.",
            answer: "Because compute instances span two AZs inside an Auto Scaling Group, the Application Load Balancer detects failing targets in the impacted AZ via health checks and instantly re-routes 100% of traffic to healthy instances in the second AZ. Concurrently, the Multi-AZ database detects primary failure and flips its DNS endpoint to the synchronous standby in the second AZ in under 60 seconds with zero data loss.",
            trap: "Claiming zero downtime on database failover without explaining DNS propagation and connection pool retry mechanisms."
          }
        ],
        relatedEngineId: "tool-cloud-mastery",
        relatedEngineName: "Cloud 20-Concept Mastery"
      },
      {
        id: "ce-portfolio",
        stepNumber: 10,
        title: "Portfolio",
        subtitle: "GitHub Engineering Showcase & Technical Case Studies",
        phase: "Portfolio & Career",
        durationWeeks: "Weeks 23-24",
        overview: "Transform your code into an irresistible engineering portfolio. Hiring managers do not read resume bullet points; they inspect clean GitHub repositories, well-structured READMEs, architectural diagrams, and video walkthroughs.",
        coreSkills: [
          "Writing production-grade README files with architecture diagrams and cost breakdowns",
          "Documenting trade-offs: Why ECS over EKS? Why Aurora over standard RDS?",
          "Cost analysis: Showing monthly estimated AWS spend using Infracost",
          "Recording concise 3-minute Loom video walkthroughs explaining your design"
        ],
        handsOnProject: {
          title: "Production Engineering Case Study & Cost Breakdown",
          objective: "Package your capstone project into a polished public GitHub repository complete with an architectural overview, disaster recovery runbook, Infracost breakdown, and live demo URL.",
          deliverables: [
            "C4 Architecture Diagram illustrating packet flow from user to database",
            "Infracost pull request comment showing estimated monthly run cost (~$140/mo)",
            "Step-by-step reproduction guide allowing any engineer to `terraform apply` in their account"
          ],
          architectureTip: "Include an explicit 'Failure Modes & Lessons Learned' section in your README: admitting what broke and how you fixed it demonstrates senior maturity."
        },
        commandsCheatsheet: [
          { cmd: "infracost breakdown --path .", desc: "Calculate exact projected monthly AWS cloud bill directly from Terraform HCL code" },
          { cmd: "gh repo view --web", desc: "Open current repository in browser to audit visual presentation and markdown formatting" }
        ],
        interviewQuestions: [
          {
            question: "Why did you choose this specific architecture for your portfolio project instead of a simpler monolithic setup?",
            answer: "I optimized for high availability and zero single points of failure. While a single EC2 instance is cheaper, it cannot survive an AZ outage. By using an ALB with an ASG across two AZs paired with Multi-AZ Aurora, the system achieves a 99.95% availability SLO while keeping monthly baseline costs under $150 via Graviton instances and gp3 volumes.",
            trap: "Saying 'I used it because it's best practice' without explaining the specific business and reliability trade-offs."
          }
        ],
        relatedEngineId: "tool-tech-stack",
        relatedEngineName: "Tech Stack Explorer"
      },
      {
        id: "ce-job-ready",
        stepNumber: 11,
        title: "Job Ready",
        subtitle: "Technical Interview Mastery & Systems Design Sprints",
        phase: "Portfolio & Career",
        durationWeeks: "Weeks 25+",
        overview: "Prepare for Cloud Engineer behavioral, technical, and systems design interview loops. Master live terminal debugging, whiteboard systems design, and behavioral STAR stories.",
        coreSkills: [
          "Live coding: Python Boto3 automation scripts under interview pressure",
          "Cloud Systems Design: Designing scalable, fault-tolerant architectures from scratch",
          "Behavioral STAR Stories: Production incident resolution, technical conflict, innovation",
          "AWS Certification alignment (AWS Certified Solutions Architect Associate / SysOps)"
        ],
        handsOnProject: {
          title: "Mock Systems Design Sprint: Scale to 1 Million Daily Users",
          objective: "Complete 10 timed 45-minute whiteboard systems design challenges (e.g. 'Design a global video streaming platform', 'Architect a real-time analytics pipeline').",
          deliverables: [
            "Calculated bandwidth, storage, and read/write IOPS capacity requirements",
            "Identified single points of failure (SPOFs) and designed automated mitigations",
            "Presented trade-off evaluations between consistency (ACID) and availability (BASE)"
          ],
          architectureTip: "In systems design interviews, always ask clarifying questions about scale (DAU, read/write ratio) and latency requirements before drawing boxes."
        },
        commandsCheatsheet: [
          { cmd: "aws health describe-events --filter 'eventStatusCodes=open'", desc: "Query AWS Health API to check for active cloud infrastructure disruptions" },
          { cmd: "checkov -d . --compact", desc: "Run comprehensive pre-flight security scan across all Terraform repositories" }
        ],
        interviewQuestions: [
          {
            question: "Tell me about a time a production cloud deployment went wrong and how you resolved it.",
            answer: "Use STAR format: Situation (Friday deploy of payment API caused 502 errors), Task (Restore checkout within 15m), Action (Identified broken DB migration, executed instant blue-green router flip, restored healthy Blue tier in 40s, diagnosed bug in staging), Result (Zero customer transactions lost, added pre-deployment migration verification in CI).",
            trap: "Blaming a teammate or the cloud provider instead of demonstrating systematic ownership and root-cause resolution."
          }
        ],
        relatedEngineId: "tool-decision",
        relatedEngineName: "Decision Engine"
      }
    ]
  },
  {
    id: "devops-engineer",
    name: "DevOps Engineer",
    badge: "CI/CD, Containers & Platform Automation",
    description: "The complete pipeline from Linux and Git internals to Docker containerization, Kubernetes orchestration, GitOps CI/CD delivery, Terraform, and full-stack observability.",
    salaryRange: "$120,000 - $185,000",
    timeline: "7 - 10 Months (15-20 hrs/week)",
    targetRole: "DevOps Engineer / Platform Engineer / SRE (Site Reliability Engineer)",
    steps: [
      {
        id: "de-linux-bash",
        stepNumber: 1,
        title: "Linux & Bash",
        subtitle: "The Operating System Engine of All Containers",
        phase: "Foundations",
        durationWeeks: "Weeks 1-3",
        overview: "Every Docker container and Kubernetes worker node runs on Linux. Master bash scripting, pipes, redirections, process management (PID 1, signals), and system troubleshooting.",
        coreSkills: [
          "Bash scripting: Variables, loops, conditionals, exit codes (`set -euo pipefail`)",
          "Process management: `ps aux`, `top`, signals (`SIGTERM`, `SIGKILL`), zombie processes",
          "Text processing utilities: `grep`, `awk`, `sed`, `cut`, `sort`, `uniq`",
          "Storage and memory analysis: `df -h`, `free -m`, cgroups inspection"
        ],
        handsOnProject: {
          title: "Production Log Analysis & Health Watchdog",
          objective: "Write a bulletproof bash daemon that monitors server memory, disk, and Nginx access logs, parsing HTTP 5xx spikes and sending automated alerts with system diagnostics.",
          deliverables: [
            "Strict bash script with `set -euo pipefail` and trap cleanup hooks",
            "Cron job or systemd timer executing health audits every 5 minutes",
            "Awk one-liner calculating top 10 IP addresses causing HTTP 500 errors"
          ],
          architectureTip: "Always put `set -euo pipefail` at the top of every production bash script to stop execution on the first error or unbound variable."
        },
        commandsCheatsheet: [
          { cmd: "set -euo pipefail", desc: "Bash strict mode: exit on error, exit on unset variable, fail on pipe failure" },
          { cmd: "awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -n 10", desc: "Extract and rank the top 10 client IP addresses hitting the web server" },
          { cmd: "kill -15 <pid> && sleep 5 && kill -9 <pid> 2>/dev/null", desc: "Graceful termination pattern: send SIGTERM first, fallback to SIGKILL" }
        ],
        interviewQuestions: [
          {
            question: "What is a zombie process in Linux, why does it occur, and how do you resolve it?",
            answer: "A zombie process is a terminated process whose entry remains in the process table because its parent process has not yet read its exit code via the `wait()` syscall. Zombies consume PID table slots. You cannot kill a zombie with `kill -9` (it is already dead); you must signal the parent process to wait on it, or kill the parent process so `init` (PID 1) inherits and reaps it.",
            trap: "Answering that you run `kill -9 <zombie_pid>`: you cannot kill a process that has already terminated."
          }
        ],
        relatedEngineId: "tool-linux",
        relatedEngineName: "Linux 20-Concept Mastery"
      },
      {
        id: "de-git-github",
        stepNumber: 2,
        title: "Git & GitHub",
        subtitle: "Version Control Discipline & Git Workflows",
        phase: "Foundations",
        durationWeeks: "Weeks 4-5",
        overview: "Git is the single source of truth for all modern infrastructure. Master commit graph internals, interactive rebasing, merge conflict resolution, branch protection rules, and Conventional Commits.",
        coreSkills: [
          "Git Object Database: Commits, Trees, Blobs, Annotated Tags, and SHA hashes",
          "Branching strategies: GitHub Flow vs Trunk-Based Development",
          "Advanced Git operations: `git rebase -i`, `git cherry-pick`, `git bisect`, `git reflog`",
          "Repository governance: Branch protection, required pull request reviews, signed commits"
        ],
        handsOnProject: {
          title: "Trunk-Based Release Engineering Pipeline",
          objective: "Establish an enterprise Git workflow: configure protected main branch, enforce GPG commit signing, setup Conventional Commits with semantic release tagging, and use `git bisect` to find a simulated regression commit.",
          deliverables: [
            "Branch protection requiring passing status checks and zero unreviewed commits",
            "Pre-commit hooks enforcing Conventional Commit message formatting",
            "Automated changelog generation based on `feat:` and `fix:` commit tags"
          ],
          architectureTip: "Adopt Trunk-Based Development over GitFlow: short-lived branches merged daily prevent multi-day merge conflict nightmares."
        },
        commandsCheatsheet: [
          { cmd: "git rebase -i HEAD~4", desc: "Interactively squash, edit, or reword the last 4 local commits" },
          { cmd: "git reflog", desc: "Inspect chronological history of HEAD pointer movements (recover deleted commits)" },
          { cmd: "git bisect start && git bisect bad && git bisect good <commit_sha>", desc: "Perform binary search across commit history to isolate the exact commit that introduced a bug" }
        ],
        interviewQuestions: [
          {
            question: "What is the difference between `git merge` and `git rebase`, and when would you use each?",
            answer: "`git merge` creates a new merge commit combining two branches, preserving complete historical chronology and branch context. `git rebase` replays local commits on top of the target branch's base, creating a clean, linear commit history. Use `rebase` on local feature branches before merging; never rebase public shared branches like `main`.",
            trap: "Rebasing a public shared branch, which forces team members to reconcile diverged Git histories."
          }
        ],
        relatedEngineId: "tool-tech-stack",
        relatedEngineName: "Tech Stack Explorer"
      },
      {
        id: "de-python-scripting",
        stepNumber: 3,
        title: "Python Scripting",
        subtitle: "Advanced DevOps Automation & JSON/YAML Wrangling",
        phase: "Foundations",
        durationWeeks: "Weeks 6-7",
        overview: "When bash scripts exceed 100 lines, they become unmaintainable. Learn to write production Python automation for Kubernetes API manipulation, Docker registry querying, and config generation.",
        coreSkills: [
          "JSON, YAML, and TOML manipulation with `json`, `pyyaml`, and `pydantic`",
          "Interacting with HTTP REST APIs using `httpx` and `requests` with retry adapters",
          "Interfacing with local processes using `subprocess.run(check=True)`",
          "Packaging CLI tools with `argparse` or `click`"
        ],
        handsOnProject: {
          title: "Kubernetes Manifest Linter & Security Checker CLI",
          objective: "Build a Python CLI tool that parses raw Kubernetes YAML files, validates resource limits, verifies that containers do not run as root, and checks image tags against mutable `:latest` anti-patterns.",
          deliverables: [
            "CLI tool accepting directory paths and outputting colorized pass/fail tables",
            "Pydantic data models validating Kubernetes Pod specifications",
            "Integration into GitHub Actions failing pull requests on security policy breaches"
          ],
          architectureTip: "Always use `subprocess.run(..., check=True, capture_output=True, text=True)` in Python to guarantee unhandled shell exit codes raise exceptions."
        },
        commandsCheatsheet: [
          { cmd: "python -c 'import json, sys; print(json.dumps(json.load(sys.stdin), indent=2))'", desc: "Pretty-print complex JSON streams directly in the terminal" },
          { cmd: "pip install ruff mypy pytest", desc: "Install high-performance Python linter, type checker, and test framework" }
        ],
        interviewQuestions: [
          {
            question: "When should you write a DevOps automation task in Python versus Bash?",
            answer: "Use Bash for simple, sequential system commands (installing packages, pipe-chaining grep/sed/awk, simple file checks < 50 lines). Use Python when you need complex data manipulation (JSON/YAML parsing), REST API error handling, multithreading, database queries, or when code complexity requires unit testing.",
            trap: "Claiming you can write everything in Bash: parsing complex nested JSON in bash without jq is brittle and error-prone."
          }
        ],
        relatedEngineId: "tool-scripting-mastery",
        relatedEngineName: "Scripting 20-Concept Mastery"
      },
      {
        id: "de-docker",
        stepNumber: 4,
        title: "Docker",
        subtitle: "Containerization, Multi-Stage Builds & OCI Standards",
        phase: "Core Engineering",
        durationWeeks: "Weeks 8-10",
        overview: "Containers are the universal packaging format of modern software. Master the differences between images and containers, BuildKit layer caching, multi-stage builds, rootless security, and Docker Compose.",
        coreSkills: [
          "Linux Namespaces (PID, NET, MNT, IPC, UTS) and Cgroups resource limits",
          "Dockerfile optimization: Multi-stage builds, layer caching, `.dockerignore`",
          "Docker Compose for multi-container local orchestration and health checks",
          "Container security: Non-root users (`USER 10001`), read-only root filesystems, Trivy scanning"
        ],
        handsOnProject: {
          title: "Multi-Stage Distroless Production Containerization",
          objective: "Containerize a full-stack Next.js and Node.js application using multi-stage builds that shrink the image from 1.4GB down to 85MB running on Google Distroless as an unprivileged user.",
          deliverables: [
            "Dockerfile separating dependency installation, build, and runtime stages",
            "Docker Compose stack with PostgreSQL, Redis, and healthcheck dependencies",
            "Trivy vulnerability scan reporting 0 Critical and 0 High CVEs"
          ],
          architectureTip: "Always use the exec JSON form for `ENTRYPOINT [\"node\", \"server.js\"]` so POSIX signals (`SIGTERM`) pass directly to the application."
        },
        commandsCheatsheet: [
          { cmd: "DOCKER_BUILDKIT=1 docker build -t myapp:v1 .", desc: "Build image utilizing parallel BuildKit Directed Acyclic Graph engine" },
          { cmd: "docker history --human <image>", desc: "Inspect layer-by-layer size contribution of each Dockerfile instruction" },
          { cmd: "docker diff <container_id>", desc: "Inspect filesystem mutations (Added, Changed, Deleted) on the container RW upperdir" }
        ],
        interviewQuestions: [
          {
            question: "Why should you use multi-stage builds in Dockerfiles?",
            answer: "Multi-stage builds allow you to use heavy images with compilers, headers, and build tools (gcc, tsc, python) in temporary build stages, and copy only the final compiled binary or minified bundle into a minimal runtime stage (Alpine/Distroless). This shrinks image sizes by up to 90%, speeds up deployment transfer times, and eliminates compilers and package managers from production images, drastically reducing the security attack surface.",
            trap: "Bundling devDependencies, TypeScript compilers, and test suites into the final production container layer."
          }
        ],
        relatedEngineId: "tool-docker-mastery",
        relatedEngineName: "Docker 20-Concept Mastery"
      },
      {
        id: "de-kubernetes",
        stepNumber: 5,
        title: "Kubernetes",
        subtitle: "Production Container Fleet Orchestration",
        phase: "Core Engineering",
        durationWeeks: "Weeks 11-14",
        overview: "Kubernetes is the operating system of the cloud. Master Pods, Deployments, Services, Ingress, ConfigMaps, Secrets, StatefulSets, HPA autoscaling, RBAC, and triage of CrashLoopBackOff states.",
        coreSkills: [
          "Core workloads: Pods (pause containers), Deployments (rolling updates), StatefulSets (PVCs)",
          "Networking: Services (ClusterIP, NodePort), EndpointSlices, Ingress (L7 routing)",
          "Lifecycle & Health: Startup, Liveness, and Readiness probes, PreStop sleep hooks",
          "Resource management: Requests (scheduling) vs Limits (cgroups OOM kills), QoS classes"
        ],
        handsOnProject: {
          title: "Zero-Downtime Microservice Cluster Deployment",
          objective: "Deploy a microservice application to a Kubernetes cluster with zero-downtime rolling updates, HPA CPU autoscaling, Ingress TLS termination, and readiness health probes.",
          deliverables: [
            "Deployment manifest with `maxSurge: 25%`, `maxUnavailable: 0`, and `preStop: sleep 10`",
            "Horizontal Pod Autoscaler (HPA) scaling pods from 2 to 10 replicas under load",
            "Complete post-mortem and triage guide for simulated `CrashLoopBackOff` failures"
          ],
          architectureTip: "Never check external databases in a Liveness probe: if the database slows down, all pods will fail their liveness probes simultaneously, creating an unrecoverable restart loop."
        },
        commandsCheatsheet: [
          { cmd: "kubectl get pods -o wide --show-labels", desc: "List pods showing node assignments, internal IPs, and metadata labels" },
          { cmd: "kubectl describe pod <name> | grep -A 10 Events:", desc: "Inspect lifecycle transition events and probe failure reasons for a failing pod" },
          { cmd: "kubectl logs <name> --previous", desc: "Retrieve stdout/stderr logs from the previous crashed container instance before restart" }
        ],
        interviewQuestions: [
          {
            question: "What is the difference between a Liveness probe and a Readiness probe in Kubernetes?",
            answer: "A **Liveness probe** determines if the container process is still alive and operational; if it fails `failureThreshold` times, the kubelet kills and restarts the container. A **Readiness probe** determines if the pod is ready to accept incoming customer traffic; if it fails, the container is NOT restarted, but its IP is removed from Service `EndpointSlices` so load balancers stop sending it traffic.",
            trap: "Thinking that a failed readiness probe restarts the container."
          }
        ],
        relatedEngineId: "tool-kubernetes-mastery",
        relatedEngineName: "Kubernetes 20-Concept Mastery"
      },
      {
        id: "de-cicd-pipelines",
        stepNumber: 6,
        title: "CI/CD Pipelines",
        subtitle: "Automated Software Delivery & Supply Chain Security",
        phase: "Core Engineering",
        durationWeeks: "Weeks 15-17",
        overview: "Transform code changes into production releases automatically. Master GitHub Actions DAG workflows, lockfile caching, automated testing matrices, OIDC cloud federation, and GitOps delivery.",
        coreSkills: [
          "Workflow DAGs (`needs`), matrix builds, and fail-fast static analysis stages",
          "OpenID Connect (OIDC) authentication with cloud providers (no static secret keys)",
          "Blue-Green and Canary progressive delivery strategies",
          "Supply-chain security: Trivy CVE scanning, SBOM generation, Cosign container signing"
        ],
        handsOnProject: {
          title: "Production GitOps Delivery Pipeline",
          objective: "Build an end-to-end GitHub Actions CI/CD pipeline that lints, runs sharded unit tests, builds a Docker image, signs it with Cosign, and commits the new digest to an ArgoCD GitOps repository.",
          deliverables: [
            "GitHub Actions workflow authenticated to AWS via OIDC",
            "Dependency caching using lockfile hashes reducing build times from 8m to 90s",
            "Pull request preview environments with automated teardown on branch merge"
          ],
          architectureTip: "Never store permanent AWS access keys in GitHub Secrets: use GitHub OIDC to assume short-lived IAM roles with AWS STS."
        },
        commandsCheatsheet: [
          { cmd: "gh run list --limit 5", desc: "List recent GitHub Actions workflow runs and their completion statuses" },
          { cmd: "gh run watch <run_id>", desc: "Watch live streaming status and step transitions of an active pipeline run" },
          { cmd: "cosign sign --yes <image_digest>", desc: "Cryptographically sign an OCI container image using keyless OIDC" }
        ],
        interviewQuestions: [
          {
            question: "What is the difference between Blue-Green Deployment and Canary Deployment?",
            answer: "In **Blue-Green Deployment**, two identical production environments exist simultaneously; traffic is switched 100% instantaneously from Blue to Green at the load balancer level once Green is verified. In **Canary Deployment**, a tiny percentage of live traffic (e.g. 2% -> 10% -> 50% -> 100%) is progressively routed to the new version while automated monitoring monitors Prometheus metrics for error rate spikes.",
            trap: "Deploying breaking database schema changes during Blue-Green without backward compatibility."
          }
        ],
        relatedEngineId: "tool-cicd-mastery",
        relatedEngineName: "CI/CD 20-Concept Mastery"
      },
      {
        id: "de-terraform",
        stepNumber: 7,
        title: "Terraform",
        subtitle: "Infrastructure as Code for Platform Engineers",
        phase: "Advanced Systems",
        durationWeeks: "Weeks 18-20",
        overview: "Codify cloud platforms with Terraform. Master remote state, DynamoDB locking, child modules, declarative import blocks, and automated drift detection pipelines.",
        coreSkills: [
          "HCL declarative syntax, state files, remote backends (S3 + DynamoDB locking)",
          "Lifecycle blocks (`create_before_destroy`, `prevent_destroy`)",
          "Automated drift detection using `terraform plan -detailed-exitcode`",
          "Policy as Code integration: Pre-commit scanning with Checkov and OPA"
        ],
        handsOnProject: {
          title: "EKS Cluster Provisioned via Modular Terraform",
          objective: "Write modular Terraform code that deploys an Amazon EKS cluster spanning multiple private subnets with managed node groups, IAM roles for service accounts (IRSA), and VPC CNI.",
          deliverables: [
            "Remote S3 backend with DynamoDB locking and KMS encryption",
            "Modular architecture separating VPC, EKS cluster, and Node Groups",
            "CI pipeline running Checkov security scans on every pull request"
          ],
          architectureTip: "Enable IAM Roles for Service Accounts (IRSA) on EKS: pod containers assume fine-grained IAM roles without needing node-level permissions."
        },
        commandsCheatsheet: [
          { cmd: "terraform plan -out=tfplan", desc: "Compile deterministic execution plan binary for safe CI apply" },
          { cmd: "terraform apply -refresh-only", desc: "Reconcile out-of-band cloud changes into state without modifying resources" },
          { cmd: "checkov -d . --framework terraform", desc: "Scan Terraform code for security vulnerabilities and compliance flaws" }
        ],
        interviewQuestions: [
          {
            question: "How do you handle secrets (passwords, private keys) in Terraform without leaking them?",
            answer: "1. Never hardcode secrets in `.tf` files. 2. Mark input variables as `sensitive = true` to redact them from CLI stdout. 3. Remember that `sensitive = true` does NOT encrypt the secret inside `terraform.tfstate`. 4. Store state files in encrypted remote backends (S3 with KMS) with strict IAM policies. 5. In production, use external secret management (AWS Secrets Manager, HashiCorp Vault) and inject secrets dynamically into containers at runtime.",
            trap: "Believing that `sensitive = true` encrypts secrets in the state file."
          }
        ],
        relatedEngineId: "tool-iac-mastery",
        relatedEngineName: "IaC 20-Concept Mastery"
      },
      {
        id: "de-aws-deployment",
        stepNumber: 8,
        title: "AWS Deployment",
        subtitle: "Enterprise Cloud Hosting & Networking Infrastructure",
        phase: "Advanced Systems",
        durationWeeks: "Weeks 21-23",
        overview: "Deploy and manage containerized platforms on AWS. Master VPC subnets, NAT Gateways, Application Load Balancers, Route 53, and ECR container registries.",
        coreSkills: [
          "VPC topologies: Public, Private, and Database subnet routing",
          "Application Load Balancers: Target Groups, health checks, TLS offloading",
          "Amazon ECR (Elastic Container Registry): Vulnerability scanning, lifecycle policies",
          "AWS WAF (Web Application Firewall): SQLi, XSS, and rate limiting rules"
        ],
        handsOnProject: {
          title: "Production AWS Application Ingress & WAF Shield",
          objective: "Deploy an Application Load Balancer fronting an EKS/ECS container service, protected by an AWS WAF WebACL blocking SQL injection and rate-limiting IP floods to 100 req/5m.",
          deliverables: [
            "Route 53 Alias record routing traffic to the ALB with ACM TLS 1.3",
            "AWS WAF rules active and verified via simulated curl flood attacks",
            "ALB access logs streamed to an S3 bucket with Athena query partition indexing"
          ],
          architectureTip: "Configure `deregistration_delay.timeout_seconds` on ALB target groups down to 30 seconds to speed up container deployment drain times."
        },
        commandsCheatsheet: [
          { cmd: "aws elbv2 describe-target-health --target-group-arn <tg_arn>", desc: "Inspect real-time health status of all registered container targets" },
          { cmd: "aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <registry_url>", desc: "Authenticate local Docker CLI daemon to AWS ECR private registry" }
        ],
        interviewQuestions: [
          {
            question: "How do you achieve zero-downtime deployments when updating containerized services behind an ALB?",
            answer: "1. Configure the Deployment with `maxSurge: 25%` and `maxUnavailable: 0`. 2. Implement a `readinessProbe` so Kubernetes only routes traffic once the app is fully initialized. 3. Add a `preStop: sleep 10` hook to give the ALB time to deregister the old container before the app stops listening. 4. Reduce ALB `deregistration_delay` to 30 seconds to allow active connections to finish draining gracefully.",
            trap: "Omitting the preStop hook, which causes the ALB to send requests to an already-killed container."
          }
        ],
        relatedEngineId: "tool-cloud-mastery",
        relatedEngineName: "Cloud 20-Concept Mastery"
      },
      {
        id: "de-monitoring-logging",
        stepNumber: 9,
        title: "Monitoring & Logging",
        subtitle: "Full-Stack Observability: Prometheus, Grafana, Loki & OpenTelemetry",
        phase: "Advanced Systems",
        durationWeeks: "Weeks 24-26",
        overview: "You cannot manage what you cannot measure. Master the 3 pillars of observability: Prometheus metrics (PromQL), Grafana dashboards (RED/USE methods), Loki structured logging, and Alertmanager notification routing.",
        coreSkills: [
          "The 3 Telemetry Pillars: Metrics (Prometheus), Logs (Loki), Traces (Tempo)",
          "PromQL: `rate()`, `histogram_quantile()`, vector math, recording rules",
          "Grafana dashboards: The RED Method (Rate, Errors, Duration) for microservices",
          "SLIs, SLOs, and Error Budget multi-burn-rate alerting rules in Alertmanager"
        ],
        handsOnProject: {
          title: "Full-Stack Observability & Multi-Burn SLO Alerting",
          objective: "Deploy a complete observability stack (Prometheus, Grafana, Loki, Alertmanager) monitoring a microservices cluster, complete with custom RED dashboards and Slack/PagerDuty multi-burn-rate alerts.",
          deliverables: [
            "Golden Signals Grafana dashboard tracking P50, P90, and P99 latencies",
            "Prometheus alerting rules triggering on 14.4x Error Budget burn rates",
            "LogQL streams parsing structured JSON logs directly from Loki"
          ],
          architectureTip: "Never alert on raw CPU utilization spikes: alert on user-facing symptoms (elevated HTTP 5xx errors or P99 latency SLO breaches)."
        },
        commandsCheatsheet: [
          { cmd: "promtool check rules /etc/prometheus/alert.rules.yml", desc: "Validate Prometheus alerting and recording rule syntax and PromQL logic" },
          { cmd: "amtool silence add --alertname=HighErrorRate --duration=1h", desc: "Temporarily silence firing Alertmanager alert during active maintenance" }
        ],
        interviewQuestions: [
          {
            question: "What is an Error Budget, and how does it prevent tension between developers and operations?",
            answer: "An Error Budget is the allowed unreliability over a time window: `Error Budget = 100% - SLO` (e.g. 0.1% downtime for a 99.9% SLO). It acts as an objective, mathematical referee: if the error budget is healthy, developers ship features aggressively. If the error budget is exhausted, feature deploys freeze and 100% of engineering effort redirects toward reliability and bug fixes.",
            trap: "Saying that operations wants 100% uptime: 100% is the wrong target and halts all innovation."
          }
        ],
        relatedEngineId: "tool-monitoring-mastery",
        relatedEngineName: "Monitoring 20-Concept Mastery"
      },
      {
        id: "de-portfolio",
        stepNumber: 10,
        title: "Portfolio",
        subtitle: "Production Platform Showcase & Architecture Playbooks",
        phase: "Portfolio & Career",
        durationWeeks: "Weeks 27-28",
        overview: "Transform your engineering work into an authoritative portfolio. Build a public GitOps repository demonstrating production Kubernetes, Terraform, CI/CD, and monitoring with comprehensive documentation.",
        coreSkills: [
          "Architecting a cohesive GitOps repository structure (ArgoCD + Helm + Terraform)",
          "Writing incident postmortems using the 5 Whys framework to showcase senior maturity",
          "Documenting Disaster Recovery procedures (RTO < 15m, RPO < 5m)",
          "Creating recorded terminal demos (using asciinema or high-resolution GIFs)"
        ],
        handsOnProject: {
          title: "The Production-Grade Autonomous GitOps Platform",
          objective: "Publish an enterprise platform repository: Terraform provisions the AWS EKS cluster, GitHub Actions builds and signs containers, ArgoCD auto-syncs manifests, and Prometheus/Grafana monitors health.",
          deliverables: [
            "Public GitHub repository with automated PR status checks and branch protection",
            "Full architectural diagram detailing packet flow and deployment boundaries",
            "Included blameless postmortem analyzing a simulated SEV-1 database outage"
          ],
          architectureTip: "A hiring manager will look at your repository's commit history: clean, descriptive Conventional Commits prove engineering discipline."
        },
        commandsCheatsheet: [
          { cmd: "argocd app list", desc: "Display all managed applications, sync status, and health states via ArgoCD" },
          { cmd: "asciinema rec demo.cast", desc: "Record high-resolution terminal session showcasing your CLI tools and deploys" }
        ],
        interviewQuestions: [
          {
            question: "Walk me through the lifecycle of a code commit from developer laptop to running in production in your GitOps platform.",
            answer: "1. Developer opens PR. 2. GitHub Actions runs linting, type checks, and sharded unit tests. 3. PR is reviewed and merged to `main`. 4. CI builds multi-stage Docker image, runs Trivy vulnerability scan, and signs image with Cosign. 5. CI updates image tag in GitOps repository. 6. ArgoCD detects Git commit and reconciles Kubernetes cluster state via rolling update. 7. Prometheus monitors SLIs during rollout.",
            trap: "Saying that CI directly SSHs into production to run `kubectl apply`: modern DevOps uses GitOps pull reconciliation via ArgoCD."
          }
        ],
        relatedEngineId: "tool-cicd-mastery",
        relatedEngineName: "CI/CD 20-Concept Mastery"
      },
      {
        id: "de-job-ready",
        stepNumber: 11,
        title: "Job Ready",
        subtitle: "DevOps / SRE Interview Sprints & Live Terminal Debugging",
        phase: "Portfolio & Career",
        durationWeeks: "Weeks 29+",
        overview: "Ace technical screening calls, live terminal debugging assessments, systems design interviews, and behavioral STAR questions. Master the nuances between DevOps, Platform Engineering, and Site Reliability Engineering.",
        coreSkills: [
          "Live terminal troubleshooting: Diagnosing broken Linux servers and crashing Kubernetes pods in real time",
          "Production Systems Design: Designing resilient, multi-region container platforms",
          "Behavioral mastery: Storytelling around production outages, technical debt, and team alignment",
          "Negotiating top-of-market compensation packages with competing offers"
        ],
        handsOnProject: {
          title: "Live Terminal Chaos Triage Sprint",
          objective: "Execute 10 timed 30-minute troubleshooting challenges on deliberately broken environments (e.g. broken DNS, crashed etcd, corrupted state locks, OOM-killed pods).",
          deliverables: [
            "Documented structured triage playbook: Status -> Events -> Logs -> Root Cause -> Fix",
            "Maintained composure under pressure during simulated live technical interviews",
            "Completed 5 recorded mock behavioral interviews using the STAR method"
          ],
          architectureTip: "During live troubleshooting interviews, speak your thought process out loud: interviewers care more about how you isolate variables than memorized flags."
        },
        commandsCheatsheet: [
          { cmd: "kubectl get events --sort-by='.metadata.creationTimestamp' -A", desc: "Quickly view the latest cluster-wide failure events across all namespaces" },
          { cmd: "dmesg -T | grep -E -i 'oom|kill|error'", desc: "Scan kernel ring buffer for Out-Of-Memory termination events with human timestamps" }
        ],
        interviewQuestions: [
          {
            question: "How do you balance engineering velocity with operational stability in a high-growth startup?",
            answer: "By implementing Error Budgets and automated quality gates. Rather than relying on human gatekeepers or manual change approval boards (CABs), we define quantifiable SLOs. Automated CI/CD pipelines enforce tests, security scans, and progressive canary rollouts. If the error budget burns, feature deployments freeze automatically, aligning product and engineering incentives mathematically.",
            trap: "Suggesting manual Change Approval Boards (CAB meetings), which kill engineering velocity and indicate low DevOps maturity."
          }
        ],
        relatedEngineId: "tool-triage",
        relatedEngineName: "Diagnostic CLI Tree"
      }
    ]
  }
];

