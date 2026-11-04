---
name: lab-check
description: >-
  Revisa si un lab RHCSA del repo quedó hecho bien en la VM: compara evidencia
  (salida de comandos, captura o SSH) contra el objetivo del lab. Detecta errores
  típicos como useradd -g vs -G, sudoers, find que copia /proc, Flatpak
  system/user. Usar cuando el usuario diga revisar lab, chequear lab, ¿está
  bien?, grader, verificar objetivo, porcentaje del examen, o pegue
  getfacl/id/systemctl/lvs/visudo/flatpak y pregunte si cumple.
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

Un lab:

```markdown
## lab-XX · [título corto]

| Objetivo | Estado | Evidencia |
|----------|--------|-----------|
| … | OK / FALTA / DUDOSO | … |

**Veredicto:** cumple / no cumple / incompleto
**Siguiente probe** (solo si hace falta): `comando`
```

Varios labs (como en una pasada de VM):

```markdown
## Chequeo client/server

| Lab | Veredicto | Qué vi |
|-----|-----------|--------|
| 05 | no cumple | gid=sysadm → usaron -g |
| 10 | cumple | getfacl OK |

### Porcentaje (lista principal)
- Cumplen: N / TOTAL ≈ P%
- Casi / mal / no chequeados: …
```

Una línea de arreglo por FALTA, sin pegar el walkthrough entero.

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
- Solo marcar **cumple** con evidencia OK. “Casi” (ej. cron con texto distinto) **no** suma al numerador.
- Sé explícito: *N cumplen / TOTAL lista ≈ P%*; aparte listá no chequeados y FALTA.

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
- **find → /root/erikfiles (lab-12):** si `find /root/erikfiles` solo muestra `proc/…` y `sin_proc=0`, FALTA. Hay que `-prune` de `/proc` `/sys` `/dev` (y del destino). Ver [examples/lab-12.md](examples/lab-12.md).
- **Flatpak (extra-04):** system vs user; no `sudo -u`+`--user`; id `org.mozilla.firefox` en minúsculas. Ver [examples/extra-04.md](examples/extra-04.md).
- **cron logger (lab-07):** el texto tiene que coincidir (`Ex200 Testing` sin espacio raro).

## Probes

Comandos típicos: [probes.md](probes.md).  
Ejemplos: [examples/lab-05.md](examples/lab-05.md), [examples/lab-10.md](examples/lab-10.md), [examples/lab-12.md](examples/lab-12.md), [examples/extra-04.md](examples/extra-04.md).
