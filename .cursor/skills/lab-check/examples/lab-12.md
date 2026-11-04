# Ejemplo · lab-12 (find → /root/erikfiles)

## Objetivos

- Archivos de erik modificados en las últimas 24 h
- Copiados a `/root/erikfiles`
- Conservar estructura de rutas (`cp --parents`)

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

Rutas bajo `home/` (u otras reales), no solo `proc/`.

## Ejemplo FALTA · entró a /proc

```text
/root/erikfiles/proc/2606/task/2606/fdinfo/0
...
total=49
sin_proc=0
```

- Procesos de erik crean ficheros en `/proc` con dueño erik y mtime fresco.
- `find / -user erik` los agarra; `cp --parents` arma `/root/erikfiles/proc/...`.
- `2>/dev/null` no evita copiar `/proc`.

Arreglo: `rm -rf /root/erikfiles` y volver a correr el find con `-prune` de `/root/erikfiles`, `/proc`, `/sys`, `/dev`.
