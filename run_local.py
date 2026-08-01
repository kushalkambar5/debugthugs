import os
import sys
import json
import time
import subprocess
import urllib.request
import urllib.error
import signal

# Color support for terminals
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def log(msg, color=Colors.OKBLUE):
    print(f"{color}[HippoSuite] {msg}{Colors.ENDC}")

def get_ngrok_url():
    """Fetches the active public ngrok URL from the local ngrok client API."""
    try:
        req = urllib.request.Request("http://127.0.0.1:4040/api/tunnels")
        with urllib.request.urlopen(req, timeout=2) as response:
            data = json.loads(response.read().decode())
            tunnels = data.get("tunnels", [])
            for tunnel in tunnels:
                # Prefer HTTPS URLs
                public_url = tunnel.get("public_url", "")
                if public_url.startswith("https://"):
                    return public_url
            # Fallback to any public url if no https
            if tunnels:
                return tunnels[0].get("public_url", "")
    except urllib.error.URLError:
        pass
    except Exception as e:
        log(f"Error fetching ngrok tunnels: {e}", Colors.WARNING)
    return None

def update_env_file(env_path, ngrok_url):
    """Updates NEXTAUTH_URL inside the .env.local file with the ngrok URL."""
    lines = []
    updated = False
    
    # Read existing content if it exists
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
            
    new_lines = []
    for line in lines:
        if line.strip().startswith("NEXTAUTH_URL="):
            new_lines.append(f'NEXTAUTH_URL="{ngrok_url}"\n')
            updated = True
        else:
            new_lines.append(line)
            
    if not updated:
        # Append if not found
        new_lines.append(f'\n# Dynamically set by run_local.py\nNEXTAUTH_URL="{ngrok_url}"\n')
        
    with open(env_path, "w", encoding="utf-8") as f:
        f.writelines(new_lines)
        
    log(f"Updated NEXTAUTH_URL in {env_path} to {ngrok_url}", Colors.OKGREEN)

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(root_dir, "frontend")
    backend_dir = os.path.join(root_dir, "backend")
    env_path = os.path.join(frontend_dir, ".env.local")

    log("Starting Hippo Health Suite Launcher...", Colors.HEADER)
    
    # 1. Detect ngrok URL
    ngrok_url = get_ngrok_url()
    if ngrok_url:
        log(f"Active ngrok tunnel detected: {ngrok_url}", Colors.OKGREEN)
    else:
        log("No active ngrok tunnel found at http://127.0.0.1:4040", Colors.WARNING)
        log("If you are deploying for external access, please run 'ngrok http 3000' in another terminal window first!", Colors.WARNING)
        ngrok_url = "http://localhost:3000"
        log(f"Defaulting local auth URL to: {ngrok_url}", Colors.WARNING)

    # 2. Update .env.local with NextAuth URL
    update_env_file(env_path, ngrok_url)

    # 3. Launch Services
    processes = []
    
    try:
        # Launch backend
        log("Starting Express backend (port 5000)...", Colors.OKBLUE)
        backend_proc = subprocess.Popen(
            ["npm", "run", "dev"], 
            cwd=backend_dir, 
            shell=True
        )
        processes.append(backend_proc)
        
        # Launch frontend
        log("Starting Next.js frontend (port 3000)...", Colors.OKBLUE)
        frontend_proc = subprocess.Popen(
            ["npm", "run", "dev"], 
            cwd=frontend_dir, 
            shell=True
        )
        processes.append(frontend_proc)
        
        log(f"All systems running. Access your site at: {ngrok_url}", Colors.BOLD + Colors.OKGREEN)
        log("Press Ctrl+C to terminate all services.", Colors.HEADER)
        
        # Keep main thread alive and monitor processes
        while True:
            # Check if any process has terminated early
            for p in processes:
                if p.poll() is not None:
                    raise Exception("One of the services crashed/terminated unexpectedly.")
            time.sleep(1)
            
    except KeyboardInterrupt:
        log("\nShutting down services cleanly...", Colors.WARNING)
    except Exception as e:
        log(f"\nError: {e}", Colors.FAIL)
    finally:
        # Graceful cleanup
        for p in processes:
            if p.poll() is None:
                log(f"Terminating subprocess (PID {p.pid})...", Colors.WARNING)
                # On Windows, taskkill is needed for shell=True subprocesses to clean up children
                if sys.platform == "win32":
                    subprocess.run(["taskkill", "/F", "/T", "/PID", str(p.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                else:
                    p.terminate()
        log("Launcher exited successfully.", Colors.BOLD + Colors.OKGREEN)

if __name__ == "__main__":
    main()
