# Ejemplo · lab-05 (usuarios, sysadm, developer, sudo)

## Objetivos (resumen)

- Grupos `sysadm` y `developer`
- felipe y erik: **secundario** `sysadm`
- thiago: **secundario** `developer`, con shell, fuera de `sysadm`
- diego: `/sbin/nologin`, fuera de `sysadm`
- `%sysadm` puede `sudo useradd`; felipe `NOPASSWD` passwd
- Como felipe: crear usuarios `joaquin` y `roman` (prueba del `sudo useradd`)

## Probe

```bash
id felipe; id erik; id thiago; id diego
getent group sysadm developer
getent passwd diego
getent passwd joaquin roman
sudo -l -U felipe
sudo -l -U thiago
# opcional: ver el archivo (main o drop-in)
sudo grep -nE '%sysadm|^felipe ' /etc/sudoers /etc/sudoers.d/* 2>/dev/null
```

## Ejemplo OK

```text
uid=1000(felipe) gid=1000(felipe) groups=1000(felipe),1001(sysadm)
uid=1001(erik)   gid=1001(erik)   groups=1001(erik),1001(sysadm)
uid=1002(thiago) gid=1002(thiago) groups=1002(thiago),1003(developer)
uid=1003(diego)  gid=1003(diego)  groups=1003(diego)
```

```text
diego:...:/sbin/nologin
```

Notas:

- `gid` = grupo privado del usuario (o el que toque por defecto), **no** `sysadm`/`developer`.
- `sysadm` / `developer` solo en la lista `groups=` → secundarios (`useradd -G` / `usermod -aG`).
- thiago no figura en `getent group sysadm`.
- diego no tiene shell de login.

## Ejemplo FALTA · `-g` en vez de `-G`

```text
uid=1000(felipe) gid=1001(sysadm) groups=1001(sysadm)
uid=1002(thiago) gid=1003(developer) groups=1003(developer)
```

- `gid=…(sysadm)` o `gid=…(developer)` cuando el lab pide **secundario** → crearon con `useradd -g …` (primario).
- Arreglo (qué tiene que quedar): primario = grupo del login (o el que diga el enunciado); el de admin/dev otra vez como secundario, p. ej. `usermod -g felipe felipe` y `usermod -aG sysadm felipe` (ajustá nombres/GID reales de la VM).

## Ejemplo OK · sudoers

```text
%sysadm ALL=(ALL) /usr/sbin/useradd
felipe ALL=(ALL) NOPASSWD: /usr/bin/passwd
```

Vale en `/etc/sudoers` (visudo) o en `/etc/sudoers.d/sysadm`. Lo que importa: `sudo -l -U felipe` lista passwd con NOPASSWD, y un miembro de sysadm tiene useradd.

## Ejemplo FALTA · sudoers

- `sysadm ALL=…` sin `%` → no es regla de grupo  
- `felipe … /usr/bin/passwd` sin `NOPASSWD:` → le pide contraseña  
- `useradd` / `passwd` sin ruta absoluta → suele fallar o no matchear  
- solo en comentario `# %sysadm …` → no aplica  

## Otras FALTAs frecuentes

- thiago en `sysadm` → no debe administrar
- diego con `/bin/bash` → debía ser nologin
- `sudo -l -U felipe` sin `NOPASSWD: …/passwd` → falta la regla de felipe
- `sudo -l -U thiago` con useradd → no debería heredar sysadm
