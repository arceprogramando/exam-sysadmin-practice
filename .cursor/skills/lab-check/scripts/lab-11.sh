#!/usr/bin/env bash
# lab-11 (list 24 · chrony): read-only check on server and client.
here="$(cd "$(dirname "$0")" && pwd)"

echo "######## SERVER 172.16.1.13"
"$here/vm.sh" server '
rpm -q chrony
echo "enabled=$(systemctl is-enabled chronyd) active=$(systemctl is-active chronyd)"
grep -nE "^\s*(allow|local|server|pool)" /etc/chrony.conf /etc/chrony.d/*.conf 2>/dev/null
echo "conf_mtime=$(stat -c %y /etc/chrony.conf)"
systemctl show chronyd -p ActiveEnterTimestamp
echo "fw_runtime=$(firewall-cmd --list-services)"
echo "fw_permanent=$(firewall-cmd --permanent --list-services)"
firewall-cmd --get-active-zones
echo "-- escucha (tiene que aparecer :123)"; ss -ulnp | grep chronyd
echo "-- hora propia (Leap status Normal = tiene hora para dar)"; chronyc tracking | grep -E "Reference|Stratum|Leap"
chronyc activity | grep -E "online|unknown"
echo "-- pedidos que le llegan del client"; chronyc serverstats | head -2; chronyc clients
echo "-- salida a internet"; ip route | grep default; getent hosts 2.rocky.pool.ntp.org >/dev/null && echo dns_OK || echo dns_FALLA
'

echo "######## CLIENT 172.16.1.12"
"$here/vm.sh" client '
rpm -q chrony
echo "enabled=$(systemctl is-enabled chronyd) active=$(systemctl is-active chronyd)"
grep -nE "^\s*(server|pool|peer)" /etc/chrony.conf /etc/chrony.d/*.conf 2>/dev/null
chronyc sources
chronyc tracking | grep -E "Reference|Stratum|Leap"
'
