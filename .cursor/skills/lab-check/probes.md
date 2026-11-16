# Probes por tema

Correr en la VM indicada por `where`. Preferí lectura (`getfacl`, `id`, `systemctl is-enabled`) antes que cambiar nada.

## Usuarios / sudo

```bash
id USUARIO
id -gn USUARIO          # solo primario
id -Gn USUARIO          # todos los nombres de grupo
getent group GRUPO
getent passwd USUARIO   # shell (nologin) y home
sudo -l -U USUARIO
# archivo (opcional; el efecto lo prueba sudo -l):
test -f /etc/sudoers.d/ARCHIVO && sudo cat /etc/sudoers.d/ARCHIVO
sudo grep -nE '%sysadm|felipe|useradd|passwd' /etc/sudoers /etc/sudoers.d/* 2>/dev/null
```

Cómo leer `id` (lab-05 y similares):

```text
uid=1000(felipe) gid=1000(felipe) groups=1000(felipe),1001(sysadm)
                 ^^^^^^^^^^^^^^^^ primario          ^^^^^^^^^^^^^^ secundarios
```

- Pedían **secundario** y `gid` es `sysadm`/`developer` → FALTA (`-g` en vez de `-G`).
- El grupo aparece solo en `groups=` y el `gid` es el del login → OK para secundario.
- `getent group sysadm` lista miembros; no distingue primario vs secundario: siempre cruzá con `id`.

sudoers lab-05 (contenido OK):

```text
%sysadm ALL=(ALL) /usr/sbin/useradd
felipe ALL=(ALL) NOPASSWD: /usr/bin/passwd
```

- `%` = grupo. Sin `%` en felipe.
- Paths absolutos. `NOPASSWD` solo en la de felipe/passwd.
- Archivo principal o `/etc/sudoers.d/…`: ambos OK si `sudo -l -U felipe` muestra la regla.

## ACL

```bash
getfacl RUTA
# Efectivo: mirar user:NOMBRE, group::, other::, mask::
# named user efectivo = entrada ∩ mask
```

## Red / hostname

```bash
nmcli -g IP4.ADDRESS,IP4.GATEWAY,IP4.DNS device show IFACE
hostnamectl
```

## Repos DNF

```bash
dnf repolist
grep -E '^(baseurl|enabled|gpgcheck)=' /etc/yum.repos.d/*.repo
```

## Servicios / timers

```bash
systemctl is-enabled -- NOMBRE
systemctl is-active -- NOMBRE
systemctl list-timers NOMBRE.timer --no-pager
systemctl cat NOMBRE.timer NOMBRE.service
```

## LVM / mounts

```bash
lvs; vgs; pvs
findmnt RUTA
grep RUTA /etc/fstab
df -h RUTA
```

## NFS / autofs

```bash
showmount -e IP_SERVER   # desde client
exportfs -v              # en server
systemctl is-enabled --now autofs
ls RUTA_AUTOFS && mount | grep PATRON
```

## Firewall / SELinux

```bash
firewall-cmd --list-services
firewall-cmd --list-ports
getenforce
semanage port -l | grep PATRON
```

## Cron / logger

```bash
systemctl is-enabled crond; systemctl is-active crond
crontab -u erik -l
journalctl -t erik --since "1 day ago" | grep -i Ex200 | tail -5
```

Texto exacto del lab: `Ex200 Testing` (sin espacio entre Ex y 200).

## find / erikfiles (lab-12)

```bash
find /root/erikfiles -type f 2>/dev/null | head
echo "sin_proc=$(find /root/erikfiles -type f ! -path '*/proc/*' 2>/dev/null | wc -l)"
```

`sin_proc=0` y rutas solo `…/proc/…` → FALTA (entró a `/proc`).

## Flatpak

```bash
which flatpak
flatpak remotes
flatpak list | grep -i Calc
su - erik -c 'flatpak remotes; flatpak list --user' | grep -E 'flathub|irefox|firefox'
```

## Tuned / UID / login

```bash
systemctl is-enabled tuned; tuned-adm active; tuned-adm recommend
id arce   # uid=1111
grep Welcome /home/joaquin/.bashrc; cat /etc/profile.d/welcome.sh
```

## chrony / NTP (lab-11) — server y client

Server (`where: server`, IP 172.16.1.13):

```bash
rpm -q chrony
systemctl is-enabled chronyd; systemctl is-active chronyd
grep -E '^\s*(allow|bindaddress|port|local|server|pool)' /etc/chrony.conf
firewall-cmd --list-services
firewall-cmd --list-ports
# permanente (si list-services no alcanza):
firewall-cmd --permanent --list-services
```

Client (172.16.1.12):

```bash
rpm -q chrony
systemctl is-enabled chronyd; systemctl is-active chronyd
grep -E '^\s*(server|pool|peer)' /etc/chrony.conf
chronyc sources -v
chronyc tracking
```

Cómo leer `chronyc sources` (client):

```text
MS Name/IP address         Stratum Poll Reach LastRx Last sample
===============================================================================
^* 172.16.1.13                   3   6   377    12   +123us[ +150us] +/-  ...
```

- `^*` o `^\+` con `172.16.1.13` y Reach ≠ 0 → OK (sincron contra el server).
- Solo `^?` / Reach `0` / no aparece `.13` → FALTA (no llega o no está en conf).
- Solo `127.127…` / `CHRO` / pools públicos y **no** el `.13` → FALTA para este lab.

## Pasada multi-lab (client, root)

Preferí **varias** conexiones cortas, no un solo script enorme.

```bash
# 05
id felipe; id erik; id thiago; id diego; sudo -l -U felipe; sudo -l -U thiago
# 06
ls -ld /shared/sysadm
# 07
crontab -u erik -l; systemctl is-active crond
# 10
getfacl /var/tmp/fstab
# 12
echo sin_proc=$(find /root/erikfiles -type f ! -path '*/proc/*' 2>/dev/null | wc -l)
# 13
wc -l /root/lines; test -f /usr/share/dict/words && echo words_ok
# 14 / 18 / 19 / flatpak: ver secciones arriba
# 11 (client half)
systemctl is-enabled chronyd; systemctl is-active chronyd; chronyc sources -v | head -20
```

Server (puerto **2200**), lab-11:

```bash
systemctl is-enabled chronyd; systemctl is-active chronyd
grep -E '^\s*allow' /etc/chrony.conf
firewall-cmd --list-services; firewall-cmd --permanent --list-services
```

SSH tip: `root@127.0.0.1 -p 2222`, password lab `student`. Server: puerto **2200**. Si dice `Not allowed at this time`, esperá y reintentá.
