# scripts/fix-firewall.ps1
# Run this script as Administrator to allow Expo/Metro and ADB through the Windows Firewall.

Write-Host "Adding Windows Firewall rules for project115..." -ForegroundColor Cyan

# 1. Metro Bundler (Port 8081)
New-NetFirewallRule -DisplayName "Expo Metro Bundler (8081)" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8081 -ErrorAction SilentlyContinue

# 2. ADB (Ports 5554, 5555)
New-NetFirewallRule -DisplayName "Android ADB (5554-5555)" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 5554,5555 -ErrorAction SilentlyContinue

# 3. Expo older ports (19000-19006)
New-NetFirewallRule -DisplayName "Expo Legacy Ports (19000-19006)" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 19000-19006 -ErrorAction SilentlyContinue

Write-Host "Firewall rules added successfully." -ForegroundColor Green
Write-Host "Important: Ensure Tailscale is active and logged in on both your PC and your Phone." -ForegroundColor Yellow
try {
    $tsIp = (Get-NetIPAddress -InterfaceAlias Tailscale -ErrorAction SilentlyContinue | Select-Object -First 1).IPAddress
    if ($tsIp) {
        Write-Host "Your PC Tailscale IP: $tsIp" -ForegroundColor White
    } else {
        Write-Host "Tailscale interface not found. Please ensure Tailscale is installed and active." -ForegroundColor Red
    }
} catch {
    Write-Host "Could not retrieve Tailscale IP." -ForegroundColor Red
}
