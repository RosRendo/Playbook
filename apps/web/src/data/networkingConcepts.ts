export interface NetworkingCommand {
  cmd: string;
  desc: string;
  level: "read" | "write" | "hazardous";
}

export interface NetworkingConceptDetail {
  id: string;
  number: string;
  title: string;
  tagline: string;
  category:
    | "Architectural Models & Layers"
    | "Addressing & Routing"
    | "Name Resolution & Web Protocols"
    | "Sockets & Ingress Infrastructure"
    | "Security & Virtual Networks"
    | "Diagnostics & Performance";
  mentalModel: string;
  keySyntax: string;
  productionCommands: NetworkingCommand[];
  productionRules: string[];
  failureModes: string[];
  realWorldScenario: string;
}

export const NETWORKING_CONCEPTS: NetworkingConceptDetail[] = [
  {
    id: "osi-model",
    number: "01",
    title: "OSI Model",
    tagline: "The 7-layer theoretical blueprint of computer communication and encapsulation",
    category: "Architectural Models & Layers",
    mentalModel:
      "The Open Systems Interconnection (OSI) model standardizes network communication into 7 distinct abstraction layers. As data moves down the stack from Layer 7 to Layer 1, each layer wraps the payload with its own protocol header (Encapsulation). On reception, the reverse occurs (Decapsulation).\n- Layer 7 (Application): HTTP, DNS, SSH, gRPC (Human-facing protocols)\n- Layer 6 (Presentation): TLS/SSL, Data serialization, JSON, Gzip\n- Layer 5 (Session): RPC, Sockets, Session authentication\n- Layer 4 (Transport): TCP (reliable/ordered), UDP (fast/lossy), Ports\n- Layer 3 (Network): IP Addressing (IPv4/IPv6), Routers, ICMP\n- Layer 2 (Data Link): Ethernet, MAC addresses, Switches, VLANs\n- Layer 1 (Physical): Fiber optics, Copper twisted pair, Wi-Fi radio waves",
    keySyntax:
      "Data Unit by Layer:\nLayer 7 (Application)   → Data (HTTP Request / JSON)\nLayer 6 (Presentation)  → Encrypted / Formatted Data (TLS)\nLayer 5 (Session)       → Managed Session Payload\nLayer 4 (Transport)     → Segment (TCP) / Datagram (UDP) [Adds Port Headers]\nLayer 3 (Network)       → Packet [Adds Source & Dest IP Addresses]\nLayer 2 (Data Link)     → Frame [Adds Source & Dest MAC Addresses]\nLayer 1 (Physical)      → Bits (Electrical Pulses / Photons)",
    productionCommands: [
      { cmd: "tcpdump -nnvv -i eth0 port 443", desc: "Capture and decode packet headers across L2, L3, and L4 in real time.", level: "read" },
      { cmd: "ip link show", desc: "Inspect Layer 2 network interfaces, MTU byte sizes, and MAC addresses.", level: "read" },
      { cmd: "ip route show", desc: "Inspect Layer 3 IP routing table and default gateway next-hops.", level: "read" },
      { cmd: "ss -tulpn", desc: "Inspect Layer 4 TCP/UDP transport listening ports and socket states.", level: "read" },
      { cmd: "curl -Iv https://api.domain.com", desc: "Audit Layer 7 HTTP application handshake and TLS presentation headers.", level: "read" }
    ],
    productionRules: [
      "Always troubleshoot bottom-up: verify Layer 3 (can I ping the IP?) before debugging Layer 7 (why did HTTP return 502?).",
      "Understand packet overhead: Ethernet frame (14B) + IP header (20B) + TCP header (20B) = 54 bytes of metadata per packet.",
      "Never confuse Layer 4 load balancing (TCP stream proxying) with Layer 7 load balancing (HTTP header and path routing)."
    ],
    failureModes: [
      "Debugging API code for 2 hours when an engineer discovers the Layer 1 network cable was unplugged or virtual NIC link was DOWN.",
      "MTU mismatches causing packet fragmentation drops when tunneling packets through VPNs with >1500 byte payloads."
    ],
    realWorldScenario:
      "A developer encounters intermittent connection timeouts to a database. Pings succeed (Layer 3 OK), but large queries hang. Running 'ip link show' reveals a 1400-byte MTU on the VPN interface dropping 1500-byte jumbo packets. Setting 'mss clamp' on the router solves the freeze."
  },
  {
    id: "tcp-vs-udp",
    number: "02",
    title: "TCP vs UDP",
    tagline: "Reliable byte-streams with flow control vs connectionless low-latency datagrams",
    category: "Architectural Models & Layers",
    mentalModel:
      "- TCP (Transmission Control Protocol): Connection-oriented, ordered, reliable, and byte-stream based. Requires a 3-way handshake (SYN, SYN-ACK, ACK) before transmitting data. Guarantees packet delivery via sequence numbers and ACK receipts. Employs Congestion Control and Flow Control (Sliding Window). If a packet drops, TCP retransmits and holds subsequent packets in queue (Head-of-Line Blocking).\n- UDP (User Datagram Protocol): Connectionless, unordered, and lightweight. Sends datagrams fire-and-forget without handshakes or retransmission guarantees. Minimal 8-byte header overhead. Ideal for VoIP, DNS queries, video streaming, online multiplayer games, and modern HTTP/3 (QUIC).",
    keySyntax:
      "TCP 3-Way Handshake:\nClient                        Server\n  │ ─── SYN (Seq=X) ─────────> │\n  │ <── SYN-ACK (Seq=Y,Ack=X+1)│\n  │ ─── ACK (Ack=Y+1) ───────> │  (Connection ESTABLISHED)\n\nTCP 4-Way Teardown: FIN -> ACK -> FIN -> ACK\nTCP Header Size: 20–60 bytes | UDP Header Size: 8 bytes",
    productionCommands: [
      { cmd: "ss -t -a", desc: "Display all TCP sockets with connection states (ESTABLISHED, SYN_SENT, TIME_WAIT).", level: "read" },
      { cmd: "ss -u -a", desc: "Display all connectionless UDP socket listeners.", level: "read" },
      { cmd: "nc -zv <TARGET_IP> 443", desc: "Test TCP 3-way handshake port connectivity using netcat.", level: "read" },
      { cmd: "nc -zvu <TARGET_IP> 53", desc: "Test UDP datagram socket reachability (e.g. DNS port 53).", level: "read" },
      { cmd: "sysctl net.ipv4.tcp_congestion_control", desc: "Query active TCP congestion algorithm (e.g. cubic, bbr).", level: "read" }
    ],
    productionRules: [
      "Use TCP for financial transactions, API requests, and database mutations where zero packet loss is mandatory.",
      "Switch web servers to Google BBR congestion control ('net.ipv4.tcp_congestion_control=bbr') to double throughput on lossy networks.",
      "Remember that UDP requires application-level logic (like QUIC/HTTP/3) if reliability, ordering, or replay protection is needed."
    ],
    failureModes: [
      "Head-of-Line blocking in HTTP/2 (over single TCP connection): 1 dropped packet stalls all multiplexed streams until retransmitted.",
      "SYN flood attacks exhaust server connection tables (TCP backlog) by sending millions of SYN packets without answering the final ACK."
    ],
    realWorldScenario:
      "A live video stream stutters and buffers under high latency using TCP. The engineering team switches the streaming ingest protocol from RTMP (TCP) to WebRTC (UDP). Latency plummets from 3,500ms to 180ms because dropped frames are discarded rather than retransmitted."
  },
  {
    id: "ip-addressing",
    number: "03",
    title: "IP Addressing",
    tagline: "Hierarchical Layer 3 host addressing: IPv4 (32-bit), IPv6 (128-bit), and Private RFC 1918",
    category: "Addressing & Routing",
    mentalModel:
      "An IP address uniquely identifies a network interface on an internetwork. IPv4 uses 32 bits represented as 4 decimal octets (e.g. `192.168.1.1`). Because 4.3 billion IPv4 addresses are exhausted, RFC 1918 reserves private address spaces that are non-routable on the public internet:\n- `10.0.0.0/8` (10.0.0.0 – 10.255.255.255: Enterprise networks, VPCs)\n- `172.16.0.0/12` (172.16.0.0 – 172.31.255.255: Docker default bridge networks)\n- `192.168.0.0/16` (192.168.0.0 – 192.168.255.255: Home and office LANs)\n- `127.0.0.0/8` (Loopback interface `localhost`)\nIPv6 expands address space to 128 bits (e.g. `2001:0db8:85a3::8a2e:0370:7334`), eliminating NAT requirements.",
    keySyntax:
      "IPv4 Octet Structure: 192.168.1.50\nBinary: 11000000 . 10101000 . 00000001 . 00110010 (32 bits total)\n\nRFC 1918 Private Ranges (Never routed on Public Internet):\nClass A: 10.0.0.0/8       (16.7M hosts)\nClass B: 172.16.0.0/12    (1.04M hosts)\nClass C: 192.168.0.0/16   (65.5k hosts)",
    productionCommands: [
      { cmd: "ip -4 addr show", desc: "List all IPv4 addresses assigned to active local network interfaces.", level: "read" },
      { cmd: "ip -6 addr show", desc: "List all IPv6 addresses and link-local scope addresses.", level: "read" },
      { cmd: "curl -s https://checkip.amazonaws.com", desc: "Query external public WAN IP assigned to egress internet gateway.", level: "read" },
      { cmd: "hostname -I", desc: "Print all internal and external IP addresses bound to host machine.", level: "read" }
    ],
    productionRules: [
      "Never assign public routable IP addresses directly to internal database or cache instances; isolate them in private RFC 1918 subnets.",
      "Always design cloud VPC CIDR blocks to avoid overlapping ranges (e.g. don't use 192.168.1.0/24 in both cloud and office to allow VPN peering).",
      "Treat loopback `127.0.0.1` as strictly node-local; containers cannot reach host loopback without host networking mode."
    ],
    failureModes: [
      "VPC peering failure: Two cloud VPCs cannot route traffic because both were provisioned with the identical `10.0.0.0/16` CIDR block.",
      "Binding a microservice to `127.0.0.1:3000` inside a Docker container makes it unreachable from the host port forward (must bind to `0.0.0.0:3000`)."
    ],
    realWorldScenario:
      "A developer spins up an Express server inside Docker listening on `127.0.0.1:8080`. Host curl to `localhost:8080` returns 'connection refused'. The developer changes the listen binding to `0.0.0.0:8080` (all interfaces), and traffic immediately passes through the container bridge."
  },
  {
    id: "subnets-and-cidr",
    number: "04",
    title: "Subnets and CIDR",
    tagline: "Classless Inter-Domain Routing: Subnet masks, network prefixes, and host allocation",
    category: "Addressing & Routing",
    mentalModel:
      "CIDR (Classless Inter-Domain Routing) divides an IP address into two parts: the **Network Prefix** (identifies the subnet) and the **Host Identifier** (identifies the specific machine). The slash notation (e.g. `/24`) specifies the number of leading bits fixed for the network. In any subnet, 2 addresses are reserved by the networking standard:\n- Network Address (All host bits 0): Identifies the subnet itself (`192.168.1.0`)\n- Broadcast Address (All host bits 1): Broadcasts to all hosts on the subnet (`192.168.1.255`)\nCloud providers (AWS/GCP) reserve an additional 3 addresses (Gateway `.1`, DNS `.2`, Future `.3`), meaning a `/24` yields $256 - 5 = 251$ usable cloud IPs.",
    keySyntax:
      "CIDR Calculation Cheat Sheet:\n/32 → 1 IP      (Single host: 255.255.255.255)\n/28 → 16 IPs    (11 usable in AWS)\n/24 → 256 IPs   (251 usable in AWS: 255.255.255.0)\n/20 → 4,096 IPs (Standard cloud subnet size)\n/16 → 65,536 IPs(Standard VPC network size: 255.255.0.0)\n/8  → 16.7M IPs (255.0.0.0)",
    productionCommands: [
      { cmd: "ipcalc 192.168.1.0/24", desc: "Calculate netmask, broadcast, host range, and total usable addresses.", level: "read" },
      { cmd: "ip route | grep default", desc: "Display default route CIDR scope and gateway IP interface.", level: "read" },
      { cmd: "sudo ip addr add 10.0.1.50/24 dev eth0", desc: "Assign secondary static IP address within a /24 subnet to interface eth0.", level: "write" }
    ],
    productionRules: [
      "Provision production VPCs with at least a `/16` (65,536 IPs); subnets provisioned with `/28` run out of IPs during Kubernetes auto-scaling.",
      "Remember that AWS reserves 5 IP addresses per subnet (.0, .1, .2, .3, and .255).",
      "Isolate subnets by function: Public Subnet (`10.0.1.0/24` with IGW) vs Private Subnet (`10.0.10.0/24` with NAT Gateway)."
    ],
    failureModes: [
      "A Kubernetes cluster cannot spawn new worker pods because the node's `/26` pod subnet exhausted its 62 available IP addresses.",
      "Subnet mask typo (`/16` entered as `/24`) isolates servers on the same local switch from routing packets to each other."
    ],
    realWorldScenario:
      "During a Black Friday traffic surge, an EKS cluster fails to scale out nodes with 'InsufficientFreeAddressesInSubnet'. The subnet was a small `/28`. The DevOps engineer migrates to a `/20` subnet (4,096 IPs), allowing the cluster to scale freely."
  },
  {
    id: "dns-domain-name-system",
    number: "05",
    title: "DNS",
    tagline: "The phonebook of the internet: Recursive revolvers, Authoritative nameservers, and Records",
    category: "Name Resolution & Web Protocols",
    mentalModel:
      "DNS resolves human-readable domain names (`api.stripe.com`) into routable IP addresses (`54.187.159.182`). Resolution follows a hierarchical query chain:\n1. Browser & OS Cache (`/etc/hosts`)\n2. Recursive Resolver (ISP, Cloudflare `1.1.1.1`, Google `8.8.8.8`)\n3. Root Nameservers (`.`, 13 worldwide logical clusters)\n4. Top-Level Domain (TLD) Nameservers (`.com`, `.org`)\n5. Authoritative Nameservers (Where the domain owner manages DNS records, e.g. Route53, Cloudflare)\nRecords include: `A` (IPv4), `AAAA` (IPv6), `CNAME` (Alias), `MX` (Mail), `TXT` (SPF/DKIM/Domain verification), and `NS` (Delegation).",
    keySyntax:
      "DNS Record Architecture:\nA       api.example.com.      → 104.21.45.12    (IPv4 target)\nAAAA    api.example.com.      → 2606:4700::6815 (IPv6 target)\nCNAME   www.example.com.      → example.com.    (Canonical alias)\nTXT     example.com.          → \"v=spf1 ...\"    (Authentication / Verification)\nTTL (Time to Live)            → 300 (seconds record can be cached)",
    productionCommands: [
      { cmd: "dig +trace api.github.com", desc: "Trace hierarchical DNS resolution from root servers down to authoritative host.", level: "read" },
      { cmd: "dig @1.1.1.1 example.com A +noall +answer", desc: "Query Cloudflare DNS directly for A-records, filtering metadata.", level: "read" },
      { cmd: "dig example.com TXT +short", desc: "Fetch domain TXT verification and SPF records.", level: "read" },
      { cmd: "nslookup -type=mx google.com", desc: "Quick lookup of target domain mail exchange routing.", level: "read" },
      { cmd: "cat /etc/resolv.conf", desc: "Inspect local operating system upstream DNS resolver configuration.", level: "read" }
    ],
    productionRules: [
      "Lower TTL to 60–300 seconds 48 hours BEFORE major production migrations or DNS cutovers to allow rapid rollbacks.",
      "Never put a CNAME record at the domain apex (`@` / `example.com`); standard DNS RFC prohibits CNAME alongside SOA/NS records (use ALIAS/ANAME).",
      "Always set up both IPv4 (A) and IPv6 (AAAA) records to prevent dual-stack fallback timeout latency."
    ],
    failureModes: [
      "Migrating servers with a 86400 (24-hour) TTL leaves 50% of global customers hitting dead decommissioned IP addresses for a full day.",
      "Misconfigured `/etc/resolv.conf` on a Linux server causes every database connection string query to stall for 5 seconds on DNS timeout."
    ],
    realWorldScenario:
      "A production domain cutover stalls. Half the team sees the new app, half sees the old one. Running `dig @8.8.8.8 domain.com` reveals Google's cache has 14,000 seconds remaining because the previous engineer forgot to lower the TTL before the migration."
  },
  {
    id: "http-and-https",
    number: "06",
    title: "HTTP and HTTPS",
    tagline: "Stateless application layer protocol: Methods, status codes, multiplexing, and headers",
    category: "Name Resolution & Web Protocols",
    mentalModel:
      "HTTP (Hypertext Transfer Protocol) is the request-response foundation of the web. HTTPS wraps HTTP in a TLS encrypted tunnel on port 443.\n- HTTP/1.1: Head-of-line blocking on single connections; browsers open 6 parallel TCP connections per domain.\n- HTTP/2: Binary framing, single TCP connection with multiplexed concurrent streams, header compression (HPACK), and server push.\n- HTTP/3: Replaces TCP with UDP-based QUIC. Eliminates TCP head-of-line blocking across lossy cellular networks and enables 0-RTT handshakes.\n- Status code categories: 1xx Informational, 2xx Success, 3xx Redirection, 4xx Client Error, 5xx Server Error.",
    keySyntax:
      "HTTP Message Anatomy:\nRequest:  POST /api/v1/checkout HTTP/1.1\nHeaders:  Host: api.stripe.com | Authorization: Bearer xxx | Content-Type: application/json\nBody:     {\"amount\": 4900, \"currency\": \"usd\"}\n\nResponse: HTTP/1.1 200 OK\nHeaders:  Content-Type: application/json | Set-Cookie: session=...; HttpOnly; Secure; SameSite=Strict\nBody:     {\"status\": \"succeeded\", \"id\": \"ch_123\"}",
    productionCommands: [
      { cmd: "curl -Iv https://httpbin.org/get", desc: "Display full HTTP request and response headers with TLS cipher details.", level: "read" },
      { cmd: "curl --http2 -I https://cloudflare.com", desc: "Verify server supports HTTP/2 binary framing protocol.", level: "read" },
      { cmd: "curl --http3 -I https://cloudflare.com", desc: "Test whether edge supports cutting-edge HTTP/3 (QUIC over UDP).", level: "read" },
      { cmd: "curl -w \"DNS: %{time_namelookup}s | Connect: %{time_connect}s | TLS: %{time_appconnect}s | TTFB: %{time_starttransfer}s | Total: %{time_total}s\n\" -so /dev/null https://google.com", desc: "Deep latency timing breakdown of HTTP request lifecycle.", level: "read" }
    ],
    productionRules: [
      "Always set 'Cache-Control: no-store' on authenticated API endpoints returning sensitive user data.",
      "Always include 'Strict-Transport-Security: max-age=31536000; includeSubDomains; preload' (HSTS) to force HTTPS.",
      "Never transmit authorization headers or session cookies over unencrypted plaintext HTTP (port 80)."
    ],
    failureModes: [
      "Missing CORS headers (`Access-Control-Allow-Origin`) causes browser frontend SPAs to reject API responses.",
      "Nginx upstream returning HTTP 504 Gateway Timeout because Node.js backend took >60s to finish an unindexed database query."
    ],
    realWorldScenario:
      "A React app reports slow dashboard load times. The engineer runs the curl timing command and notices TTFB (Time To First Byte) is 1.8s while DNS and TLS are 30ms. This confirms the delay is backend database query execution, not network latency."
  },
  {
    id: "tls-certificates",
    number: "07",
    title: "TLS Certificates",
    tagline: "Cryptographic privacy and integrity: Public Key Infrastructure (PKI), SNI, and ACME renewal",
    category: "Name Resolution & Web Protocols",
    mentalModel:
      "TLS (Transport Layer Security) encrypts communication between browser and server, providing Confidentiality (no eavesdropping), Integrity (no tampering), and Authentication (proves server identity). During the TLS 1.3 handshake:\n1. Client sends `ClientHello` with supported ciphers and SNI (Server Name Indication: specifies target hostname for virtual hosting).\n2. Server replies with `ServerHello` and its X.509 Digital Certificate signed by a trusted Certificate Authority (CA).\n3. Client validates the cryptographic signature chain back to a root CA embedded in the OS trust store.\n4. Both sides derive a shared symmetric encryption session key using Diffie-Hellman (ECDHE) for blazingly fast payload encryption.",
    keySyntax:
      "TLS Handshake Flow (TLS 1.3 = 1 Round Trip):\nClient                                    Server\n  │ ─── ClientHello (SNI, Ciphers, KeyShare) ─> │\n  │ <── ServerHello (Certificate, KeyShare) ─── │\n  │     (Both derive AES session keys)          │\n  │ <── Finished (Encrypted) ────────────────── │\n  │ ─── HTTP Request (Encrypted with AES) ────> │ (1 RTT total)",
    productionCommands: [
      { cmd: "echo | openssl s_client -servername example.com -connect example.com:443 2>/dev/null | openssl x509 -noout -dates -issuer", desc: "Audit live certificate validity dates, expiration, and issuing CA.", level: "read" },
      { cmd: "sudo certbot certonly --nginx -d domain.com -d www.domain.com", desc: "Issue Let's Encrypt automated TLS certificate via ACME protocol.", level: "write" },
      { cmd: "sudo certbot renew --dry-run", desc: "Simulate automated certbot certificate renewal challenge.", level: "read" },
      { cmd: "openssl x509 -in /etc/ssl/cert.pem -text -noout | grep -A 2 'Subject Alternative Name'", desc: "Inspect Subject Alternative Names (SANs) covered by certificate.", level: "read" }
    ],
    productionRules: [
      "Always set up automated renewal cron or systemd timer (`certbot renew`) and monitor certificate expiration with alerts at 30 days.",
      "Ensure intermediate certificates are bundled properly (fullchain.pem); missing intermediates cause mobile browser SSL errors.",
      "Use modern TLS 1.2 and TLS 1.3 only; disable obsolete, vulnerable SSLv3, TLS 1.0, and TLS 1.1 in Nginx."
    ],
    failureModes: [
      "Certificate expires unnoticed at midnight on Sunday, triggering red 'YOUR CONNECTION IS NOT PRIVATE' browser security blocks for all users.",
      "Serving only `cert.pem` instead of `fullchain.pem` in Nginx causes Android and curl clients to fail validation with 'unable to get local issuer certificate'."
    ],
    realWorldScenario:
      "A SaaS customer reports mobile app login failures while desktop browsers succeed. Running `openssl s_client` reveals the server is missing the intermediate CA certificate. Updating Nginx from `ssl_certificate cert.pem` to `ssl_certificate fullchain.pem` resolves the trust chain."
  },
  {
    id: "ports-and-sockets",
    number: "08",
    title: "Ports and Sockets",
    tagline: "Layer 4 multiplexing: The TCP 4-tuple, ephemeral ports, and socket lifecycle states",
    category: "Sockets & Ingress Infrastructure",
    mentalModel:
      "While an IP address delivers packets to a physical or virtual host, **Ports** (0–65535) direct packets to specific application processes running on that host. A socket is an OS file descriptor binding an IP address and port. A complete TCP connection is uniquely identified across the internet by a **4-Tuple**:\n`(Source IP, Source Port, Destination IP, Destination Port)`\nPort classes:\n- Well-Known Ports (0–1023): Privileged (require root to bind). HTTP (80), HTTPS (443), SSH (22), DNS (53).\n- Registered Ports (1024–49151): User daemons. PostgreSQL (5432), Redis (6379), Node.js (3000).\n- Dynamic / Ephemeral Ports (49152–65535): Assigned by OS for outbound client connections.\nKey socket states: `LISTEN`, `ESTABLISHED`, `CLOSE_WAIT` (app hasn't closed socket), `TIME_WAIT` (OS waiting 2*MSL to ensure delayed packets clear).",
    keySyntax:
      "Standard Server Port Map:\n22   → SSH (Remote Terminal)\n53   → DNS (Domain Resolution)\n80   → HTTP (Web Ingress)\n443  → HTTPS (Encrypted Web)\n3000 → Node.js / Next.js Internal\n5432 → PostgreSQL Store\n6379 → Redis Cache\n\nSocket State: LISTEN → SYN_RECEIVED → ESTABLISHED → FIN_WAIT → TIME_WAIT → CLOSED",
    productionCommands: [
      { cmd: "ss -tulpn", desc: "List all listening TCP and UDP sockets with owning process names and PIDs.", level: "read" },
      { cmd: "lsof -i :3000", desc: "Find exact PID and command locking port 3000 to resolve EADDRINUSE.", level: "read" },
      { cmd: "sudo fuser -k 3000/tcp", desc: "Forcefully kill whatever process is currently occupying TCP port 3000.", level: "hazardous" },
      { cmd: "cat /proc/sys/net/ipv4/ip_local_port_range", desc: "Inspect OS ephemeral outbound port allocation range.", level: "read" },
      { cmd: "ss -s", desc: "Summary statistics of active, closed, and timewait sockets in kernel memory.", level: "read" }
    ],
    productionRules: [
      "Never run user-space application servers directly on port 80/443; bind to an unprivileged port (3000) and reverse-proxy through Nginx.",
      "Tune `tcp_tw_reuse = 1` in high-throughput API gateways to prevent ephemeral port exhaustion under heavy traffic.",
      "Investigate accumulating `CLOSE_WAIT` sockets; it indicates your application code is leaking open sockets without calling `socket.close()`."
    ],
    failureModes: [
      "EADDRINUSE: Node server crashes on startup because an orphaned previous background process is still holding port 3000.",
      "Ephemeral Port Exhaustion: Reverse proxy cannot open new outbound connections to upstream backends because 60,000 connections are stuck in TIME_WAIT."
    ],
    realWorldScenario:
      "After an automated deployment, a Next.js server fails to start with 'Error: listen EADDRINUSE: address already in use :::3000'. The engineer runs `lsof -i :3000`, discovers a zombie node process from the old deploy, and kills it with `fuser -k 3000/tcp`, allowing the new version to bind cleanly."
  },
  {
    id: "load-balancers",
    number: "09",
    title: "Load Balancers",
    tagline: "Distributing traffic: L4 vs L7 balancing, health checks, and algorithms",
    category: "Sockets & Ingress Infrastructure",
    mentalModel:
      "A Load Balancer sits between incoming client traffic and a fleet of backend servers, preventing any single server from becoming a bottleneck or single point of failure (SPOF).\n- Layer 4 (Transport / NLB): Routes packets based on IP and TCP/UDP ports without inspecting application payloads. Ultra-high throughput (millions of requests/sec) with microsecond latency. Cannot inspect HTTP headers, cookies, or URL paths.\n- Layer 7 (Application / ALB): Decodes the HTTP protocol. Can inspect request paths (`/api` vs `/static`), host headers, authorization tokens, and cookies. Performs SSL Termination and intelligent routing.\nBalancing Algorithms: Round Robin, Least Connections (best for long transactions), IP Hash (session persistence), and Weighted Distribution.\nActive Health Checks periodically poll `/healthz` and automatically deregister failing nodes.",
    keySyntax:
      "Traffic Routing Topologies:\nClient ──> [ Layer 7 Load Balancer (ALB) ]\n                     │\n      ┌──────────────┼──────────────┐\n      ▼              ▼              ▼\n/api/*          /static/*       /checkout/*\n[ API Cluster ] [ CDN S3 ]      [ Payment Service ]\n\nHealth Check: GET /healthz (200 OK within 2s) every 10s. 3 failures = Unhealthy (removed from pool).",
    productionCommands: [
      { cmd: "curl -I https://lb.domain.com/healthz", desc: "Verify application health check endpoint status code.", level: "read" },
      { cmd: "sudo haproxy -c -f /etc/haproxy/haproxy.cfg", desc: "Validate HAProxy load balancer configuration syntax.", level: "read" },
      { cmd: "tail -f /var/log/haproxy.log", desc: "Follow HAProxy ingress routing, server selection, and error logs.", level: "read" }
    ],
    productionRules: [
      "Always implement a dedicated `/healthz` endpoint that verifies critical dependencies (DB read test) before returning 200 OK.",
      "Use 'Least Connections' algorithm for stateful or long-running requests; use 'Round Robin' for uniform stateless endpoints.",
      "Ensure load balancers pass the client's real public IP via `X-Forwarded-For` and protocol via `X-Forwarded-Proto`."
    ],
    failureModes: [
      "Health check false positive: `/healthz` tests an external third-party API that goes down, causing the load balancer to declare ALL backend servers dead simultaneously (cascading outage).",
      "Sticky sessions pinning 80% of traffic to 1 overloaded server while 4 other servers sit idle."
    ],
    realWorldScenario:
      "A database goes into high CPU load. Server #1 slows down, taking 4s per request, while Server #2 responds in 20ms. Using Round Robin, Server #1 backs up and crashes. Switching the load balancer to 'Least Connections' immediately diverts new requests to Server #2, saving the fleet."
  },
  {
    id: "reverse-proxy",
    number: "10",
    title: "Reverse Proxy",
    tagline: "The gateway shield: Nginx, Traefik, SSL termination, caching, and header forwarding",
    category: "Sockets & Ingress Infrastructure",
    mentalModel:
      "While a Forward Proxy acts on behalf of clients (e.g. corporate internet filtering), a **Reverse Proxy** acts on behalf of backend servers. Clients connect to the reverse proxy (Nginx, Caddy, Traefik, HAProxy) believing it is the origin. The reverse proxy provides:\n1. Security Isolation: Backend servers hide in a private network without public IPs.\n2. SSL/TLS Termination: Decrypts HTTPS once at the edge, communicating with backends via fast internal HTTP.\n3. Compression & Caching: Gzip/Brotli compression and static asset caching.\n4. Rate Limiting: Drops abusive DDoS bursts before they reach application code.\n5. Request Rewriting: Forwards client metadata using `X-Forwarded-For`, `X-Forwarded-Proto`, and `Host`.",
    keySyntax:
      "Standard Nginx Reverse Proxy Block:\nserver {\n    listen 443 ssl http2;\n    server_name api.domain.com;\n\n    ssl_certificate /etc/letsencrypt/live/domain.com/fullchain.pem;\n    ssl_certificate_key /etc/letsencrypt/live/domain.com/privkey.pem;\n\n    location / {\n        proxy_pass http://127.0.0.1:3000;\n        proxy_http_version 1.1;\n        proxy_set_header Upgrade $http_upgrade;\n        proxy_set_header Connection 'upgrade';\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto $scheme;\n    }\n}",
    productionCommands: [
      { cmd: "sudo nginx -t", desc: "Validate Nginx configuration syntax and virtual host files before reloading.", level: "read" },
      { cmd: "sudo systemctl reload nginx", desc: "Zero-downtime graceful reload of Nginx master process and workers.", level: "write" },
      { cmd: "sudo tail -f /var/log/nginx/error.log", desc: "Inspect upstream 502/504 errors and reverse proxy connection drops.", level: "read" },
      { cmd: "curl -Iv -H 'Host: api.domain.com' http://127.0.0.1:80", desc: "Test local Nginx virtual host mapping directly on server.", level: "read" }
    ],
    productionRules: [
      "Always execute 'sudo nginx -t' before reloading; a single syntax error in Nginx will cause service reboots to fail.",
      "Always forward 'X-Forwarded-Proto $scheme'; without it, backend frameworks redirect in an infinite HTTPS loop.",
      "Configure 'client_max_body_size' appropriately (default is 1MB in Nginx; file upload endpoints fail with HTTP 413 without it)."
    ],
    failureModes: [
      "HTTP 502 Bad Gateway: Nginx is running, but the backend application process on port 3000 crashed or is not listening.",
      "Infinite redirect loop: Backend sees incoming plaintext HTTP from Nginx proxy pass and issues a 301 redirect to HTTPS over and over."
    ],
    realWorldScenario:
      "Customers report HTTP 502 Bad Gateway when visiting `app.com`. The engineer checks `sudo systemctl status nginx` (it's active), then runs `ss -tulpn | grep 3000`. Port 3000 is empty—the Node.js process crashed on an unhandled promise rejection. Restarting Node clears the 502 immediately."
  },
  {
    id: "network-address-translation",
    number: "11",
    title: "NAT",
    tagline: "Conserving IPv4: Source NAT (Masquerading), Destination NAT (Port Forwarding), and Gateways",
    category: "Addressing & Routing",
    mentalModel:
      "Network Address Translation (NAT) modifies IP address headers in transit through a router/firewall.\n- SNAT (Source NAT / Masquerading): Used when private subnet instances (`10.0.1.50`) initiate outbound connections to the internet. The router replaces the private source IP with its single public WAN IP and tracks the connection in a state table. Return packets are translated back to the private host.\n- DNAT (Destination NAT / Port Forwarding): Rewrites the destination IP of incoming packets. Used to expose internal services (e.g. forward public IP port 80 to internal IP `10.0.1.10:80`).\nIn cloud architectures (AWS/GCP), **NAT Gateways** allow private database subnets to download software updates and security patches while blocking all direct inbound connections from the public internet.",
    keySyntax:
      "SNAT (Outbound Internet Egress):\n[ Private DB: 10.0.2.15 ] ──> [ NAT Gateway: 54.200.10.5 ] ──> [ GitHub: 140.82.121.4 ]\n(Source IP rewritten from 10.0.2.15 to 54.200.10.5 on outbound packets)\n\nDNAT (Inbound Port Forwarding):\n[ Client: 203.0.113.1 ] ──> [ Router WAN: 54.200.10.5:8080 ] ──> [ Internal App: 10.0.1.5:80 ]",
    productionCommands: [
      { cmd: "sudo iptables -t nat -L -n -v", desc: "List active Linux kernel NAT translation tables and packet counters.", level: "read" },
      { cmd: "sudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE", desc: "Enable Source NAT (Masquerading) outbound on interface eth0.", level: "write" },
      { cmd: "cat /proc/net/nf_conntrack | head -n 30", desc: "Inspect live kernel NAT connection tracking table.", level: "read" },
      { cmd: "sysctl net.ipv4.ip_forward", desc: "Verify kernel IPv4 packet forwarding is enabled (required for NAT routers).", level: "read" }
    ],
    productionRules: [
      "Place databases, redis instances, and backend workers in private subnets routed through a NAT Gateway for outbound egress only.",
      "Monitor NAT connection tracking tables (`nf_conntrack_max`); under extreme concurrent connection bursts, conntrack table exhaustion drops packets.",
      "Never put high-throughput inter-service traffic through a cloud NAT Gateway; cloud providers charge heavy per-GB egress fees."
    ],
    failureModes: [
      "Kernel `nf_conntrack: table full, dropping packet`: NAT router runs out of connection tracking memory and drops all new outbound connections.",
      "Backend server in a private subnet cannot download security updates (`apt update` hangs) because its route table is missing a route to the NAT Gateway."
    ],
    realWorldScenario:
      "A database server in a private AWS subnet cannot run `apt install postgresql`. Ping to `google.com` fails. The engineer inspects the private route table and finds `0.0.0.0/0` had no target. Adding target `nat-0a1b2c3d` gives the instance outbound access while maintaining zero inbound public exposure."
  },
  {
    id: "firewalls-and-security",
    number: "12",
    title: "Firewalls",
    tagline: "Stateful packet filtering: Ingress vs Egress, UFW, iptables/nftables, and DROP vs REJECT",
    category: "Security & Virtual Networks",
    mentalModel:
      "A firewall inspects incoming (Ingress) and outgoing (Egress) network packets, enforcing access rules based on IP address, port, protocol, and state.\n- Stateful vs Stateless: Modern firewalls (Linux Netfilter/iptables/UFW, AWS Security Groups) are **Stateful**. When an outbound connection is permitted, return packets are automatically allowed back through without a manual reverse rule.\n- DROP vs REJECT:\n  - `DROP`: Silently discards packet with zero response. Port scanners must wait for full TCP timeout. Best for public internet security.\n  - `REJECT`: Immediately returns an ICMP Port Unreachable or TCP RST packet. Client knows instantly that connection was refused. Best for internal corporate LANs.\nIn cloud infrastructure, Security Groups act as host-level stateful firewalls; Network ACLs (NACLs) act as subnet-level stateless firewalls.",
    keySyntax:
      "Default Security Posture: DEFAULT DENY ALL INGRESS\nIngress Rule: Allow TCP 22   from Admin_IP only\nIngress Rule: Allow TCP 80   from 0.0.0.0/0 (World)\nIngress Rule: Allow TCP 443  from 0.0.0.0/0 (World)\nIngress Rule: Allow TCP 5432 from 10.0.1.0/24 only (Private Web Subnet)\nAll other inbound traffic: DROP",
    productionCommands: [
      { cmd: "sudo ufw status verbose", desc: "Display active UFW firewall rules, default policies, and logging status.", level: "read" },
      { cmd: "sudo ufw allow proto tcp from 1.2.3.4 to any port 22", desc: "Restrict SSH port 22 access strictly to trusted administrator static IP.", level: "write" },
      { cmd: "sudo ufw allow 80/tcp && sudo ufw allow 443/tcp", desc: "Permit public inbound web traffic on ports 80 and 443.", level: "write" },
      { cmd: "sudo ufw deny from 198.51.100.4", desc: "Blacklist malicious attacker IP immediately at firewall level.", level: "write" },
      { cmd: "sudo iptables -L -n -v --line-numbers", desc: "Inspect raw Netfilter packet filter tables with byte counters.", level: "read" },
      { cmd: "sudo ufw enable", desc: "HAZARDOUS: Activates firewall. Ensure port 22 is permitted FIRST or session disconnects.", level: "hazardous" }
    ],
    productionRules: [
      "CRITICAL: Always run 'sudo ufw allow 22/tcp' BEFORE running 'sudo ufw enable'; otherwise, you will instantly sever your SSH session permanently.",
      "Never expose database ports (Postgres 5432, MySQL 3306, Redis 6379) to `0.0.0.0/0` in firewall rules.",
      "Prefer DROP over REJECT for public-facing firewall rules to slow down automated network scanning bots."
    ],
    failureModes: [
      "Enabling firewall without an explicit SSH allow rule permanently locks the engineer out of the remote cloud server.",
      "A developer opens port 6379 to the world on a Redis server without a password; an automated bot injects cryptominer keys within 10 minutes."
    ],
    realWorldScenario:
      "Security scanning reveals 40,000 SSH brute-force attempts per day on a public VPS. The engineer configures `sudo ufw delete allow 22` and replaces it with `sudo ufw allow from 203.0.113.50 to any port 22` (office VPN IP). Unauthorized login attempts drop to 0 instantly."
  },
  {
    id: "virtual-private-networks",
    number: "13",
    title: "VPN",
    tagline: "Encrypted network extension: WireGuard, OpenVPN, IPsec, and Split vs Full Tunneling",
    category: "Security & Virtual Networks",
    mentalModel:
      "A Virtual Private Network (VPN) creates an encrypted tunnel across an untrusted network (the public internet), allowing remote machines to communicate as if they were physically connected to the same private local area network (LAN).\n- WireGuard: Modern, lightweight, fast cryptographic protocol integrated directly into the Linux kernel (~4,000 lines of code vs 100k+ in OpenVPN). Uses Noise protocol, Curve25519, ChaCha20, and Poly1305.\n- Tunnel Modes:\n  - Full Tunnel: ALL client traffic (web browsing + internal resources) is encrypted and routed through the remote VPN gateway.\n  - Split Tunnel: Only packets destined for the private subnet CIDR (`10.0.0.0/16`) traverse the encrypted tunnel; general internet traffic routes directly via the user's local ISP, reducing VPN bandwidth load.",
    keySyntax:
      "WireGuard Config Architecture (/etc/wireguard/wg0.conf):\n[Interface]\nAddress = 10.8.0.1/24\nPrivateKey = <Server_Private_Key>\nListenPort = 51820\n\n[Peer]\nPublicKey = <Client_Public_Key>\nAllowedIPs = 10.8.0.2/32\n\nAllowedIPs = 0.0.0.0/0  → Full Tunnel (routes everything)\nAllowedIPs = 10.8.0.0/24 → Split Tunnel (routes private network only)",
    productionCommands: [
      { cmd: "sudo wg show", desc: "Inspect active WireGuard tunnel interfaces, connected peers, and handshake timestamps.", level: "read" },
      { cmd: "sudo wg-quick up wg0", desc: "Bring up WireGuard encrypted virtual network interface wg0.", level: "write" },
      { cmd: "sudo wg-quick down wg0", desc: "Tear down WireGuard network interface.", level: "write" },
      { cmd: "ip link show wg0", desc: "Inspect virtual tunnel interface MTU and packet transfer counters.", level: "read" }
    ],
    productionRules: [
      "Use modern WireGuard over legacy OpenVPN or IPsec for cloud administrative bastion tunnels; it connects in 10ms and handles roaming seamlessly.",
      "Use Split Tunneling for developer laptop access to save cloud VPN gateway bandwidth and reduce latency for normal browsing.",
      "Always set `PersistentKeepalive = 25` on peers sitting behind NAT routers to keep stateful firewall holes open."
    ],
    failureModes: [
      "WireGuard MTU issue: Tunnel fails to transmit large packets because the 1500 MTU was not reduced to accommodate WireGuard's 80-byte encapsulation header (set MTU to 1420).",
      "Forgotten `PersistentKeepalive`: Client behind home NAT loses connection to cloud server after 30 seconds of inactivity."
    ],
    realWorldScenario:
      "Engineers need direct secure access to staging databases without exposing port 5432 to the public internet. The team deploys a WireGuard peer inside the cloud VPC. Developers connect via split-tunnel, accessing `10.0.2.15:5432` securely through the tunnel while their Zoom calls route unhindered."
  },
  {
    id: "virtual-private-cloud",
    number: "14",
    title: "VPC basics",
    tagline: "Isolated cloud networking: Public/Private subnets, Internet Gateways, and Route Tables",
    category: "Security & Virtual Networks",
    mentalModel:
      "A Virtual Private Cloud (VPC) is an isolated private software-defined network provisioned in a public cloud (AWS, GCP, Azure). It encapsulates all compute, database, and container resources.\n- Core Building Blocks:\n  1. VPC CIDR Block: Defines the total private IP space (typically `/16`, e.g. `10.0.0.0/16`).\n  2. Subnets: Partitions within availability zones. Public subnets have direct routes to an Internet Gateway (IGW). Private subnets route to the internet only via a NAT Gateway.\n  3. Internet Gateway (IGW): Translates and routes public internet traffic to public subnets.\n  4. Route Tables: Sets of routing rules determining where network packets are directed.\n  5. Security Groups & NACLs: Stateful instance-level and stateless subnet-level packet filters.",
    keySyntax:
      "Cloud VPC Architecture:\nVPC: 10.0.0.0/16\n  ├── Public Subnet (10.0.1.0/24) ──> Route to IGW (0.0.0.0/0 -> igw-xxx)\n  │     └── ALB / Nginx Reverse Proxy (Public IP: 54.x.x.x)\n  │\n  └── Private Subnet (10.0.2.0/24) ──> Route to NAT Gateway (0.0.0.0/0 -> nat-xxx)\n        └── App Workers & PostgreSQL Database (Private IP: 10.0.2.50, NO Public IP)",
    productionCommands: [
      { cmd: "aws ec2 describe-vpcs", desc: "List provisioned AWS VPCs, state, CIDR blocks, and tenancy.", level: "read" },
      { cmd: "aws ec2 describe-subnets --filters 'Name=vpc-id,Values=vpc-0a1b2c3d'", desc: "Query all subnets and CIDR allocations in target VPC.", level: "read" },
      { cmd: "aws ec2 describe-route-tables --filters 'Name=vpc-id,Values=vpc-0a1b2c3d'", desc: "Audit route tables and default 0.0.0.0/0 targets across VPC.", level: "read" }
    ],
    productionRules: [
      "Always design multi-AZ (Availability Zone) subnets from Day 1 to allow high-availability database and container deployments.",
      "Never place a database in a public subnet; database instances must reside strictly in private subnets with zero public IP assignment.",
      "Size your VPC CIDR generously (`10.0.0.0/16` gives 65,536 IPs); changing a VPC primary CIDR block after deployment is painful."
    ],
    failureModes: [
      "Assigning public IPs to backend database instances leads to automated credential brute-force attacks from internet scanners.",
      "Placing containers in a private subnet whose route table lacks a NAT Gateway prevents container images from pulling from external registries."
    ],
    realWorldScenario:
      "A fintech application is audited for SOC2 compliance. The audit flags that backend servers were in a public subnet with Elastic IPs. The architect moves backend instances to a private subnet routed through a NAT Gateway, satisfying compliance by eliminating public ingress vectors."
  },
  {
    id: "routing-tables",
    number: "15",
    title: "Routing Tables",
    tagline: "The kernel's road map: Next-hop resolution, default gateway (0.0.0.0/0), and metric priorities",
    category: "Addressing & Routing",
    mentalModel:
      "A Routing Table is a database stored in operating system memory or router hardware that lists destination network CIDRs and where packets destined for those networks should be forwarded (**Next Hop**).\nWhen a packet is ready to leave a network interface, the kernel checks the routing table using the **Longest Prefix Match** rule (the most specific subnet mask wins):\n1. Destination matches local subnet `192.168.1.0/24` → Sent directly via local Layer 2 ARP broadcast on `eth0`.\n2. Destination matches VPN subnet `10.8.0.0/24` → Sent via `wg0` tunnel interface.\n3. Destination matches nothing specific → Sent to **Default Gateway** (`0.0.0.0/0`), which forwards packets out to the internet router.\nRoute **Metrics** break ties: lower metric numbers have higher priority.",
    keySyntax:
      "Routing Table Structure (ip route show):\ndefault via 192.168.1.1 dev eth0 proto dhcp metric 100\n10.8.0.0/24 dev wg0 proto kernel scope link src 10.8.0.1\n172.17.0.0/16 dev docker0 proto kernel scope link src 172.17.0.1\n192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.50 metric 100\n\nLongest Prefix Rule: Packet to 10.8.0.50 matches /24 (specific) over 0.0.0.0/0 (general).",
    productionCommands: [
      { cmd: "ip route show", desc: "Display kernel IPv4 routing table, interfaces, and metric costs.", level: "read" },
      { cmd: "ip route get 8.8.8.8", desc: "Determine exact interface, gateway, and source IP kernel will choose to reach target IP.", level: "read" },
      { cmd: "sudo ip route add 10.0.0.0/16 via 192.168.1.254 dev eth0", desc: "Add static route forwarding corporate 10.0.0.0/16 subnet through router.", level: "write" },
      { cmd: "sudo ip route del 10.0.0.0/16", desc: "Delete static routing table entry.", level: "write" }
    ],
    productionRules: [
      "Use 'ip route get <destination>' to instantly diagnose which interface and IP the kernel is selecting before debugging firewall rules.",
      "Ensure only ONE default gateway (`0.0.0.0/0`) exists with the lowest metric; multiple default gateways cause asymmetric routing drops.",
      "Beware of Docker bridge networks: Docker automatically adds routes for `172.17.0.0/16`, which can conflict if internal corporate LANs use that space."
    ],
    failureModes: [
      "Asymmetric Routing: Outbound packets leave via interface eth0, but return packets arrive via eth1; stateful firewalls drop the return packets as invalid.",
      "Accidentally deleting the default gateway route leaves the server instantly unreachable over SSH."
    ],
    realWorldScenario:
      "A server has two network cards: eth0 (public internet) and eth1 (private storage SAN). After a reboot, the server cannot reach the internet. Running `ip route show` reveals eth1 became the default gateway (`0.0.0.0/0 via 10.0.0.1`). Adjusting metric priorities restores internet traffic on eth0."
  },
  {
    id: "content-delivery-network",
    number: "16",
    title: "CDN",
    tagline: "Edge acceleration: Anycast routing, edge caching, cache invalidation, and Origin Shielding",
    category: "Name Resolution & Web Protocols",
    mentalModel:
      "A Content Delivery Network (CDN) is a globally distributed network of Point of Presence (PoP) edge proxy servers (Cloudflare, Fastly, AWS CloudFront). Using **BGP Anycast**, the same IP address is advertised from hundreds of data centers worldwide; internet routers send users to the geographically closest server.\n- Edge Caching: Static assets (`.js`, `.css`, images) are cached at the edge. A user in Tokyo downloads assets from Tokyo in 10ms instead of crossing the Pacific to a Virginia origin (250ms).\n- Origin Shield: A designated central caching tier protecting your primary origin server from dogpiling cache-miss surges.\n- Cache-Control Headers:\n  - `public, max-age=31536000, immutable` (Hashed assets like `bundle-a1b2c.js`)\n  - `s-maxage=60, stale-while-revalidate=30` (CDN cache TTL separate from browser)",
    keySyntax:
      "CDN Flow & Anycast Routing:\nUser (London) ──(10ms)──> [ London CDN Edge ] ──(Cache Hit: Returns instantly)\nUser (Sydney) ──(12ms)──> [ Sydney CDN Edge ] ──(Cache Miss: Fetches from Virginia Origin once)──> Cached!\n\nKey Response Headers:\nCF-Cache-Status: HIT | MISS | EXPIRED | DYNAMIC\nAge: 3420 (seconds asset has been stored in CDN cache)",
    productionCommands: [
      { cmd: "curl -Iv https://example.com/logo.png | grep -i -E 'cache-control|cf-cache-status|x-cache|age'", desc: "Inspect CDN cache hit/miss status and age headers.", level: "read" },
      { cmd: "curl -X PURGE https://example.com/static/style.css", desc: "Send manual HTTP PURGE request to invalidate cached edge asset.", level: "write" },
      { cmd: "dig example.com +short", desc: "Inspect Anycast IP addresses returned by CDN edge.", level: "read" }
    ],
    productionRules: [
      "Always append content hashes to static asset filenames (`main.a8b1c2.js`); this allows safe `max-age=31536000, immutable` caching without stale file bugs.",
      "Never cache endpoints returning `Set-Cookie` or personalized authorization data; use `Cache-Control: private, no-store`.",
      "Configure an Origin Shield or rate limiting on your origin server to prevent the 'Thundering Herd' problem during cache invalidation."
    ],
    failureModes: [
      "Accidentally caching authenticated user profile responses at the CDN level results in User A seeing User B's account dashboard.",
      "Deploying frontend updates without filename hashes leaves global users seeing broken UI for days due to browser cache retention."
    ],
    realWorldScenario:
      "A marketing campaign drives 100,000 visitors per minute to a Next.js homepage. The origin database begins timing out. The engineer configures `s-maxage=60, stale-while-revalidate=600` on the homepage route. CDN cache hit ratio rises to 99.4%, and origin CPU drops from 100% to 4%."
  },
  {
    id: "curl-and-dig",
    number: "17",
    title: "Curl and dig",
    tagline: "The command-line diagnostic dynamic duo: Layer 7 HTTP debugging and Layer 5/7 DNS tracing",
    category: "Diagnostics & Performance",
    mentalModel:
      "- `curl`: The definitive HTTP/S client for testing API endpoints, inspecting headers, sending customized payloads, auditing SSL handshakes, and measuring timing latency.\n- `dig` (Domain Information Groper): The primary DNS diagnostic tool. Queries recursive and authoritative nameservers directly, bypassing local OS caching, displaying query time, TTL values, and authoritative answers.",
    keySyntax:
      "High-Value Curl Flags:\n-I              → Head request only (view response headers)\n-v              → Verbose output (displays TLS handshake, cipher, headers)\n-L              → Follow HTTP 301/302 redirects automatically\n-k              → Insecure (skip SSL certificate validation for testing)\n-X POST -d '{}' → Specify HTTP method and JSON body\n-H 'Header'     → Inject custom request header",
    productionCommands: [
      { cmd: "curl -Iv https://api.stripe.com", desc: "Perform verbose HTTP handshake audit showing TLS negotiation and response codes.", level: "read" },
      { cmd: "curl -w \"HTTP Status: %{http_code} | Total Time: %{time_total}s\n\" -so /dev/null https://api.domain.com", desc: "Extract exact HTTP response code and total request latency.", level: "read" },
      { cmd: "curl -X POST https://api.domain.com/v1/auth -H 'Content-Type: application/json' -d '{\"user\":\"test\"}'", desc: "Execute JSON POST API mutation directly from terminal.", level: "read" },
      { cmd: "dig api.domain.com +trace", desc: "Trace full hierarchical DNS path from root servers down to authoritative host.", level: "read" },
      { cmd: "dig @8.8.8.8 domain.com A +short", desc: "Query specific public resolver directly to verify external DNS propagation.", level: "read" }
    ],
    productionRules: [
      "Use 'curl -Iv' rather than opening browser developer tools when debugging CORS and SSL handshake issues to isolate browser caching anomalies.",
      "Always test with 'dig +trace' during DNS migrations to see exactly which authoritative nameserver is serving stale records.",
      "Use curl's format variables (`%{time_namelookup}`, `%{time_connect}`, `%{time_starttransfer}`) to quantify latency bottlenecks."
    ],
    failureModes: [
      "Testing an endpoint with curl without `-L` fails to detect a 301 redirect loop that breaks mobile app clients.",
      "Relying on `ping domain.com` to test DNS; ping uses `/etc/hosts` and OS cache, masking real remote DNS misconfigurations."
    ],
    realWorldScenario:
      "A developer claims 'the staging API is down'. The DevOps engineer runs `curl -Iv https://staging.api.com`. It instantly returns `HTTP/1.1 403 Forbidden` with header `Server: cloudflare` and `error code: 1020`. The API isn't down; Cloudflare's WAF blocked the developer's office IP address."
  },
  {
    id: "netstat-and-ss",
    number: "18",
    title: "Netstat and ss",
    tagline: "Kernel socket table inspection: Replacing legacy netstat with modern ss for high-performance triage",
    category: "Diagnostics & Performance",
    mentalModel:
      "`ss` (Socket Statistics) is the modern Linux replacement for legacy `netstat`. While `netstat` reads `/proc/net/tcp` slowly line-by-line (which freezes on servers with 50,000+ open connections), `ss` queries kernel netlink sockets directly, returning in milliseconds.\n`ss` displays:\n- Listening TCP/UDP sockets (`-l`)\n- Process IDs and binary names holding sockets (`-p`)\n- Numeric ports without slow reverse-DNS lookup delays (`-n`)\n- Socket queue buffers: `Recv-Q` (bytes received but not read by app yet) and `Send-Q` (bytes sent but unacknowledged by remote peer). Accumulating `Recv-Q` means the application process is frozen or CPU bound.",
    keySyntax:
      "ss Flag Guide (The Golden Flag Combo: ss -tulpn):\n-t  → TCP sockets\n-u  → UDP sockets\n-l  → Listening sockets only\n-p  → Show process PID and command name\n-n  → Numeric ports (shows :80 instead of :http)\n-a  → All sockets (both listening and established)\n-s  → Summary statistics overview",
    productionCommands: [
      { cmd: "ss -tulpn", desc: "List all listening TCP/UDP sockets with process names, PIDs, and bound ports.", level: "read" },
      { cmd: "ss -tan state established", desc: "List all active, connected TCP client connections.", level: "read" },
      { cmd: "ss -tan state time-wait | wc -l", desc: "Count total sockets currently lingering in TIME_WAIT state.", level: "read" },
      { cmd: "ss -s", desc: "Print total kernel socket memory buffers and connection count summaries.", level: "read" },
      { cmd: "ss -ti '( sport = :443 or dport = :443 )'", desc: "Inspect TCP internal socket details including RTT latency and packet retransmission counts.", level: "read" }
    ],
    productionRules: [
      "Always use 'ss' instead of obsolete 'netstat' on production servers; netstat can cause CPU spikes on high-load servers.",
      "Always include the '-n' flag to disable reverse DNS resolution; resolving 10,000 IPs during an incident can lock up your terminal.",
      "Monitor 'Recv-Q': If `Recv-Q` on port 3000 is consistently >0, your Node.js event loop is blocked and failing to process incoming HTTP sockets."
    ],
    failureModes: [
      "Running legacy `netstat -a` without `-n` during a DDoS attack locks the terminal for 20 minutes attempting to reverse-resolve 50,000 IPs.",
      "Ignoring growing `Recv-Q` values leads to dropped client connections as the kernel's `listen()` backlog overflows."
    ],
    realWorldScenario:
      "An API server latency increases to 10 seconds. The engineer runs `ss -tulpn` and observes `Recv-Q` on port 3000 has 128 packets queued up. The Node.js single-threaded event loop was completely blocked by a synchronous `JSON.parse()` on a 50MB payload."
  },
  {
    id: "latency-and-bandwidth",
    number: "19",
    title: "Latency and bandwidth",
    tagline: "Network performance physics: RTT, Throughput, Bandwidth-Delay Product (BDP), and Bufferbloat",
    category: "Diagnostics & Performance",
    mentalModel:
      "- Bandwidth: The width of the pipe (volume of data transmitted per second, e.g. 10 Gbps). Adding more bandwidth increases capacity, NOT speed.\n- Latency: The time it takes for a single packet to travel from source to destination (RTT: Round Trip Time, limited by the speed of light in fiber optic cables: ~5ms per 1,000km).\n- Bandwidth-Delay Product (BDP): The amount of unacknowledged data in transit required to fill the network pipe: $\\text{BDP} = \\text{Bandwidth} \\times \\text{RTT}$. If TCP window size is smaller than the BDP, your connection cannot saturate available bandwidth.\n- Bufferbloat: Excessively large router packet buffers introduce seconds of queuing delay under high load, causing jitter and latency spikes.",
    keySyntax:
      "Network Physics Breakdown:\nRound Trip Time (RTT): Ping latency (e.g. US to Europe = ~80ms)\nThroughput Ceiling: Max Throughput = TCP Window Size / RTT\nExample: With 64KB window and 80ms RTT, max throughput is limited to ~6.4 Mbps regardless of having a 1 Gbps fiber line!",
    productionCommands: [
      { cmd: "ping -c 10 8.8.8.8", desc: "Measure average RTT latency, packet loss percentage, and jitter variance.", level: "read" },
      { cmd: "iperf3 -c <TARGET_IP>", desc: "Measure raw end-to-end TCP bandwidth throughput between two servers.", level: "read" },
      { cmd: "sysctl net.ipv4.tcp_rmem && sysctl net.ipv4.tcp_wmem", desc: "Inspect kernel TCP read and write socket buffer minimum, default, and maximum sizes.", level: "read" },
      { cmd: "mtr -rw -c 20 8.8.8.8", desc: "Combined ping and traceroute report showing latency and loss at every network hop.", level: "read" }
    ],
    productionRules: [
      "Do not buy more bandwidth to fix slow database query latency; speed is governed by RTT and query efficiency, not bandwidth width.",
      "Co-locate application compute instances in the same cloud region or availability zone as their database to keep latency sub-1ms.",
      "Enable TCP Window Scaling (`net.ipv4.tcp_window_scaling = 1`) on high-latency links to allow TCP windows beyond 64KB."
    ],
    failureModes: [
      "Deploying a frontend in Frankfurt connecting to a database in Virginia: 80ms cross-Atlantic latency multiplied by 15 sequential queries results in a 1.2s page load delay.",
      "Bufferbloat on congested routers causing ping latency to spike from 15ms to 1,200ms during large backup uploads."
    ],
    realWorldScenario:
      "A distributed app makes 10 serial queries to load a profile page. In local testing (0.2ms latency), the page loads in 2ms. In production across regions (70ms latency), the page takes $10 \\times 70\\text{ms} = 700\\text{ms}$. Batching the 10 queries into a single database transaction reduces the round-trips from 10 to 1, cutting latency by 90%."
  },
  {
    id: "networking-debugging",
    number: "20",
    title: "Networking debugging",
    tagline: "Systematic fault isolation: The bottom-up OSI triage ladder, tcpdump, mtr, and strace",
    category: "Diagnostics & Performance",
    mentalModel:
      "When network failure strikes, never randomly restart services. Follow the systematic **Bottom-Up OSI Triage Ladder**:\n1. Layer 1/2 (Physical/Link): Is the interface UP? (`ip link`)\n2. Layer 3 (Network IP): Can we reach the local gateway and remote IP? (`ping`, `ip route`)\n3. Layer 4 (Transport Port): Is the remote port open and accepting connections? (`nc -zv`, `ss -tulpn`)\n4. Layer 5/7 (DNS): Does the domain resolve to the expected IP? (`dig +trace`, `nslookup`)\n5. Layer 7 (Application/TLS): Does the HTTP server respond? (`curl -Iv`)\n6. Packet Capture: When all else fails, capture raw packets with `tcpdump` to prove whether packets are leaving the interface or being dropped upstream.",
    keySyntax:
      "The 5-Step Network Triage Protocol:\nStep 1: Interface & Link   → ip link show && ip addr\nStep 2: Gateway & IP Route → ping -c 3 <GATEWAY_IP> && ip route get <TARGET_IP>\nStep 3: Port Reachability  → nc -zv <TARGET_IP> 443\nStep 4: DNS Resolution     → dig @8.8.8.8 <DOMAIN> +short\nStep 5: Layer 7 HTTP & TLS → curl -Iv https://<DOMAIN>",
    productionCommands: [
      { cmd: "sudo tcpdump -nnvv -i any port 5432 -c 10", desc: "Sniff first 10 packets arriving on database port 5432 across all interfaces.", level: "read" },
      { cmd: "mtr --report --report-cycles 10 1.1.1.1", desc: "Generate multi-hop packet loss and latency diagnostic report.", level: "read" },
      { cmd: "traceroute -n -T -p 443 example.com", desc: "Trace routing path using TCP SYN packets on port 443 to bypass ICMP firewalls.", level: "read" },
      { cmd: "sudo tcpdump -i any 'tcp[tcpflags] & (tcp-rst) != 0'", desc: "Detect TCP Reset (RST) packets indicating rejected or dropped connections.", level: "read" }
    ],
    productionRules: [
      "Always capture packets at both sender and receiver simultaneously when troubleshooting elusive packet loss to identify the exact dropped hop.",
      "Use 'traceroute -T -p 443' instead of standard UDP/ICMP traceroute; intermediate corporate firewalls often drop ICMP while permitting TCP 443.",
      "Check `dmesg -T` when network calls drop; kernel connection tracking table exhaustion or SYN flood protections show up in kernel logs first."
    ],
    failureModes: [
      "Assuming a remote server is down because `ping` fails, when the remote administrator simply blocked ICMP echo requests while HTTP 443 is working perfectly.",
      "Spending hours debugging Nginx configuration when `tcpdump` proves incoming packets never reached the server interface due to an upstream cloud Security Group rule."
    ],
    realWorldScenario:
      "A developer insists an external payment webhook provider is failing to deliver calls. The sysadmin runs `sudo tcpdump -nn -i eth0 port 443 and host <PROVIDER_IP>`. Zero packets arrive. The provider's webhook test log shows 'connection timed out'. The admin inspects cloud security group rules and discovers port 443 was restricted to office IPs only. Opening port 443 restores webhooks instantly."
  }
];

