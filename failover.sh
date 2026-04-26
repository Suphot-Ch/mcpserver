#!/bin/bash
TARGET="8.8.8.8"

GW_ETH0=$(ip route show default dev eth0 | head -n1 | awk '{print $3}')
GW_WLAN0=$(ip route show default dev wlan0 | head -n1 | awk '{print $3}')

if [ -z "$GW_ETH0" ]; then
    ETH0_OK=false
else
    if ping -I eth0 -c 1 -W 2 $TARGET > /dev/null 2>&1; then
        ETH0_OK=true
    else
        ETH0_OK=false
    fi
fi

if [ -z "$GW_WLAN0" ]; then
    WLAN0_OK=false
else
    if ping -I wlan0 -c 1 -W 2 $TARGET > /dev/null 2>&1; then
        WLAN0_OK=true
    else
        WLAN0_OK=false
    fi
fi

if [ "$ETH0_OK" = true ]; then
    CURRENT_METRIC=$(ip route show default dev eth0 | head -n1 | grep -o 'metric [0-9]*' | awk '{print $2}')
    if [ "$CURRENT_METRIC" != "202" ] && [ ! -z "$CURRENT_METRIC" ]; then
        ip route replace default via $GW_ETH0 dev eth0 metric 202
    fi
else
    if [ "$WLAN0_OK" = true ]; then
        CURRENT_METRIC=$(ip route show default dev eth0 | head -n1 | grep -o 'metric [0-9]*' | awk '{print $2}')
        if [ "$CURRENT_METRIC" != "404" ] && [ ! -z "$CURRENT_METRIC" ]; then
            ip route replace default via $GW_ETH0 dev eth0 metric 404
        fi
    fi
fi
