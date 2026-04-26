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

$port.WriteLine("sudo dmesg | tail -n 30")
Start-Sleep -Seconds 2
$out1 = $port.ReadExisting()

$port.WriteLine("sudo journalctl -u dhcpcd -n 30 --no-pager")
Start-Sleep -Seconds 2
$out2 = $port.ReadExisting()

$port.WriteLine("sudo journalctl -u wpa_supplicant -n 30 --no-pager")
Start-Sleep -Seconds 2
$out3 = $port.ReadExisting()

$port.WriteLine("ip a show wlan0")
Start-Sleep -Seconds 1
$out4 = $port.ReadExisting()

$port.Close()
Write-Output "--- DMESG ---"
Write-Output $out1
Write-Output "--- DHCPCD ---"
Write-Output $out2
Write-Output "--- WPA ---"
Write-Output $out3
Write-Output "--- WLAN0 ---"
Write-Output $out4
