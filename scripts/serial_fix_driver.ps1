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

$port.WriteLine("echo 'options rtl8188fu rtw_power_mgnt=0 rtw_enusbss=0 rtw_ips_mode=1 rtw_ht_enable=0 rtw_bw_mode=0' | sudo tee /etc/modprobe.d/rtl8188fu.conf > /dev/null")
Start-Sleep -Seconds 1
$out1 = $port.ReadExisting()

$port.WriteLine("sudo rmmod rtl8188fu; sudo modprobe rtl8188fu; sleep 5; ip a show wlan0")
Start-Sleep -Seconds 8
$out2 = $port.ReadExisting()

$port.Close()
Write-Output "--- TEE ---"
Write-Output $out1
Write-Output "--- MODPROBE ---"
Write-Output $out2
