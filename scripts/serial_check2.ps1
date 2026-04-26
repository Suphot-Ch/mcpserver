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
    Start-Sleep -Milliseconds 1000
}

$port.WriteLine("sudo dmesg | grep -iE 'usb|wlan|voltage|under' | tail -n 50")
Start-Sleep -Seconds 2
$port.WriteLine("ip a show wlan0")
Start-Sleep -Seconds 2
$port.WriteLine("ip route")
Start-Sleep -Seconds 2

$output = $port.ReadExisting()
$port.Close()
Write-Output "BUFFER:"
Write-Output $buffer
Write-Output "--- OUTPUT:"
Write-Output $output
