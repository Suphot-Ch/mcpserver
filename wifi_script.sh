sudo sh -c 'wpa_passphrase RD-Software_2.4G P@ssw0rd >> /etc/wpa_supplicant/wpa_supplicant.conf'
sudo wpa_cli -i wlan0 reconfigure
sleep 10
ip a show wlan0
ip route
ping -c 2 8.8.8.8