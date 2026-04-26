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

$port.WriteLine("sleep 5; ip a show wlan0; ip route")
Start-Sleep -Seconds 6
$out1 = $port.ReadExisting()

$port.WriteLine("ping -c 3 192.168.109.253")
Start-Sleep -Seconds 4
$out2 = $port.ReadExisting()

$port.Close()
Write-Output "--- WLAN0 & ROUTE ---"
Write-Output $out1
Write-Output "--- PING ---"
Write-Output $out2
