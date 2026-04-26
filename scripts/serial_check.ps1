. "$PSScriptRoot\serial_env.ps1"
$serialCreds = Get-SerialCredentials

$port = new-Object System.IO.Ports.SerialPort COM6, 115200, None, 8, one
$port.ReadTimeout = 2000
$port.WriteTimeout = 2000
try {
    $port.Open()
} catch {
    Write-Host "Failed to open COM6: $_"
    exit 1
}

$port.WriteLine("`r`n")
Start-Sleep -Milliseconds 1000
$buffer = $port.ReadExisting()

if (Test-SerialLoginRequired -Buffer $buffer -Username $serialCreds.Username) {
    $port.WriteLine("$($serialCreds.Username)`r")
    Start-Sleep -Milliseconds 1000
    $port.WriteLine("$($serialCreds.Password)`r")
    Start-Sleep -Milliseconds 1000
}

$port.WriteLine("sudo dmesg | grep -iE 'usb|wlan|voltage|under' | tail -n 40`r")
Start-Sleep -Seconds 2
$port.WriteLine("ip a show wlan0`r")
Start-Sleep -Seconds 2
$port.WriteLine("ip route`r")
Start-Sleep -Seconds 2

$output = $port.ReadExisting()
$port.Close()
Write-Output $buffer
Write-Output "---"
Write-Output $output
