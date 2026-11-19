---
name: lab-check
description: >-
  Revisa si un lab del repo de práctica quedó hecho bien en la VM: compara evidencia
  (salida de comandos, captura o SSH) contra el objetivo del lab. Detecta errores
  típicos como useradd -g vs -G, sudoers, find que copia /proc, Flatpak
  system/user, chrony/NTP (allow, firewall, sources). Usar cuando el usuario diga
  revisar lab, chequear lab, ¿está bien?, grader, verificar objetivo, porcentaje
  del examen, o pegue getfacl/id/systemctl/lvs/visudo/flatpak/chronyc y pregunte
  si cumple.
---

# Lab check

Grader de **resultado**, no de camino. Varias formas válidas (orGroup, tip del video) cuentan si el objetivo se cumple.

## Cuándo

El usuario nombra un lab (`lab-10`, ACL, Q08, “el de fstab”), pide chequear **varios** / “los demás”, pregunta el **porcentaje**, o pega evidencia.

## Flujo

1. **Identificar el lab** (o la lista)  
   Buscá en `src/lib/labs.ts` por `id`, título o video. Leé `objective`, `steps`, `where` y el `tip`. No inventes objetivos.

2. **Conseguir evidencia** (en este orden)  
   - Salida pegada o captura en el chat.  
   - Si hay SSH usable: corré los **probes** (ver [probes.md](probes.md) y sección SSH abajo).  
   - Si falta evidencia: pedí **una** tanda corta de comandos, no la solución.

3. **Evaluar cada ítem del `objective`**  
   Para cada bullet: `OK` | `FALTA` | `DUDOSO`.

4. **No premiar el comando “del video”**  
   Resultado correcto por otro camino válido → OK. Comando parecido con estado malo → FALTA.

5. **Respuesta** (español, corta):

El número de la izquierda es el de la lista en `/practica/`, el de `labCode` en `src/lib/labs.ts` (dos dígitos). No pongas ahí el id (`lab-05`). Setup es `00` y no entra en los porcentajes. Edición v10 salvo que el usuario haya dicho v9. Ordená la tabla por ese número.

Un lab:

```markdown
## 06 · [título corto]

| Objetivo | Estado | Evidencia |
|----------|--------|-----------|
| … | OK / FALTA / DUDOSO | … |

**Veredicto:** bien / mal / incompleta / no realizada
**Siguiente probe** (solo si hace falta): `comando`
```

Varios labs (como en una pasada de VM). Una fila por lab que cuenta. Cada lab entra en una sola bolsa:

- **bien**: todos los objetivos OK.
- **incompleta**: hay trabajo y al menos un objetivo OK y otro FALTA o DUDOSO (la IP está, el hostname no).
- **mal**: se ve que lo intentaron y ningún objetivo queda OK (cron con el texto cambiado, grupo primario, find que copió `/proc`).
- **no realizada**: no hay rastro de que hayan empezado (el archivo no existe, el servicio no está instalado, sigue el valor de fábrica).

```markdown
## Chequeo client/server

| Nº | Veredicto | Qué vi |
|----|-----------|--------|
| 05 | mal | gid=sysadm → usaron -g |
| 12 | bien | getfacl OK |
| 03 | incompleta | IP 172.16.1.12/24; hostname client.rhcsa.lab |
| 09 | no realizada | atd no está instalado |

### Porcentaje (lista principal)
TOTAL = labs que cuentan (sin setup, sin el tema de la otra edición).

- Bien: A / TOTAL ≈ P%
- Mal: B / TOTAL ≈ P%
- Incompletas: C / TOTAL ≈ P%
- No realizadas: D / TOTAL ≈ P%

A + B + C + D = TOTAL. Si alguna no se pudo mirar, va en una quinta línea (No chequeadas) y las cinco suman TOTAL.
```

Una línea de arreglo por FALTA, sin pegar el walkthrough entero.

## Número de la lista → id (v10)

Lo que el usuario dice («el 24», «lab 24 server») es el número de la lista, no el id. Regla de `labCode`: labs `pdf` (en v10 entran Flatpak extra-04/05, salen Podman lab-20/21/22) ordenados client → server → los dos, respetando el orden de `LABS`; después los extras. Tabla actual (regenerala si cambia `labs.ts`):

| Nº | id | VM | | Nº | id | VM |
|----|----|----|-|----|----|----|
| 01 | lab-01-root-client | client | | 16 | lab-18 | client |
| 02 | lab-01 (red) | client | | 17 | lab-journal | client |
| 03 | lab-03 (repos) | client | | 18 | lab-19 | client |
| 04 | lab-05 (usuarios/sudo) | client | | 19 | extra-04 (Flatpak) | client |
| 05 | lab-pwquality | client | | 20 | extra-05 | client |
| 06 | lab-06 (setgid) | client | | 21 | lab-02-root-server | server |
| 07 | lab-07 (cron) | client | | 22 | lab-02 (red) | server |
| 08 | lab-at | client | | 23 | lab-11 (chrony) | server + client |
| 09 | lab-09 (tar) | client | | 24 | lab-15 (LVM) | server |
| 10 | lab-links | client | | 25 | lab-16 (swap) | server |
| 11 | lab-10 (ACL) | client | | 26 | lab-04 (puerto 82) | server |
| 12 | lab-12 (find) | client | | 27 | lab-ssh-key | server |
| 13 | lab-find-size | client | | 28 | lab-17 | server |
| 14 | lab-13 (grep) | client | | 29 | lab-08 | server |
| 15 | lab-14 (UID) | client | | 30 | extra-03 (FTP anónimo) | server |

## Acceso por vagrant ssh (lo más rápido)

Si no hay `~/.ssh/config` con `rhcsa-client`, entrá por Vagrant desde la carpeta del Vagrantfile (máquina personal: `~/rhsca-lab-client-server`, un symlink; otra carpeta → `LAB_VAGRANT_DIR`). Las VMs las levanta el usuario: **nunca** `vagrant up/halt/destroy`.

```bash
scripts/vm.sh client 'id erik; getfacl /var/tmp/fstab'   # comando de lectura como root
scripts/lab-11.sh                                         # chequeo completo de chrony en las dos
```

`vm.sh` pasa el comando en base64, así no hay que escapar `$`, comillas ni pipes. Primero `vagrant status` si no sabés si están arriba.

- Contraseñas: no intentes loguearte. Compará el hash: `openssl passwd -6 -salt SALT CLAVE` contra el campo de `getent shadow USUARIO` (SALT = lo que va entre el segundo y el tercer `$`). Si el campo empieza con `!`, el usuario no tiene contraseña (falta `passwd`).
- Nunca abras un login interactivo (`script -qc "su - erik"`, `su - erik` sin `-c`): se cuelga esperando una terminal y deja la sesión abierta en la VM. Para mensajes de login (lab-19), leé los archivos (`/etc/profile.d/*.sh`, `~/.bashrc`). `su - USER -c true` no sirve para probarlos: `/etc/profile` manda la salida de `profile.d` a `/dev/null` cuando el shell no es interactivo.
- `httpd` y `http` en el firewall del server vienen del provisionamiento (instalados a la hora en que se creó la VM). No cuentan como rastro del lab-04: mirá `rpm -q httpd --qf '%{INSTALLTIME:date}'` antes de decir que lo empezaron.

## Trampas que se repiten

- **Cambió el archivo, no reinició el servicio.** `sshd -T` y `sshd -t` leen el disco, no el proceso que corre. Compará `stat -c %y ARCHIVO` contra `systemctl show UNIDAD -p ActiveEnterTimestamp`: si el archivo es más nuevo, el servicio corre la config vieja. Para chrony mirá también `ss -ulnp | grep chronyd`: sin `:123` el `allow` no entró. Arreglo: `systemctl restart chronyd` / `sshd -t && systemctl reload sshd`.
- **sshd: gana el primero que se lee.** `sshd_config` incluye `sshd_config.d/*.conf` en la línea 15. `00-rhcsa-lab-root.conf` (PermitRootLogin) y `05-vagrant.conf` (PasswordAuthentication no) le ganan a lo que pongan más abajo en `sshd_config`. Para saber de qué archivo sale: `grep -Rni 'permitrootlogin\|passwordauthentication' /etc/ssh/sshd_config /etc/ssh/sshd_config.d/`. Ojo con `ssh_config.d` (cliente) contra `sshd_config.d` (servidor).
- **El Vagrant pierde internet después de los labs de red (02 y 22).** El gateway y el DNS `172.16.1.1` en enp0s8 quedan con métrica 100 y le ganan a la NAT (`10.0.2.2`, 101). `172.16.1.1` es el host: responde ping pero no rutea ni resuelve. Efectos: `dnf` → `Could not resolve host`; chrony del server → `sources with unknown address`. No es un error del lab. Arreglo sin romper el lab de red: `nmcli con mod enp0s8 ipv4.route-metric 200 ipv4.dns-priority 200 && nmcli con up enp0s8`.

## SSH a la VM de práctica (client)

Config típica en `~/.ssh/config`: `Host rhcsa-client` → `127.0.0.1`, puerto **2222**, user a veces `felipe` **sin** `IdentityFile`.

- `BatchMode` / sin clave → `Permission denied (publickey,password)`.
- En el lab de root la clave de **root** suele ser `student`.
- Preferí tandas **cortas** de comandos: un heredoc enorme puede colgar; muchas conexiones seguidas → sshd `Not allowed at this time` (MaxStartups). Esperá ~30–60 s y reintentá.
- OpenSSH interactivo a veces acepta password; si no, paramiko/python con `password='student'` (root, puerto 2222).
- Server: puerto **2200** (mismo patrón).

Probe multi-lab de ejemplo (root@client): ver [probes.md](probes.md) § “Pasada multi-lab”.

## Porcentaje del examen

- Contá labs `track` principal vía `labs.ts` + `trackFor`/`isOffEdition` (v10: Flatpak cuenta; Podman no).
- Setup (teclado) **no** cuenta.
- **bien** solo con todos los objetivos OK. Un acierto parcial es **incompleta**, no bien.
- Un intento cuyo resultado no cumple ningún objetivo es **mal**, no “casi”.
- Sin rastro de trabajo es **no realizada**.
- Cerrá con los cuatro porcentajes sobre el mismo TOTAL. Tienen que sumar el TOTAL (más no chequeadas, si las hay).

## Reglas

- Fuente de verdad: `objective` en `labs.ts` (y `labs-en.ts` si el UI está en EN).
- Prohibido inventar requisitos que el lab no pide.
- No marques Done en la app por el usuario.
- No asumas la VM: client vs server según `where`.
- Si el lab tiene prep (timers, LVM vo): distinguí prep vs lo que el lab pide demostrar.
- Persistencia: si el objetivo dice “al boot” / enable, comprobá unidad enable o fstab/exports, no solo el estado ahora.
- **Primario vs secundario:** si `steps`/`tip` dicen grupo *secundario* (lab-05: sysadm, developer), no alcanza con “está en el grupo”. Leé `id`:
  - `gid=` = **primario** (`useradd -g` / `usermod -g`)
  - `groups=` = lista (primario + **secundarios**; `useradd -G` / `usermod -aG`)
  - FALTA típica: `gid=…(sysadm)` o `gid=…(developer)` cuando el lab pedía secundario → usaron `-g` en vez de `-G`.
  - OK típico: `gid=…(felipe)` (o el grupo privado del login) y `sysadm`/`developer` aparece en `groups=` sin ser el `gid`.
- **sudoers / visudo** (lab-05 y similares): evaluá el **efecto**, no dónde lo editaron.
  - Vale `/etc/sudoers` o drop-in en `/etc/sudoers.d/…` si la regla es correcta y `sudo -l -U` la muestra.
  - Grupo → línea con `%nombre`. Usuario → sin `%`.
  - Comandos con **ruta absoluta** (`/usr/sbin/useradd`, `/usr/bin/passwd`), no solo el nombre corto.
  - `NOPASSWD:` solo donde el lab lo pide (felipe + passwd); no lo exijas en `%sysadm` useradd.
  - Preferí evidencia `sudo -l -U USUARIO` además (o en vez) del archivo: confirma qué aplica de verdad.
  - FALTAs típicas: `sysadm` sin `%`; `NOPASSWD` faltante en felipe; `passwd`/`useradd` sin path; regla solo en un comentario; thiago con privilegios de sysadm.
- **find → /root/erikfiles (lab-12):** si `find /root/erikfiles` solo muestra `proc/…` y `sin_proc=0`, FALTA. Camino del video: `find / -xdev -user erik -type f -mtime -1 -exec cp --parents {} /root/erikfiles \\;`. Vacío total también es FALTA si no hay evidencia de archivos de erik. Ver [examples/lab-12.md](examples/lab-12.md).
- **Flatpak (extra-04):** system vs user; no `sudo -u`+`--user`; id `org.mozilla.firefox` en minúsculas. Ver [examples/extra-04.md](examples/extra-04.md).
- **cron logger (lab-07):** el texto tiene que coincidir (`Ex200 Testing` sin espacio raro).
- **chrony / NTP (lab-11, “misma hora”):** hay que mirar **server y client**.
  - Server (172.16.1.13): `allow` (o equivalente) en `/etc/chrony.conf` para la red del lab; `firewall-cmd` con servicio `ntp` (UDP 123) permanente + reload; `chronyd` active y enabled.
  - Client (172.16.1.12): línea `server 172.16.1.13` (iburst OK) en chrony.conf; `chronyc sources` tiene que mostrar esa IP como fuente usable (no solo `^?` / unreachable eterno); `chronyd` active y enabled.
  - Persistente = `systemctl is-enabled chronyd` en **las dos**, no solo `is-active`.
  - FALTAs típicas: solo client configurado; `allow` sin firewall (o al revés); pool público tapa al server del lab; chronyd running pero disabled; `chronyc sources` solo `127.0.0.1` / `CHRO`. Ver [examples/lab-11.md](examples/lab-11.md).
  - **Server sin hora propia:** `chronyc tracking` en el server dice `Leap status : Not synchronised`. El server recibe y contesta (`chronyc serverstats` / `chronyc clients` muestran al `.12`), pero el client descarta la respuesta y queda `^?` con Reach 0. No confundir con firewall: si `clients` muestra al `.12`, el firewall anda. Causas: sin internet (ver trampa de rutas) o pool que no resuelve. Arreglo: devolverle internet, o `local stratum 10` en el chrony.conf del server y restart.
  - Correr `scripts/lab-11.sh`: junta todo eso en una pasada.

## Probes

Comandos típicos: [probes.md](probes.md).  
Ejemplos: [examples/lab-05.md](examples/lab-05.md), [examples/lab-10.md](examples/lab-10.md), [examples/lab-11.md](examples/lab-11.md), [examples/lab-12.md](examples/lab-12.md), [examples/extra-04.md](examples/extra-04.md).
