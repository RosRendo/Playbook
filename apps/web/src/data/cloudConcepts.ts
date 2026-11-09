export interface CloudConcept {
  id: string;
  name: string;
  subtitle: string;
  category: "Compute & Serverless" | "Networking & Edge" | "Storage & Databases" | "Security & Identity" | "Messaging & Observability" | "Governance & Architecture";
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

export const CLOUD_CONCEPTS: CloudConcept[] = [
  {
    id: "iam",
    name: "1. IAM",
    subtitle: "Identity and Access Management: Policies, Roles & Least Privilege",
    category: "Security & Identity",
    mentalModel: "IAM is the global control plane gatekeeper of AWS. Nothing in AWS can make an API request without explicit cryptographic authentication (SigV4) and policy authorization evaluated against an explicit 'deny by default' evaluation logic.",
    coreMechanism: "IAM evaluates policies (Identity-based, Resource-based, Permissions Boundaries, SCPs). The evaluation engine starts with an implicit Deny. Any explicit Deny immediately overrides everything. If no Deny exists, at least one explicit Allow must match the Action, Resource, and Conditions. IAM Roles use AWS STS to issue short-lived temporary session tokens (15m to 12h).",
    keySyntax: [
      {
        label: "Least-Privilege S3 Read/Write IAM Policy",
        code: `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAppBucketAccess",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::production-assets-bucket/*",
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "true"
        }
      }
    }
  ]
}`,
        explanation: "Restricts access to a single specific bucket prefix and mandates TLS encryption via `aws:SecureTransport`."
      }
    ],
    productionCommands: [
      { cmd: "aws sts get-caller-identity", desc: "Display current active AWS Account ID, IAM User/Role ARN, and assumed session identity", level: "read" },
      { cmd: "aws iam list-attached-user-policies --user-name <username>", desc: "Audit all managed policies attached directly to an IAM user", level: "read" },
      { cmd: "aws iam create-access-key --user-name <username>", desc: "Generate a new access key pair for an IAM user (rotate regularly)", level: "write" }
    ],
    productionRules: [
      "Never generate or store permanent IAM access keys for EC2, ECS, or Lambda: attach IAM Instance Profiles / Task Roles that issue automatic STS tokens.",
      "Lock down the root account: delete all root access keys, enforce hardware FIDO2 MFA, and use root exclusively for billing changes."
    ],
    failureModes: [
      {
        pitfall: "Attaching `AdministratorAccess` to an application EC2 instance profile for 'convenience'",
        impact: "An SSRF vulnerability in the web application curls metadata `http://169.254.169.254/latest/meta-data/iam/security-credentials/` and grants the attacker full root access to the entire AWS account.",
        resolution: "Enforce least privilege policies and mandate IMDSv2 (`HttpTokens: required`)."
      }
    ],
    realWorldScenario: {
      title: "The Capital One SSRF Metadata Exfiltration Breach",
      situation: "An attacker stole 100+ million customer credit card applications from Amazon S3.",
      investigation: "A misconfigured WAF on an EC2 instance had an SSRF vulnerability. The instance profile had excessive read permissions across all S3 buckets in the account.",
      fix: "Enforced IMDSv2 hop limits, restricted IAM role permissions strictly to specific bucket ARNs, and enabled GuardDuty anomaly detection."
    }
  },
  {
    id: "ec2",
    name: "2. EC2",
    subtitle: "Elastic Compute Cloud: Nitro Hypervisors, EBS & Instance Types",
    category: "Compute & Serverless",
    mentalModel: "EC2 provides virtualized compute instances running on physical servers. Modern instances run on the AWS Nitro System (dedicated hardware cards offloading VPC networking, EBS encryption, and hypervisor management).",
    coreMechanism: "EC2 instances attach Elastic Block Store (EBS) network-attached virtual disks over dedicated PCIe channels. Instance types are optimized by workload: C-series (Compute), M-series (General Purpose), R-series (Memory-Optimized), I-series (NVMe Storage). Instances boot using AMIs (Amazon Machine Images) and execute Cloud-Init user-data bootstrap scripts on startup.",
    keySyntax: [
      {
        label: "Terraform EC2 Specification with IMDSv2 Hardening",
        code: `resource "aws_instance" "web" {
  ami                  = "ami-0c55b159cbfafe1f0" # Amazon Linux 2023
  instance_type        = "c6i.xlarge"
  subnet_id            = aws_subnet.private_app.id
  iam_instance_profile = aws_iam_instance_profile.app_profile.name

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required" # Mandates IMDSv2 (blocks SSRF attacks)
    http_put_response_hop_limit = 1
  }

  root_block_device {
    volume_type = "gp3"
    volume_size = 50
    encrypted   = true
  }
}`,
        explanation: "Enforcing `http_tokens = 'required'` neutralizes classic SSRF attacks that attempt to steal IAM credentials via curl."
      }
    ],
    productionCommands: [
      { cmd: "aws ec2 describe-instances --filters 'Name=instance-state-name,Values=running' --query 'Reservations[*].Instances[*].[InstanceId,InstanceType,PrivateIpAddress,Tags[?Key==`Name`].Value|[0]]' --output table", desc: "List running EC2 instances with IDs, types, private IPs, and Name tags", level: "read" },
      { cmd: "aws ssm start-session --target <instance_id>", desc: "Open an encrypted terminal shell to an EC2 instance via AWS Systems Manager without SSH keys or open port 22", level: "write" }
    ],
    productionRules: [
      "Never open port 22 (SSH) to `0.0.0.0/0`: manage all EC2 instances via AWS Systems Manager (SSM) Session Manager.",
      "Always enforce IMDSv2 (`HttpTokens: required`) with a hop limit of 1 on every EC2 launch template."
    ],
    failureModes: [
      {
        pitfall: "Storing persistent application database files on EC2 instance store (ephemeral NVMe) disks",
        impact: "When the EC2 instance is stopped or rescheduled due to host hardware failure, the ephemeral NVMe disk is wiped completely, resulting in 100% data loss.",
        resolution: "Use EBS volumes (`gp3` or `io2`) for persistent storage."
      }
    ],
    realWorldScenario: {
      title: "The $12,000 Surprise Bill from Forgotten `io2` Provisioned IOPS",
      situation: "A startup's monthly AWS bill doubled after a developer tested a database migration.",
      investigation: "The developer provisioned an EBS volume with `io2` and 64,000 provisioned IOPS, leaving it attached to a stopped staging EC2 instance.",
      fix: "Migrated to `gp3` (which provides 3,000 baseline IOPS for free) and set up AWS Budgets alerts."
    }
  },
  {
    id: "s3",
    name: "3. S3",
    subtitle: "Simple Storage Service: Object Storage, Versioning & Lifecycle",
    category: "Storage & Databases",
    mentalModel: "S3 is a globally distributed, highly available key-value object store offering 99.999999999% (11 9s) of data durability. Data is organized into Buckets and stored as immutable Objects containing data and metadata.",
    coreMechanism: "When an object is written, S3 replicates it across a minimum of three distinct physical Availability Zones before returning HTTP 200. S3 provides strong read-after-write consistency for PUT and DELETE requests. Storage classes (Standard, Infrequent Access, Glacier Instant, Glacier Deep Archive) optimize storage costs via automated Lifecycle Policies.",
    keySyntax: [
      {
        label: "Secure S3 Bucket Configuration with Block Public Access",
        code: `resource "aws_s3_bucket" "secure_assets" {
  bucket = "company-prod-vault-2026"
}

# 1. Enforce Server-Side Encryption (KMS)
resource "aws_s3_bucket_server_side_encryption_configuration" "kms" {
  bucket = aws_s3_bucket.secure_assets.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
  }
}

# 2. Block 100% Public Access (Account & Bucket Level)
resource "aws_s3_bucket_public_access_block" "block_all" {
  bucket                  = aws_s3_bucket.secure_assets.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}`,
        explanation: "Public Access Block acts as a master circuit breaker, preventing any bucket policy or ACL from exposing files publicly."
      }
    ],
    productionCommands: [
      { cmd: "aws s3 ls s3://<bucket_name>/ --human-readable --summarize", desc: "List bucket contents and calculate total object count and cumulative byte size", level: "read" },
      { cmd: "aws s3 sync ./dist s3://<bucket_name>/dist --delete", desc: "Synchronize local build directory to S3, purging files deleted locally", level: "write" }
    ],
    productionRules: [
      "Always enable S3 'Block Public Access' unless the bucket is explicitly dedicated to public static website hosting.",
      "Enable S3 Object Versioning and MFA Delete on critical buckets to prevent accidental deletion or ransomware overwrites."
    ],
    failureModes: [
      {
        pitfall: "Accidentally uploading unversioned files without S3 Lifecycle expiration rules for multipart uploads",
        impact: "Failed multipart uploads leave hidden orphan byte chunks in the bucket indefinitely, consuming terabytes of billed storage.",
        resolution: "Configure an S3 Lifecycle Rule to abort incomplete multipart uploads after 7 days."
      }
    ],
    realWorldScenario: {
      title: "The $10,000 DDoS via S3 Public List Bucket Requests",
      situation: "An open S3 bucket received 400 million HTTP `GET /?list-type=2` requests in 48 hours, incurring thousands of dollars in S3 API request fees.",
      investigation: "The bucket had a public read policy allowing `s3:ListBucket`. Bots exploited this to hammer S3 list endpoints.",
      fix: "Blocked public access and routed assets strictly through Amazon CloudFront using Origin Access Control (OAC)."
    }
  },
  {
    id: "vpc",
    name: "4. VPC",
    subtitle: "Virtual Private Cloud: Subnets, Route Tables & NAT Gateways",
    category: "Networking & Edge",
    mentalModel: "A VPC is your logically isolated software-defined network in the AWS cloud. It defines IP address spaces (CIDR), routing topologies, and network boundaries mirroring a traditional enterprise datacenter.",
    coreMechanism: "A VPC resides within an AWS Region. Subnets map to individual Availability Zones. A **Public Subnet** has a route table directing `0.0.0.0/0` to an **Internet Gateway (IGW)**. A **Private Subnet** directs `0.0.0.0/0` to a **NAT Gateway** residing in a public subnet, enabling private compute (EC2, ECS, RDS) to initiate outbound traffic while blocking inbound connections.",
    keySyntax: [
      {
        label: "Standard 3-Tier Enterprise VPC Topology",
        code: `VPC CIDR: 10.0.0.0/16
├── Public Subnets (Ingress / ALBs / NAT Gateways):
│   ├── 10.0.1.0/24 (AZ-1a) -> Route: 0.0.0.0/0 -> Internet Gateway (IGW)
│   └── 10.0.2.0/24 (AZ-1b) -> Route: 0.0.0.0/0 -> Internet Gateway (IGW)
├── Private Application Subnets (EC2 / EKS / ECS):
│   ├── 10.0.10.0/24 (AZ-1a) -> Route: 0.0.0.0/0 -> NAT Gateway (AZ-1a)
│   └── 10.0.20.0/24 (AZ-1b) -> Route: 0.0.0.0/0 -> NAT Gateway (AZ-1b)
└── Isolated Database Subnets (RDS / Aurora):
    ├── 10.0.100.0/24 (AZ-1a) -> No Internet Route (Air-gapped)
    └── 10.0.200.0/24 (AZ-1b) -> No Internet Route (Air-gapped)`,
        explanation: "Databases reside in isolated subnets with zero route to the Internet or NAT Gateways, completely unreachable from external networks."
      }
    ],
    productionCommands: [
      { cmd: "aws ec2 describe-vpcs --query 'Vpcs[*].[VpcId,CidrBlock,IsDefault,Tags[?Key==`Name`].Value|[0]]' --output table", desc: "List all VPCs in the current region, their CIDR allocations, and Name tags", level: "read" },
      { cmd: "aws ec2 describe-route-tables --filters 'Name=vpc-id,Values=<vpc_id>'", desc: "Display route tables, local CIDR routes, and gateway associations for a VPC", level: "read" }
    ],
    productionRules: [
      "Never deploy production workloads in the Default VPC: build a custom VPC with explicit public, private, and database subnets.",
      "Use VPC Endpoints (AWS PrivateLink) for S3 and DynamoDB to keep traffic on the private AWS backbone and bypass NAT Gateway bandwidth charges."
    ],
    failureModes: [
      {
        pitfall: "Placing a production database inside a public subnet with `PubliclyAccessible: true`",
        impact: "Internet scanners find the open port 5432, execute brute-force attacks, and attempt credential stuffing.",
        resolution: "Deploy databases exclusively in isolated subnets with no Internet Gateway routes."
      }
    ],
    realWorldScenario: {
      title: "The $6,000 Monthly NAT Gateway Data Processing Surprise",
      situation: "A company's AWS networking bill exploded. NAT Gateway data transfer fees reached $6,200/month.",
      investigation: "EC2 worker instances in private subnets were streaming 140TB of training data from S3 through the NAT Gateway ($0.045 per GB).",
      fix: "Created a free S3 Gateway VPC Endpoint (`aws_vpc_endpoint`). Traffic routed directly to S3 across the internal AWS fabric, slashing the bill by $6,200 immediately."
    }
  },
  {
    id: "security-groups",
    name: "5. Security Groups",
    subtitle: "Stateful Virtual Firewalls & Instance-Level ENI Filtering",
    category: "Networking & Edge",
    mentalModel: "Security Groups are virtual stateful firewalls attached to Elastic Network Interfaces (ENIs). They filter traffic at the hypervisor level before packets ever reach the instance operating system.",
    coreMechanism: "Security Groups are **stateful**: if an inbound request is permitted on port 443, the outbound response traffic is automatically allowed regardless of outbound rules. By default, Security Groups deny all inbound traffic and allow all outbound traffic. Security Groups evaluate rules simultaneously (no rule ordering or priority numbers).",
    keySyntax: [
      {
        label: "Chained Security Group Pattern (No Hardcoded IPs)",
        code: `# 1. ALB Security Group (Accepts public HTTPS traffic):
resource "aws_security_group" "alb_sg" {
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# 2. App Security Group (Accepts traffic ONLY from ALB SG):
resource "aws_security_group" "app_sg" {
  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id] # Reference SG ID directly!
  }
}

# 3. DB Security Group (Accepts traffic ONLY from App SG):
resource "aws_security_group" "db_sg" {
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app_sg.id]
  }
}`,
        explanation: "Chaining security group IDs eliminates brittle IP address hardcoding and automatically allows new auto-scaled application instances."
      }
    ],
    productionCommands: [
      { cmd: "aws ec2 describe-security-groups --filters 'Name=group-name,Values=*app*' --output table", desc: "Inspect inbound and outbound firewall rule entries for matching security groups", level: "read" },
      { cmd: "aws ec2 authorize-security-group-ingress --group-id <sg_id> --protocol tcp --port 443 --cidr <ip>/32", desc: "Add a specific IP address to an existing security group whitelist", level: "write" }
    ],
    productionRules: [
      "Always reference source Security Group IDs (`security_groups = [aws_security_group.app.id]`) rather than CIDR blocks between internal architectural tiers.",
      "Never configure `0.0.0.0/0` on database ports (5432, 3306, 6379, 27017): restrict database ingress strictly to application security groups."
    ],
    failureModes: [
      {
        pitfall: "Confusing Security Groups (stateful, attached to ENI) with Network ACLs (stateless, attached to subnet)",
        impact: "Engineers block return traffic on ephemeral ports in NACLs, causing all outbound HTTP/HTTPS calls to hang indefinitely.",
        resolution: "Rely primarily on Security Groups for firewall rules; use NACLs strictly for broad subnet-level IP blocking."
      }
    ],
    realWorldScenario: {
      title: "Database Outage Caused by an IP Hardcoded in Security Group",
      situation: "After an auto-scaling event, 50% of incoming checkout transactions failed with database connection timeouts.",
      investigation: "The database security group allowed port 5432 from a hardcoded subnet CIDR `10.0.1.0/24`. Auto-scaling launched new instances in `10.0.2.0/24`.",
      fix: "Replaced the hardcoded CIDR with a dynamic Security Group reference: `security_groups = [aws_security_group.app_tier.id]`."
    }
  },
  {
    id: "load-balancers",
    name: "6. Load Balancers",
    subtitle: "Elastic Load Balancing: Application (ALB) vs Network (NLB)",
    category: "Networking & Edge",
    mentalModel: "Elastic Load Balancing (ELB) automatically distributes incoming application traffic across multiple targets (EC2, ECS, Lambda, IP addresses) in multiple Availability Zones.",
    coreMechanism: "An **Application Load Balancer (ALB)** operates at Layer 7 (HTTP/HTTPS), supporting path-based routing (`/api`), host routing (`api.domain.com`), and TLS offloading. A **Network Load Balancer (NLB)** operates at Layer 4 (TCP/UDP), handling tens of millions of requests per second with ultra-low sub-millisecond latency and static elastic IPs.",
    keySyntax: [
      {
        label: "ALB Target Group with Active Healthchecks",
        code: `resource "aws_lb_target_group" "api" {
  name        = "api-prod-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip" # Required for AWS Fargate / ECS

  health_check {
    enabled             = true
    path                = "/health"
    protocol            = "HTTP"
    matcher             = "200"
    interval            = 15
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}`,
        explanation: "Health checks verify application liveness; unready or crashed containers are removed from the routing pool within 30 seconds."
      }
    ],
    productionCommands: [
      { cmd: "aws elbv2 describe-load-balancers --query 'LoadBalancers[*].[DNSName,Scheme,State.Code]'", desc: "List all active load balancers, public/internal schemes, and DNS hostnames", level: "read" },
      { cmd: "aws elbv2 describe-target-health --target-group-arn <tg_arn>", desc: "Inspect real-time health status (healthy, unhealthy, draining) of all registered backend targets", level: "read" }
    ],
    productionRules: [
      "Always deploy Load Balancers across a minimum of two Availability Zones to maintain high availability during AWS facility disruptions.",
      "Configure `deregistration_delay.timeout_seconds` (default 300s) down to 30-60s on fast-moving container services to speed up deployment rollouts."
    ],
    failureModes: [
      {
        pitfall: "Setting health check path to an unauthenticated heavy database query: `GET /health` executing `SELECT count(*) FROM orders`",
        impact: "Under high traffic, the health check queries time out, causing the ALB to mark 100% of healthy backend instances as 'unhealthy' and returning 503 errors.",
        resolution: "Point health checks to a lightweight internal endpoint that returns HTTP 200 without blocking on heavy database operations."
      }
    ],
    realWorldScenario: {
      title: "Mass 504 Gateway Timeouts from Idle Connection Dropping",
      situation: "Users reported intermittent HTTP 504 Gateway Timeout errors during file uploads.",
      investigation: "The ALB had an idle timeout of 60 seconds, while the backend Node.js server had an idle timeout of 65 seconds. The backend closed the keep-alive socket just as the ALB sent a request.",
      fix: "Configured backend server keep-alive timeout to 65 seconds and set ALB idle timeout to 60 seconds (backend must always be higher than ALB)."
    }
  },
  {
    id: "auto-scaling",
    name: "7. Auto Scaling",
    subtitle: "Dynamic Fleet Elasticity: Target Tracking & Predictive Scaling",
    category: "Compute & Serverless",
    mentalModel: "Auto Scaling Groups (ASG) ensure that you have the right number of compute instances running to handle the load for your application, automatically scaling out during surges and scaling in during lulls.",
    coreMechanism: "An ASG monitors Amazon CloudWatch metrics (e.g. Average CPU Utilization, ALB Request Count Per Target). Target Tracking policies calculate desired capacity to maintain metric equilibrium (e.g. maintain 60% CPU). ASGs span multiple AZs, automatically replacing degraded or terminated instances.",
    keySyntax: [
      {
        label: "ASG with Target Tracking Scaling Policy",
        code: `resource "aws_autoscaling_group" "app_asg" {
  name                = "app-asg-production"
  min_size            = 3
  max_size            = 20
  desired_capacity    = 3
  vpc_zone_identifier = [aws_subnet.private_a.id, aws_subnet.private_b.id]
  target_group_arns   = [aws_lb_target_group.api.arn]
  health_check_type   = "ELB" # Replaces instance if ALB health check fails
  health_check_grace_period = 300
}

resource "aws_autoscaling_policy" "cpu_target" {
  name                   = "cpu-target-tracking-60"
  autoscaling_group_name = aws_autoscaling_group.app_asg.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 60.0
  }
}`,
        explanation: "`health_check_type: ELB` instructs the ASG to terminate and replace instances if they fail the load balancer's HTTP health check."
      }
    ],
    productionCommands: [
      { cmd: "aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names <asg_name>", desc: "Inspect current, minimum, and maximum instance counts, and active instances", level: "read" },
      { cmd: "aws autoscaling set-desired-capacity --auto-scaling-group-name <asg_name> --desired-capacity <count>", desc: "Manually scale up or down an Auto Scaling Group in real time", level: "write" }
    ],
    productionRules: [
      "Always set `min_size` to at least 2 instances spanning two Availability Zones to maintain high availability during single-node crashes.",
      "Use `TargetTrackingScaling` on `ALBRequestCountPerTarget` rather than CPU utilization for I/O-bound web APIs."
    ],
    failureModes: [
      {
        pitfall: "Setting `health_check_grace_period` too short (e.g. 15 seconds) for an application that takes 90 seconds to boot",
        impact: "The ASG marks the newly booted instance as failed before it finishes starting, terminates it, launches another, and enters an infinite boot-death loop.",
        resolution: "Set the grace period to 300 seconds to allow adequate initialization time."
      }
    ],
    realWorldScenario: {
      title: "The Rapid Scale-In Thrashing Incident",
      situation: "An API repeatedly scaled from 4 instances to 18 instances and back down to 4 every 10 minutes, causing performance degradation.",
      investigation: "The scaling policy had no cooldown period. When a batch worker ran, CPU spiked, triggered scale-out, finished, and immediately scaled in.",
      fix: "Configured a scale-in cooldown stabilization window of 300 seconds."
    }
  },
  {
    id: "rds",
    name: "8. RDS",
    subtitle: "Relational Database Service: Multi-AZ, Read Replicas & Aurora",
    category: "Storage & Databases",
    mentalModel: "Amazon RDS is a managed relational database service (PostgreSQL, MySQL, MariaDB) that automates provisioning, hardware scaling, automated backups, OS patching, and Multi-AZ failover.",
    coreMechanism: "In a **Multi-AZ** configuration, RDS synchronously replicates all writes to a standby database instance in a second Availability Zone. If the primary instance fails, RDS automatically updates the DNS record to point to the standby within 60-120 seconds. **Aurora** replaces physical replication with a shared cloud-native storage volume across 3 AZs with 6-way replication and sub-second failover.",
    keySyntax: [
      {
        label: "Production Multi-AZ PostgreSQL RDS Specification",
        code: `resource "aws_db_instance" "prod_db" {
  identifier             = "core-prod-postgres"
  allocated_storage      = 100
  max_allocated_storage  = 1000 # Automated storage auto-scaling
  engine                 = "postgres"
  engine_version         = "16.1"
  instance_class         = "db.r6g.xlarge"
  multi_az               = true # High availability synchronous replica
  publicly_accessible    = false
  storage_encrypted      = true
  deletion_protection    = true
  backup_retention_period = 30
  skip_final_snapshot    = false
  final_snapshot_identifier = "core-prod-db-final-snapshot"
}`,
        explanation: "`deletion_protection = true` prevents anyone from deleting the production database via the AWS console or Terraform."
      }
    ],
    productionCommands: [
      { cmd: "aws rds describe-db-instances --db-instance-identifier <db_id> --query 'DBInstances[*].[DBInstanceIdentifier,DBInstanceStatus,Endpoint.Address,MultiAZ]'", desc: "Inspect RDS instance status, connection endpoint DNS, and Multi-AZ state", level: "read" },
      { cmd: "aws rds reboot-db-instance --db-instance-identifier <db_id> --force-failover", desc: "HAZARDOUS: Force an immediate simulated Multi-AZ failover to test high availability", level: "hazardous" }
    ],
    productionRules: [
      "Always enable `deletion_protection: true` on production RDS instances to prevent catastrophic accidental deletion.",
      "Never disable automated backups: maintain a minimum of 14-30 days retention with Point-In-Time Recovery (PITR) enabled."
    ],
    failureModes: [
      {
        pitfall: "Running schema migrations with table locks (`ALTER TABLE ... ADD COLUMN ... DEFAULT ...`) on live RDS instances",
        impact: "Exhausts database connection pool, exceeds max connections, and causes site-wide HTTP 500 errors.",
        resolution: "Use zero-downtime migration techniques and test migrations against staging snapshots."
      }
    ],
    realWorldScenario: {
      title: "The Midnight Multi-AZ Failover Connection Drop",
      situation: "An AWS data center suffered a power failure. The primary database failed over to the standby, but the application remained down for 20 minutes.",
      investigation: "The Node.js application cached the resolved DNS IP of the database connection string indefinitely (`pg` pool DNS caching) instead of respecting the 5-second DNS TTL.",
      fix: "Configured application connection pool client with DNS TTL overrides and deployed AWS RDS Proxy to manage connection pooling."
    }
  },
  {
    id: "dynamodb",
    name: "9. DynamoDB",
    subtitle: "Serverless NoSQL: Single-Digit Millisecond Scale & Partition Keys",
    category: "Storage & Databases",
    mentalModel: "Amazon DynamoDB is a fully managed, serverless NoSQL key-value and document database designed to deliver single-digit millisecond latency at any scale with zero maintenance.",
    coreMechanism: "DynamoDB partitions data automatically across SSD storage based on the hash of the **Partition Key (PK)**. An optional **Sort Key (SK)** allows range queries within a partition. It supports On-Demand billing (pay per request) or Provisioned Capacity (RCUs and WCUs). DynamoDB Streams capture a time-ordered sequence of item-level modifications for event-driven Lambda triggers.",
    keySyntax: [
      {
        label: "Single-Table Design DynamoDB Definition",
        code: `resource "aws_dynamodb_table" "core_table" {
  name         = "production_core_store"
  billing_mode = "PAY_PER_REQUEST" # Serverless on-demand pricing
  hash_key     = "PK"              # Partition Key
  range_key    = "SK"              # Sort Key

  attribute {
    name = "PK"
    type = "S"
  }
  attribute {
    name = "SK"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true # Automated continuous backups
  }
}`,
        explanation: "Using generic `PK` and `SK` attribute names enables Single-Table Design patterns, storing multiple entity types in one table."
      }
    ],
    productionCommands: [
      { cmd: "aws dynamodb describe-table --table-name <table_name> --query 'Table.[ItemCount,TableSizeBytes,TableStatus]'", desc: "Inspect item count, storage consumption, and status of a DynamoDB table", level: "read" },
      { cmd: "aws dynamodb get-item --table-name <table_name> --key '{\"PK\": {\"S\": \"USER#123\"}, \"SK\": {\"S\": \"PROFILE\"}}'", desc: "Fetch a specific document item by primary key", level: "read" }
    ],
    productionRules: [
      "Always design partition keys with high cardinality (e.g. `USER#<uuid>`) to prevent 'hot partitions' that throttle throughput.",
      "Never use `Scan` in production application code: `Scan` reads every item in the entire table, resulting in high latency and massive billing spikes. Always use `Query`."
    ],
    failureModes: [
      {
        pitfall: "Using a low-cardinality partition key like `status: 'ACTIVE'` for millions of records",
        impact: "All writes and reads hit a single physical storage node, exceeding the 1,000 WCU / 3,000 RCU per-partition limit and throwing `ProvisionedThroughputExceededException`.",
        resolution: "Use composite partition keys combining status with timestamps or UUIDs."
      }
    ],
    realWorldScenario: {
      title: "The $18,000 Scan Bill from an Unindexed Admin Dashboard",
      situation: "A newly launched admin dashboard search feature triggered an $18,000 DynamoDB bill in its first week.",
      investigation: "The developer used `dynamodb.scan()` with a filter expression to search for user emails across 40 million records on every search keystroke.",
      fix: "Created a Global Secondary Index (GSI) on `Email` and refactored the search to use `dynamodb.query()`."
    }
  },
  {
    id: "lambda",
    name: "10. Lambda",
    subtitle: "Serverless Event-Driven Compute & Concurrency Governance",
    category: "Compute & Serverless",
    mentalModel: "AWS Lambda lets you run code without provisioning or managing servers. You pay strictly for compute time consumed in 1-millisecond increments.",
    coreMechanism: "Lambda functions are triggered by events (API Gateway, S3 uploads, SQS messages, DynamoDB Streams). The AWS Firecracker microVM hypervisor provisions an execution environment in milliseconds. If subsequent events arrive while an environment is active, the container is reused (warm start). If concurrency surges, Lambda scales horizontally up to your account concurrency limit.",
    keySyntax: [
      {
        label: "Production TypeScript Lambda with Memory & Timeout Ceilings",
        code: `resource "aws_lambda_function" "process_order" {
  function_name = "process-order-worker"
  runtime       = "nodejs20.x"
  handler       = "index.handler"
  architectures = ["arm64"] # AWS Graviton2 (20% cheaper, faster execution)
  memory_size   = 512       # Allocates proportional CPU shares
  timeout       = 30        # Hard timeout in seconds
  role          = aws_iam_role.lambda_exec.arn

  environment {
    variables = {
      NODE_OPTIONS = "--enable-source-maps"
    }
  }

  reserved_concurrent_executions = 50 # Prevents database connection exhaustion
}`,
        explanation: "Setting `reserved_concurrent_executions` protects downstream relational databases from being overwhelmed by thousands of concurrent Lambda connections."
      }
    ],
    productionCommands: [
      { cmd: "aws lambda list-functions --query 'Functions[*].[FunctionName,Runtime,MemorySize,Timeout]'", desc: "List all deployed Lambda functions, runtimes, memory allocations, and timeouts", level: "read" },
      { cmd: "aws lambda invoke --function-name <name> --payload '{\"test\": true}' response.json && cat response.json", desc: "Directly trigger a test invocation of a Lambda function from the command line", level: "write" }
    ],
    productionRules: [
      "Select `arm64` architecture (AWS Graviton) for all new Lambda functions: delivers up to 34% better price-performance compared to x86_64.",
      "Initialize database connections and SDK clients OUTSIDE the event handler function to reuse warm connection pools across invocations."
    ],
    failureModes: [
      {
        pitfall: "Connecting directly from unconstrained Lambda functions to an RDS PostgreSQL database",
        impact: "A sudden traffic spike spawns 1,000 Lambda execution environments simultaneously, opening 1,000 direct database connections and crashing PostgreSQL with `FATAL: too many connections`.",
        resolution: "Deploy **AWS RDS Proxy** between Lambda and the database to pool and multiplex connections."
      }
    ],
    realWorldScenario: {
      title: "The Cold-Start Latency Spike on VPC-Attached Lambda",
      situation: "An API Gateway backed by Lambda exhibited 4-second latency spikes on customer requests.",
      investigation: "The function was written in Java with Spring Cloud Function inside a VPC, resulting in a 3.8-second cold start.",
      fix: "Migrated the function to Node.js on Graviton ARM64 and enabled **Provisioned Concurrency** for critical endpoints, reducing P99 latency to 45ms."
    }
  },
  {
    id: "ecs-and-eks",
    name: "11. ECS and EKS",
    subtitle: "Container Orchestration: AWS Native ECS vs Standard Kubernetes EKS",
    category: "Compute & Serverless",
    mentalModel: "ECS (Elastic Container Service) is AWS's lightweight, proprietary container orchestrator deeply integrated with AWS IAM, CloudWatch, and ALBs. EKS (Elastic Kubernetes Service) is managed CNCF-compliant Kubernetes running on AWS infrastructure.",
    coreMechanism: "Both services support two compute data planes: **EC2** (you manage the worker instances and AMI patching) and **Fargate** (serverless container compute where AWS manages the underlying VMs and you pay per vCPU/RAM second). ECS uses Task Definitions; EKS uses standard Kubernetes Pod and Deployment manifests.",
    keySyntax: [
      {
        label: "ECS Fargate Task Definition with IAM Task Role",
        code: `resource "aws_ecs_task_definition" "api" {
  family                   = "core-api-task"
  network_mode             = "awsvpc" # Required for Fargate
  requires_compatibilities = ["FARGATE"]
  cpu                      = "1024" # 1 vCPU
  memory                   = "2048" # 2 GB RAM
  execution_role_arn       = aws_iam_role.ecs_execution.arn # For pulling image & logs
  task_role_arn            = aws_iam_role.ecs_task.arn      # Given to the running app

  container_definitions = jsonencode([
    {
      name      = "api"
      image     = "123456789.dkr.ecr.us-east-1.amazonaws.com/api:v1.0"
      essential = true
      portMappings = [{ containerPort = 8080 }]
    }
  ])
}`,
        explanation: "`task_role_arn` grants the running container access to S3 or DynamoDB without needing hardcoded credentials."
      }
    ],
    productionCommands: [
      { cmd: "aws ecs list-tasks --cluster <cluster_name>", desc: "List all active container task ARNs running inside an ECS cluster", level: "read" },
      { cmd: "aws eks update-kubeconfig --region <region> --name <cluster_name>", desc: "Configure local ~/.kube/config to authenticate with an AWS EKS Kubernetes cluster", level: "write" }
    ],
    productionRules: [
      "Use **AWS Fargate** for ECS and EKS whenever possible to eliminate the operational burden of managing, patching, and securing EC2 worker nodes.",
      "Distinguish between `execution_role_arn` (used by AWS to pull images and write logs) and `task_role_arn` (used by your application code to access AWS services)."
    ],
    failureModes: [
      {
        pitfall: "Deploying ECS tasks in private subnets without a NAT Gateway or VPC Endpoints for ECR",
        impact: "Tasks fail to start and get stuck in `CannotPullContainerError: timeout` because Fargate cannot reach ECR to pull the image.",
        resolution: "Ensure private subnets have outbound routes through a NAT Gateway or configure private ECR VPC Endpoints."
      }
    ],
    realWorldScenario: {
      title: "The Operational Tax of Over-Engineering with EKS",
      situation: "A team of 3 engineers spent 60% of their sprint time managing Kubernetes version upgrades, CNI daemonsets, and node groups for a simple 4-microservice app.",
      investigation: "The company chose EKS without Kubernetes expertise, creating an unsustainable operational burden.",
      fix: "Migrated the 4 microservices to AWS ECS Fargate, eliminating node management entirely and cutting infrastructure maintenance time to near zero."
    }
  },
  {
    id: "route-53",
    name: "12. Route 53",
    subtitle: "Highly Available DNS, Global Routing Policies & Health Checks",
    category: "Networking & Edge",
    mentalModel: "Amazon Route 53 is a highly available, scalable cloud Domain Name System (DNS) web service operating on a globally distributed network of Anycast DNS servers, delivering 100% SLA uptime.",
    coreMechanism: "Route 53 translates names like `example.com` into IP addresses. It features **Alias Records**, which provide free, dynamic DNS integration with AWS resources (ALBs, CloudFront distributions, S3 buckets) that automatically track IP changes. Routing policies include: Simple, Weighted, Latency-based, Geolocation, and Failover (active-passive disaster recovery).",
    keySyntax: [
      {
        label: "Route 53 Alias Record Pointing to CloudFront",
        code: `resource "aws_route53_record" "apex" {
  zone_id = aws_route53_zone.primary.zone_id
  name    = "mycompany.com"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.cdn.domain_name
    zone_id                = aws_cloudfront_distribution.cdn.hosted_zone_id
    evaluate_target_health = false
  }
}`,
        explanation: "Alias records allow mapping the apex root domain (mycompany.com) directly to AWS resources without CNAME flattening issues."
      }
    ],
    productionCommands: [
      { cmd: "aws route53 list-hosted-zones --query 'HostedZones[*].[Id,Name,ResourceRecordSetCount]'", desc: "List all public and private hosted zones in the AWS account", level: "read" },
      { cmd: "aws route53 test-dns-answer --hosted-zone-id <zone_id> --record-name <domain> --record-type A", desc: "Simulate a DNS lookup against Route 53 authoritative nameservers", level: "read" }
    ],
    productionRules: [
      "Always use Route 53 **Alias Records** instead of CNAME records when pointing to AWS resources: Alias queries are free and support apex root domains.",
      "Never lower DNS TTL below 60 seconds unless you are actively preparing for an immediate infrastructure migration."
    ],
    failureModes: [
      {
        pitfall: "Using a standard CNAME record on the root apex domain (`mycompany.com`)",
        impact: "Violates DNS RFC standards; email delivery breaks because MX records cannot coexist with a CNAME on the root domain.",
        resolution: "Use Route 53 Alias record (`type: A` with `alias` block)."
      }
    ],
    realWorldScenario: {
      title: "Global Traffic Routing Fails During Primary Region Outage",
      situation: "An AWS region outage hit US-East-1. The disaster recovery failover to US-West-2 failed to trigger.",
      investigation: "The Route 53 health check was configured to check an endpoint in US-East-1 that was unreachable, but the health check itself was tied to an internal IP.",
      fix: "Configured public Route 53 Health Checks evaluating `/health` across multiple global monitoring locations."
    }
  },
  {
    id: "cloudfront",
    name: "13. CloudFront",
    subtitle: "Global Content Delivery Network (CDN), Edge Caching & OAC",
    category: "Networking & Edge",
    mentalModel: "Amazon CloudFront is a fast, secure content delivery network (CDN) that delivers data, videos, applications, and APIs to users globally via 600+ Edge Locations with low latency and high transfer speeds.",
    coreMechanism: "CloudFront terminates TLS connections close to the user at the Edge. It caches static assets (images, JS, CSS) using Cache-Control HTTP headers. For dynamic API requests, CloudFront routes traffic back to origins (ALB, API Gateway, S3) over AWS's optimized global private fiber backbone.",
    keySyntax: [
      {
        label: "Secure CloudFront Distribution with Origin Access Control (OAC)",
        code: `resource "aws_cloudfront_distribution" "cdn" {
  origin {
    domain_name              = aws_s3_bucket.assets.bucket_regional_domain_name
    origin_id                = "S3-Assets"
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    target_origin_id       = "S3-Assets"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true # Automatically compresses with Gzip / Brotli
  }

  viewer_certificate {
    acm_certificate_arn = aws_acm_certificate.cert.arn # Must be in us-east-1!
    ssl_support_method  = "sni-only"
  }
}`,
        explanation: "TLS certificates used by CloudFront MUST be provisioned in the us-east-1 (N. Virginia) region."
      }
    ],
    productionCommands: [
      { cmd: "aws cloudfront create-invalidation --distribution-id <dist_id> --paths '/*'", desc: "HAZARDOUS: Invalidate entire global edge cache to force fresh origin pulls", level: "hazardous" },
      { cmd: "aws cloudfront list-distributions --query 'DistributionList.Items[*].[Id,DomainName,Status]'", desc: "List all active CloudFront distributions and their domain endpoints", level: "read" }
    ],
    productionRules: [
      "Always use Origin Access Control (OAC) to secure S3 origins: prevent users from bypassing CloudFront and accessing S3 directly.",
      "CloudFront ACM SSL certificates must ALWAYS be provisioned in the `us-east-1` region regardless of where your application is hosted."
    ],
    failureModes: [
      {
        pitfall: "Running wild `/*` invalidations on every CI/CD deployment",
        impact: "First 1,000 invalidation paths per month are free; beyond that, AWS charges $0.005 per path. Furthermore, cache-busting all assets hammers origin servers.",
        resolution: "Use content-hashed asset filenames (`app.a8f9b.js`) and set long Cache-Control headers (`max-age=31536000, immutable`)."
      }
    ],
    realWorldScenario: {
      title: "The $8,000 CloudFront Invalidation Bill",
      situation: "A team noticed an unexplained $8,400 line item on their AWS bill under CloudFront.",
      investigation: "Their deployment script ran `aws cloudfront create-invalidation --paths /*` across 50 staging environments on every git push.",
      fix: "Switched to hashed filenames and restricted invalidations strictly to `index.html` on production releases."
    }
  },
  {
    id: "cloudwatch",
    name: "14. CloudWatch",
    subtitle: "Observability: Metrics, Alarms, Container Insights & Log Groups",
    category: "Messaging & Observability",
    mentalModel: "Amazon CloudWatch is the monitoring and observability service for AWS, collecting operational metrics, logs, and traces across compute, storage, and networking layers.",
    coreMechanism: "Services publish standard metrics (CPU, disk, network) every 1-5 minutes. CloudWatch Logs aggregates structured text and JSON logs into Log Groups. Metric Filters scan incoming log lines with regex patterns to publish custom metrics (e.g. counting HTTP 500 occurrences). CloudWatch Alarms evaluate metric thresholds and trigger actions (SNS notifications, Auto Scaling, EC2 reboot).",
    keySyntax: [
      {
        label: "CloudWatch Alarm Triggering PagerDuty via SNS",
        code: `resource "aws_cloudwatch_metric_alarm" "api_5xx_errors" {
  alarm_name          = "api-high-5xx-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60 # 1-minute window
  statistic           = "Sum"
  threshold           = 10 # Alert if > 10 errors in 2 consecutive periods
  alarm_description   = "Triggers on elevated 5xx error rates from ALB"
  alarm_actions       = [aws_sns_topic.pagerduty_alerts.arn]
}`,
        explanation: "`evaluation_periods = 2` prevents noisy false-alarm spikes from waking up on-call engineers."
      }
    ],
    productionCommands: [
      { cmd: "aws logs tail /aws/lambda/<function_name> --follow", desc: "Live-stream tail of logs emitted by an AWS Lambda function in the terminal", level: "read" },
      { cmd: "aws cloudwatch describe-alarms --state-value ALARM", desc: "List all CloudWatch alarms across the account currently in an active ALARM state", level: "read" }
    ],
    productionRules: [
      "Always set an explicit retention period on CloudWatch Log Groups (e.g. 14, 30, or 90 days): the default retention is 'Never Expire', leading to permanent log storage costs.",
      "Write structured JSON logs from your application code to enable lightning-fast CloudWatch Logs Insights queries."
    ],
    failureModes: [
      {
        pitfall: "Leaving CloudWatch Log Groups on default 'Never Expire' retention",
        impact: "Over 3 years, debug logs accumulate into hundreds of terabytes, resulting in thousands of dollars in monthly log storage bills.",
        resolution: "Enforce retention policies across all log groups via Terraform: `retention_in_days = 30`."
      }
    ],
    realWorldScenario: {
      title: "Silent Checkout Failure for 6 Hours Due to Missing Alarms",
      situation: "An API began returning 500 errors on checkout, but no engineers noticed until customers complained on Twitter.",
      investigation: "The company had dashboards, but zero CloudWatch Alarms configured on ALB 5xx metrics or error log frequency.",
      fix: "Deployed automated CloudWatch Alarms on ALB 5XX counts and Lambda error metrics wired directly to PagerDuty."
    }
  },
  {
    id: "sqs-and-sns",
    name: "15. SQS and SNS",
    subtitle: "Asynchronous Decoupling: Queue Buffering vs Pub/Sub Fan-Out",
    category: "Messaging & Observability",
    mentalModel: "SNS (Simple Notification Service) is a **Pub/Sub** fan-out service (1 message to many subscribers). SQS (Simple Queue Service) is a **point-to-point buffer** queue (1 message to 1 consumer) that decouples system components and absorbs traffic spikes.",
    coreMechanism: "In the **SNS-to-SQS Fan-Out pattern**, an application publishes an event once to an SNS topic. Multiple SQS queues subscribe to that topic, each receiving a copy of the message for independent processing. SQS queues support Standard (at-least-once, high throughput) and FIFO (exactly-once, ordered). Dead Letter Queues (DLQs) capture poisoned messages that fail processing after `maxReceiveCount` retries.",
    keySyntax: [
      {
        label: "Production SQS Queue with Dead Letter Queue (DLQ)",
        code: `# 1. Dead Letter Queue to catch poisoned messages
resource "aws_sqs_queue" "orders_dlq" {
  name                      = "orders-processing-dlq"
  message_retention_seconds = 1209600 # Retain for 14 days
}

# 2. Main Work Queue
resource "aws_sqs_queue" "orders_queue" {
  name                       = "orders-processing-queue"
  visibility_timeout_seconds = 180 # Must be >= 6x Lambda function timeout!
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.orders_dlq.arn
    maxReceiveCount     = 3 # Move to DLQ after 3 failed attempts
  })
}`,
        explanation: "`visibility_timeout_seconds` hides the message from other consumers while one consumer is actively processing it."
      }
    ],
    productionCommands: [
      { cmd: "aws sqs get-queue-attributes --queue-url <url> --attribute-names ApproximateNumberOfMessages ApproximateNumberOfMessagesNotVisible", desc: "Inspect current queue backlog and in-flight message count", level: "read" },
      { cmd: "aws sqs purge-queue --queue-url <url>", desc: "HAZARDOUS: Delete all messages in the specified SQS queue immediately", level: "hazardous" }
    ],
    productionRules: [
      "Always configure a Dead Letter Queue (DLQ) for every production SQS queue to isolate malformed or poisoned messages.",
      "Set SQS `visibility_timeout` to at least 6 times the timeout of your consumer Lambda function to prevent duplicate processing."
    ],
    failureModes: [
      {
        pitfall: "Setting SQS visibility timeout shorter than the consumer processing time",
        impact: "While Consumer 1 is still processing a message, the visibility timeout expires. Consumer 2 picks up the same message, executing the action twice.",
        resolution: "Ensure visibility timeout is generously sized and implement consumer idempotency."
      }
    ],
    realWorldScenario: {
      title: "Duplicate Charges from Missing Idempotency in SQS Consumers",
      situation: "Customers were billed twice for single purchases during high-traffic flash sales.",
      investigation: "A database latency spike caused Lambda workers to take 32 seconds to process orders. The SQS visibility timeout was 30 seconds. SQS assumed the worker died and handed the message to a second worker.",
      fix: "Increased visibility timeout to 180 seconds and implemented idempotency checks using DynamoDB transaction locks."
    }
  },
  {
    id: "secrets-manager",
    name: "16. Secrets Manager",
    subtitle: "Credential Lifecycle: Envelope Encryption & Automated Rotation",
    category: "Security & Identity",
    mentalModel: "AWS Secrets Manager securely stores, rotates, and manages access to database credentials, API keys, and private tokens throughout their lifecycle, backed by AWS KMS envelope encryption.",
    coreMechanism: "Secrets are encrypted using an AWS KMS Customer Managed Key. Secrets Manager integrates with AWS Lambda to execute automated, zero-downtime credential rotation for RDS, Aurora, and third-party APIs. IAM policies strictly govern who or what can decrypt the secret payload.",
    keySyntax: [
      {
        label: "Retrieving Secrets via AWS SDK (Node.js) with Caching",
        code: `import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({ region: "us-east-1" });
let cachedSecret = null;
let lastFetch = 0;

export async function getDatabaseCredentials() {
  const now = Date.now();
  // Cache in-memory for 5 minutes to avoid excessive API call costs!
  if (cachedSecret && now - lastFetch < 300000) {
    return cachedSecret;
  }

  const response = await client.send(
    new GetSecretValueCommand({ SecretId: "production/rds/postgres" })
  );
  cachedSecret = JSON.parse(response.SecretString);
  lastFetch = now;
  return cachedSecret;
}`,
        explanation: "Caching secret values in application memory prevents making an expensive API call on every single HTTP request."
      }
    ],
    productionCommands: [
      { cmd: "aws secretsmanager list-secrets --query 'SecretList[*].[Name,LastRotatedDate,RotationEnabled]'", desc: "List all secrets, last rotation timestamp, and rotation status", level: "read" },
      { cmd: "aws secretsmanager get-secret-value --secret-id <secret_name> --query 'SecretString' --output text", desc: "Retrieve decrypted secret payload for authorized troubleshooting", level: "read" }
    ],
    productionRules: [
      "Cache retrieved secrets in application memory for 5-15 minutes: fetching secrets on every HTTP request creates latency and drives up API billing.",
      "Enable automated rotation on database secrets to eliminate static, never-rotated credentials."
    ],
    failureModes: [
      {
        pitfall: "Calling `GetSecretValue` on every incoming API request without in-memory caching",
        impact: "AWS throttles your calls with `ThrottlingException`, your API crashes, and you incur $0.05 per 10,000 API calls on high-traffic apps.",
        resolution: "Use the official AWS Secrets Manager client-side caching library."
      }
    ],
    realWorldScenario: {
      title: "The $4,000 Secrets Manager Request Bill",
      situation: "A microservice handling 3,000 req/sec began failing all requests and generated a $4,200 monthly Secrets Manager bill.",
      investigation: "The developer placed `getSecretValue()` inside the database query execution wrapper, making 250 million API calls in a month.",
      fix: "Implemented in-memory caching with a 5-minute TTL, cutting API calls to under 1,000 per month."
    }
  },
  {
    id: "cost-management",
    name: "17. Cost Management",
    subtitle: "FinOps Discipline: Cost Explorer, Budgets & Savings Plans",
    category: "Governance & Architecture",
    mentalModel: "Cloud cost optimization (FinOps) is a core engineering discipline. Unmonitored cloud environments lead to catastrophic billing creep. AWS provides tools to allocate, analyze, alert, and optimize cloud expenditures.",
    coreMechanism: "Cost Allocation Tags categorize spend by Environment, Service, and Owner. **AWS Budgets** monitors forecasted spend and triggers SNS/PagerDuty alerts when thresholds (e.g. 85%) are reached. **Compute Savings Plans** and **Reserved Instances** offer up to 72% discounts in exchange for 1- or 3-year hourly commit obligations. **Cost Anomaly Detection** uses machine learning to alert on unexpected spending surges.",
    keySyntax: [
      {
        label: "AWS Budget with Forecasted Spend Alerts",
        code: `resource "aws_budgets_budget" "monthly_cap" {
  name              = "monthly-total-budget"
  budget_type       = "COST"
  limit_amount      = "5000"
  limit_unit        = "USD"
  time_unit         = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 85
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED" # Alerts BEFORE you exceed the budget!
    subscriber_email_addresses = ["finops-alerts@mycompany.com"]
  }
}`,
        explanation: "`notification_type: FORECASTED` alerts you on day 10 if you are projected to exceed your monthly budget by day 30."
      }
    ],
    productionCommands: [
      { cmd: "aws ce get-cost-and-usage --time-period Start=2026-10-01,End=2026-10-31 --granularity MONTHLY --metrics 'UnblendedCost' --group-by Type=DIMENSION,Key=SERVICE", desc: "Display monthly AWS expenditure grouped by service type via Cost Explorer", level: "read" },
      { cmd: "aws budgets describe-budgets --account-id <account_id>", desc: "List all active budget limits, actual spend, and forecasted thresholds", level: "read" }
    ],
    productionRules: [
      "Mandate cost allocation tags (`Environment`, `Service`, `Owner`) on every single Terraform resource: untagged resources should fail CI linting.",
      "Purchase Compute Savings Plans instead of EC2 Instance Savings Plans for maximum flexibility across EC2, Fargate, and Lambda."
    ],
    failureModes: [
      {
        pitfall: "Running unattached, idle resources: unattached EBS volumes, idle NAT Gateways, abandoned RDS snapshots",
        impact: "Companies routinely waste 20-35% of their total cloud budget on zombie infrastructure that serves zero traffic.",
        resolution: "Run AWS Trusted Advisor or automated cleanup tools (CloudCustodian) to terminate idle resources."
      }
    ],
    realWorldScenario: {
      title: "The $45,000 EMR Cluster Running in an Empty Sandbox",
      situation: "An engineer spun up an Elastic MapReduce (EMR) cluster with 50 high-memory nodes for a weekend experiment and forgot to terminate it.",
      investigation: "The sandbox account lacked an AWS Budget alarm. The cluster ran unnoticed for 5 weeks.",
      fix: "Configured mandatory AWS Budgets with hard spending caps and auto-remediation scripts that terminate untagged sandbox resources after 24 hours."
    }
  },
  {
    id: "regions-and-azs",
    name: "18. Regions and AZs",
    subtitle: "Global Fault Domains: Blast Radius & Geographic Redundancy",
    category: "Governance & Architecture",
    mentalModel: "AWS infrastructure is built on Regions and Availability Zones. An **Availability Zone (AZ)** is one or more discrete data centers with redundant power and networking. A **Region** is a physical geographic area containing three or more completely isolated AZs connected by private low-latency fiber.",
    coreMechanism: "Designing for high availability requires distributing compute and storage across multiple AZs within a Region to survive single-datacenter disasters. Designing for disaster recovery (DR) requires replicating data across multiple distinct Regions (e.g. `us-east-1` and `us-west-2`) to survive regional catastrophic outages.",
    keySyntax: [
      {
        label: "Fault Domain Isolation Architecture",
        code: `AWS Global Infrastructure:
├── Region: us-east-1 (N. Virginia)
│   ├── Availability Zone: us-east-1a (Data Center 1 - Isolated Power & Flood Plain)
│   ├── Availability Zone: us-east-1b (Data Center 2 - Isolated Power & Flood Plain)
│   └── Availability Zone: us-east-1c (Data Center 3 - Isolated Power & Flood Plain)
│       └── High Availability Target: Multi-AZ Deployment (Active-Active)
└── Region: us-west-2 (Oregon - Fully Independent Power Grid & Fiber)
    └── Disaster Recovery Target: Cross-Region Read Replicas (Active-Passive)`,
        explanation: "AZs within a region have <2ms latency; cross-region replication is asynchronous and incurs transfer latency."
      }
    ],
    productionCommands: [
      { cmd: "aws ec2 describe-availability-zones --region <region> --query 'AvailabilityZones[*].[ZoneName,State]'", desc: "List all active, healthy Availability Zones available in a specific region", level: "read" },
      { cmd: "aws ec2 describe-regions --output table", desc: "List all enabled commercial and GovCloud AWS geographic regions", level: "read" }
    ],
    productionRules: [
      "Every production workload must be deployed across at least two Availability Zones (Multi-AZ).",
      "Be aware of cross-AZ data transfer costs: sending data between EC2 instances in different AZs costs $0.01 per GB in both directions."
    ],
    failureModes: [
      {
        pitfall: "Deploying all EC2 instances and database instances into a single Availability Zone (e.g. `us-east-1a`) to save on network transfer costs",
        impact: "When a hardware failure or fiber cut occurs in that specific AZ, your entire service suffers a complete outage.",
        resolution: "Enforce Multi-AZ deployments across Auto Scaling Groups and database tiers."
      }
    ],
    realWorldScenario: {
      title: "Data Center Fire Knocks Out Single-AZ SaaS Platform",
      situation: "A power transformer fire knocked out an entire AWS data center. A B2B SaaS platform was completely offline for 14 hours.",
      investigation: "The company had 10 EC2 instances, but all of them were manually provisioned in `us-east-1a` with single-AZ RDS.",
      fix: "Architected a fully automated Multi-AZ deployment across three Availability Zones using Terraform and Multi-AZ Aurora."
    }
  },
  {
    id: "backups",
    name: "19. Backups",
    subtitle: "Disaster Recovery: RTO, RPO, Immutable Vaults & AWS Backup",
    category: "Governance & Architecture",
    mentalModel: "Disaster Recovery is governed by two metrics: **RPO** (Recovery Point Objective - how much data can you afford to lose?) and **RTO** (Recovery Time Objective - how long can you afford to be down?). AWS Backup centralizes and automates policy-driven protection across storage services.",
    coreMechanism: "AWS Backup creates snapshot plans spanning RDS, EBS, EFS, DynamoDB, and S3. **AWS Backup Vault Lock** enforces WORM (Write Once, Read Many) compliance, cryptographically preventing anyone (even the AWS account root user) from deleting backups before their retention period expires, providing complete ransomware protection.",
    keySyntax: [
      {
        label: "AWS Backup Vault with Immutable Vault Lock",
        code: `resource "aws_backup_vault" "immutable_vault" {
  name        = "production-immutable-backup-vault"
  kms_key_arn = aws_kms_key.backup_key.arn
}

resource "aws_backup_vault_lock_configuration" "ransomware_protection" {
  backup_vault_name   = aws_backup_vault.immutable_vault.name
  min_retention_days  = 30
  max_retention_days  = 365
  changeable_for_days = 3 # After 3 days, lock is permanent and cannot be deleted!
}`,
        explanation: "Once locked, even an attacker with full root access cannot delete backups, defeating ransomware destruction attacks."
      }
    ],
    productionCommands: [
      { cmd: "aws backup list-backup-jobs --by-state COMPLETED --max-results 10", desc: "List recent completed backup executions across all managed AWS resources", level: "read" },
      { cmd: "aws rds restore-db-instance-to-point-in-time --source-db-instance-identifier <src> --target-db-instance-identifier <new> --restore-time <timestamp>", desc: "Perform Point-In-Time Recovery (PITR) to restore an RDS database to an exact minute in the past", level: "write" }
    ],
    productionRules: [
      "Regularly test restoring from backups: an untested backup is merely an unverified hypothesis.",
      "Replicate critical backups to a secondary AWS account using AWS Organizations and SCPs to defend against account takeover."
    ],
    failureModes: [
      {
        pitfall: "Relying on local snapshots within the same AWS account without Vault Lock protection",
        impact: "Ransomware attackers compromise account credentials, delete all RDS snapshots, and delete the production databases simultaneously.",
        resolution: "Replicate snapshots to an isolated backup account and enable AWS Backup Vault Lock."
      }
    ],
    realWorldScenario: {
      title: "Ransomware Deletes Staged Snapshots During Account Hijack",
      situation: "An attacker obtained an admin IAM key and ran a script that deleted all live databases and manual snapshots, demanding $500k in Bitcoin.",
      investigation: "The company had automated daily backups, but they were stored in the same account with no deletion locks.",
      fix: "Instituted AWS Backup Vault Lock and cross-account backup replication into an isolated, air-gapped AWS security account."
    }
  },
  {
    id: "well-architected",
    name: "20. Well-Architected",
    subtitle: "The 6 Pillars of Architectural Excellence & Production Readiness",
    category: "Governance & Architecture",
    mentalModel: "The AWS Well-Architected Framework provides architectural guidelines and best practices across 6 core pillars: Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, and Sustainability.",
    coreMechanism: "The framework evaluates architectures against proven engineering trade-offs: design for failure, automate manual procedures, test recovery at scale, treat infrastructure as code, decouple components, and eliminate single points of failure (SPOFs).",
    keySyntax: [
      {
        label: "The 6 Pillars Checklist",
        code: `1. Operational Excellence:
   - Infrastructure as Code (Terraform)
   - Observability: Structured logging, distributed tracing (OpenTelemetry)

2. Security:
   - Zero Trust: Least privilege IAM & IMDSv2
   - Encryption at Rest (KMS) & in Transit (TLS 1.3)

3. Reliability:
   - Multi-AZ compute and databases
   - Automated self-healing (ASGs, Healthchecks, Circuit Breakers)

4. Performance Efficiency:
   - Serverless compute (Lambda, Fargate)
   - Caching layers (CloudFront CDN, ElastiCache Redis)

5. Cost Optimization:
   - Compute Savings Plans & Right-sizing
   - Storage Lifecycle policies (S3 Intelligent-Tiering)

6. Sustainability:
   - Graviton ARM64 architecture (higher energy efficiency)`,
        explanation: "Balancing all 6 pillars ensures robust, scalable, and cost-effective cloud operations."
      }
    ],
    productionCommands: [
      { cmd: "aws wellarchitected list-workloads", desc: "List all formal Well-Architected Review workloads registered in the account", level: "read" },
      { cmd: "aws securityhub get-findings --filters '{\"SeverityLabel\": [{\"Value\": \"CRITICAL\", \"Comparison\": \"EQUALS\"}]}'", desc: "Retrieve critical security compliance findings across the AWS environment", level: "read" }
    ],
    productionRules: [
      "Conduct a formal AWS Well-Architected Review on every major workload before launching to production.",
      "Design every system with the fundamental assumption that any single component, AZ, or dependency can and will fail."
    ],
    failureModes: [
      {
        pitfall: "Optimizing exclusively for cost at the expense of reliability (single-AZ, no backups, no auto-scaling)",
        impact: "The company saves $200/month on infrastructure, but loses $250,000 in customer revenue during an unrecovered 8-hour outage.",
        resolution: "Evaluate engineering trade-offs across all 6 pillars rather than treating cost in isolation."
      }
    ],
    realWorldScenario: {
      title: "The Single-Point-of-Failure Outage that Closed a Funding Round",
      situation: "During an investor demo, a cloud platform crashed completely and remained down for 3 hours.",
      investigation: "The company ran a single monolithic Redis server on a t3.small EC2 instance in a public subnet without backups or failover. When the instance ran out of memory, the entire app crashed.",
      fix: "Architected a Well-Architected Multi-AZ Amazon ElastiCache cluster with automatic failover and Redis replica nodes."
    }
  }
];

