# Ejemplo · lab-11 (chrony / NTP)

Lista: **24 · server** (“Las dos máquinas no marcan la misma hora”).  
`where: server`, pero el lab pide **las dos** VMs.

## Objetivos

- Server 172.16.1.13 ofrece NTP
- Client 172.16.1.12 sincroniza contra ese server
- Persistente en las dos (`chronyd` enabled)

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

Notas:

- `iburst` es opcional pero válido.
- Varios `allow` o CIDR distinto al /24 del lab: OK si cubre al client `.12`.
- No hace falta que el server use al client como fuente; el server **sirve** hora.
