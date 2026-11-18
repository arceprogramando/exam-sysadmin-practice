# Ejemplo · lab-11 (chrony / NTP)

Lista: **24 · server** (“Las dos máquinas no marcan la misma hora”).  
`where: server`, pero el lab pide **las dos** VMs.

## Objetivos

- Server 172.16.1.13 ofrece NTP
- Client 172.16.1.12 sincroniza contra ese server
- Persistente en las dos (`chronyd` enabled)

## Atajo

`scripts/lab-11.sh` corre todo esto (más escucha, hora propia del server y pedidos recibidos) en las dos VMs por vagrant ssh.

## Probe server (puerto 2200)

```bash
rpm -q chrony
systemctl is-enabled chronyd; systemctl is-active chronyd
grep -E '^\s*(allow|server|pool)' /etc/chrony.conf
firewall-cmd --list-services
firewall-cmd --permanent --list-services
```

## Probe client (puerto 2222)

```bash
rpm -q chrony
systemctl is-enabled chronyd; systemctl is-active chronyd
grep -E '^\s*(server|pool)' /etc/chrony.conf
chronyc sources -v
```

## Ejemplo OK

Server:

```text
enabled
active
allow 172.16.1.0/24
# firewall list-services incluye ntp (runtime y/o permanent + ya recargado)
```

Client:

```text
enabled
active
server 172.16.1.13 iburst
# chronyc sources: línea con 172.16.1.13 y ^* o ^+ (Reach != 0)
```

## Ejemplo FALTA / DUDOSO

| Señal | Estado |
|-------|--------|
| Sin `allow` en el server | FALTA (no ofrece NTP a la red) |
| `allow` ok pero `ntp` no está en el firewall | FALTA |
| Client sin `server 172.16.1.13` (solo pool público) | FALTA |
| `chronyc sources` no muestra `.13` o Reach 0 | FALTA |
| `chronyd` active pero `disabled` en una de las dos | FALTA (no persistente) |
| Solo una máquina tocada | incompleta / FALTA según qué falta |
| chrony no instalado (`rpm -q` falla) | no realizada o FALTA si la otra mitad sí |

| `allow` agregado después del último restart (`stat` del conf más nuevo que `ActiveEnterTimestamp`; `ss -ulnp` sin `:123`) | FALTA: falta `systemctl restart chronyd` |
| Server `Leap status: Not synchronised` y `chronyc clients` muestra al `.12` | FALTA: el server no tiene hora para dar; el client queda `^?` aunque firewall y allow estén bien |

## Caso real (2026-11-18, Vagrant)

Server con `allow 172.16.1.12`, `ntp` en el firewall (runtime y permanent), escuchando en `:123`, enabled. Client con `server 172.16.1.13 iburst`, enabled. Aun así el client queda `^? 172.16.1.13 … Reach 0`:

```text
# server
Leap status     : Not synchronised
8 sources with unknown address
NTP packets received       : 11      ← el client sí llega
default via 172.16.1.1 dev enp0s8 metric 100   ← sin internet
dns_FALLA
```

Causa: el lab de red del server dejó el gateway `172.16.1.1` con más prioridad que la NAT, así que el pool no resuelve y el server no tiene hora. Arreglo: `nmcli con mod enp0s8 ipv4.route-metric 200 ipv4.dns-priority 200 && nmcli con up enp0s8 && systemctl restart chronyd` (o `local stratum 10`). Veredicto mientras tanto: **incompleta** (sirve NTP y es persistente, pero el client no sincroniza).

Notas:

- `iburst` es opcional pero válido.
- Varios `allow` o CIDR distinto al /24 del lab: OK si cubre al client `.12`.
- No hace falta que el server use al client como fuente; el server **sirve** hora.
