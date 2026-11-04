# Ejemplo · lab-12 (find → /root/erikfiles)

## Objetivos

- Archivos de erik modificados en las últimas 24 h
- Copiados a `/root/erikfiles`
- Conservar estructura de rutas (`cp --parents`)

## Camino del video (Q12)

```bash
find / -user erik -type f -mtime -1 2>/dev/null
mkdir -p /root/erikfiles
find / -xdev -user erik -type f -mtime -1 -exec cp --parents {} /root/erikfiles \; 2>/dev/null
ls -R /root/erikfiles
```

- `-mtime -1` (no `1` solo).
- `-exec … \;` (no `\+` con `--parents` y padres distintos).
- `-xdev` opcional pero evita basura de `/proc`.

## Probe

```bash
find /root/erikfiles -type f 2>/dev/null | head
echo "total=$(find /root/erikfiles -type f 2>/dev/null | wc -l)"
echo "sin_proc=$(find /root/erikfiles -type f ! -path '*/proc/*' 2>/dev/null | wc -l)"
```

## Ejemplo OK

```text
/root/erikfiles/home/erik/...
sin_proc > 0
```

## Ejemplo FALTA · vacío

```text
total=0
```

No había archivos de erik con `-mtime -1`, o el destino no existía cuando corriste el `cp`.

## Ejemplo FALTA · solo /proc

```text
/root/erikfiles/proc/2606/...
sin_proc=0
```

Repetir con `-xdev` (o sin incluir `/proc` en la práctica).
