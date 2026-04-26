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

$port.WriteLine("echo 'options rtl8188fu rtw_power_mgnt=0 rtw_enusbss=0 rtw_ips_mode=1' | sudo tee /etc/modprobe.d/rtl8188fu.conf > /dev/null")
Start-Sleep -Seconds 1
$out1 = $port.ReadExisting()

$port.WriteLine("cat /sys/module/rtl8188fu/parameters/rtw_power_mgnt")
Start-Sleep -Seconds 1
$out2 = $port.ReadExisting()

$port.WriteLine("cat /etc/modprobe.d/rtl8188fu.conf")
Start-Sleep -Seconds 1
$out3 = $port.ReadExisting()

$port.WriteLine("sudo rmmod rtl8188fu; sudo modprobe rtl8188fu; sleep 3; ip a show wlan0")
Start-Sleep -Seconds 5
$out4 = $port.ReadExisting()

$port.WriteLine("cat /sys/module/rtl8188fu/parameters/rtw_power_mgnt")
Start-Sleep -Seconds 1
$out5 = $port.ReadExisting()

$port.Close()
Write-Output "--- TEE ---"
Write-Output $out1
Write-Output "--- PARAM BEFORE ---"
Write-Output $out2
Write-Output "--- CONF ---"
Write-Output $out3
Write-Output "--- MODPROBE ---"
Write-Output $out4
Write-Output "--- PARAM AFTER ---"
Write-Output $out5
