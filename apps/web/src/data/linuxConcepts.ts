export interface LinuxCommand {
  cmd: string;
  desc: string;
  level: "read" | "write" | "hazardous";
}

export interface LinuxConceptDetail {
  id: string;
  number: string;
  title: string;
  tagline: string;
  category:
    | "Filesystem & Permissions"
    | "Processes & Services"
    | "Text & Streams"
    | "Access & Automation"
    | "Diagnostics & Storage"
    | "Networking & Shell"
    | "Kernel & Recovery";
  mentalModel: string;
  keySyntax: string;
  productionCommands: LinuxCommand[];
  productionRules: string[];
  failureModes: string[];
  realWorldScenario: string;
}

export const LINUX_CONCEPTS: LinuxConceptDetail[] = [
  {
    id: "filesystem-hierarchy",
    number: "01",
    title: "File System Hierarchy",
    tagline: "Everything is a file mounted under the single root tree (/)",
    category: "Filesystem & Permissions",
    mentalModel:
      "Unlike Windows (which isolates storage by drive letters C:, D:), Unix presents a unified single-tree filesystem starting at root (/). Storage devices, RAM drives, hardware peripherals, and kernel runtime telemetry are mounted as directories inside this tree. Key directories: /etc (system config files), /var (dynamic logs and state), /opt (third-party software), /proc and /sys (virtual kernel pseudo-filesystems exposing CPU, memory, and process states in real time).",
    keySyntax:
      "/ (Root)\n├── etc/      Config files (nginx.conf, sshd_config)\n├── var/      Variable state & logs (/var/log, /var/run)\n├── proc/     Kernel virtual state (/proc/cpuinfo, /proc/meminfo)\n├── sys/      Kernel device hardware abstractions\n├── dev/      Device nodes (/dev/sda, /dev/null, /dev/urandom)\n├── opt/      Self-contained vendor packages\n├── home/     User personal directory trees\n└── tmp/      Volatile ephemeral storage (cleaned on reboot)",
    productionCommands: [
      { cmd: "tree -L 2 -d /", desc: "List top 2 levels of filesystem directory hierarchy.", level: "read" },
      { cmd: "cat /proc/cpuinfo | grep 'model name' | wc -l", desc: "Count logical CPU cores from virtual kernel procfs.", level: "read" },
      { cmd: "ls -la /var/log", desc: "Inspect system, auth, and webserver log directory.", level: "read" },
      { cmd: "du -sh /var/* 2>/dev/null | sort -h", desc: "Calculate size of /var subdirectories to locate runaway logs.", level: "read" }
    ],
    productionRules: [
      "Never write persistent application state or uploads into /tmp; it is volatile and purged on reboot.",
      "Store production web server configs strictly in /etc/<service>/ and deploy code into /var/www/ or /opt/.",
      "Never tamper with files in /proc or /sys directly; they are RAM interfaces into the live running kernel."
    ],
    failureModes: [
      "Disk 100% full because /var/log unrotated error logs filled up the root partition.",
      "Permissions crash when developers copy files into /etc without root ownership."
    ],
    realWorldScenario:
      "A VPS disk reaches 100% capacity and Nginx stops accepting connections. Running 'du -sh /var/log/*' isolates 45GB of uncompressed error logs, which can be safely cleared with 'truncate -s 0 /var/log/nginx/error.log'."
  },
  {
    id: "permissions-chmod",
    number: "02",
    title: "Permissions and chmod",
    tagline: "Discretionary Access Control: User, Group, Others with Read, Write, Execute",
    category: "Filesystem & Permissions",
    mentalModel:
      "Every file and directory has 3 permission scopes: Owner (u), Group (g), and Others (o). Each scope holds 3 bits: Read (4), Write (2), and Execute (1). For files: Read = view contents, Write = edit contents, Execute = run as program/binary. For directories: Read = list contents (`ls`), Write = create/delete files inside, Execute = enter/traverse directory (`cd`). Numeric permissions add the bits: 7 = rwx (4+2+1), 6 = rw- (4+2), 5 = r-x (4+1), 4 = r-- (4), 0 = ---.",
    keySyntax:
      "-rwxr-xr-- 1 deploy www-data 4096 Nov 9 10:00 app.js\n │  │  │  │\n │  │  │  └─ Others: r-- (4) = Read only\n │  │  └── Group (www-data): r-x (5) = Read + Execute\n │  └───── Owner (deploy): rwx (7) = Read + Write + Execute\n └──────── File type: '-' file, 'd' directory, 'l' symlink",
    productionCommands: [
      { cmd: "chmod 600 ~/.ssh/id_ed25519", desc: "Lock down private SSH key (Owner RW, Others none). Mandatory for SSH.", level: "write" },
      { cmd: "chmod 644 /var/www/html/index.html", desc: "Standard web asset permissions (Owner RW, World Read).", level: "write" },
      { cmd: "chmod 755 /var/www/html", desc: "Standard directory permissions (Owner RWX, World RX for directory traversal).", level: "write" },
      { cmd: "chmod -R u=rwX,g=rX,o= /opt/myapp", desc: "Safe capital X recursion: executes directories, leaves files non-executable.", level: "write" },
      { cmd: "chmod -R 777 /var/www", desc: "HAZARDOUS: Opens full write/execute access to all world users. Never run in production.", level: "hazardous" }
    ],
    productionRules: [
      "Never run 'chmod 777' as a quick fix; it exposes database secrets and allows arbitrary code execution.",
      "Private keys must always be 600 (~/.ssh/id_rsa, .env files); public keys are 644.",
      "Directories require the execute bit (755) for users to 'cd' inside them and traverse file trees."
    ],
    failureModes: [
      "SSH refuses connection: 'Permissions 0777 for id_rsa are too open. It is required that your private key files are NOT accessible by others.'",
      "Nginx returns 403 Forbidden because web assets lack read permission for the www-data group."
    ],
    realWorldScenario:
      "Deploying a Node.js web app yields 'EACCES: permission denied'. Running 'chown -R deploy:www-data /var/www/app && chmod -R 750 /var/www/app' properly assigns execution rights without making files world-writable."
  },
  {
    id: "users-and-groups",
    number: "03",
    title: "Users and Groups",
    tagline: "Principle of least privilege: Never run production application workloads as root",
    category: "Filesystem & Permissions",
    mentalModel:
      "Linux identities are separated into system accounts (UID < 1000) like `www-data`, `postgres`, `nobody`, and regular user accounts (UID >= 1000). Root (UID 0) has unrestricted kernel authority and bypasses all file permissions. Production workloads should run under isolated service accounts (`useradd -r -s /bin/false <service>`) with no interactive login shell. Sudo (`/etc/sudoers`) allows specified users to elevate privileges without sharing the root password.",
    keySyntax:
      "/etc/passwd  → deploy:x:1001:1001:Deploy User:/home/deploy:/bin/bash\n/etc/shadow  → deploy:$6$hashes...:19672:0:99999:7:::\n/etc/group   → www-data:x:33:deploy,nginx\n/etc/sudoers → %sudo ALL=(ALL:ALL) ALL",
    productionCommands: [
      { cmd: "id", desc: "Display current UID, GID, and effective group memberships.", level: "read" },
      { cmd: "useradd -m -s /bin/bash -G sudo deploy", desc: "Create dedicated deploy user with home dir and sudo access.", level: "write" },
      { cmd: "useradd -r -s /usr/sbin/nologin apprunner", desc: "Create unprivileged system user without shell for running Docker/Node.", level: "write" },
      { cmd: "chown -R deploy:www-data /var/www/app", desc: "Set owner to deploy user and group to web server www-data.", level: "write" },
      { cmd: "sudo visudo", desc: "Safely edit sudoers file with syntax validation before saving.", level: "write" }
    ],
    productionRules: [
      "Never run web applications or public-facing microservices directly as root UID 0.",
      "Always use 'sudo visudo' instead of 'nano /etc/sudoers'; visudo prevents syntax errors that permanently lock you out of root.",
      "Service accounts for daemon processes should have their shell set to '/usr/sbin/nologin'."
    ],
    failureModes: [
      "Attacker compromises Node.js app running as root and installs kernel rootkit on the host.",
      "Syntax typo in /etc/sudoers locks entire team out of sudo execution on production server."
    ],
    realWorldScenario:
      "A database backup script is automated. Instead of running as root, a dedicated 'dbbackup' user is provisioned with read-only access to PostgreSQL and write-only access to an S3 backup bucket."
  },
  {
    id: "processes-and-signals",
    number: "04",
    title: "Processes and Signals",
    tagline: "Process lifecycle, IPC signals, graceful shutdowns, and zombie elimination",
    category: "Processes & Services",
    mentalModel:
      "Every running program is a process identified by a PID (Process ID) with a Parent PID (PPID). Processes receive signals via the kernel for inter-process communication (IPC). Critical signals:\n- SIGTERM (Signal 15): Default polite request to terminate. The process catches this, finishes active HTTP requests, commits database transactions, closes sockets, and exits.\n- SIGKILL (Signal 9): Immediate kernel execution termination. Uncatchable. Drops active DB transactions immediately.\n- SIGHUP (Signal 1): Hang up / reload configuration without dropping connections (e.g. Nginx config reload).\n- SIGINT (Signal 2): Keyboard interrupt (Ctrl+C).",
    keySyntax:
      "Signal Values:\n 1  SIGHUP   Reload configuration\n 2  SIGINT   Interrupt (Ctrl+C)\n 9  SIGKILL  Immediate kill (Kernel forced, no cleanup)\n15  SIGTERM  Polite graceful shutdown (App catches and cleans up)\n18  SIGCONT  Continue paused process\n19  SIGSTOP  Pause process execution",
    productionCommands: [
      { cmd: "ps aux | grep node", desc: "List all active processes filtered by keyword 'node'.", level: "read" },
      { cmd: "top -b -n 1 | head -n 20", desc: "Batch snapshot of top CPU and memory consuming processes.", level: "read" },
      { cmd: "kill -15 <PID>", desc: "Send graceful SIGTERM to PID, allowing in-flight requests to complete.", level: "write" },
      { cmd: "kill -9 <PID>", desc: "Send forceful SIGKILL when process hangs on deadlock. Use only after SIGTERM fails.", level: "hazardous" },
      { cmd: "kill -HUP $(cat /var/run/nginx.pid)", desc: "Gracefully reload Nginx configuration without dropping client traffic.", level: "write" },
      { cmd: "pkill -f 'celery worker'", desc: "Send SIGTERM to all processes matching regex string.", level: "write" }
    ],
    productionRules: [
      "Always try SIGTERM (15) first and wait 5-10 seconds before escalating to SIGKILL (9).",
      "In containerized Docker environments, PID 1 must properly forward SIGTERM to child processes, or containers will hang on shutdown for 10s.",
      "Check PPID to prevent orphaned child processes or zombie states (<defunct>)."
    ],
    failureModes: [
      "Running 'kill -9' on PostgreSQL during active write leads to WAL log replay recovery delay on restart.",
      "Deadlocked worker process consumes 100% CPU because it ignored SIGTERM and required manual SIGKILL."
    ],
    realWorldScenario:
      "An automated deployment script triggers 'kill -9' on a payment processing worker. 4 customer stripe transactions are cut mid-flight. Switching the script to 'kill -15' lets the worker finish current transaction batches before dying."
  },
  {
    id: "systemd-services",
    number: "05",
    title: "Systemd Services",
    tagline: "Init system PID 1: Daemon lifecycle, automatic restart on failure, and boot targets",
    category: "Processes & Services",
    mentalModel:
      "Systemd is the initial process (PID 1) launched by the Linux kernel. It manages all background daemons (units) defined in `/etc/systemd/system/*.service`. A service file specifies `ExecStart` (the startup command), `Restart=always` (auto-reboots crashed services), `User` (drop root privileges to deploy user), and `EnvironmentFile` (inject secrets). Systemd provides centralized logging via `journald` and handles graceful socket-activated starts.",
    keySyntax:
      "[Unit]\nDescription=Next.js Web Application\nAfter=network.target postgresql.service\n\n[Service]\nType=simple\nUser=deploy\nWorkingDirectory=/var/www/app\nExecStart=/usr/bin/node /var/www/app/server.js\nRestart=always\nRestartSec=5\nEnvironment=NODE_ENV=production PORT=3000\nEnvironmentFile=/etc/myapp.env\n\n[Install]\nWantedBy=multi-user.target",
    productionCommands: [
      { cmd: "systemctl status myapp.service", desc: "Check service health, active status, PID, and recent log outputs.", level: "read" },
      { cmd: "sudo systemctl daemon-reload", desc: "Reload systemd manager configuration after editing unit files.", level: "write" },
      { cmd: "sudo systemctl start myapp.service", desc: "Start the target background service.", level: "write" },
      { cmd: "sudo systemctl restart myapp.service", desc: "Restart the target background service.", level: "write" },
      { cmd: "sudo systemctl enable myapp.service", desc: "Configure service to start automatically on system boot.", level: "write" },
      { cmd: "sudo systemctl disable myapp.service", desc: "Prevent service from starting automatically on system boot.", level: "write" }
    ],
    productionRules: [
      "Always execute 'sudo systemctl daemon-reload' immediately after creating or editing any unit file.",
      "Set 'RestartSec=5' alongside 'Restart=always' to prevent rapid crash-loop thrashing that locks CPU.",
      "Declare 'After=network.target' and 'After=postgresql.service' so dependencies start in deterministic order."
    ],
    failureModes: [
      "App crashes on boot because it tried to connect to PostgreSQL before database service was ready.",
      "Editing /etc/systemd/system/myapp.service without running 'daemon-reload' leaves system running obsolete config."
    ],
    realWorldScenario:
      "A developer starts an API with 'nohup node server.js &'. When the VPS reboots at 3 AM for kernel security updates, the API does not start. Packaging the process into a systemd unit with 'systemctl enable' ensures 100% automated reboot recovery."
  },
  {
    id: "package-managers",
    number: "06",
    title: "Package Managers",
    tagline: "Deterministic system package lifecycle: APT, DPKG, and unattended security patching",
    category: "Processes & Services",
    mentalModel:
      "Debian/Ubuntu systems rely on APT (Advanced Package Tool) as the high-level manager and DPKG as the low-level deb package installer. APT consults `/etc/apt/sources.list` and `/etc/apt/sources.list.d/` for signed repository metadata. `apt update` fetches package indexes; `apt upgrade` installs new package versions. Production stability requires holding critical versions (e.g. pinning PostgreSQL major versions) to prevent breaking upgrades during standard patches.",
    keySyntax:
      "APT Lifecycle:\napt update        → Downloads index files from /etc/apt/sources.list\napt upgrade       → Upgrades all packages with new versions available\napt install -y    → Installs package and resolves dependency trees\napt mark hold     → Pins package version, preventing automatic upgrades\napt autoremove    → Cleans unneeded orphaned dependency packages",
    productionCommands: [
      { cmd: "sudo apt update", desc: "Refresh local package lists from remote software repositories.", level: "write" },
      { cmd: "sudo apt upgrade -y", desc: "Install newest versions of all currently installed packages.", level: "write" },
      { cmd: "sudo apt install -y build-essential curl git ufw", desc: "Install core developer toolchain and dependencies.", level: "write" },
      { cmd: "sudo apt-mark hold postgresql-16", desc: "Pin PostgreSQL version to prevent unintended major database upgrades.", level: "write" },
      { cmd: "dpkg -l | grep -i nginx", desc: "Query low-level DPKG database to verify installed package version.", level: "read" },
      { cmd: "sudo apt autoremove -y && sudo apt clean", desc: "Remove orphaned packages and clean local archive cache in /var/cache/apt.", level: "write" }
    ],
    productionRules: [
      "Always run 'apt update' before 'apt install' to ensure package manifests and security hashes match.",
      "Pin database engines and runtime libraries using 'apt-mark hold' so automated cron patches don't break production.",
      "Clean up /var/cache/apt/archives periodically in constrained VPS disk environments."
    ],
    failureModes: [
      "Automated 'apt upgrade' upgrades PostgreSQL 15 to 16, breaking data directory format and taking DB offline.",
      "Interrupted APT command leaves /var/lib/dpkg/lock-frontend locked, blocking all future installs."
    ],
    realWorldScenario:
      "An engineer needs to fix a stuck dpkg lock after an SSH drop. Running 'sudo fuser -vki -TERM /var/lib/dpkg/lock-frontend' terminates the orphaned lockholder and running 'sudo dpkg --configure -a' repairs incomplete package states."
  },
  {
    id: "grep-awk-sed",
    number: "07",
    title: "Grep, awk and sed",
    tagline: "The Holy Trinity of Unix stream text parsing and log analysis",
    category: "Text & Streams",
    mentalModel:
      "- grep (Global Regular Expression Print): Filters and finds lines matching a regex pattern.\n- awk (Aho, Weinberger, Kernighan): Pattern-scanning and column processing language. Treats whitespace-separated text as columns ($1, $2, ... $NF). Ideal for calculating aggregations, status code counts, and tabular transforms.\n- sed (Stream Editor): Modifies, replaces, and deletes text streams line-by-line without opening interactive editors (`s/pattern/replacement/g`).",
    keySyntax:
      "grep -E 'regex' file.log       → Filter lines matching regex\nawk '{print $1, $9}' access.log → Print Column 1 (IP) and Column 9 (Status Code)\nawk '$9 >= 500 {print $7}'     → Print paths of requests returning 5xx errors\nsed 's/localhost/db.prod/g'    → Substitute string occurrences in text stream\nsed -i 's/PORT=3000/PORT=8080/' → Inline direct file modification",
    productionCommands: [
      { cmd: "grep -rn 'ERROR' /var/log/nginx/ --color=auto", desc: "Recursively search for string 'ERROR' with line numbers.", level: "read" },
      { cmd: "grep -E 'HTTP/1\\.[01]\" 5[0-9]{2}' /var/log/nginx/access.log | head -n 10", desc: "Filter access logs for 5xx server errors using regex.", level: "read" },
      { cmd: "awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -n 10", desc: "Calculate Top 10 client IPs generating traffic (anti-DDoS analysis).", level: "read" },
      { cmd: "awk '$9 == 502 {print $7}' /var/log/nginx/access.log | sort | uniq -c | sort -nr", desc: "List most frequent API routes throwing 502 Bad Gateway.", level: "read" },
      { cmd: "sed -i 's/DEBUG=true/DEBUG=false/g' .env", desc: "Directly mutate configuration flag inside .env file in-place.", level: "write" }
    ],
    productionRules: [
      "Always test sed substitutions without '-i' first to review stdout before mutating production configuration files.",
      "Combine 'sort | uniq -c | sort -nr' with awk to aggregate log counts and frequency rankings.",
      "Use 'grep -E' (extended regex) for alternation `(404|500|502)` instead of escaping multiple pipes."
    ],
    failureModes: [
      "Running 'sed -i' with an unescaped slash in a URL pattern replaces unexpected string fragments and corrupts .env.",
      "Unquoted awk print commands failing when log lines contain missing columns."
    ],
    realWorldScenario:
      "A DDoS attack floods an Nginx endpoint. The engineer runs 'awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -5' to isolate an IP sending 4,000 req/sec, then instantly bans it using 'sudo ufw deny from <IP>'."
  },
  {
    id: "pipes-and-redirections",
    number: "08",
    title: "Pipes and Redirections",
    tagline: "Connecting program outputs: stdin (0), stdout (1), stderr (2), and pipelines",
    category: "Text & Streams",
    mentalModel:
      "Every Unix process opens 3 standard POSIX file descriptors:\n- 0 (stdin): Standard input\n- 1 (stdout): Standard output (normal program results)\n- 2 (stderr): Standard error (diagnostics and error messages)\nPipes (`|`) connect stdout of the left program to stdin of the right program in memory without temporary files. Redirections change destinations:\n- `>` overwrites target file with stdout.\n- `>>` appends stdout to file.\n- `2>&1` redirects stderr into stdout stream.\n- `&> /dev/null` silences all output completely by discarding into the null device.",
    keySyntax:
      "cmd > file.txt      → Overwrite file with stdout (1)\ncmd >> file.txt     → Append stdout to file\ncmd 2> error.log    → Write only stderr (2) to error.log\ncmd > out.log 2>&1  → Write both stdout and stderr into out.log\ncmd 2>&1 | tee out  → Display output on terminal AND save to file simultaneously\ncmd < input.sql     → Feed input.sql into stdin",
    productionCommands: [
      { cmd: "ps aux | grep node | grep -v grep", desc: "Filter process tree while excluding the grep process itself.", level: "read" },
      { cmd: "npm run build > build.log 2>&1", desc: "Redirect standard output and compile errors into unified build.log.", level: "write" },
      { cmd: "tail -f /var/log/syslog | grep -i --line-buffered 'oom'", desc: "Live stream system logs filtered specifically for Out Of Memory events.", level: "read" },
      { cmd: "echo 'net.ipv4.tcp_syncookies = 1' | sudo tee -a /etc/sysctl.conf", desc: "Append kernel parameter through sudo without permission denial.", level: "write" },
      { cmd: "crontab_job.sh > /dev/null 2>&1", desc: "Completely suppress cron job terminal emails by discarding all output.", level: "write" }
    ],
    productionRules: [
      "Never use 'sudo echo ... > /etc/file'; the redirection is evaluated in the unprivileged shell and fails. Use 'sudo tee'.",
      "Always specify '2>&1' when logging background processes, otherwise fatal crash stack traces won't be written to log files.",
      "Be vigilant with `>` vs `>>`; accidentally typing single `>` truncates your production log file to 0 bytes."
    ],
    failureModes: [
      "Accidentally typing 'cat new.log > main.log' instead of '>>' wipes out weeks of historical production audit logs.",
      "Cron job sends thousands of spam emails because stderr was not redirected with '2>&1'."
    ],
    realWorldScenario:
      "A developer attempts 'sudo echo 'nameserver 1.1.1.1' > /etc/resolv.conf' and gets 'Permission denied'. They learn to pipe through tee: 'echo 'nameserver 1.1.1.1' | sudo tee /etc/resolv.conf', which correctly inherits root execution."
  },
  {
    id: "ssh-and-keys",
    number: "09",
    title: "SSH and Keys",
    tagline: "Cryptographic server access: Ed25519 keys, hardened sshd_config, and Bastion access",
    category: "Access & Automation",
    mentalModel:
      "SSH (Secure Shell, port 22) uses asymmetric cryptography. The developer holds a Private Key (`~/.ssh/id_ed25519`, chmod 600) on their local machine; the server stores the corresponding Public Key (`~/.ssh/authorized_keys`, chmod 644). During handshake, the server challenges the client to prove ownership of the private key mathematically without ever sending secrets across the wire. Hardening rules mandate disabling password auth, root direct login, and empty passwords in `/etc/ssh/sshd_config`.",
    keySyntax:
      "Local Client:              Remote Server (/home/deploy/.ssh/):\n~/.ssh/id_ed25519 (Private) ───[Handshake Challenge]───> authorized_keys (Public)\n(Never leave machine)                                     (Permitted signers)\n\nsshd_config Security Rules:\nPasswordAuthentication no\nPermitRootLogin no\nPubkeyAuthentication yes\nMaxAuthTries 3",
    productionCommands: [
      { cmd: "ssh-keygen -t ed25519 -C 'deploy@production'", desc: "Generate modern, secure Ed25519 keypair with comments.", level: "write" },
      { cmd: "ssh-copy-id -i ~/.ssh/id_ed25519.pub deploy@<SERVER_IP>", desc: "Securely copy public key to remote user's authorized_keys.", level: "write" },
      { cmd: "ssh -i ~/.ssh/id_ed25519 -p 22 deploy@<SERVER_IP>", desc: "Connect to remote host specifying private key identity.", level: "read" },
      { cmd: "chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys", desc: "Enforce strict POSIX permissions required by SSH daemon.", level: "write" },
      { cmd: "sudo sshd -t", desc: "Validate /etc/ssh/sshd_config syntax before restarting sshd daemon.", level: "read" },
      { cmd: "sudo systemctl restart ssh", desc: "Restart SSH server daemon to apply hardened configuration.", level: "write" }
    ],
    productionRules: [
      "Always use Ed25519 keys over obsolete RSA 2048 keys; Ed25519 is faster, more secure, and immune to padding oracles.",
      "Always test 'sshd -t' before restarting the SSH daemon; a syntax error can permanently sever server connectivity.",
      "Always keep an active SSH terminal session open in a separate window when modifying sshd_config until new logins verify."
    ],
    failureModes: [
      "Disabling PasswordAuthentication before copying public key locks developer out of remote server completely.",
      "SSH daemon silently ignores authorized_keys if file permissions are group-writable (777 or 775)."
    ],
    realWorldScenario:
      "Bots scan port 22 attempting 10,000 dictionary password attacks per hour. Setting 'PasswordAuthentication no' and installing Fail2ban drops unauthorized auth attempts to 0."
  },
  {
    id: "cron-jobs",
    number: "10",
    title: "Cron Jobs",
    tagline: "Time-based job scheduler: crontab syntax, environment traps, and overlapping lock safety",
    category: "Access & Automation",
    mentalModel:
      "Cron is a background daemon that triggers commands on specified schedules according to crontab files (`/var/spool/cron/crontabs/<user>` or `/etc/cron.d/`). The schedule has 5 fields: minute (0-59), hour (0-23), day of month (1-31), month (1-12), and day of week (0-7). CRITICAL GOTCHA: Cron executes jobs with a stripped, minimal environment (`PATH=/usr/bin:/bin`, HOME, and SHELL=/bin/sh). Commands depending on `/usr/local/bin` (node, pnpm, docker) fail unless full paths or explicit PATH exports are defined.",
    keySyntax:
      "┌───────────── Minute (0 - 59)\n│ ┌─────────── Hour (0 - 23)\n│ │ ┌───────── Day of Month (1 - 31)\n│ │ │ ┌─────── Month (1 - 12)\n│ │ │ │ ┌───── Day of Week (0 - 6) (0 = Sunday)\n* * * * * <command to execute>\n\nExamples:\n0 2 * * *       → Every night at 02:00 AM\n*/15 * * * *    → Every 15 minutes\n0 0 * * 1       → Every Monday at midnight\n0 0 1 * *       → First day of every month",
    productionCommands: [
      { cmd: "crontab -l", desc: "List active scheduled cron jobs for current user.", level: "read" },
      { cmd: "crontab -e", desc: "Edit user crontab schedule with default terminal editor.", level: "write" },
      { cmd: "flock -n /tmp/backup.lock /usr/local/bin/backup.sh", desc: "Execute job with non-blocking file lock to prevent overlapping runs.", level: "write" },
      { cmd: "grep CRON /var/log/syslog | tail -n 20", desc: "Inspect recent cron trigger executions and exit statuses.", level: "read" },
      { cmd: "crontab -r", desc: "HAZARDOUS: Removes all scheduled cron jobs for current user without confirmation.", level: "hazardous" }
    ],
    productionRules: [
      "Always specify absolute binary paths in cron commands (e.g. '/usr/bin/node /var/www/app/cron.js' not 'node cron.js').",
      "Always wrap long-running jobs in 'flock -n' to prevent a stalled job from overlapping with the next trigger cycle.",
      "Always redirect stdout and stderr to a log file (`>> /var/log/cron.log 2>&1`) to capture debugging outputs."
    ],
    failureModes: [
      "Cron job silently fails because 'node' or 'pnpm' was not in cron's default stripped PATH.",
      "Database backup cron takes 25 minutes to run every 15 minutes, spawning 10 overlapping backups and exhausting server RAM."
    ],
    realWorldScenario:
      "An automated daily report script fails silently. Adding 'SHELL=/bin/bash' and 'PATH=/usr/local/bin:/usr/bin:/bin' at the top of the crontab restores node environment resolution."
  },
  {
    id: "disk-and-memory-usage",
    number: "11",
    title: "Disk and Memory Usage",
    tagline: "Resource limits: Memory buffers/cache, Swap partitions, and Out-Of-Memory (OOM) Killer",
    category: "Diagnostics & Storage",
    mentalModel:
      "- Memory: Linux uses available RAM aggressively for filesystem page caching (`buff/cache`). This memory is instantly reclaimed if an application needs it. 'Free' RAM is wasted RAM; monitor 'Available' RAM instead.\n- Swap: Disk-backed virtual memory space. When physical RAM is exhausted, inactive pages swap to disk to avoid kernel panics.\n- OOM Killer: When physical RAM and swap hit 100%, the kernel invokes `oom-killer` to terminate the process with the highest `oom_score` (usually the database or web process) with SIGKILL to save the operating system from freezing.",
    keySyntax:
      "free -m output interpretation:\n              total        used        free      shared  buff/cache   available\nMem:           3920        1420         310          85        2190        2310\nSwap:          2048         120        1928\n\nReal usable RAM = 'available' (2310 MB), NOT 'free' (310 MB)!\nOOM Killer logs: /var/log/syslog or 'dmesg -T | grep -i oom'",
    productionCommands: [
      { cmd: "free -h", desc: "Display human-readable total, used, buff/cache, and available memory.", level: "read" },
      { cmd: "df -h", desc: "Show disk usage per mounted filesystem partition with available percentages.", level: "read" },
      { cmd: "du -ah /var 2>/dev/null | sort -rh | head -n 15", desc: "Locate the 15 largest files and folders consuming disk space.", level: "read" },
      { cmd: "dmesg -T | grep -i -E 'oom[- ]killer|killed process'", desc: "Check kernel ring buffer for Out-Of-Memory termination events.", level: "read" },
      { cmd: "sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile", desc: "Create and activate 2GB emergency swap file on Linux VPS.", level: "write" }
    ],
    productionRules: [
      "Always configure at least 1-2GB of swap on small 1GB-2GB VPS instances to prevent abrupt OOM Killer terminations.",
      "Set up disk alerts at 85% capacity; databases immediately enter read-only panic state if disk reaches 100%.",
      "Do not panic over low 'free' memory if 'available' memory is high; Linux caches disk files in RAM intentionally."
    ],
    failureModes: [
      "PostgreSQL or Node app killed abruptly with code 137 because kernel OOM killer executed SIGKILL.",
      "VPS becomes unresponsive because heavy swap thrashing saturated disk I/O at 100%."
    ],
    realWorldScenario:
      "A 1GB RAM VPS crashes during 'pnpm build'. The dmesg logs confirm: 'Out of memory: Killed process node'. Adding a 2GB swapfile gives the compiler enough virtual memory headroom to complete the build safely."
  },
  {
    id: "logs-and-journalctl",
    number: "12",
    title: "Logs and Journalctl",
    tagline: "Observability at the source: systemd journal, syslog, and automated logrotate",
    category: "Diagnostics & Storage",
    mentalModel:
      "Modern Linux systems unify service output into `systemd-journald`. All stdout and stderr emitted by any systemd service is indexed into binary journal logs queryable via `journalctl`. Traditional logs live in `/var/log/` (e.g. `/var/log/nginx/access.log`, `/var/log/auth.log`). `logrotate` runs daily via cron to compress older logs (`.gz`), retain N historical archives, and truncate active logs to prevent 100% disk exhaustion.",
    keySyntax:
      "journalctl Flags:\n-u <service>    → Filter logs by systemd service unit name\n-f              → Follow log stream in real time (like tail -f)\n-n <lines>      → Show latest N lines (e.g. -n 50)\n--since <time>  → Filter by timeframe ('1 hour ago', '2026-11-09 10:00:00')\n-p <priority>   → Filter by severity ('err', 'warning', 'info')",
    productionCommands: [
      { cmd: "journalctl -u myapp.service -n 100 --no-pager", desc: "View latest 100 log lines from application service without paging.", level: "read" },
      { cmd: "journalctl -u myapp.service -f", desc: "Follow live application logs in real time as requests arrive.", level: "read" },
      { cmd: "journalctl -u myapp.service --since '30 minutes ago' -p err", desc: "Filter errors and panics recorded in the last 30 minutes.", level: "read" },
      { cmd: "sudo tail -f /var/log/nginx/error.log", desc: "Follow Nginx web server upstream errors in real time.", level: "read" },
      { cmd: "sudo journalctl --vacuum-time=7d", desc: "Purge archived journal logs older than 7 days to reclaim disk space.", level: "write" }
    ],
    productionRules: [
      "Always configure '/etc/logrotate.d/myapp' for custom services writing files to /var/log/.",
      "Use 'journalctl -u service -f' during deployments to immediately verify zero runtime boot panics.",
      "Vacuum journald logs periodically with '--vacuum-size=500M' on capacity-constrained VPS nodes."
    ],
    failureModes: [
      "System disk fills up to 100% because logrotate was missing for high-throughput API logs.",
      "Application logging sensitive user credentials, bearer tokens, or credit cards in plain text logs."
    ],
    realWorldScenario:
      "An API server returns 502 Bad Gateway. Running 'journalctl -u myapp.service -n 50' instantly reveals: 'Error: connect ECONNREFUSED 127.0.0.1:5432 - Database server is not running'."
  },
  {
    id: "networking-commands",
    number: "13",
    title: "Networking Commands",
    tagline: "Inspecting socket bindings, network hops, DNS resolution, and firewall rules",
    category: "Networking & Shell",
    mentalModel:
      "Network troubleshooting follows the OSI model from Layer 3 (IP connectivity) to Layer 4 (Transport TCP/UDP port bindings) to Layer 7 (Application HTTP/DNS).\n- `ip addr`: View local network interfaces and IP assignments.\n- `ss -tulpn`: Modern replacement for netstat. Displays open listening sockets, ports, and owning PIDs.\n- `curl -Iv`: Inspect Layer 7 HTTP handshakes, headers, and TLS certificates.\n- `dig` / `nslookup`: Query DNS records directly against specific nameservers.\n- `ufw` (Uncomplicated Firewall): User-friendly frontend for iptables packet filtering rules.",
    keySyntax:
      "Networking Inspection Hierarchy:\nLayer 7 (App)   → curl -Iv https://domain.com / dig domain.com A\nLayer 4 (Port)  → ss -tulpn | grep :3000\nLayer 3 (IP)    → ping -c 4 1.1.1.1 / ip route\nFirewall (UFW)  → sudo ufw status verbose",
    productionCommands: [
      { cmd: "ss -tulpn", desc: "List all listening TCP/UDP sockets with process IDs and port numbers.", level: "read" },
      { cmd: "curl -Iv https://example.com", desc: "Fetch HTTP headers and verify TLS certificate expiration and cipher.", level: "read" },
      { cmd: "dig +short example.com A", desc: "Query authoritative DNS A-record mapping for domain.", level: "read" },
      { cmd: "sudo ufw status numbered", desc: "Display active firewall rules and their rule index numbers.", level: "read" },
      { cmd: "sudo ufw allow 80/tcp && sudo ufw allow 443/tcp", desc: "Allow inbound HTTP and HTTPS web traffic through firewall.", level: "write" },
      { cmd: "sudo ufw deny from 192.168.1.100", desc: "Block all network packets arriving from malicious source IP.", level: "write" }
    ],
    productionRules: [
      "Always verify internal port binding with 'ss -tulpn' before debugging Nginx 502 reverse proxy errors.",
      "Never expose database ports (5432, 6379, 27017) to public internet (0.0.0.0); bind to 127.0.0.1 or private VPC.",
      "Always allow port 22 in UFW BEFORE enabling the firewall with 'sudo ufw enable' to prevent instant lockout."
    ],
    failureModes: [
      "Enabling UFW without opening SSH port 22 locks the administrator out of the remote server permanently.",
      "Database bound to 127.0.0.1 cannot be reached by Docker containers running on a bridge network."
    ],
    realWorldScenario:
      "A containerized API fails to connect to PostgreSQL. Running 'ss -tulpn | grep 5432' shows Postgres is listening only on '127.0.0.1:5432' instead of the Docker bridge gateway '172.17.0.1:5432'. Updating postgresql.conf restores connectivity."
  },
  {
    id: "environment-variables",
    number: "14",
    title: "Environment Variables",
    tagline: "Runtime secrets injection, process inheritance, and system-wide env configuration",
    category: "Networking & Shell",
    mentalModel:
      "Environment variables are key-value string pairs maintained in a process's memory space. When a process spawns a child process (`fork`/`exec`), exported environment variables are inherited by the child. Variables defined without `export` remain local to the current shell. System-wide variables live in `/etc/environment`. Application secrets should never be baked into source code or Git repositories; inject them at runtime via `.env` files or systemd `EnvironmentFile` directives.",
    keySyntax:
      "Variable Scopes:\nexport KEY=value       → Exports variable to all future child subshells\nKEY=value node app.js  → Inline single-command injection (dies with process)\n/etc/environment       → System-wide global variables loaded on login\n~/.bashrc              → User-specific shell variables loaded in interactive bash",
    productionCommands: [
      { cmd: "printenv | grep -E 'NODE_|DATABASE_|PORT'", desc: "Inspect current process environment variables matching key filters.", level: "read" },
      { cmd: "echo $PATH | tr ':' '\n'", desc: "Print search PATH directories line-by-line for clear debugging.", level: "read" },
      { cmd: "export NODE_ENV=production", desc: "Set and export environment variable to all subsequently executed commands.", level: "write" },
      { cmd: "env -i /bin/bash", desc: "Spawn clean subshell with completely empty environment to test dependencies.", level: "read" },
      { cmd: "sudo chmod 600 /var/www/app/.env", desc: "Restrict production .env credentials to owner only (Read/Write).", level: "write" }
    ],
    productionRules: [
      "Never commit '.env' or secret credentials to Git version control; list '.env*' in .gitignore.",
      "Set file permissions on production .env files to 600 so unprivileged system accounts cannot read database secrets.",
      "Use systemd 'EnvironmentFile=/etc/myapp.env' to inject configuration into managed daemons cleanly."
    ],
    failureModes: [
      "Committed .env file pushed to GitHub leaks production Stripe secret keys within 90 seconds to scraping bots.",
      "Node.js app crashes in production because NODE_ENV was set without 'export', preventing child processes from seeing it."
    ],
    realWorldScenario:
      "A developer changes a DB password in `/etc/environment` but the running application still fails. Environment changes do not mutate running process memory. Restarting the systemd service reloads the environment file cleanly."
  },
  {
    id: "shell-configuration",
    number: "15",
    title: "Shell Configuration",
    tagline: "Startup initialization files: .bashrc vs .bash_profile, aliases, and PATH resolution",
    category: "Networking & Shell",
    mentalModel:
      "When a user logs in, bash reads configuration files based on shell mode:\n- Login Shell (SSH login): Executes `/etc/profile`, then the first found of `~/.bash_profile`, `~/.bash_login`, or `~/.profile`.\n- Non-Login Interactive Shell (opening a subshell or tmux window): Executes `~/.bashrc`.\nTo maintain consistency, `~/.bash_profile` should always source `~/.bashrc`. PATH dictates where bash searches for executable binaries in left-to-right order. Custom aliases and functions belong in `~/.bashrc`.",
    keySyntax:
      "Shell Startup Hierarchy:\nSSH Login ──> /etc/profile ──> ~/.bash_profile ──(sources)──> ~/.bashrc\nNew Window ──> ~/.bashrc\n\nCustom Alias Format:\nalias p='pnpm'\nalias d='docker'\nalias dc='docker compose'\nalias ll='ls -laF'",
    productionCommands: [
      { cmd: "echo $SHELL", desc: "Display active default login shell for current user.", level: "read" },
      { cmd: "nano ~/.bashrc", desc: "Edit user interactive shell configuration file.", level: "write" },
      { cmd: "source ~/.bashrc", desc: "Reload shell configuration immediately into current session without re-logging.", level: "write" },
      { cmd: "which node && which pnpm", desc: "Resolve exact filesystem binary path used when invoking commands.", level: "read" },
      { cmd: "type -a ls", desc: "Determine whether a command is a binary, shell built-in, or alias.", level: "read" }
    ],
    productionRules: [
      "Always prepend directories to PATH ('export PATH=\"/new/bin:$PATH\"') so custom versions take precedence.",
      "Never put heavy interactive commands or outputs in .bashrc; it can break SFTP and SCP remote copy protocols.",
      "Test shell configuration edits in a separate terminal before closing the current working session."
    ],
    failureModes: [
      "Adding 'echo Welcome' in ~/.bashrc breaks SCP and Ansible automated SSH commands because of unexpected stdout.",
      "Accidentally overwriting PATH with 'export PATH=/opt/bin' instead of appending breaks basic commands like 'ls' and 'sudo'."
    ],
    realWorldScenario:
      "An engineer executes 'pnpm' but gets 'command not found'. Running 'echo $PATH' reveals `/usr/local/bin` was missing. Adding `export PATH=\"/usr/local/bin:$PATH\"` to `~/.bashrc` fixes global binary resolution."
  },
  {
    id: "tmux-and-screen",
    number: "16",
    title: "tmux and screen",
    tagline: "Terminal multiplexers: Session persistence, detach/reattach, and multi-pane panes",
    category: "Access & Automation",
    mentalModel:
      "When an SSH connection drops, the kernel sends SIGHUP to the session leader, which kills all child terminal processes (e.g. your database migration or build script). Terminal multiplexers like `tmux` decouple the terminal process from the network socket by running a persistent background server. You can detach (`Ctrl+b d`) from a session, disconnect from SSH, travel home, reconnect via SSH, and reattach (`tmux attach`) to find the process still running exactly where you left it.",
    keySyntax:
      "Tmux Control Bindings (Prefix = Ctrl + b):\nCtrl+b  d    → Detach from current session (keeps it running in background)\nCtrl+b  c    → Create new window\nCtrl+b  %    → Split pane vertically (left / right)\nCtrl+b  \"    → Split pane horizontally (top / bottom)\nCtrl+b  o    → Switch between panes\nCtrl+b  x    → Close active pane",
    productionCommands: [
      { cmd: "tmux new -s deploy", desc: "Create a new named tmux session 'deploy'.", level: "write" },
      { cmd: "tmux ls", desc: "List all active background tmux sessions running on the server.", level: "read" },
      { cmd: "tmux attach -t deploy", desc: "Reattach to the existing background session 'deploy'.", level: "write" },
      { cmd: "tmux kill-session -t deploy", desc: "Terminate a specific background tmux session and its children.", level: "write" },
      { cmd: "tmux kill-server", desc: "HAZARDOUS: Immediately kills all active tmux sessions and running processes.", level: "hazardous" }
    ],
    productionRules: [
      "Always name tmux sessions explicitly (`tmux new -s <name>`) so team members know what is running.",
      "Always run long database migrations, bulk data imports, or compilation builds inside tmux to survive network drops.",
      "Use 'Ctrl+b d' to detach gracefully rather than closing your local terminal window directly."
    ],
    failureModes: [
      "Running a 4-hour database migration over raw SSH; WiFi drops at minute 230, causing a broken migration state.",
      "Leaving 20 forgotten tmux sessions running on a staging server consuming 4GB of residual memory."
    ],
    realWorldScenario:
      "A developer must run a 45-minute PostgreSQL migration. They open `tmux new -s db-migrate`, trigger `pnpm prisma migrate deploy`, detach with `Ctrl+b d`, close their laptop, and reattach an hour later to confirm success."
  },
  {
    id: "archives-and-compression",
    number: "17",
    title: "Archives and Compression",
    tagline: "Packaging and compressing data: tar archives, gzip, and streaming backups over SSH",
    category: "Diagnostics & Storage",
    mentalModel:
      "In Unix, archiving (bundling multiple files into a single tape archive `.tar`) is distinct from compression (shrinking file size with algorithms like gzip `.gz` or zstandard `.zst`). The `tar` utility bundles files while preserving POSIX permissions, directory hierarchies, timestamps, and symlinks. Combining both creates `.tar.gz` (tarball). Streaming tar over SSH allows copying gigabytes of files between servers directly in memory without creating temporary intermediate files on disk.",
    keySyntax:
      "tar Flags:\n-c  Create new archive\n-x  Extract files from archive\n-z  Compress/decompress using gzip (.gz)\n-v  Verbose progress output\n-f  Specify archive filename (MUST be immediately before file argument)\n-C  Change to target directory before extracting",
    productionCommands: [
      { cmd: "tar -czvf backup-$(date +%F).tar.gz /var/www/app", desc: "Create compressed tarball of directory with date timestamp.", level: "write" },
      { cmd: "tar -xzvf backup-2026-11-09.tar.gz -C /var/www/restore", desc: "Extract compressed tarball into target directory.", level: "write" },
      { cmd: "tar -ztvf backup.tar.gz | head -n 20", desc: "Inspect contents of compressed archive without extracting to disk.", level: "read" },
      { cmd: "tar -czf - /var/www/app | ssh user@remote 'tar -xzf - -C /var/www/app'", desc: "Stream directory tree directly between two servers over SSH pipeline.", level: "write" },
      { cmd: "gzip -d backup.sql.gz", desc: "Decompress gzipped database SQL dump file.", level: "write" }
    ],
    productionRules: [
      "Always check archive contents with 'tar -tf archive.tar.gz' before extracting to avoid overwriting existing files.",
      "Use '-C <directory>' to extract into isolated target folders instead of polluting current working directory.",
      "Exclude unnecessary directories with '--exclude=node_modules --exclude=.git' when creating application backups."
    ],
    failureModes: [
      "Creating tarball without excluding node_modules creates a 10GB archive that exhausts VPS disk capacity.",
      "Extracting a 'tar bomb' (archive without a parent root folder) that dumps 50,000 files into your home directory."
    ],
    realWorldScenario:
      "Migrating 50GB of user uploads between two VPS servers. Running `tar -czf - /var/www/uploads | ssh deploy@new-server 'tar -xzf - -C /var/www/uploads'` transfers the data securely without wasting temporary disk space."
  },
  {
    id: "mounting-disks",
    number: "18",
    title: "Mounting Disks",
    tagline: "Block devices, filesystem creation, persistent fstab mounts, and bootlock prevention",
    category: "Diagnostics & Storage",
    mentalModel:
      "Physical and virtual storage volumes appear as block device nodes in `/dev/` (e.g. `/dev/sda`, `/dev/nvme0n1`, `/dev/vdb`). A raw block device must be partitioned (GPT/MBR) and formatted with a filesystem (ext4 or xfs) before it can be attached (mounted) to an existing directory in the unified tree. The `/etc/fstab` file configures automatic mounting at boot. Crucial rule: Always identify disks in `fstab` by UUID (never raw device names like `/dev/sdb`, which can swap on reboot).",
    keySyntax:
      "/etc/fstab Format:\n<UUID>               <Mount Point>   <Type>  <Options>       <Dump>  <Pass>\nUUID=a1b2c3d4-...    /mnt/data       ext4    defaults,nofail   0       2\n\n'nofail' option is CRITICAL: Prevents server from hanging in emergency mode on boot if disk fails to mount!",
    productionCommands: [
      { cmd: "lsblk -f", desc: "List all storage block devices, partition layout, filesystem types, and UUIDs.", level: "read" },
      { cmd: "sudo mkfs.ext4 -L DataVol /dev/sdb", desc: "Format raw block volume /dev/sdb with Linux ext4 filesystem.", level: "hazardous" },
      { cmd: "sudo mkdir -p /mnt/data && sudo mount /dev/sdb /mnt/data", desc: "Mount formatted disk partition to /mnt/data target directory.", level: "write" },
      { cmd: "sudo umount /mnt/data", desc: "Safely unmount filesystem before detaching cloud volume.", level: "write" },
      { cmd: "sudo mount -a", desc: "Test-mount all entries in /etc/fstab to verify syntax before rebooting.", level: "read" }
    ],
    productionRules: [
      "Always use 'UUID=...' in /etc/fstab instead of '/dev/sdb'; device letters can shift after cloud provider reboots.",
      "Always include the 'nofail' flag in /etc/fstab for secondary data volumes so missing disks don't brick the boot sequence.",
      "Always execute 'sudo mount -a' after editing /etc/fstab; if it outputs an error, do NOT reboot until fixed."
    ],
    failureModes: [
      "Typo in /etc/fstab without 'nofail' causes the VPS to fail boot, dropping into Emergency Recovery Console.",
      "Running 'mkfs.ext4' on the wrong device name wipes out production PostgreSQL data volume instantly."
    ],
    realWorldScenario:
      "A cloud block volume is attached for Docker volumes. The engineer formats with `mkfs.ext4 /dev/vdb`, retrieves the UUID with `lsblk -f`, and adds `UUID=xxx /var/lib/docker ext4 defaults,nofail 0 2` to `/etc/fstab`, verifying with `mount -a`."
  },
  {
    id: "kernel-basics",
    number: "19",
    title: "Kernel Basics",
    tagline: "Core architecture: System calls, loadable modules, sysctl parameters, and dmesg",
    category: "Kernel & Recovery",
    mentalModel:
      "The Linux kernel is a monolithic operating system core running in privileged CPU ring 0. User-space programs (Node.js, Nginx) run in unprivileged ring 3 and must request kernel services (reading files, opening network sockets, allocating memory) via System Calls (`syscalls`). Dynamic device support is handled via loadable kernel modules (`lsmod`/`modprobe`). Kernel runtime parameters can be dynamically tuned via the `/proc/sys/` interface or persistently configured in `/etc/sysctl.conf` (e.g. TCP window scaling, SYN cookies).",
    keySyntax:
      "User Space (Ring 3): [ Node.js / Nginx / Database ]\n          │             ▲\n    read()│             │ sys_read() response\n          ▼             │\nKernel Space (Ring 0): [ System Call Interface (Syscalls) ]\n                       [ Process Scheduler | VFS | Network Stack ]\n                       [ Hardware Drivers / Kernel Modules ]",
    productionCommands: [
      { cmd: "uname -a", desc: "Display kernel version, release architecture, and host build date.", level: "read" },
      { cmd: "dmesg -T | tail -n 50", desc: "Inspect human-readable kernel ring buffer logs for hardware and driver events.", level: "read" },
      { cmd: "lsmod | head -n 15", desc: "List currently loaded kernel modules.", level: "read" },
      { cmd: "sudo sysctl -p", desc: "Load and apply persistent kernel configuration changes from /etc/sysctl.conf.", level: "write" },
      { cmd: "sudo sysctl -w net.ipv4.ip_forward=1", desc: "Dynamically enable kernel IPv4 packet forwarding for Docker routing.", level: "write" }
    ],
    productionRules: [
      "Always check 'dmesg -T' first whenever the operating system behaves erratically or processes are killed unexpectedly.",
      "Tune production network parameters in /etc/sysctl.conf (e.g. increase net.core.somaxconn from 128 to 4096 for Nginx).",
      "Never install unverified third-party out-of-tree kernel modules on high-security production nodes."
    ],
    failureModes: [
      "Hardware memory bit-flip or disk I/O controller failure logged only in kernel dmesg, missed by application logs.",
      "TCP connection drops under high load because kernel SYN backlog `net.ipv4.tcp_max_syn_backlog` was set to default 128."
    ],
    realWorldScenario:
      "Nginx drops connections during high concurrent traffic spikes. The engineer inspects `dmesg` and sees TCP SYN floods dropped. Tuning `net.core.somaxconn = 4096` in `/etc/sysctl.conf` eliminates the drops immediately."
  },
  {
    id: "troubleshooting-methodology",
    number: "20",
    title: "Troubleshooting Methodology",
    tagline: "The USE Method: Utilization, Saturation, and Errors across CPU, Memory, Disk, and Network",
    category: "Kernel & Recovery",
    mentalModel:
      "When a production server fails, never guess or reboot blindly. Follow Brendan Gregg's USE Method:\n1. Utilization: How busy is the resource? (e.g. CPU at 98%)\n2. Saturation: Is work queuing up waiting for the resource? (e.g. Load average > core count, swap active)\n3. Errors: Are error counters incrementing? (e.g. TCP drops, disk I/O errors)\nFollow the 5-Step Fault Triage Ladder: Physical/Cloud Connectivity → Firewall (UFW) → Port Binding (`ss -tulpn`) → Application Process Health (`systemctl`/`ps`) → Downstream Dependencies (Database/Redis).",
    keySyntax:
      "The 5-Step Triage Ladder:\nStep 1: Network & DNS   → ping -c 3 8.8.8.8 && dig domain.com\nStep 2: Firewall & Port → sudo ufw status && ss -tulpn | grep :3000\nStep 3: Process Health  → systemctl status myapp && ps aux | grep myapp\nStep 4: System Capacity → top (CPU), free -h (RAM), df -h (Disk)\nStep 5: Error Logs      → journalctl -u myapp -n 50 && dmesg -T | grep -i oom",
    productionCommands: [
      { cmd: "uptime", desc: "Display system uptime and 1, 5, 15-minute load averages.", level: "read" },
      { cmd: "top -b -n 1 | head -n 15", desc: "Snapshot active process resource consumption.", level: "read" },
      { cmd: "ss -tulpn | grep -E ':(80|443|3000|5432)'", desc: "Verify active listening ports for web server, app, and database.", level: "read" },
      { cmd: "journalctl -p err -xb -n 30", desc: "Query all system error priority logs recorded since current boot.", level: "read" },
      { cmd: "lsof -i :3000", desc: "Find exact process ID and user locking port 3000.", level: "read" }
    ],
    productionRules: [
      "Never reboot a stuck server before collecting basic diagnostics (top, free -h, df -h, journalctl); rebooting destroys in-memory forensic evidence.",
      "Use 'lsof -i :<port>' or 'fuser <port>/tcp' when encountering 'EADDRINUSE: address already in use'.",
      "Check disk space ('df -h') immediately if services fail to start or databases refuse to write records."
    ],
    failureModes: [
      "Junior engineer restarts server on high load, compounding failure by triggering long database recovery on reboot.",
      "Debugging code for 3 hours when the actual root cause was a full disk partition (df -h showing 100%)."
    ],
    realWorldScenario:
      "An API server alerts that it cannot accept traffic. The engineer runs the triage ladder: ping passes, port 3000 is open in ss, but `df -h` shows `/` partition is 100% full. Truncating old crash dumps instantly restores service availability without downtime."
  }
];

