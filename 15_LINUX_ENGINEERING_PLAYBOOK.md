# 🐧 15. The Production Linux Engineering Playbook
> Master Reference: 20 Core Linux Concepts for Full-Stack & DevOps Engineers

---

## 🗺️ Table of Contents
1. [01. File System Hierarchy](#01-file-system-hierarchy)
2. [02. Permissions and chmod](#02-permissions-and-chmod)
3. [03. Users and Groups](#03-users-and-groups)
4. [04. Processes and Signals](#04-processes-and-signals)
5. [05. Systemd Services](#05-systemd-services)
6. [06. Package Managers](#06-package-managers)
7. [07. Grep, awk and sed](#07-grep-awk-and-sed)
8. [08. Pipes and Redirections](#08-pipes-and-redirections)
9. [09. SSH and Keys](#09-ssh-and-keys)
10. [10. Cron Jobs](#10-cron-jobs)
11. [11. Disk and Memory Usage](#11-disk-and-memory-usage)
12. [12. Logs and Journalctl](#12-logs-and-journalctl)
13. [13. Networking Commands](#13-networking-commands)
14. [14. Environment Variables](#14-environment-variables)
15. [15. Shell Configuration](#15-shell-configuration)
16. [16. tmux and screen](#16-tmux-and-screen)
17. [17. Archives and Compression](#17-archives-and-compression)
18. [18. Mounting Disks](#18-mounting-disks)
19. [19. Kernel Basics](#19-kernel-basics)
20. [20. Troubleshooting Methodology (USE Method)](#20-troubleshooting-methodology-use-method)

---

### 01. File System Hierarchy
- **Mental Model**: In Unix, everything is mounted under a single inverted root tree (`/`). Unlike Windows drive letters (`C:`, `D:`), secondary storage, RAM virtual filesystems, and hardware device interfaces are mapped to directories.
- **Key Directories**:
  - `/etc`: System-wide static configuration files (`nginx.conf`, `sshd_config`, `hosts`).
  - `/var`: Variable runtime data and active logs (`/var/log`, `/var/www`, `/var/run`).
  - `/proc` & `/sys`: Virtual pseudo-filesystems in RAM exposing live kernel state (`/proc/cpuinfo`, `/proc/meminfo`).
  - `/dev`: Hardware and special device nodes (`/dev/sda`, `/dev/null`, `/dev/urandom`).
  - `/opt`: Self-contained vendor and third-party software packages.
  - `/tmp`: Volatile scratch storage, cleared upon operating system reboot.
- **Production Commands**:
  - `tree -L 2 -d /` — Map top 2 levels of filesystem structure.
  - `cat /proc/cpuinfo | grep 'model name' | wc -l` — Read CPU topology.
  - `du -sh /var/* 2>/dev/null | sort -h` — Triage disk consumption in variable partitions.
- **Production Invariant**: Never store persistent database files or user uploads inside `/tmp`.

---

### 02. Permissions and chmod
- **Mental Model**: Discretionary Access Control (DAC) divides access into **User (Owner)**, **Group**, and **Others (World)** across **Read (4)**, **Write (2)**, and **Execute (1)**.
  - Files: Read = view content, Write = modify/delete content, Execute = run binary/script.
  - Directories: Read = list files (`ls`), Write = create/delete files inside, Execute = traverse into folder (`cd`).
- **Octal Formula**: `rwx` = $4 + 2 + 1 = 7$. `rw-` = $4 + 2 = 6$. `r-x` = $4 + 1 = 5$.
- **Standard Configurations**:
  - `chmod 600 ~/.ssh/id_ed25519` — Private SSH keys (Owner RW only; mandatory or SSH fails).
  - `chmod 644 /var/www/html/index.html` — Static web content (Owner RW, World Read).
  - `chmod 755 /var/www/html` — Directory access (Owner RWX, World Read+Traverse).
  - `chmod -R u=rwX,g=rX,o= /opt/app` — Safe recursive permissions (`X` executes directories only, leaving files non-executable).
- **Production Invariant**: Never execute `chmod 777` on production servers. It violates security audits and allows arbitrary code execution.

---

### 03. Users and Groups
- **Mental Model**: Principle of least privilege. Root (`UID 0`) bypasses all filesystem permissions. Web servers and microservices must run under dedicated system accounts (`UID < 1000`) like `www-data` or `node` with shell set to `/usr/sbin/nologin`.
- **System Identity Files**:
  - `/etc/passwd`: User account definitions, default shell, and home directory.
  - `/etc/shadow`: Cryptographically salted and hashed passwords (readable only by root).
  - `/etc/group`: Group memberships and GIDs.
  - `/etc/sudoers`: Privilege escalation rules (always edited via `sudo visudo`).
- **Production Commands**:
  - `useradd -m -s /bin/bash -G sudo deploy` — Provision deploy engineer with sudo rights.
  - `useradd -r -s /usr/sbin/nologin apprunner` — Provision unprivileged service account.
  - `chown -R deploy:www-data /var/www/app` — Assign ownership to deployer and web group.
  - `sudo visudo` — Edit sudoers with syntax checking to prevent root lockout.

---

### 04. Processes and Signals
- **Mental Model**: Every program runs as a process with a PID and PPID. Processes communicate and terminate via kernel IPC signals:
  - `SIGTERM (15)`: Polite termination request. The application catches this, finishes in-flight HTTP requests, closes database pools, and exits cleanly.
  - `SIGKILL (9)`: Kernel-enforced immediate death. Uncatchable. Drops active database transactions instantly.
  - `SIGHUP (1)`: Hangup / reload configuration without dropping client sockets (e.g. Nginx zero-downtime reload).
  - `SIGINT (2)`: Terminal keyboard interrupt (`Ctrl+C`).
- **Production Commands**:
  - `ps aux | grep node` — Search process table.
  - `top -b -n 1 | head -n 20` — Fast snapshot of highest resource-consuming processes.
  - `kill -15 <PID>` — Graceful shutdown (try this first).
  - `kill -9 <PID>` — Force kill after 10-second SIGTERM timeout.
  - `kill -HUP $(cat /var/run/nginx.pid)` — Reload Nginx without downtime.

---

### 05. Systemd Services
- **Mental Model**: Systemd is PID 1, the master init daemon. Services are declared in unit files (`/etc/systemd/system/*.service`). It handles automated crash reboots (`Restart=always`), startup sequencing (`After=network.target`), resource limits, and sandboxing.
- **Production Unit Template**:
  ```ini
  [Unit]
  Description=Next.js Web Service
  After=network.target postgresql.service

  [Service]
  Type=simple
  User=deploy
  WorkingDirectory=/var/www/app
  ExecStart=/usr/bin/node /var/www/app/server.js
  Restart=always
  RestartSec=5
  EnvironmentFile=/etc/app.env

  [Install]
  WantedBy=multi-user.target
  ```
- **Lifecycle Commands**:
  - `sudo systemctl daemon-reload` — Reload systemd index after editing service files.
  - `sudo systemctl status myapp.service` — Verify service health and PID.
  - `sudo systemctl enable --now myapp.service` — Enable at boot and start immediately.

---

### 06. Package Managers
- **Mental Model**: APT (Debian/Ubuntu) and DNF/YUM (RHEL) manage package repositories, dependencies, and digital signatures. APT downloads packages from `/etc/apt/sources.list`.
- **Production Commands**:
  - `sudo apt update && sudo apt upgrade -y` — Update indexes and apply patches.
  - `sudo apt-mark hold postgresql-16` — Pin database packages to prevent breaking major upgrades during automatic patch cycles.
  - `sudo apt autoremove -y && sudo apt clean` — Clear cached `.deb` files from `/var/cache/apt/`.
  - `sudo fuser -vki -TERM /var/lib/dpkg/lock-frontend` — Clear stuck package lockholders.

---

### 07. Grep, awk and sed
- **Mental Model**: The fundamental trio of log parsing and text stream processing:
  - `grep`: Matches regex patterns in text lines.
  - `awk`: Columnar extraction and aggregations. Columns are addressed as `$1, $2, ... $NF`.
  - `sed`: Stream editor for batch text substitutions without opening files.
- **Production Pipelines**:
  - `awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -10` — Rank top 10 requesting client IPs (anti-DDoS triage).
  - `awk '$9 >= 500 {print $7}' /var/log/nginx/access.log | sort | uniq -c | sort -nr` — Rank endpoints throwing 5xx errors.
  - `sed -i 's/DEBUG=true/DEBUG=false/g' .env` — In-place configuration replacement.

---

### 08. Pipes and Redirections
- **Mental Model**: Unix connects processes using memory buffers (pipes `|`) across standard file descriptors:
  - `0`: stdin (Standard input)
  - `1`: stdout (Standard output)
  - `2`: stderr (Standard error)
- **Redirection Matrix**:
  - `>`: Overwrite file with stdout.
  - `>>`: Append stdout to file.
  - `2>&1`: Combine stderr into stdout stream.
  - `&> /dev/null`: Discard all outputs into the bitbucket.
  - `cmd 2>&1 | tee output.log`: Print to terminal AND write to file simultaneously.
- **Rule**: When running sudo, use `echo "x" | sudo tee -a /etc/file` rather than `sudo echo "x" >> /etc/file`.

---

### 09. SSH and Keys
- **Mental Model**: Asymmetric public-key cryptography on port 22. Private key (`~/.ssh/id_ed25519`, chmod 600) stays on client; public key (`~/.ssh/authorized_keys`, chmod 644) resides on server.
- **Hardening Rules in `/etc/ssh/sshd_config`**:
  - `PasswordAuthentication no` — Disable password brute-force vectors entirely.
  - `PermitRootLogin no` — Force login through unprivileged user before sudo.
  - `MaxAuthTries 3` — Sever connection after 3 failed attempts.
- **Commands**:
  - `ssh-keygen -t ed25519 -C "deploy@prod"` — Modern high-security key generation.
  - `ssh-copy-id -i ~/.ssh/id_ed25519.pub user@server` — Secure key installation.
  - `sudo sshd -t` — Validate configuration syntax BEFORE restarting SSH daemon.

---

### 10. Cron Jobs
- **Mental Model**: Automated background scheduler running every minute against `/var/spool/cron/crontabs/`.
- **5-Star Syntax**: `Minute (0-59) | Hour (0-23) | Day of Month (1-31) | Month (1-12) | Day of Week (0-6)`
- **The Cron Environment Trap**: Cron jobs run in a stripped environment (`PATH=/usr/bin:/bin`). Commands calling `node`, `pnpm`, or `docker` fail unless full binary paths (`/usr/local/bin/node`) are specified.
- **Production Lock Pattern**:
  `0 2 * * * flock -n /tmp/backup.lock /usr/local/bin/backup.sh >> /var/log/backup.log 2>&1`
  *(Uses `flock -n` to prevent overlapping runs if a backup takes longer than 24 hours).*

---

### 11. Disk and Memory Usage
- **Mental Model**:
  - **RAM**: Linux caches disk reads in RAM (`buff/cache`). Real usable memory is **Available**, NOT **Free**.
  - **Swap**: Disk space acting as emergency virtual RAM to prevent crashes.
  - **OOM Killer**: When physical RAM and swap hit 100%, kernel invokes `oom-killer` to terminate highest-scoring memory hogs (usually PostgreSQL or Node.js) with SIGKILL.
- **Inspection Commands**:
  - `free -h` — Inspect memory and swap allocation.
  - `df -h` — Inspect filesystem partition capacity.
  - `du -ah /var 2>/dev/null | sort -rh | head -15` — Find 15 largest files on disk.
  - `dmesg -T | grep -i oom` — Verify if OOM killer executed.

---

### 12. Logs and Journalctl
- **Mental Model**: `systemd-journald` captures all service stdout/stderr in indexed binary logs. Traditional text logs live in `/var/log/`. `logrotate` compresses old logs (`.gz`) and discards ancient archives to prevent disk overflows.
- **Inspection Commands**:
  - `journalctl -u myapp.service -f` — Live real-time log stream.
  - `journalctl -u myapp.service --since "1 hour ago" -p err` — Query errors from past hour.
  - `sudo journalctl --vacuum-time=7d` — Purge journal logs older than 7 days.
  - `sudo tail -f /var/log/nginx/error.log` — Web server upstream triage.

---

### 13. Networking Commands
- **Mental Model**: Socket inspection and packet routing from Layer 3 to Layer 7.
- **Command Deck**:
  - `ss -tulpn` — List all listening TCP/UDP sockets with process PIDs.
  - `curl -Iv https://example.com` — Validate Layer 7 HTTP status and SSL certificate validity.
  - `dig +short example.com A` — Query DNS A-records directly.
  - `sudo ufw status numbered` — View active firewall rules.
  - `sudo ufw allow 80/tcp && sudo ufw allow 443/tcp` — Permit web traffic.
- **Rule**: Never expose databases (`5432`, `6379`) to public `0.0.0.0`; bind strictly to `127.0.0.1` or internal Docker networks.

---

### 14. Environment Variables
- **Mental Model**: Key-value pairs stored in process memory. Child processes inherit variables exported by parent shells. System-wide configuration lives in `/etc/environment`. Application secrets live in `.env` (chmod 600) or systemd `EnvironmentFile`.
- **Commands**:
  - `printenv | grep -E 'NODE_|DATABASE_'` — Audit active process variables.
  - `export KEY="value"` — Export to subshells.
  - `chmod 600 /var/www/app/.env` — Lock down secret access.

---

### 15. Shell Configuration
- **Mental Model**:
  - **Login Shell** (`ssh user@host`): Runs `/etc/profile`, then `~/.bash_profile`.
  - **Non-Login Interactive Shell** (`tmux`, subshell): Runs `~/.bashrc`.
  - `~/.bash_profile` should always include: `[[ -f ~/.bashrc ]] && . ~/.bashrc`.
- **Commands**:
  - `source ~/.bashrc` — Apply configuration without logging out.
  - `which pnpm` — Locate binary path in active PATH.
  - `echo $PATH | tr ':' '\n'` — Inspect PATH directory evaluation order.

---

### 16. tmux and screen
- **Mental Model**: Terminal multiplexers decouple terminal sessions from SSH network sockets. If SSH drops, the background tmux daemon keeps your long-running migration or compilation running.
- **Key Bindings (`Ctrl+b` Prefix)**:
  - `Ctrl+b  d` — Detach session (leaves it running in background).
  - `Ctrl+b  %` — Split pane vertically.
  - `Ctrl+b  "` — Split pane horizontally.
- **Commands**:
  - `tmux new -s deploy` — Start named session.
  - `tmux ls` — List background sessions.
  - `tmux attach -t deploy` — Reattach to running session.

---

### 17. Archives and Compression
- **Mental Model**: Archiving (bundling files with `tar`, preserving permissions) vs Compression (reducing size with `gzip`).
- **Commands**:
  - `tar -czvf backup-$(date +%F).tar.gz /var/www/app` — Compress directory with date tag.
  - `tar -xzvf backup.tar.gz -C /var/restore` — Extract into target directory.
  - `tar -czf - /var/www | ssh user@remote 'tar -xzf - -C /var/www'` — Stream directory over SSH pipeline without creating intermediate disk files.

---

### 18. Mounting Disks
- **Mental Model**: Block devices in `/dev/` (e.g. `/dev/sdb`) are partitioned, formatted with a filesystem (`ext4`, `xfs`), and mounted to a directory point. Persistent mounts live in `/etc/fstab`.
- **Rules for `/etc/fstab`**:
  - Always mount by **UUID** (`UUID=xxx`), never by mutable device names (`/dev/sdb`).
  - Always use `nofail` option: `UUID=xxx /mnt/data ext4 defaults,nofail 0 2`.
  - Test with `sudo mount -a` before rebooting!

---

### 19. Kernel Basics
- **Mental Model**: Monolithic kernel running in privileged CPU Ring 0. User programs run in unprivileged Ring 3 and request OS services via **System Calls (syscalls)**. Kernel parameters can be tuned in `/etc/sysctl.conf`.
- **Commands**:
  - `uname -a` — Kernel version and architecture.
  - `dmesg -T | tail -50` — Hardware and driver kernel ring buffer logs.
  - `sudo sysctl -p` — Apply persistent kernel parameters.

---

### 20. Troubleshooting Methodology (USE Method)
- **The USE Framework (Brendan Gregg)**:
  1. **Utilization**: Percentage of time resource was busy (`top`, `iostat`).
  2. **Saturation**: Degree of queued work waiting for resource (`load average`, `vmstat`).
  3. **Errors**: Count of error events (`dmesg`, `netstat -s`, `/var/log/syslog`).
- **The 5-Step Fault Triage Ladder**:
  1. Network & DNS (`ping`, `dig`)
  2. Firewall & Sockets (`ufw status`, `ss -tulpn`)
  3. Process State (`systemctl status`, `ps aux`)
  4. Capacity Limits (`df -h`, `free -h`)
  5. Application Logs (`journalctl -u service -n 50`)
- **Key Diagnostic**: `lsof -i :3000` — Identify process blocking port 3000 during EADDRINUSE errors.

