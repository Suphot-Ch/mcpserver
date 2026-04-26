. "$PSScriptRoot\serial_env.ps1"
$serialCreds = Get-SerialCredentials

$port = new-Object System.IO.Ports.SerialPort COM6, 115200, None, 8, one
$port.DtrEnable = $true
$port.RtsEnable = $true
$port.ReadTimeout = 2000
$port.WriteTimeout = 2000
try {
    $port.Open()
} catch {
    Write-Host "Failed to open COM6: $_"
    exit 1
}

$port.WriteLine("")
Start-Sleep -Milliseconds 1000
$buffer = $port.ReadExisting()

if (Test-SerialLoginRequired -Buffer $buffer -Username $serialCreds.Username) {
    $port.WriteLine($serialCreds.Username)
    Start-Sleep -Milliseconds 1000
    $port.WriteLine($serialCreds.Password)
    Start-Sleep -Seconds 3
}

$port.ReadExisting() | Out-Null

$port.WriteLine("ip route")
Start-Sleep -Seconds 1
$out1 = $port.ReadExisting()

$port.WriteLine("ip neigh show dev wlan0")
Start-Sleep -Seconds 1
$out2 = $port.ReadExisting()

$port.WriteLine("ping -c 3 192.168.109.253")
Start-Sleep -Seconds 4
$out3 = $port.ReadExisting()

$port.WriteLine("sudo iw dev wlan0 link")
Start-Sleep -Seconds 1
$out4 = $port.ReadExisting()

$port.WriteLine("cat /etc/dhcpcd.conf | grep wlan0")
Start-Sleep -Seconds 1
$out5 = $port.ReadExisting()

$port.Close()
Write-Output "--- ROUTE ---"
Write-Output $out1
Write-Output "--- NEIGH ---"
Write-Output $out2
Write-Output "--- PING GW ---"
Write-Output $out3
Write-Output "--- LINK ---"
Write-Output $out4
Write-Output "--- DHCPCD ---"
Write-Output $out5
