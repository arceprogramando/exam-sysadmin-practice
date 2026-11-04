# Ejemplo · lab-10 (ACL /var/tmp/fstab)

## Objetivos

- Copia `/etc/fstab` → `/var/tmp/fstab`, dueño `root:root`
- Grupo root: solo lectura
- erik: rw
- felipe: sin acceso
- others: solo lectura
- (steps) sin bit de ejecución

## Probe

```bash
getfacl /var/tmp/fstab
```

## Ejemplo OK

```
# owner: root
# group: root
user::rw-
user:erik:rw-
user:felipe:---
group::r--
mask::rw-
other::r--
```

Notas:

- `mask::rw-` es normal con ACL de erik; el grupo efectivo sigue siendo `group::` ∩ mask → lectura.
- `chmod g-r` dejaría el grupo sin lectura → FALTA.

## Ejemplo FALTA

- `user:erik:r--` → erik no puede escribir  
- `other::rw-` → others escribe  
- `user:felipe:r--` → felipe no debe leer  
- falta `user:erik` → no hay ACL de erik  
