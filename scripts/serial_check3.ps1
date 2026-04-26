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
    Start-Sleep -Seconds 5
}

$port.ReadExisting() | Out-Null
$port.WriteLine("sudo dmesg | tail -n 20")
Start-Sleep -Seconds 2
$output1 = $port.ReadExisting()

$port.WriteLine("ip a show wlan0")
Start-Sleep -Seconds 2
$output2 = $port.ReadExisting()

$port.WriteLine("ping -c 2 8.8.8.8")
Start-Sleep -Seconds 3
$output3 = $port.ReadExisting()

$port.Close()
Write-Output "--- DMESG ---"
Write-Output $output1
Write-Output "--- WLAN0 ---"
Write-Output $output2
Write-Output "--- PING ---"
Write-Output $output3
