# Ejemplo · extra-04 (Flatpak)

## Objetivos (práctica casa)

- Flatpak instalado
- Remote flathub (URL del lab)
- `org.gnome.Calculator` → **system**
- `org.gnome.gedit` → **system** (se desinstala en extra-05)
- `org.mozilla.firefox` → **user** solo erik
- Siguen tras logout

## Probe

```bash
which flatpak
flatpak remotes
flatpak list | grep -iE 'Calc|gedit'
su - erik -c 'flatpak remotes; flatpak list --user' | grep -E 'flathub|irefox|firefox'
```

## Ejemplo OK

```text
flathub  system
...
Calculadora  org.gnome.Calculator  ...  system
gedit        org.gnome.gedit       ...  system

# como erik / su - erik:
flathub  system
flathub  user
Firefox  org.mozilla.firefox  ...
```

## FALTAs frecuentes

- `sudo -u erik flatpak … --user` → flatpak se niega; usar `su - erik -c '…'`
- remote solo **system** y install `--user` → “No se encontraron referencias remotas para flathub”
- id `org.mozilla.Firefox` (F mayúscula) → no matchea; es `org.mozilla.firefox`
- `flatpak list` como root no muestra la app `--user` de erik
