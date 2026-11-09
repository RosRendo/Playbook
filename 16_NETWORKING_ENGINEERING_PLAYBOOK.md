# 🌐 16. The Production Computer Networking Playbook
> Master Reference: 20 Core Networking Concepts for Full-Stack & DevOps Engineers

---

## 🗺️ Table of Contents
1. [01. OSI Model (7 Layers of Encapsulation)](#01-osi-model-7-layers-of-encapsulation)
2. [02. TCP vs UDP (Reliable Streams vs Fast Datagrams)](#02-tcp-vs-udp-reliable-streams-vs-fast-datagrams)
3. [03. IP Addressing (IPv4, IPv6 & RFC 1918 Private Ranges)](#03-ip-addressing-ipv4-ipv6--rfc-1918-private-ranges)
4. [04. Subnets and CIDR (Prefix Notation & Host Math)](#04-subnets-and-cidr-prefix-notation--host-math)
5. [05. DNS (Hierarchical Resolution, Records & TTL)](#05-dns-hierarchical-resolution-records--ttl)
6. [06. HTTP and HTTPS (HTTP/1.1 vs HTTP/2 vs HTTP/3 QUIC)](#06-http-and-https-http11-vs-http2-vs-http3-quic)
7. [07. TLS Certificates (PKI, X.509, SNI & Automated ACME)](#07-tls-certificates-pki-x509-sni--automated-acme)
8. [08. Ports and Sockets (The TCP 4-Tuple & Ephemeral Ranges)](#08-ports-and-sockets-the-tcp-4-tuple--ephemeral-ranges)
9. [09. Load Balancers (L4 NLB vs L7 ALB & Balancing Algorithms)](#09-load-balancers-l4-nlb-vs-l7-alb--balancing-algorithms)
10. [10. Reverse Proxy (Gateway Shields, SSL Offload & Nginx)](#10-reverse-proxy-gateway-shields-ssl-offload--nginx)
11. [11. NAT (Source NAT, Port Forwarding & Cloud Egress Gateways)](#11-nat-source-nat-port-forwarding--cloud-egress-gateways)
12. [12. Firewalls (Stateful Packet Filtering, UFW & iptables)](#12-firewalls-stateful-packet-filtering-ufw--iptables)
13. [13. VPN (WireGuard, Encrypted Tunnels & Split Tunneling)](#13-vpn-wireguard-encrypted-tunnels--split-tunneling)
14. [14. VPC basics (Isolated Cloud Networks, Subnets & Gateways)](#14-vpc-basics-isolated-cloud-networks-subnets--gateways)
15. [15. Routing Tables (Next-Hop Routing & Default Gateway 0.0.0.0/0)](#15-routing-tables-next-hop-routing--default-gateway-00000)
16. [16. CDN (BGP Anycast, Edge Caching & Origin Shielding)](#16-cdn-bgp-anycast-edge-caching--origin-shielding)
17. [17. Curl and dig (Layer 7 API Audits & DNS Tracing)](#17-curl-and-dig-layer-7-api-audits--dns-tracing)
18. [18. Netstat and ss (Kernel Socket Tables & Buffer Triage)](#18-netstat-and-ss-kernel-socket-tables--buffer-triage)
19. [19. Latency and bandwidth (RTT Physics, BDP & Bufferbloat)](#19-latency-and-bandwidth-rtt-physics-bdp--bufferbloat)
20. [20. Networking debugging (The Bottom-Up OSI Triage Protocol)](#20-networking-debugging-the-bottom-up-osi-triage-protocol)

---

### 01. OSI Model (7 Layers of Encapsulation)
- **Mental Model**: Standardized theoretical model breaking network communication into 7 distinct boundaries. As data moves down the stack, each layer wraps headers around payload (Encapsulation); on reception, headers are stripped (Decapsulation).
  - **L7 Application**: HTTP, DNS, SSH, gRPC (End-user applications)
  - **L6 Presentation**: TLS encryption, Gzip compression, JSON serialization
  - **L5 Session**: Sockets, RPC sessions, connection handshakes
  - **L4 Transport**: TCP (reliable/ordered segments), UDP (datagrams), Ports
  - **L3 Network**: IP Packets, Routers, Subnetting, ICMP
  - **L2 Data Link**: Ethernet Frames, MAC addresses, Switches, VLANs
  - **L1 Physical**: Raw bits over copper twisted pair, fiber photons, Wi-Fi radio waves
- **Production Invariant**: Always troubleshoot bottom-up: verify L3 connectivity (`ping`) before debugging L7 (`HTTP 502 Bad Gateway`).

---

### 02. TCP vs UDP (Reliable Streams vs Fast Datagrams)
- **Mental Model**:
  - **TCP (Transmission Control Protocol)**: Connection-oriented 3-way handshake (`SYN` $\rightarrow$ `SYN-ACK` $\rightarrow$ `ACK`). Sequence numbers guarantee ordered delivery. Retransmits dropped packets. Employs Congestion Control (Cubic, BBR) and Flow Control (sliding window). Head-of-line blocking occurs when 1 lost packet stalls all subsequent packets.
  - **UDP (User Datagram Protocol)**: Connectionless fire-and-forget datagrams with minimal 8-byte header overhead. Zero handshakes, zero retransmission guarantees. Used for real-time video (WebRTC), DNS queries, and modern HTTP/3 (QUIC).
- **Production Rule**: Switch Linux web servers to Google BBR congestion algorithm (`net.ipv4.tcp_congestion_control = bbr`) to maximize throughput on lossy public internet paths.

---

### 03. IP Addressing (IPv4, IPv6 & RFC 1918 Private Ranges)
- **Mental Model**: Layer 3 logical host identifiers.
  - **IPv4**: 32-bit address represented as 4 decimal octets (`192.168.1.1`).
  - **RFC 1918 Non-Routable Private Ranges**:
    - `10.0.0.0/8` (10.0.0.0 – 10.255.255.255: Cloud VPCs and enterprise corporate networks)
    - `172.16.0.0/12` (172.16.0.0 – 172.31.255.255: Docker default container bridges)
    - `192.168.0.0/16` (192.168.0.0 – 192.168.255.255: Local home and office LANs)
    - `127.0.0.0/8` (`127.0.0.1` Loopback / Localhost)
  - **IPv6**: 128-bit hexadecimal addresses (`2001:0db8::1`) eliminating NAT exhaustion.
- **Production Rule**: Never expose databases to public routable IP addresses; keep them strictly within RFC 1918 private subnets.

---

### 04. Subnets and CIDR (Prefix Notation & Host Math)
- **Mental Model**: Classless Inter-Domain Routing divides an IP into a Network Prefix and a Host Identifier. The slash notation (`/24`) defines the fixed network bits.
- **CIDR Size Cheat Sheet**:
  - `/32`: 1 IP (Single specific machine)
  - `/28`: 16 IPs (11 usable in AWS)
  - `/24`: 256 IPs (251 usable in AWS)
  - `/20`: 4,096 IPs (Standard cloud subnet size)
  - `/16`: 65,536 IPs (Standard production VPC size)
- **Cloud Provider IP Reservation**: AWS and GCP reserve 5 addresses per subnet: `.0` (Network), `.1` (Gateway), `.2` (DNS), `.3` (Future), and `.255` (Broadcast).
- **Production Rule**: Never provision production VPCs smaller than `/16`; resizing a VPC after deploying databases and clusters requires rebuilding from scratch.

---

### 05. DNS (Hierarchical Resolution, Records & TTL)
- **Mental Model**: The distributed database mapping human domain names to routable IP addresses.
- **Resolution Chain**: Browser Cache $\rightarrow$ OS Cache (`/etc/hosts`) $\rightarrow$ Recursive Resolver (`1.1.1.1`) $\rightarrow$ Root Nameservers (`.`) $\rightarrow$ TLD Nameservers (`.com`) $\rightarrow$ Authoritative Nameservers (Route53/Cloudflare).
- **Core Record Types**:
  - `A`: Domain to IPv4 address.
  - `AAAA`: Domain to IPv6 address.
  - `CNAME`: Canonical alias pointing to another domain (never permitted at domain apex `@`).
  - `MX`: Mail exchanger routing.
  - `TXT`: Text record for SPF, DKIM, and domain ownership validation.
- **Production Rule**: Lower DNS TTL (Time To Live) to 300 seconds 48 hours before planned server migrations to allow near-instantaneous traffic cutovers and rollbacks.

---

### 06. HTTP and HTTPS (HTTP/1.1 vs HTTP/2 vs HTTP/3 QUIC)
- **Mental Model**: The application layer protocol powering the web.
  - **HTTP/1.1**: Text-based, persistent connections, but head-of-line blocking limits throughput. Browsers open 6 parallel TCP connections.
  - **HTTP/2**: Binary framing, header compression (HPACK), and multiplexing multiple concurrent streams over a single TCP connection.
  - **HTTP/3**: Built on UDP via **QUIC**. Eliminates TCP head-of-line blocking, provides 0-RTT connection resumption, and migrates connections seamlessly when mobile clients switch from Wi-Fi to cellular.
- **Timing Lifecycle**: `DNS Lookup` $\rightarrow$ `TCP Handshake` $\rightarrow$ `TLS Handshake` $\rightarrow$ `TTFB (Time To First Byte)` $\rightarrow$ `Content Download`.

---

### 07. TLS Certificates (PKI, X.509, SNI & Automated ACME)
- **Mental Model**: Public Key Infrastructure (PKI) ensuring Confidentiality, Integrity, and Server Authentication.
  - **SNI (Server Name Indication)**: Client indicates target hostname during `ClientHello` before decryption, enabling virtual hosting of multiple SSL domains on 1 IP.
  - **TLS 1.3**: Completes handshake in a single round trip (1 RTT).
  - **ACME Protocol (Let's Encrypt)**: Automates domain validation challenges (HTTP-01 or DNS-01) and issues free, auto-renewing 90-day X.509 certificates.
- **Production Rule**: Always serve `fullchain.pem` (leaf certificate + intermediate CA certificates); serving only `cert.pem` breaks SSL validation on mobile clients.

---

### 08. Ports and Sockets (The TCP 4-Tuple & Ephemeral Ranges)
- **Mental Model**: While IP addresses identify machines, 16-bit ports (0–65535) identify specific processes. A connection is uniquely indexed across the internet by a **4-Tuple**:
  $$\text{Connection} = (\text{Source IP}, \text{Source Port}, \text{Destination IP}, \text{Destination Port})$$
- **Port Ranges**:
  - `0–1023`: Well-Known / Privileged (Requires root: 80 HTTP, 443 HTTPS, 22 SSH, 53 DNS)
  - `1024–49151`: Registered User Ports (3000 Node, 5432 Postgres, 6379 Redis)
  - `49152–65535`: Ephemeral Outbound Ports (Allocated dynamically by OS for clients)
- **Key Diagnostic**: `lsof -i :3000` or `fuser 3000/tcp` to isolate and terminate processes causing `EADDRINUSE`.

---

### 09. Load Balancers (L4 NLB vs L7 ALB & Balancing Algorithms)
- **Mental Model**:
  - **Layer 4 (Network Load Balancer / NLB)**: Routes at TCP/UDP transport layer. Ultra-high throughput (millions req/sec) with microsecond latency. Cannot inspect HTTP headers, cookies, or URL paths.
  - **Layer 7 (Application Load Balancer / ALB)**: Decodes HTTP. Routes based on URL path (`/api` vs `/static`), host header, or JWT claims. Performs SSL Termination.
- **Balancing Algorithms**: Round Robin (stateless uniform loads), Least Connections (long database or WebSocket sessions), IP Hash (session stickiness).
- **Production Rule**: Never couple `/healthz` endpoints to external third-party APIs; if Stripe has an outage, your health check will fail and the load balancer will kill all your healthy servers.

---

### 10. Reverse Proxy (Gateway Shields, SSL Offload & Nginx)
- **Mental Model**: An edge gateway proxying requests on behalf of internal backend origin servers.
  - Decouples client SSL termination from internal services.
  - Compresses responses (Gzip / Brotli) and caches static assets.
  - Absorbs DDoS bursts and provides IP rate-limiting.
  - Forwards real client metadata to backends via `X-Forwarded-For` and `X-Forwarded-Proto`.
- **Production Rule**: Always set `proxy_set_header X-Forwarded-Proto $scheme;` in Nginx; without it, backend frameworks detect HTTP and trigger infinite 301 redirect loops.

---

### 11. NAT (Source NAT, Port Forwarding & Cloud Egress Gateways)
- **Mental Model**: Network Address Translation modifies packet IP headers in transit.
  - **SNAT (Source NAT / Masquerading)**: Rewrites private source IP (`10.0.1.50`) to public router IP (`54.200.1.1`) so private instances can access internet APIs.
  - **DNAT (Destination NAT / Port Forwarding)**: Rewrites destination IP of incoming public packets to route traffic to an internal private server.
  - **Cloud NAT Gateways**: Allow private database and worker subnets to install security updates while completely blocking all inbound connections from the internet.

---

### 12. Firewalls (Stateful Packet Filtering, UFW & iptables)
- **Mental Model**: Stateful packet inspection engine. When an outbound request is permitted, return packets are automatically allowed through without a manual inbound rule.
  - **DROP**: Silently discards packets. Attackers wait for full timeout (recommended for public interfaces).
  - **REJECT**: Actively replies with TCP RST or ICMP Port Unreachable.
- **Production Invariant**: Always execute `sudo ufw allow 22/tcp` BEFORE running `sudo ufw enable`. Enabling UFW without opening SSH locks you out permanently.

---

### 13. VPN (WireGuard, Encrypted Tunnels & Split Tunneling)
- **Mental Model**: Cryptographically extends a private network across the public internet.
  - **WireGuard**: Modern, minimal (~4,000 LOC), kernel-embedded protocol using ChaCha20-Poly1305 and Curve25519.
  - **Split Tunneling**: Only packets addressed to the private subnet CIDR (`10.0.0.0/16`) route through the encrypted tunnel; regular internet traffic routes directly through local ISP, preserving VPN gateway bandwidth.

---

### 14. VPC basics (Isolated Cloud Networks, Subnets & Gateways)
- **Mental Model**: A logically isolated Software-Defined Network in the cloud.
  - **Public Subnet**: Connected to an Internet Gateway (IGW) with direct public IPv4 allocation. Hosts Application Load Balancers and Nginx reverse proxies.
  - **Private Subnet**: Has no route to IGW; routes outbound egress through a NAT Gateway. Hosts backend APIs, microservices, and databases.
  - **Security Groups**: Stateful instance-level firewalls.

---

### 15. Routing Tables (Next-Hop Routing & Default Gateway 0.0.0.0/0)
- **Mental Model**: Kernel decision engine for packet forwarding based on destination IP.
  - **Longest Prefix Match Rule**: The most specific subnet route wins. A packet to `10.8.0.15` matches `/24` route over default `/0`.
  - **Default Gateway (`0.0.0.0/0`)**: Catch-all next hop where all unrouted internet packets are sent.
- **Diagnostic Command**: `ip route get <TARGET_IP>` reveals the exact interface, gateway, and source IP chosen by the kernel.

---

### 16. CDN (BGP Anycast, Edge Caching & Origin Shielding)
- **Mental Model**: Global edge caching network.
  - **BGP Anycast**: Multiple global data centers advertise the exact same IP address; internet routing sends clients to the nearest physical PoP.
  - **Static Asset Optimization**: Caches assets at the edge with `Cache-Control: public, max-age=31536000, immutable`.
  - **Origin Shield**: Centralized caching layer between edge PoPs and origin server, protecting databases from cache-stampede storms.

---

### 17. Curl and dig (Layer 7 API Audits & DNS Tracing)
- **Mental Model**: The essential CLI diagnostic duo.
  - `curl`: Tests HTTP endpoints, measures latency stages (`time_namelookup`, `time_connect`, `time_starttransfer`), inspects headers, and executes JSON mutations.
  - `dig`: Bypasses OS caches to inspect authoritative DNS records, query latencies, and delegation chains (`dig +trace`).

---

### 18. Netstat and ss (Kernel Socket Tables & Buffer Triage)
- **Mental Model**: `ss` (Socket Statistics) replaces legacy `netstat` by querying kernel netlink sockets directly in milliseconds.
  - Golden Flag Combo: `ss -tulpn` (TCP, UDP, Listening, Process names/PIDs, Numeric ports).
  - **Recv-Q Monitoring**: If `Recv-Q` is accumulating on a listening socket, the application event loop is blocked and failing to accept incoming connections.

---

### 19. Latency and bandwidth (RTT Physics, BDP & Bufferbloat)
- **Mental Model**:
  - **Bandwidth**: Width of the pipe (volume per second, e.g. 10 Gbps). Adding bandwidth increases volume, NOT speed.
  - **Latency (RTT)**: Time for a packet to travel round-trip (limited by speed of light in fiber: ~5ms per 1,000km).
  - **Bandwidth-Delay Product (BDP)**: $\text{BDP} = \text{Bandwidth} \times \text{RTT}$. Determines maximum unacknowledged bytes in flight.
  - **Co-location Rule**: Co-locate application servers and databases in the same cloud region or availability zone to maintain sub-millisecond query latency.

---

### 20. Networking debugging (The Bottom-Up OSI Triage Protocol)
- **Systematic 5-Step Protocol**:
  1. **Layer 1/2 (Link)**: Is the interface UP? (`ip link show`)
  2. **Layer 3 (Network)**: Can we reach the gateway and target IP? (`ping`, `ip route get`)
  3. **Layer 4 (Transport)**: Is the port open and listening? (`nc -zv <IP> <PORT>`, `ss -tulpn`)
  4. **Layer 5/7 (DNS)**: Does the domain resolve to the right IP? (`dig @8.8.8.8 <DOMAIN>`)
  5. **Layer 7 (Application)**: Does HTTP/TLS negotiate cleanly? (`curl -Iv https://<DOMAIN>`)
  - **Packet Sniffing**: Run `sudo tcpdump -nnvv -i any port <PORT>` to verify whether packets are arriving or dropped upstream.

