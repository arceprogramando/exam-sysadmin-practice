import type { Locale } from "./i18n";

export interface TldrRef {
  /** Page name under tldr-pages, e.g. userdel */
  page: string;
  /** Folder in the repo: common or linux */
  platform?: "common" | "linux";
}

export interface GlossaryEntry {
  term: string;
  definition: string;
  example?: string;
  /** Extra words that count as this entry for search and in-text links (e.g. PV → volumen físico). */
  aliases?: string[];
  /** Link to usage examples on tldr-pages */
  tldr?: TldrRef;
}

export const TLDR_REPO = "https://github.com/tldr-pages/tldr";

export function tldrUrl(ref: TldrRef): string {
  const platform = ref.platform ?? "common";
  return `${TLDR_REPO}/blob/main/pages/${platform}/${ref.page}.md`;
}

/** Pasteable commands only. Split on " · " so each gets its own copy button. */
export function exampleCommands(example: string | undefined): string[] {
  if (!example?.trim()) return [];
  return example
    .split(" · ")
    .map((part) => part.trim())
    .filter(Boolean);
}

const es: GlossaryEntry[] = [
  {
    term: "which",
    definition: "Dice la ruta del ejecutable que el shell va a correr. No busca archivos sueltos: busca comandos en el PATH.",
    example: "which logger → /usr/bin/logger",
    tldr: { page: "which" },
  },
  {
    term: "rpm",
    definition:
      "Consulta paquetes ya instalados. rpm -ql PAQUETE lista los archivos que dejó en el disco. Sirve cuando el paquete no trae un comando: which no lo va a encontrar. rpm -q PAQUETE solo dice si está instalado y qué versión.",
    example: "rpm -ql words → el diccionario queda en /usr/share/dict/words. which words no sirve: words no es un comando",
    tldr: { page: "rpm", platform: "linux" },
  },
  {
    term: "head",
    definition:
      "Muestra solo las primeras líneas de un archivo o de lo que llega por pipe (por defecto 10). Sirve para mirar un preview sin inundar la terminal. Con -n N cambiás cuántas líneas.",
    example: "tar -tjf /root/myetcbackup.tar.bz2 | head → lista el backup y head deja ver las primeras rutas sin tirar todo /etc",
    tldr: { page: "head" },
  },
  {
    term: "wc",
    definition:
      "Cuenta líneas, palabras y bytes de un archivo o de lo que llega por pipe. Sin opciones muestra las tres. -l = solo líneas, -w = palabras, -c = bytes. Sirve para verificar que un filtro (grep, etc.) dejó contenido.",
    example: "wc -l /root/lines → cuántas líneas tiene el archivo del lab de grep · grep ich /usr/share/dict/words | wc -l → cuenta sin guardar el archivo",
    tldr: { page: "wc" },
  },
  {
    term: "comando",
    definition:
      "La primera palabra que escribís en el shell: el programa.\n\nEn man -k prop, el comando es man.\nEn vgcreate -s 8M wgroup /dev/sdb1, el comando es vgcreate.\n\nDespués del comando vienen opciones (con - o --) y argumentos (nombres, rutas, números).",
    example: "man · vgcreate · lvcreate · pvcreate",
  },
  {
    term: "opción",
    definition:
      "Un interruptor del comando. Empieza con un guion (-) o dos (--).\n\nCambia cómo trabaja el comando. No es el nombre del disco ni del grupo: eso es un argumento.\n\n-k en man -k prop es la opción «apropos»: busca páginas por palabra, no abre una página por nombre.\n-s en vgcreate -s 8M fija el tamaño de cada PE.\n-l en lvcreate -l 50 pide cantidad de extents.\n-L (mayúscula) en lvcreate pide tamaño en megabytes: no es lo mismo que -l.\n-n fija el nombre del LV.\n\nLa letra va pegada al valor cuando el man lo muestra así: -s 8M (8M sin espacio en el medio). Un espacio raro entre 8 y M rompe el parseo.",
    example: "man -k prop · vgcreate -s 8M wgroup /dev/sdb1 · lvcreate -n wshare -l 50 wgroup",
  },
  {
    term: "argumento",
    definition:
      "Lo que el comando necesita además de las opciones: nombres, rutas, números sueltos.\n\nEn man -k prop, prop es el argumento: la palabra a buscar.\nEn vgcreate -s 8M wgroup /dev/sdb1: wgroup es el nombre del VG y /dev/sdb1 es el PV.\nEn lvcreate -n wshare -l 50 wgroup: wgroup al final es el VG de donde se corta el LV.\n\nSin el argumento correcto el comando no sabe sobre qué trabajar.",
    example: "man -k prop · pvcreate /dev/sdb1 · lvcreate -n wshare -l 50 wgroup",
  },
  {
    term: "man",
    definition:
      "Abre la página del manual.\n\nSin opciones: man NOMBRE. El argumento es el nombre exacto de la página (man tar, man vgcreate, man semanage-port).\n\nAlgunos comandos tienen varias páginas. man semanage es la general. El puerto está en man semanage-port. En el shell: man semanage- y Tab Tab lista esas páginas.\n\nAdentro el visor es less:\nEspacio o f: baja una pantalla.\nb: sube.\ng: al principio. G: al final.\n/FRASE Enter: busca hacia abajo. n siguiente. N (Shift+n) anterior.\n?FRASE: busca hacia arriba.\nh: ayuda. q: sale.\n\nCon pipe (man xxx | grep …) el visor no se abre. Si ves 1m / 22m / 0m pegados a la palabra, es negrita del manual, no parte del comando.",
    example:
      "man -k lvm → páginas que hablan de LVM · man vgcreate · man semanage- + Tab Tab · man firewall-cmd y /add-port · man dnf.conf | grep baseurl",
    tldr: { page: "man" },
  },
  {
    term: "man -k",
    definition:
      "Opción de man. También se llama apropos.\n\nNo abre una página por nombre. Busca en el índice del manual las páginas cuya descripción menciona la palabra.\n\nPartes de man -k prop:\nman → el comando.\n-k → la opción (keyword / apropos).\nprop → el argumento (la palabra a buscar).\n\nSirve cuando no recordás el nombre exacto del comando: man -k extent, man -k fstab, man -k volume.",
    example: "man -k prop · man -k lvm · man -k extent · apropos lvm",
    tldr: { page: "apropos" },
  },
  {
    term: "vim",
    definition:
      "Editor de texto en la terminal. vim ARCHIVO. i entra en inserción (escribís). Esc vuelve al modo normal. :wq Enter guarda y sale. :q! Enter sale sin guardar.\n\nBuscar: /FRASE Enter (igual que en man). n la próxima. N (Shift+n) la anterior.\n\nPara el lab del puerto 82: vim /etc/httpd/conf/httpd.conf, /Listen, cambiá Listen 80 por Listen 82 en la línea sin #, Esc, :wq.",
    example: "vim /etc/httpd/conf/httpd.conf",
    tldr: { page: "vim" },
  },
  {
    term: "grep",
    definition:
      "Filtra líneas. Imprime las que contienen el texto y descarta el resto. Lee un archivo (grep FRASE ARCHIVO) o lo que llega por un pipe (comando | grep FRASE). -E permite varias frases separadas por | dentro de las comillas: cada | es un «o». Sin -E, ese | es un carácter más. -i ignora mayúsculas. ^ al principio de la frase exige que la línea empiece así. -w exige la palabra entera.",
    example:
      "man dnf.conf | grep -E 'baseurl|gpgcheck|enabled' → de la página del manual, solo las líneas con una de esas tres · grep ich /usr/share/dict/words > /root/lines → palabras que contienen ich, guardadas en ese archivo · grep '^Listen' /etc/httpd/conf/httpd.conf → líneas que empiezan con Listen",
    tldr: { page: "grep" },
  },
  {
    term: "cp",
    definition:
      "Copia archivos o directorios. Orden: cp ORIGEN DESTINO. Primero lo que copiás, después a dónde. Si DESTINO es una carpeta que ya existe, el archivo entra adentro con el mismo nombre. Si DESTINO es una ruta con nombre de archivo, ahí queda con ese nombre (renombrás al copiar). -p conserva dueño/modo/fechas del origen (hace falta root para el dueño). --parents recrea la ruta del origen bajo el destino. No asigna un dueño nuevo: eso es chown después.",
    example:
      "cp /home/erik/foto.jpg /root/copia.jpg → origen /home/erik/foto.jpg, destino /root/copia.jpg (mismo contenido, otro nombre) · cp /home/erik/foto.jpg /root/erikfiles/ → entra en esa carpeta como foto.jpg · cp --parents -p /home/erik/a.txt /root/erikfiles → queda /root/erikfiles/home/erik/a.txt y conserva dueño",
    tldr: { page: "cp" },
  },
  {
    term: "umask",
    definition: "Máscara de permisos al crear archivos o directorios. Resta bits del permiso por defecto. Un umask alto deja menos permisos abiertos.",
    example: "umask 022 → archivos nuevos suelen quedar 644; umask → muestra la máscara actual",
    tldr: { page: "umask" },
  },
  {
    term: "ACL",
    definition:
      "Access Control List: permisos finos por usuario o grupo, además del dueño/grupo/otros del chmod. En el examen suelen pedirse con setfacl y getfacl. Los ejemplos de uso están en esas dos entradas.",
  },
  {
    term: "getfacl",
    definition: "Muestra las ACL de un archivo o directorio: user, group, other y mask. Sirve para verificar el lab, no solo el chmod.",
    example: "getfacl /var/tmp/fstab",
    tldr: { page: "getfacl", platform: "linux" },
  },
  {
    term: "setfacl",
    definition: "Pone o saca ACL. -m modifica, -x quita una entrada, -b borra todas las ACL extendidas.",
    example: "setfacl -m u:erik:rw /var/tmp/fstab",
    tldr: { page: "setfacl", platform: "linux" },
  },
  {
    term: "userdel",
    definition:
      "Borra un usuario. Con -r: cuenta + home + mail. Sin -r: el home queda. No borra crontab, archivos fuera del home, ACL en otros paths ni sudoers. Para limpiar todo en una VM de práctica hace falta más (crontab, find -nouser, carpetas de lab). El usuario no puede tener sesión abierta. En XFS el home no se recupera.",
    example: "userdel -r erik",
    tldr: { page: "userdel", platform: "linux" },
  },
  {
    term: "usermod",
    definition:
      "Modifica un usuario que ya existe. -aG suma un grupo secundario sin borrar los otros (sin -a, -G reemplaza toda la lista). -s cambia el shell. -l renombra el login. -g cambia el grupo primario. -d -m mueve el home.",
    example: "usermod -s /sbin/nologin diego · usermod -aG sysadm felipe",
    tldr: { page: "usermod", platform: "linux" },
  },
  {
    term: "groupdel",
    definition:
      "Borra un grupo. No puede ser el grupo primario de nadie: si falla, mirá getent group NOMBRE y cambiá el primario con usermod -g OTRO usuario, o borrá esos usuarios. Si el grupo solo era secundario (como sysadm en el lab), groupdel alcanza.",
    example: "groupdel sysadm",
    tldr: { page: "groupdel", platform: "linux" },
  },
  {
    term: "ugo",
    aliases: ["UGO", "u g o", "rwx"],
    definition:
      "Las tres clases de permiso, en orden: u (user/dueño), g (group), o (other).\n\nEn ls -l se ven tres tríos: rwxrwxrwx → dueño, grupo, otros.\nEn chmod con número: tres dígitos, uno por clase (ej. 644 = u=6, g=4, o=4).\n\nCada trío suma los mismos bits:\n4 = r\n2 = w\n1 = x\n\n7 = rwx (4+2+1)\n6 = rw- (4+2)\n5 = r-x (4+1)\n4 = r--\n3 = -wx (2+1)\n2 = -w-\n1 = --x\n0 = --- (nada en esa clase; no significa «root»)\n\nMismos bits, distinto significado según sea archivo o carpeta:\n\nEn un archivo\n• r = leer el contenido\n• w = modificar / borrar el archivo\n• x = ejecutarlo (script, binario)\n• 7 = leer, escribir y ejecutar\n\nEn una carpeta\n• r = listar nombres (ls)\n• w = crear y borrar adentro\n• x = entrar (cd) y abrir lo de adentro — no es «ejecutar un programa»\n• 7 = listar, crear y entrar\n• 6 = r+w sin x: no alcanza para cd ni para crear adentro (por eso 2660/2664 no sirven en /shared/sysadm; hace falta 2770)\n\nDetalle de carpetas: ver «permisos de un directorio».\n\nEjemplo archivo: chmod 666 → todos leen y escriben, nadie ejecuta.\nEjemplo carpeta: chmod 770 → dueño y grupo listan, crean y entran; others nada.",
    example: "ls -l · chmod 644 archivo · chmod 755 dir · chmod 2770 /shared/sysadm · chmod u=rwx,g=rx,o=rx script",
    tldr: { page: "chmod" },
  },
  {
    term: "user · dueño",
    aliases: ["u", "dueño", "owner", "user::"],
    definition:
      "La primera clase de ugo: el dueño del archivo (columna user en ls -l / getfacl user::).\n\nEn chmod es la u o el primer dígito de los tres (en 644, el 6).\nEn letras: chmod u+x, u=rw, u-w.\n\nRoot suele ser el dueño en labs de sistema; el permiso del dueño no es lo mismo que «ser root»: root puede saltarse permisos, el dueño solo tiene lo que diga su trío rwx.",
    example: "chmod u=rw archivo · chmod 600 archivo → solo el dueño lee y escribe",
    tldr: { page: "chmod" },
  },
  {
    term: "group · grupo",
    aliases: ["g", "grupo dueño", "group::"],
    definition:
      "La segunda clase de ugo: el grupo dueño del archivo (ls -l / getfacl group::).\n\nEn chmod es la g o el dígito del medio (en 644, el primer 4 = solo lectura para el grupo).\nEn letras: chmod g=r, g-w, g+x.\n\nQuien esté en ese grupo usa este trío (si no es el dueño). No confundir con grupos secundarios de la cuenta (id / -G): acá es el grupo del archivo.",
    example: "chmod g=r /var/tmp/fstab · chmod 640 archivo → grupo solo lee",
    tldr: { page: "chmod" },
  },
  {
    term: "other · otros",
    aliases: ["o", "others", "otros", "other::"],
    definition:
      "La tercera clase de ugo: todo el mundo que no es el dueño ni está en el grupo dueño.\n\nEn chmod es la o o el último dígito (en 644, el 4 final = solo lectura).\nEn letras: chmod o=r, o-rwx, o+x.\n\nAbrir other a escritura (chmod o+w / 666) deja que cualquiera escriba: en labs de ACL a veces pedís other solo lectura y excepciones con setfacl.",
    example: "chmod o=r archivo · chmod 644 archivo → others solo lee",
    tldr: { page: "chmod" },
  },
  {
    term: "chmod",
    definition:
      "Cambia permisos de un archivo o directorio.\n\nEn man chmod, el número puede tener hasta cuatro dígitos. Cada uno suma 4, 2 y 1.\n\n2770 se lee así:\n2, el primero: set group ID (setgid).\n7, el segundo: el dueño. 4+2+1, leer, escribir y entrar.\n7, el tercero: el grupo, con los mismos tres.\n0, el cuarto: el resto. Nadie.\n\nEn una carpeta, ese 1 es entrar. Sin él, el 6 no deja hacer cd ni crear un archivo. 2660 no sirve. 2770 sí.\n\nCon tres dígitos solos, son dueño, grupo y otros (ugo). El de adelante es el bit especial: 4 setuid, 2 setgid, 1 sticky.\n\nTambién acepta letras: u=dueño, g=grupo, o=otros, a=todos. + agrega, - saca, = fija.\nTabla rápida: ver ugo.",
    example: "chmod 644 archivo · chmod 755 dir · chmod 2770 /shared/sysadm · chmod u+x script.sh · chmod g-w,o-rwx archivo",
    tldr: { page: "chmod" },
  },
  {
    term: "permisos de un directorio",
    definition:
      "En una carpeta, r w x no significan lo mismo que en un archivo.\n\nr = ver los nombres (ls).\nw = crear y borrar adentro.\nx = entrar (cd) y abrir lo que está adentro.\n\nSin x no se entra, aunque haya r y w. Crear un archivo también pide x: hace falta w y x juntos.\n\n7 = 4+2+1, las tres: ver, crear y entrar.\n6 = 4+2, sin entrar. Por eso 2660 no sirve para /shared/sysadm y 2770 sí.\n0 = ni ver, ni crear, ni entrar.",
    example: "chmod 2770 /shared/sysadm → el grupo entra y crea · chmod 2660 no entra",
    tldr: { page: "chmod" },
  },
  {
    term: "setuid",
    definition:
      "Bit especial 4 (el primer dígito de chmod). En un ejecutable, el proceso corre como el dueño del archivo (ejemplo clásico: passwd como root). En directorios casi no se usa. Se ve como s en el lugar de la x del dueño: rws---. Si es S mayúscula, el bit está pero falta la x del dueño.",
    example: "chmod 4755 /ruta/al/bin → 4 = setuid",
    tldr: { page: "chmod" },
  },
  {
    term: "setgid",
    definition:
      "Bit especial 2. En man chmod es el primer dígito: set group ID.\n\nEn un directorio, los archivos y carpetas nuevos heredan el grupo dueño de esa carpeta.\nEn el lab es /shared/sysadm con chmod 2770. Si Felipe hace un touch ahí, el archivo queda grupo sysadm.\n\nEn un ejecutable, el proceso corre con el grupo del archivo.\n\nSe ve como s en el grupo: drwxrws---.\nSi es S mayúscula, falta la x del grupo. Sin esa x no se entra ni se crea adentro.",
    example: "chmod 2770 /shared/sysadm → 2 = setgid + 770",
    tldr: { page: "chmod" },
  },
  {
    term: "sticky",
    definition:
      "Bit especial 1. En un directorio escribible por varios (como /tmp), solo el dueño del archivo (o root) puede borrarlo. Se ve como t al final: drwxrwxrwt. Si es T mayúscula, el bit está pero falta la x de others. No es lo que pide el lab de setgid: ahí hace falta heredar el grupo, no proteger borrados.",
    example: "chmod 1777 /tmp → 1 = sticky + 777",
    tldr: { page: "chmod" },
  },
  {
    term: "bits especiales chmod",
    definition:
      "El primer dígito de chmod no es dueño, grupo ni otros. Es el bit especial.\n\n4 setuid.\n2 setgid.\n1 sticky.\n\nSe pueden sumar: 3 = setgid+sticky, 6 = setuid+setgid, 7 = los tres.\n\nDespués van los tres de siempre. 2770 = setgid + rwxrwx---.",
    example: "4 setuid · 2 setgid · 1 sticky",
  },
  {
    term: "LVM",
    aliases: ["Logical Volume Manager"],
    definition:
      "Logical Volume Manager: una forma de usar discos por capas, con nombres, en vez de depender solo de /dev/sdb1.\n\nCapas (nombres reales)\n• PV (Physical Volume): disco o partición marcado con pvcreate.\n• VG (Volume Group): uno o más PV juntos en un tanque de espacio.\n• LV (Logical Volume): pedazo con nombre cortado del VG; se formatea y se monta.\n\n¿Para qué sirve?\nUn sysadmin lo usa cuando Operaciones pide un espacio compartido (archivos de un servicio, dumps, datos) que tenga nombre, se monte en una carpeta, y más adelante se pueda agrandar sin borrar todo y reparticionar a mano.\n\nFlujo\ndisco o partición → PV → VG → LV → sistema de archivos → montaje.\n\nAnalogía LEGO (solo para visualizar): el PV es una placa que preparás; el VG es juntar placas en una plataforma; el LV es el edificio encima que usás de verdad. Los PE son los ladrillos de tamaño fijo con los que el VG reparte espacio.\n\next4 y /mnt/wshare ya no son LVM: son el formato y el montaje encima del LV.",
    example: "pvcreate /dev/sdb1 · vgcreate -s 8M wgroup /dev/sdb1 · lvcreate -n wshare -l 50 wgroup · mkfs.ext4 /dev/wgroup/wshare · mkdir -p /mnt/wshare · mount /dev/wgroup/wshare /mnt/wshare",
  },
  {
    term: "PV · volumen físico",
    aliases: ["PV", "volumen físico", "Physical Volume", "Physical Volumes"],
    definition:
      "Physical Volume (PV). En español, volumen físico.\n\n¿Qué es?\nEs un disco o una partición que inicializás con pvcreate para que LVM pueda utilizarlo como espacio de almacenamiento.\n\nAl convertirlo en PV, LVM prepara ese dispositivo para incorporarlo a un VG. Todavía no podés utilizarlo como un LV ni montarlo directamente como un sistema de archivos.\n\n¿Para qué sirve?\nEs el punto de entrada del almacenamiento físico a LVM. Sin un PV, LVM no puede incorporar ese dispositivo a un VG y, por lo tanto, no podés crear LV a partir de él.\n\nAnalogía LEGO (opcional): el PV es la placa que preparás. Todavía no es el VG ni el LV; solo deja ese disco/partición listo para entrar al grupo.\n\nEn el laboratorio\nSe utiliza la partición /dev/sdb1 del disco adicional, no el disco del sistema, donde están / y /boot.\n\nCuidado\nSi inicializás el disco completo (/dev/sdb) en lugar de su partición (/dev/sdb1), podés impedir usar el espacio restante para otras particiones, como la de swap. Por eso en este laboratorio se trabaja con una partición específica.\n\nFlujo de LVM: disco o partición → PV → VG → LV → sistema de archivos.",
    example: "pvcreate /dev/sdb1 · pvs · pvdisplay",
    tldr: { page: "pvcreate", platform: "linux" },
  },
  {
    term: "VG · grupo de volúmenes",
    aliases: ["VG", "grupo de volúmenes", "Volume Group", "Volume Groups"],
    definition:
      "Grupo de volúmenes (Volume Group, VG).\n\n¿Qué es?\nUn conjunto de uno o más PV que se agrupan para formar una única reserva de espacio. De esa reserva se crean los LV, que después usás como dispositivos de almacenamiento.\n\n¿Para qué sirve?\nEl VG es el espacio común del que vas a sacar los LV. Permite administrar uno o varios PV como si fueran una sola unidad lógica.\n\nAl crearlo definís:\n• Nombre del grupo: en el laboratorio, wgroup.\n• Tamaño de los PE: cada Physical Extent es una unidad de asignación. En el laboratorio cada PE mide 8 MiB (-s 8M).\n\nSin un VG no tenés un grupo de almacenamiento del que crear los LV.\n\nAnalogía LEGO (opcional): ya tenés PV preparados; el VG es juntarlos en una plataforma de la que después cortás los LV.\n\nFlujo de LVM: disco o partición → PV → VG → LV → sistema de archivos.",
    example: "vgcreate -s 8M wgroup /dev/sdb1 · vgs · vgdisplay",
    tldr: { page: "vgcreate", platform: "linux" },
  },
  {
    term: "LV · volumen lógico",
    aliases: ["LV", "volumen lógico", "Logical Volume", "Logical Volumes"],
    definition:
      "Volumen lógico (Logical Volume, LV).\n\n¿Qué es?\nEl pedazo con nombre que cortás de un VG. Eso es lo que formateás (ext4) y montás en una carpeta.\n\n¿Para qué sirve?\nEl sistema y vos hablan de un disco con nombre (/dev/wgroup/wshare), no de «un trozo raro de sdb1». Después podés agrandarlo (lvextend) sin rearmar el particionado del PV.\n\nAnalogía LEGO (opcional): el LV es el edificio encima del VG; es lo que formateás y montás de verdad.\n\nEn el lab\nEse LV se llama wshare: 50 PE de 8 MiB = 400 MB.\n\nComando del lab: lvcreate -n wshare -l 50 wgroup\n• -n wshare: nombre del LV\n• -l 50: 50 extents (minúscula). 50 × 8 MiB = 400 MB\n• wgroup: VG del que lo cortás",
    example: "lvcreate -n wshare -l 50 wgroup · lvs",
    tldr: { page: "lvcreate", platform: "linux" },
  },
  {
    term: "resize",
    aliases: ["redimensionar", "resize LV", "resize filesystem", "cambiar tamaño"],
    definition:
      "Cambiar el tamaño de algo que ya existe. En estos labs casi siempre son dos capas distintas:\n\n1) El LV (el «disco» LVM: /dev/vgroup/vo). Lo mirás con lvs.\n2) El filesystem encima (ext4). Lo mirás con df -h /mnt/vo.\n\nResize = dejar esas dos capas en el tamaño que pide el enunciado, juntas.\n\nAgrandar (grow / extend)\nMás espacio: lvextend (o lvresize hacia arriba). Si solo crece el LV, lvs cambia y df no: el ext4 sigue chico. Ahí falta resize2fs, o usar -r en el mismo lvextend para que LVM estire el filesystem.\n\nAchicar (shrink / reduce)\nMenos espacio: lvreduce / lvresize hacia abajo. Acá el orden importa más: si achicás el LV sin achicar el filesystem, el ext4 queda más grande que el disco y se rompe. Por eso -r (o resize2fs antes) es crítico.\n\nEn una frase\n«Resize el LV y el filesystem» = el volumen y lo que df muestra tienen que terminar alineados al tamaño pedido (por ejemplo ~50 MB o ~230 MB).\n\nComandos que hacen resize\n• lvextend → solo agranda el LV\n• lvreduce → solo achica el LV\n• lvresize → pone un tamaño concreto (sube o baja)\n• resize2fs → resize del ext4\n• -r en lvextend/lvresize → resize del filesystem en el mismo paso",
    example: "lvs · df -h /mnt/vo · lvextend -L 230M -r /dev/vgroup/vo · lvresize -r -L 50M /dev/vgroup/vo",
  },
  {
    term: "PE · extent",
    aliases: ["PE", "extent", "extents", "Physical Extent", "Physical Extents"],
    definition:
      "Physical Extent (PE): el ladrillo de tamaño fijo dentro del VG. No es otro disco.\n\n¿Qué es?\nLa unidad con la que LVM reparte espacio dentro del grupo.\n\n¿Para qué sirve?\nAl crear el VG, -s 8M dice: cada ladrillo mide 8 MiB.\nAl crear el LV, -l 50 dice: quiero 50 ladrillos.\n50 × 8 = 400 MB. No son «50 MB».\n\nLVM agranda y reparte de a PE, no byte por byte a mano.",
    example: "vgcreate -s 8M wgroup /dev/sdb1 · lvcreate -n wshare -l 50 wgroup",
  },
  {
    term: "wgroup",
    definition:
      "El nombre que Operaciones le puso al VG en este laboratorio.\n\n¿Qué es?\nNo es un comando ni otro tipo de objeto: es solo el nombre del Volume Group. En otro enunciado podría ser otro nombre.\n\n¿Para qué sirve?\nIdentifica el tanque de espacio del que después cortás wshare.\n\nCómo se crea\nvgcreate -s 8M wgroup /dev/sdb1\n• vgcreate: crea el VG.\n• -s 8M: cada PE mide 8 MiB.\n• wgroup: nombre del grupo (este).\n• /dev/sdb1: PV que entra al grupo.\n\nEl disco del sistema (con / y /boot) no entra acá.",
    example: "vgcreate -s 8M wgroup /dev/sdb1 · vgs · vgdisplay",
    tldr: { page: "vgcreate", platform: "linux" },
  },
  {
    term: "wshare",
    definition:
      "No es un comando. Es solo el nombre que Operaciones le puso al LV en este laboratorio («espacio compartido»). En otro enunciado podría llamarse datos, appdata, lv_share o cualquier otra cosa: lo que importa es el nombre que pide el texto, no la palabra wshare en sí.\n\n¿Qué es?\nEl Logical Volume (LV) que vive dentro del VG wgroup. En el disco aparece como /dev/wgroup/wshare.\n\n¿Para qué sirve?\nEn la vida real Operaciones no quiere tirar dumps, uploads o datos de un servicio directo en / (el disco del sistema). Quieren un trozo de disco con nombre, aparte, que:\n• se monte en una carpeta fija (/mnt/wshare) para que apps y gente escriban ahí;\n• sobreviva al reinicio (fstab + UUID): si solo hacés mount a mano, al reboot /mnt/wshare queda vacío aunque el LV siga existiendo;\n• se pueda agrandar después (lvextend) sin borrar / ni reparticionar a ciegas.\n\nEl LV solo es el “disco” con nombre. Todavía no tiene archivos: hace falta mkfs.ext4 (formato) y montarlo. Sin formato no hay carpeta usable; sin montaje no se ve en /mnt/wshare; sin fstab no vuelve solo.\n\nCómo se crea\nlvcreate -n wshare -l 50 wgroup\n• lvcreate: crea el LV.\n• -n wshare: nombre del volumen (este).\n• -l 50: 50 PE (minúscula L). Con PE de 8 MiB → 400 MB. -L mayúscula es otra cosa (tamaño en MB).\n• wgroup: VG del que lo cortás.\n\nQueda /dev/wgroup/wshare. Después: mkfs.ext4, mount y fstab por UUID.",
    example: "lvcreate -n wshare -l 50 wgroup · mkfs.ext4 /dev/wgroup/wshare · mkdir -p /mnt/wshare · mount /dev/wgroup/wshare /mnt/wshare",
    tldr: { page: "lvcreate", platform: "linux" },
  },
  {
    term: "fstab",
    definition:
      "El archivo /etc/fstab. Dice qué se monta al arrancar y dónde.\n\nCada línea tiene seis campos, en orden:\n1. qué (UUID=…)\n2. dónde (/mnt/wshare)\n3. tipo (ext4, xfs, swap)\n4. opciones (defaults)\n5. dump (casi siempre 0)\n6. chequeo al boot (0 no chequea; 1 raíz; 2 el resto)\n\nEjemplo de línea (reemplazá el UUID con el de blkid):\nUUID=EL-DE-BLKID /mnt/wshare ext4 defaults 0 0\n\nGuardar el archivo no monta ahora. Eso lo hace el próximo boot. Para probar ya: mount -a.\n\nEl UUID sale de blkid sobre el LV (/dev/wgroup/wshare), no sobre la partición sdb1.\nNo uses /dev/sdX: ese nombre puede cambiar.\nLa copia /var/tmp/fstab del lab de permisos es solo práctica de ACL: no monta nada.",
    example: "blkid /dev/wgroup/wshare · mount -a",
    tldr: { page: "fstab", platform: "linux" },
  },
  {
    term: "al boot",
    definition:
      "Que el montaje vuelva solo después de reiniciar. No es la partición /boot. En este lab es una línea de /etc/fstab con el UUID del LV (blkid /dev/wgroup/wshare), no con /dev/sdX, porque ese nombre puede cambiar.\n\nLínea típica (reemplazá EL-DE-BLKID):\nUUID=EL-DE-BLKID /mnt/wshare ext4 defaults 0 0\n\nSin esa línea el LV sigue existiendo, pero /mnt/wshare queda vacío al reiniciar.",
    example: "blkid /dev/wgroup/wshare · mount -a",
    tldr: { page: "fstab", platform: "linux" },
  },
  {
    term: "tuned",
    definition:
      "El paquete y el servicio. systemctl enable --now tuned lo arranca y lo deja para el próximo boot. Ese proceso es el que aplica el perfil. No es el comando: el comando es tuned-adm. Los dos vienen en el mismo paquete, no se instalan por separado.",
    example: "rpm -q tuned · systemctl enable --now tuned",
  },
  {
    term: "tuned-adm",
    definition:
      "El comando para hablarle al servicio tuned. recommend solo imprime un nombre y no lo guarda. profile NOMBRE lo aplica ahora y lo escribe en /etc/tuned/active_profile. active muestra el perfil que está puesto. Sin el servicio tuned corriendo, no tiene a quién aplicarle el perfil.",
    example: "tuned-adm recommend · tuned-adm profile NOMBRE · tuned-adm active",
    tldr: { page: "tuned-adm", platform: "linux" },
  },
  {
    term: "copiar y pegar",
    definition:
      "Hay tres portapapeles distintos y cada tecla habla con uno solo. Bash recorta la línea que estás escribiendo (Ctrl+K, Ctrl+U, Ctrl+W) y la devuelve con Ctrl+Y. La terminal del escritorio, la de la estación del examen, usa el del escritorio: Ctrl+Shift+C copia, Ctrl+Shift+V o Shift+Insert pegan; marcar con el botón izquierdo y pegar con el del medio usa ese mismo. Neovim guarda el suyo: yy o y copian, p pega, y el texto no sale del editor. En la consola pelada, sin escritorio, el del escritorio no existe.",
  },
  {
    term: "Ctrl+C",
    definition:
      "En la terminal manda una interrupción al comando que está corriendo. En un programa de escritorio, como el panel del enunciado o el navegador, copia el texto marcado. En el examen esa tecla sola a veces traba la terminal o el navegador. Para copiar desde la terminal del escritorio se usa Ctrl+Shift+C.",
  },
  {
    term: "Ctrl+V",
    definition:
      "En bash la próxima tecla se toma literal: no pega nada. En un programa de escritorio pega el portapapeles. En la terminal del escritorio pegar es Ctrl+Shift+V o Shift+Insert.",
  },
  {
    term: "Ctrl+Shift+C",
    definition:
      "Copia en la terminal del escritorio y deja el texto en el portapapeles del escritorio. El Shift deja Ctrl+C libre para interrumpir el comando. En la consola pelada esta combinación no existe.",
  },
  {
    term: "Ctrl+Shift+V",
    definition:
      "Pega en la terminal del escritorio el portapapeles del escritorio. Bash pega su recorte con Ctrl+Y. Neovim pega el suyo con p.",
  },
  {
    term: "Shift+Insert",
    definition:
      "Pega en la terminal del escritorio. Usa el mismo portapapeles que Ctrl+Shift+V.",
  },
  {
    term: "Ctrl+K",
    definition:
      "En bash corta desde el cursor hasta el final de la línea que estás escribiendo. Eso va al recorte de bash y vuelve con Ctrl+Y. El texto que ya se imprimió en la pantalla sigue ahí. En Neovim cortar una línea es dd.",
  },
  {
    term: "Ctrl+U",
    definition:
      "En bash corta desde el cursor hasta el principio de la línea que estás escribiendo. Vuelve con Ctrl+Y.",
  },
  {
    term: "Ctrl+W",
    definition:
      "En bash corta la palabra anterior de la línea que estás escribiendo. Vuelve con Ctrl+Y. En el navegador cierra la pestaña. En Neovim cortar es d o dd.",
  },
  {
    term: "Ctrl+Y",
    definition:
      "En bash pega lo último cortado de la línea con Ctrl+K, Ctrl+U o Ctrl+W. Alt+Y, justo después, cambia por un corte anterior. El portapapeles del escritorio se pega con Ctrl+Shift+V. Neovim pega con p.",
  },
  {
    term: "Alt+Y",
    definition:
      "En bash, después de un Ctrl+Y, cambia ese pegado por un corte anterior de la misma línea. Sigue siendo el recorte de bash.",
  },
  {
    term: "Ctrl+R",
    definition:
      "En bash busca para atrás en el historial de comandos. En Neovim, en modo inserción, Ctrl+R y después \" inserta lo que copiaste con y. La tecla es la misma y el programa decide cuál de las dos cosas hace.",
  },
  {
    term: "yy",
    definition:
      "En Neovim, modo normal, copia la línea del cursor y la deja en su lugar. p la pega debajo y P arriba, adentro de Neovim. dd corta esa línea: la copia y la borra. El portapapeles del escritorio es Ctrl+Shift+C.",
  },
  {
    term: "y (Neovim)",
    definition:
      "En Neovim, modo normal, copia sin borrar. yy copia la línea entera. Con v (caracteres) o V (la línea) marcado, y copia esa marca. p la pega adentro de Neovim.",
  },
  {
    term: "p (Neovim)",
    definition:
      "En Neovim, modo normal, pega debajo del cursor lo copiado con yy o y. P lo pega arriba. En bash el pegado de la línea es Ctrl+Y. En la terminal del escritorio es Ctrl+Shift+V.",
  },
  {
    term: "dd",
    definition:
      "En Neovim, modo normal, corta la línea: la copia y la borra. p la pega. yy copia esa línea y la deja escrita. En bash, cortar la línea que estás escribiendo es Ctrl+K o Ctrl+U.",
  },
  {
    term: "screen",
    definition:
      "Copia con el teclado texto que ya salió en la pantalla. No viene en una instalación mínima. Ctrl+A y después [ abre el modo copia, las flechas se mueven, Espacio marca el principio y otro Espacio el final, Ctrl+A y después ] pega. El recorte es de screen. Bash sigue pegando con Ctrl+Y.",
    tldr: { page: "screen" },
  },
  {
    term: "ls",
    definition:
      "Lista lo que hay en una carpeta. Sin opciones, solo nombres. -l es el listado largo: permisos, dueño, grupo y tamaño. -a incluye los que empiezan con punto. -n muestra UID y GID en número. -d no entra: muestra la carpeta misma. -Z agrega el contexto de SELinux.",
    example: "ls -lan → largo, ocultos, UID y GID numéricos · ls -ld /shared/sysadm → la carpeta, no el contenido · ls -Zd RUTA → el contexto de esa carpeta",
    tldr: { page: "ls" },
  },
  {
    term: "ls -lan",
    definition:
      "Listado largo, con ocultos, y el dueño y el grupo en número. -l es largo, -a incluye . y .., -n cambia el nombre del dueño y del grupo por el UID y el GID. Sirve cuando el nombre no alcanza para ver de quién es el archivo.",
    example: "ls -lan /home/thiago",
    tldr: { page: "ls" },
  },
  {
    term: "ls -ld",
    definition:
      "Muestra la carpeta misma, no lo que tiene adentro. Sin -d, ls entra y lista el contenido. Con -l se lee el setgid: drwxrws--- tiene la s en el lugar de la x del grupo.",
    example: "ls -ld /shared/sysadm",
    tldr: { page: "ls" },
  },
  {
    term: "ls -Zd",
    definition:
      "Muestra el contexto de SELinux de la carpeta misma. -Z es el contexto y -d no entra adentro. Sin -d, -Z lista el contexto de cada archivo de adentro.",
    example: "ls -Zd /srv/company-drop",
    tldr: { page: "ls" },
  },
  {
    term: "cd",
    definition: "Cambia de carpeta. Sin argumento va al home de quien está logueado. cd - vuelve a la carpeta anterior.",
    example: "cd /etc/yum.repos.d/ && ls",
    tldr: { page: "cd" },
  },
  {
    term: "cat",
    definition: "Imprime un archivo entero en la terminal. No pagina: si es largo, se va para arriba. Para mirar una parte, head o grep.",
    example: "cat /etc/vconsole.conf",
    tldr: { page: "cat" },
  },
  {
    term: "echo",
    definition: "Imprime el texto que le pasás. Con >> lo agrega al final de un archivo. Con > lo pisa. Dentro de comillas simples el shell no toca el texto.",
    example: "echo prueba >> /var/tmp/fstab",
    tldr: { page: "echo" },
  },
  {
    term: "mkdir",
    definition: "Crea una carpeta. -p crea también las de arriba si no existen y no se queja si la última ya está. Sin -p, una ruta con un padre que no existe falla.",
    example: "mkdir -p /shared/sysadm",
    tldr: { page: "mkdir" },
  },
  {
    term: "touch",
    definition: "Crea un archivo vacío si no existe. Si existe, le actualiza la fecha. También sirve para dejar un archivo vacío que otro programa va a leer, como /.autorelabel.",
    example: "touch /.autorelabel",
    tldr: { page: "touch" },
  },
  {
    term: "id",
    definition: "Muestra UID, grupo primario y grupos secundarios de un usuario. Sin argumento, los de quien está en el prompt. Sirve para comprobar un useradd o un usermod -aG.",
    example: "id thiago",
    tldr: { page: "id" },
  },
  {
    term: "useradd",
    definition:
      "Crea un usuario. -m crea el home. -u fija el UID. -g es el grupo primario. -G suma grupos secundarios en el alta. La contraseña no se pone acá: después va passwd.",
    example: "useradd -m -G developer thiago",
    tldr: { page: "useradd", platform: "linux" },
  },
  {
    term: "groupadd",
    definition: "Crea un grupo. El usuario se suma después con useradd -G o con usermod -aG. groupadd no mete a nadie adentro.",
    example: "groupadd developer",
    tldr: { page: "groupadd", platform: "linux" },
  },
  {
    term: "passwd",
    definition: "Cambia la contraseña. Sin argumento, la de quien está logueado: la pide dos veces. passwd USUARIO, como root, cambia la de esa cuenta. No crea el usuario.",
    example: "passwd thiago",
    tldr: { page: "passwd" },
  },
  {
    term: "chown",
    definition: "Cambia dueño y grupo de un archivo. Dueño y grupo van juntos: USUARIO:GRUPO. -R baja por la carpeta. No pone permisos: eso es chmod.",
    example: "chown erik:erik /var/tmp/fstab",
    tldr: { page: "chown" },
  },
  {
    term: "getent",
    definition: "Lee una base del sistema: passwd, group o shadow. Muestra la línea de esa cuenta, venga de un archivo local o de otra fuente. getent group NOMBRE dice si el grupo existe y quién está.",
    example: "getent passwd thiago · getent group developer",
    tldr: { page: "getent" },
  },
  {
    term: "su -",
    definition:
      "Abre un login de ese usuario: carga su home y su entorno. El guion no se saca. su USUARIO sin guion no es un login. su - -c 'COMANDO' corre eso y vuelve. Para probar un permiso, el comando tiene que ir adentro de las comillas.",
    example: "su - felipe · su - erik -c 'echo prueba >> /var/tmp/fstab'",
    tldr: { page: "su" },
  },
  {
    term: "dnf",
    definition:
      "Instala y consulta paquetes. repolist muestra los repos enabled. install -y instala sin preguntar. --repo= limita a esos repos. provides RUTA dice qué paquete trae ese archivo. clean all tira la caché. list available lista lo que se puede instalar.",
    example: "dnf repolist · dnf install -y --repo=BaseOS --repo=AppStream words · dnf provides /usr/sbin/semanage",
    tldr: { page: "dnf", platform: "linux" },
  },
  {
    term: "find",
    definition:
      "Busca archivos por nombre, dueño, tipo o fecha. -user es el dueño, -type f es archivo, -mtime -1 es el último día. -exec COMANDO {} \\; corre ese comando con cada resultado. 2>/dev/null esconde los Permission denied.",
    example: "find / -user erik -mtime -1 -type f",
    tldr: { page: "find" },
  },
  {
    term: "tar",
    definition:
      "Empaqueta, lista o extrae. Cada letra es una opción. En este lab van pegadas.\n\nc crea el archivo.\nt lista lo que hay adentro, sin extraer.\nx extrae. Este lab no la usa.\nj es bzip2. El archivo queda .tar.bz2.\nz es gzip. Eso dejaría .tar.gz y el lab no está cumplido.\nf es el nombre del archivo y va última: lo que sigue es la ruta.\nv es verbose: imprime cada nombre mientras trabaja. No es el archivo.\n\ntar -cjf /root/myetcbackup.tar.bz2 /etc\ncrea, comprime con bzip2 y escribe ese archivo. /etc es lo que entra adentro.\n\ntar -tjf /root/myetcbackup.tar.bz2\nlista ese .tar.bz2. No crea nada.\n\ncjv no sirve para esto. c crea, j es bzip2, v solo habla. Falta f, así que no escribe /root/myetcbackup.tar.bz2: tira el archivo por la terminal.\n\nEn man tar, /bzip2 salta a -j, --bzip2. /--list es la t. /--file es la f. Si ves 1m y 22m pegados a la palabra, es la negrita.",
    example: "tar -cjf /root/myetcbackup.tar.bz2 /etc · tar -tjf /root/myetcbackup.tar.bz2 | head",
    tldr: { page: "tar" },
  },
  {
    term: "systemctl",
    definition:
      "Maneja unidades de systemd. status no cambia nada. start y stop son de ahora. enable lo deja para el próximo boot y disable lo saca. enable --now arranca ya y lo deja para el boot. restart vuelve a leer la configuración.",
    example: "systemctl enable --now httpd · systemctl status httpd",
    tldr: { page: "systemctl", platform: "linux" },
  },
  {
    term: "journalctl",
    definition: "Lee el diario de systemd. -u UNIDAD deja solo ese servicio. -b es este boot. -f sigue las líneas nuevas. No reemplaza a ausearch: el de SELinux es otro registro.",
    example: "journalctl -u httpd -b",
    tldr: { page: "journalctl", platform: "linux" },
  },
  {
    term: "hostnamectl",
    definition: "Muestra o cambia el hostname. set-hostname lo cambia ya y lo guarda. No es un perfil de red: no hace falta nmcli connection up. status, o hostnamectl solo, muestra el nombre actual.",
    example: "hostnamectl set-hostname client.linux.lab",
    tldr: { page: "hostnamectl", platform: "linux" },
  },
  {
    term: "localectl",
    definition:
      "Cambia el teclado de esta máquina. set-keymap es la consola de la ventana de VirtualBox. set-x11-keymap es el gráfico, y esa ventana no lo usa. El latinoamericano de la consola se llama la-latin1, sin guion adelante: localectl set-keymap la-latin1. El guion va en el subcomando set-keymap, no en el nombre del mapa. list-keymaps lista los nombres que MAP acepta. Después, localectl status tiene que decir VC Keymap: la-latin1. En el server se deja us, porque el rescate se escribe en esa consola. Una SSH no cambia: ahí el teclado es el de tu máquina. man localectl | grep set-keymap sí lo encuentra. La línea es set-keymap MAP [TOGGLEMAP]: MAP es el nombre, la-latin1. Lo que se ve como 1m, 22m y 0m pegado a la palabra es la negrita del manual, no texto que falte. 1m la prende y 22m o 0m la apaga. grep corta el párrafo en esa línea. Para leerlo entero, abrí man localectl y buscá /set-keymap.",
    example: "localectl set-keymap la-latin1 · localectl list-keymaps · localectl status",
    tldr: { page: "localectl", platform: "linux" },
  },
  {
    term: "loginctl",
    definition: "Lista sesiones de login. Sirve para ver si un usuario sigue adentro antes de borrarlo: userdel no puede con una sesión abierta.",
    example: "loginctl list-sessions",
    tldr: { page: "loginctl", platform: "linux" },
  },
  {
    term: "reboot",
    definition: "Reinicia. En un arranque normal alcanza reboot. Si bash quedó como proceso 1, hace falta exec /sbin/reboot -f: sin -f el kernel entra en panic.",
    example: "reboot · exec /sbin/reboot -f",
    tldr: { page: "reboot" },
  },
  {
    term: "mount",
    definition:
      "Muestra o monta sistemas de archivos. Sin argumentos, lista lo que está montado. -o remount,rw vuelve a montar escribible una raíz que arrancó solo lectura. El punto de montaje es el último argumento.",
    example: "mount -o remount,rw / · mount -o remount,rw /sysroot",
    tldr: { page: "mount" },
  },
  {
    term: "nmcli",
    definition:
      "Configura NetworkManager desde la terminal. connection show lista perfiles: NAME es el nombre que va en modify, DEVICE es la placa. connection modify guarda IP, gateway y DNS. connection up aplica ahora. -f muestra un solo campo. ip a no muestra el DNS.",
    example: "nmcli connection show · nmcli -f ipv4.dns connection show hostonly · nmcli connection up hostonly",
    tldr: { page: "nmcli", platform: "linux" },
  },
  {
    term: "ip",
    definition: "Mira la red. ip -br a es la lista corta de placas y direcciones. ip a es la misma, más larga. No cambia el perfil: eso es nmcli. lo es la máquina consigo misma y no se edita.",
    example: "ip -br a",
    tldr: { page: "ip" },
  },
  {
    term: "curl",
    definition: "Pide una URL y muestra la respuesta. -I pide solo las cabeceras. Sirve para ver si un puerto o un servicio responde, sin abrir el navegador.",
    example: "curl -I http://127.0.0.1:82/",
    tldr: { page: "curl" },
  },
  {
    term: "firewall-cmd",
    definition:
      "Abre o cierra puertos en firewalld. --add-port=PUERTO/tcp abre. --permanent lo guarda. Sin --permanent, al reboot se pierde. --reload aplica ahora lo que quedó guardado. Hasta el reload, lo permanente no entra.",
    example: "firewall-cmd --add-port=82/tcp --permanent && firewall-cmd --reload",
    tldr: { page: "firewall-cmd", platform: "linux" },
  },
  {
    term: "getenforce",
    definition: "Dice el modo de SELinux ahora: Enforcing, Permissive o Disabled. No lo cambia. Enforcing bloquea. Permissive avisa y deja pasar.",
    example: "getenforce",
    tldr: { page: "getenforce", platform: "linux" },
  },
  {
    term: "semanage",
    definition:
      "Cambia la política de SELinux y lo guarda. port -l lista puertos etiquetados. port -a -t TIPO -p tcp PUERTO agrega uno. fcontext anota el contexto de una ruta para después de restorecon. No viene en una mínima: el paquete es policycoreutils-python-utils.\n\nLa sintaxis del puerto está en man semanage-port, no en man semanage. En el shell: man semanage- y Tab Tab lista esas páginas.",
    example: "man semanage-port · semanage port -l | grep http · semanage port -a -t http_port_t -p tcp 82",
    tldr: { page: "semanage", platform: "linux" },
  },
  {
    term: "restorecon",
    definition: "Aplica a los archivos el contexto que la política ya tiene anotado. -v avisa si reetiquetó. No inventa una etiqueta nueva: si falta la regla, primero va semanage fcontext.",
    example: "restorecon -v /etc/NetworkManager/system-connections/NOMBRE.nmconnection",
    tldr: { page: "restorecon", platform: "linux" },
  },
  {
    term: "getsebool",
    definition: "Muestra un booleano de SELinux. -a lista todos. No lo cambia: eso es setsebool. on permite, off no.",
    example: "getsebool -a | grep ftp",
    tldr: { page: "getsebool", platform: "linux" },
  },
  {
    term: "ausearch",
    definition: "Busca en el registro de auditoría. -m avc deja los bloqueos de SELinux. -ts recent es lo de recién. No es journalctl: el AVC de SELinux está acá.",
    example: "ausearch -m avc -ts recent",
    tldr: { page: "ausearch", platform: "linux" },
  },
  {
    term: "podman",
    definition:
      "Corre contenedores sin un demonio. run crea y arranca. -d lo deja atrás. --name le pone nombre. -v ORIGEN:DESTINO:Z monta una carpeta y la Z ajusta el contexto. generate systemd escribe la unidad para que systemd lo levante.",
    example: "podman run -d --name mycontainer localhost/text2pdf:latest · man podman-generate-systemd",
    tldr: { page: "podman", platform: "linux" },
  },
  {
    term: "flatpak",
    definition:
      "Instala aplicaciones aparte de dnf.\n\nSi el comando no existe en la máquina, primero hay que instalar el paquete con dnf (repos DNF ya configurados): dnf install -y flatpak. Sin eso, remote-add e install no corren.\n\nUn remote es el almacén de apps (parecido a un .repo de dnf): URL + un nombre corto. Ese nombre no tiene que ser flathub; en el examen suele ser el del ticket. flathub es solo el almacén público para practicar en casa.\n\nremote-add registra el almacén (no instala apps). install baja una app. --user es de esa cuenta, --system es de la máquina. list muestra lo instalado. uninstall saca una. El remote de sistema no le aparece a otro usuario cuando usa --user.",
    example: "dnf install -y flatpak · flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo · flatpak install -y --system flathub org.gnome.Calculator",
    tldr: { page: "flatpak", platform: "linux" },
  },
  {
    term: "lsblk",
    definition: "Lista discos y particiones en árbol. -f agrega el sistema de archivos y el UUID. El disco que tiene / y /boot no se reparte de nuevo.",
    example: "lsblk -f",
    tldr: { page: "lsblk", platform: "linux" },
  },
  {
    term: "blkid",
    definition: "Muestra UUID y tipo de un dispositivo. Ese UUID es el que va en fstab si la línea no usa el nombre /dev, que puede cambiar de orden.",
    example: "blkid /dev/sdb1",
    tldr: { page: "blkid", platform: "linux" },
  },
  {
    term: "parted",
    definition:
      "Reparte un disco sin menú (alternativa a fdisk). mklabel escribe la tabla. mkpart crea una partición. set N lvm on marca tipo LVM (como 8e en fdisk).\n\nLa unidad va en el número: 400MiB no es 400MB. El disco de / no se toca.\nEl video prefiere fdisk porque es interactivo; parted sirve para un solo comando.",
    example: "parted /dev/sdb --script mklabel gpt mkpart primary 1MiB 600MiB · parted /dev/sdb set 1 lvm on",
    tldr: { page: "parted", platform: "linux" },
  },
  {
    term: "pvcreate",
    definition:
      "Comando que marca un disco o partición como PV (Physical Volume / volumen físico).\n\nPor qué se usa: hasta que no corrés esto, LVM no toca ese disco. Es el primer paso.\n\nNo crea el grupo ni el volumen compartido: eso es vgcreate y lvcreate.\n\nEl argumento es la ruta completa: /dev/sdb1. Escribir solo sdb falla (No device found).\nSi marcás el disco entero (/dev/sdb), no queda espacio para el swap: evitá eso en el lab de wshare. El video Q15b a veces marca el disco entero solo para armar su prep de vo.",
    example: "pvcreate /dev/sdb1 · pvs",
    tldr: { page: "pvcreate", platform: "linux" },
  },
  {
    term: "vgcreate",
    definition:
      "Comando que crea el VG (grupo de volúmenes = placas juntas).\n\nPor qué se usa: juntás el PV en un tanque con nombre. De ahí cortás el LV.\n\nOrden típico: vgcreate -s 8M wgroup /dev/sdb1\n-s 8M → opción: cada ladrillo (PE) mide 8 MB. El 8M va junto.\nwgroup → argumento: nombre del grupo.\n/dev/sdb1 → argumento: el PV que metés.\n\nSin -s 8M, el enunciado del lab (PE de 8 MB) no queda cumplido.",
    example: "vgcreate -s 8M wgroup /dev/sdb1 · vgs",
    tldr: { page: "vgcreate", platform: "linux" },
  },
  {
    term: "lvcreate",
    definition:
      "Comando que crea el LV (volumen lógico = el edificio) dentro de un VG.\n\nPor qué se usa: es el espacio con nombre que después formateás y montás.\n\nEn este lab: lvcreate -n wshare -l 50 wgroup\n-n wshare → opción: nombre del LV.\n-l 50 → opción: 50 ladrillos (minúscula L). 50 × 8 MB = 400 MB.\n-L mayúscula → otra opción (tamaño en MB): no es lo del enunciado si pide extents.\nwgroup → argumento: de qué grupo lo sacás.\n\nQueda /dev/wgroup/wshare.\n\nPrep del video Q15b (otro lab): lvcreate -L 180M -n vo vgroup → ahí -L sí va, porque pide 180 megabytes, no extents.",
    example: "lvcreate -n wshare -l 50 wgroup · lvcreate -L 180M -n vo vgroup · lvs",
    tldr: { page: "lvcreate", platform: "linux" },
  },
  {
    term: "lvextend",
    aliases: ["extender LV", "agrandar LV"],
    definition:
      "Agrandá un LV que ya existe. No crea uno nuevo: eso es lvcreate.\n\nArgumentos clave (como en el video Q15b):\n• -L 230M → tamaño final en megabytes (L mayúscula). También -L +50M para sumar.\n• -l (minúscula) → cantidad de extents: otra cosa; no la uses si el enunciado habla en MB.\n• -r → resize del filesystem en el mismo paso (método rápido). Sin -r, lvs ya muestra el tamaño nuevo pero df sigue chico: falta resize2fs (ext4).\n• /dev/vgroup/vo → ruta del LV (VG/nombre).\n\nMétodo 1 del video: lvextend -L 230M /dev/vgroup/vo y después resize2fs /dev/vgroup/vo.\nMétodo 2: lvextend -L 230M -r /dev/vgroup/vo.\n\ndf suele mostrar menos que lvs: reserva y metadata de ext4; es normal.",
    example: "lvextend -L 230M /dev/vgroup/vo · resize2fs /dev/vgroup/vo · lvextend -L 230M -r /dev/vgroup/vo",
    tldr: { page: "lvextend", platform: "linux" },
  },
  {
    term: "lvresize",
    aliases: ["lvreduce", "resize LV"],
    definition:
      "Cambia el tamaño de un LV a un valor concreto (puede agrandar o achicar). lvextend solo agranda; lvreduce solo achica. lvresize hace las dos.\n\nOpciones:\n• -L 50M → tamaño final en MB (mayúscula).\n• -l 5 → tamaño en extents (minúscula). Con PE de 10M: 5 × 10 = 50 MB exactos.\n• -r → mueve el filesystem con el LV. Al achicar, sin -r el filesystem puede quedar más grande que el LV y se rompe.\n• /dev/vgroup/vo → el LV.\n\nTip del comentario de Q17 (recomendado al achicar):\nlvreduce -r -l 5 /dev/vgroup/vo\n• -r evita resize2fs a mano (no adivinás si son 50M o 55M).\n• -l 5 usa extents: con -s 10M en el VG → 50 MB sin convertir MB a ojo.\n\nMétodo largo del video: umount → (e2fsck -f) → resize2fs … 50M → lvreduce -l 5 → mount.\nDesmontá antes de achicar.",
    example: "lvreduce -r -l 5 /dev/vgroup/vo · lvresize -r -L 50M /dev/vgroup/vo · umount /mnt/vo",
    tldr: { page: "lvresize", platform: "linux" },
  },
  {
    term: "resize2fs",
    definition:
      "Ajusta el tamaño de un filesystem ext2/ext3/ext4 al del dispositivo.\n\nPor qué se usa con LVM: después de lvextend sin -r, el LV ya es más grande pero el ext4 no. resize2fs /dev/vgroup/vo hace que df use el espacio nuevo.\n\nEl argumento es el dispositivo del LV (o la partición), no el punto de montaje. Para crecer, el filesystem puede estar montado. Para achicar, a menudo hace falta desmontar y achicar el filesystem antes que el LV.\n\nCon lvextend -r no hace falta correr resize2fs a mano: LVM lo dispara.",
    example: "lvextend -L 230M /dev/vgroup/vo · resize2fs /dev/vgroup/vo",
    tldr: { page: "resize2fs", platform: "linux" },
  },
  {
    term: "vgextend",
    definition:
      "Suma un PV más a un VG que ya existe. No crea el grupo: eso es vgcreate.\n\nCuándo: vgs muestra poco o nada de free y necesitás crecer el LV.\n\nOrden: vgextend vgroup /dev/PARTICION\n• vgroup → el VG.\n• /dev/PARTICION → PV nuevo (partición o disco ya con pvcreate).\n\nDespués: lvextend -r … para usar ese espacio en el LV. Sin vgextend, lvextend falla si el grupo no tiene free.",
    example: "pvcreate /dev/sdb3 · vgextend vgroup /dev/sdb3 · lvextend -r -L +50M /dev/vgroup/vo",
    tldr: { page: "vgextend", platform: "linux" },
  },
  {
    term: "lvs",
    definition:
      "Lista Logical Volumes. No cambia nada.\n\nAntes y después de lvextend/lvresize: mirá el tamaño del LV acá.\nSi lvs ya cambió y df -h /mnt/vo no, faltó -r o resize2fs.",
    example: "lvs · lvs /dev/vgroup/vo · lvs -o lv_name,vg_name,lv_size",
    tldr: { page: "lvs", platform: "linux" },
  },
  {
    term: "vgs",
    definition:
      "Lista Volume Groups y cuánto free les queda. No cambia nada.\n\nSi VFree está en 0, no podés lvextend hasta hacer vgextend con más PV.",
    example: "vgs · vgdisplay",
    tldr: { page: "vgs", platform: "linux" },
  },
  {
    term: "pvs",
    definition: "Lista Physical Volumes. No cambia nada. Sirve para ver si el PV quedó creado y a qué VG está metido.",
    example: "pvs · pvdisplay",
    tldr: { page: "pvs", platform: "linux" },
  },
  {
    term: "fdisk",
    definition:
      "Particiona un disco con menú interactivo (el camino del video Q15/Q16). El argumento es el disco: /dev/sdb, no /dev/sdb1.\n\nTeclas útiles:\n• m → ayuda\n• n → nueva partición · p → primaria · Enter en número y primer sector (defaults)\n• +450M o +420M → tamaño (junto, sin espacio). Margen extra ayuda por MB vs MiB y el offset 2048\n• t → tipo: 8e = Linux LVM · 82 = Linux swap (L lista códigos)\n• p → imprimir tabla\n• w → escribir y salir · q → salir sin guardar (descarta)\n\nDespués del LVM: pvcreate /dev/sdb1. Después del swap: mkswap /dev/sdb2.",
    example: "fdisk /dev/sdb",
    tldr: { page: "fdisk", platform: "linux" },
  },
  {
    term: "mkfs.ext4",
    definition: "Formatea un volumen en ext4. El argumento es el dispositivo, no el punto de montaje. Formatear borra lo que había.",
    example: "mkfs.ext4 /dev/wgroup/wshare · mkfs.ext4 /dev/vgroup/vo",
    tldr: { page: "mkfs.ext4", platform: "linux" },
  },
  {
    term: "mkswap",
    definition: "Marca una partición como swap. No la activa: eso es swapon. Después la línea va en fstab para que vuelva sola.",
    example: "mkswap /dev/sdb2",
    tldr: { page: "mkswap", platform: "linux" },
  },
  {
    term: "swapon",
    definition:
      "Activa un swap ya marcado con mkswap.\n\n• swapon /dev/sdb2 → activa esa partición ahora\n• swapon --show o -s → lista los activos (no cambia nada)\n• swapon -a → activa todas las entradas swap de /etc/fstab (después de agregar la línea)\n\nSin la línea en fstab, al reboot no vuelve. En fstab el truco es: UUID=… swap swap defaults 0 0 (dos veces la palabra swap).",
    example: "swapon /dev/sdb2 · swapon --show · swapon -a",
    tldr: { page: "swapon", platform: "linux" },
  },
  {
    term: "vo",
    definition:
      "Nombre del LV en el lab de resize / video Q15b. Vive en el VG vgroup. Ruta: /dev/vgroup/vo.\n\nPrep típica del video: lvcreate -L 180M -n vo vgroup. Después se extiende a ~230M con lvextend (y -r o resize2fs). En el PDF el blanco suele ser ~50 MB con lvresize -r.",
    example: "lvcreate -L 180M -n vo vgroup · lvextend -L 230M -r /dev/vgroup/vo",
    tldr: { page: "lvcreate", platform: "linux" },
  },
  {
    term: "vgroup",
    definition:
      "Nombre del VG en el lab de resize / video Q15b (distinto de wgroup del lab de wshare).\n\nPrep del video: vgcreate -s 10M vgroup /dev/sdb. -s 10M = cada PE mide 10 MB. Después lvcreate -L 180M -n vo vgroup.",
    example: "vgcreate -s 10M vgroup /dev/sdb · vgs",
    tldr: { page: "vgcreate", platform: "linux" },
  },
  {
    term: "crontab",
    definition: "Edita o lista la tabla de tareas de un usuario. -l lista, -e edita, -r borra. -u USUARIO, como root, es la tabla de esa cuenta. No es el timer de systemd.",
    example: "crontab -l -u erik",
    tldr: { page: "crontab" },
  },
  {
    term: "máscara de red",
    aliases: [
      "mascara de red",
      "submáscara",
      "submascara",
      "subnet mask",
      "CIDR",
      "/24",
      "255.255.255.0",
      "prefijo",
    ],
    definition:
      "Dice qué parte de la IP es la red y qué parte es la máquina.\n\nDos formas de lo mismo (las más comunes en el lab/examen):\n• CIDR: /24 → los primeros 24 bits son red; el último número (.0–.255) es el host.\n• Decimal: 255.255.255.0 → misma máscara que /24.\n\nEjemplo: 172.16.1.0/24 = toda la red 172.16.1.x (client .12 y server .13). En la hoja del examen a veces escribe 172.24.14.0/255.255.255.0: es la red + esa máscara, no otra cosa.\n\nEn comandos casi siempre va CIDR: 172.16.1.12/24 en nmcli, allow 172.16.1.0/24 en chrony. No hace falta escribir …/255.255.255.0 ahí.\n\nNo siempre es /24: el enunciado puede pedir /16, /25, etc. Leé la hoja.",
    example: "nmcli … ipv4.addresses 172.16.1.12/24 · allow 172.16.1.0/24",
  },
  {
    term: "NTP",
    aliases: ["ntp", "chrony", "chronyd", "chronyc", "chrony.conf"],
    definition:
      "Network Time Protocol: sincronizar el reloj de las máquinas por red para que marquen la misma hora.\n\nEn RHEL/Rocky el cliente/servidor NTP es chrony (servicio chronyd, config /etc/chrony.conf). No hace falta un paquete aparte llamado ntp.\n\nLab (Q11): el server (172.16.1.13) ofrece la hora (allow + firewall servicio ntp = UDP 123). El client apunta a ese server (línea server … iburst) y chronyc sources tiene que mostrar esa IP, no solo localhost.\n\nPersistente = chronyd enabled en las dos.",
    example: "dnf install -y chrony · allow 172.16.1.0/24 · server 172.16.1.13 iburst · firewall-cmd --add-service=ntp --permanent && firewall-cmd --reload · systemctl enable --now chronyd · chronyc sources -v",
    tldr: { page: "chronyc", platform: "linux" },
  },
  {
    term: "NFS",
    aliases: ["nfs", "nfs-utils", "/etc/exports"],
    definition:
      "Network File System: compartir una carpeta del server para que otro host la monte por red y la vea como local.\n\nEn el server: instalás nfs-utils, escribís /etc/exports (qué carpeta, a quién, con qué opciones), exportfs -r, enable nfs-server y abrís el servicio nfs en el firewall.\n\nEn el client: también nfs-utils. Primero showmount -e IP_DEL_SERVER. Si eso falla, autofs o mount no van a andar.\n\nNo es lo mismo que autofs: NFS es el share; autofs (o fstab/mount) es cómo el client lo monta.",
    example: "echo '/home/guests/netuser1 172.16.1.12(rw,sync,no_root_squash)' >> /etc/exports · exportfs -r · showmount -e 172.16.1.13",
    tldr: { page: "exportfs", platform: "linux" },
  },
  {
    term: "autofs",
    aliases: ["automount", "auto.master", "/etc/auto.master", "auto.master.d"],
    definition:
      "Servicio que monta una carpeta solo cuando alguien entra a la ruta, y la desmonta solo cuando deja de usarse un rato.\n\n¿Para qué?\nHomes o shares por red (NFS) sin dejarlos montados todo el día en fstab. Si el server no está al boot, fstab puede trabarte; autofs espera a que alguien pise el path.\n\nCómo se configura (video Q08 / lab)\n1. Mapa /etc/auto.netdir: netuser1 -rw 172.16.1.13:/home/guests/netuser1 (subcarpeta → host:/export).\n2. Drop-in /etc/auto.master.d/netdir.autofs: /netdir /etc/auto.netdir (base → mapa). También vale una línea en /etc/auto.master.\n3. systemctl enable --now autofs.\n\nEjemplo: ls /netdir/netuser1 dispara el mount; mount | grep netuser1 lo confirma.\n\nNo reemplaza a NFS: el server sigue exportando. autofs es solo el montaje bajo demanda en el client.\nEl UID/GID del usuario tiene que coincidir en server y client.\nAntes de pelear con el mapa: showmount -e desde el client tiene que listar el export.",
    example: "printf '%s\\n' 'netuser1 -rw 172.16.1.13:/home/guests/netuser1' > /etc/auto.netdir · printf '%s\\n' '/netdir /etc/auto.netdir' > /etc/auto.master.d/netdir.autofs · systemctl enable --now autofs · ls /netdir/netuser1",
    tldr: { page: "automount", platform: "linux" },
  },
  {
    term: "exportfs",
    definition: "Publica o revisa lo que NFS está exportando. -v lista con las opciones. -r vuelve a leer /etc/exports. No alcanza con editar el archivo: hay que publicarlo.",
    example: "exportfs -v · exportfs -r",
    tldr: { page: "exportfs", platform: "linux" },
  },
  {
    term: "showmount",
    definition: "Pregunta a un servidor NFS qué exporta. -e HOST lista las exportaciones. Sirve para comprobar desde el cliente, sin montar todavía.",
    example: "showmount -e server",
    tldr: { page: "showmount", platform: "linux" },
  },
  {
    term: "sed",
    definition:
      "Edita texto por línea. -i cambia el archivo. Sin -i, solo imprime. La s cambia la primera coincidencia de cada línea. ^ exige el principio de la línea. No es set: set es otra orden de bash. Para editar a mano en el examen, vim suele ser más claro.",
    example: "sed -n '/Listen/p' /etc/httpd/conf/httpd.conf → imprime solo las líneas Listen, sin tocar el archivo",
    tldr: { page: "sed" },
  },
  {
    term: "visudo",
    definition: "Abre sudoers y no lo guarda si la sintaxis está mal. Es el editor seguro. No se edita /etc/sudoers con vim directo: un error te deja sin sudo.",
    example: "visudo",
    tldr: { page: "visudo", platform: "linux" },
  },
  {
    term: "chroot",
    definition: "Hace que este shell tome otra carpeta como /. En el rescate con rd.break, / es el initramfs en memoria y el disco instalado está en /sysroot. chroot /sysroot entra ahí, así passwd y touch escriben en el disco y no en la memoria. exit sale y / vuelve a ser el initramfs.",
    example: "chroot /sysroot",
    tldr: { page: "chroot" },
  },
];

const en: GlossaryEntry[] = [
  {
    term: "which",
    definition: "Prints the path of the executable the shell will run. It does not search random files: it looks up commands on PATH.",
    example: "which logger → /usr/bin/logger",
    tldr: { page: "which" },
  },
  {
    term: "rpm",
    definition:
      "Looks up packages that are already installed. rpm -ql PACKAGE lists the files it put on disk. Use it when the package does not ship a command: which will not find it. rpm -q PACKAGE only says whether it is installed and which version.",
    example: "rpm -ql words → the dictionary is /usr/share/dict/words. which words fails: words is not a command",
    tldr: { page: "rpm", platform: "linux" },
  },
  {
    term: "head",
    definition:
      "Shows only the first lines of a file or of what arrives on a pipe (10 by default). Use it for a preview without flooding the terminal. -n N changes how many lines.",
    example: "tar -tjf /root/myetcbackup.tar.bz2 | head → lists the backup and head shows the first paths without dumping all of /etc",
    tldr: { page: "head" },
  },
  {
    term: "wc",
    definition:
      "Counts lines, words, and bytes in a file or on a pipe. With no options it prints all three. -l = lines only, -w = words, -c = bytes. Handy to check that a filter (grep, etc.) left real content.",
    example: "wc -l /root/lines → how many lines the grep lab file has · grep ich /usr/share/dict/words | wc -l → count without saving the file",
    tldr: { page: "wc" },
  },
  {
    term: "command",
    definition:
      "The first word you type in the shell: the program.\n\nIn man -k prop, the command is man.\nIn vgcreate -s 8M wgroup /dev/sdb1, the command is vgcreate.\n\nAfter the command come options (with - or --) and arguments (names, paths, numbers).",
    example: "man · vgcreate · lvcreate · pvcreate",
  },
  {
    term: "option",
    definition:
      "A switch on the command. It starts with one hyphen (-) or two (--).\n\nIt changes how the command works. It is not the disk name or the group name: that is an argument.\n\n-k in man -k prop is the apropos option: search pages by keyword, do not open a page by name.\n-s in vgcreate -s 8M sets each PE size.\n-l in lvcreate -l 50 asks for a count of extents.\n-L (capital) in lvcreate asks for a size in MB/GB: not the same as -l.\n-n sets the LV name.\n\nThe letter sticks to the value when the man page shows it that way: -s 8M (no space inside 8M). A stray space between 8 and M breaks parsing.",
    example: "man -k prop · vgcreate -s 8M wgroup /dev/sdb1 · lvcreate -n wshare -l 50 wgroup",
  },
  {
    term: "argument",
    definition:
      "What the command needs besides options: names, paths, bare numbers.\n\nIn man -k prop, prop is the argument: the word to search.\nIn vgcreate -s 8M wgroup /dev/sdb1: wgroup is the VG name and /dev/sdb1 is the PV.\nIn lvcreate -n wshare -l 50 wgroup: wgroup at the end is the VG you cut from.\n\nWithout the right argument the command does not know what to work on.",
    example: "man -k prop · pvcreate /dev/sdb1 · lvcreate -n wshare -l 50 wgroup",
  },
  {
    term: "man",
    definition:
      "Opens the manual page.\n\nWith no options: man NAME. The argument is the exact page name (man tar, man vgcreate, man semanage-port).\n\nSome commands have several pages. man semanage is the general one. The port page is man semanage-port. At the shell: man semanage- then Tab Tab lists those pages.\n\nInside, the viewer is less:\nSpace or f: page down.\nb: page up.\ng: start. G: end.\n/PHRASE Enter: search down. n next. N (Shift+n) previous.\n?PHRASE: search up.\nh: help. q: quit.\n\nOn a pipe (man xxx | grep …) the viewer does not open. If you see 1m / 22m / 0m stuck to the word, that is the manual's bold, not part of the command.",
    example:
      "man -k lvm → pages that mention LVM · man vgcreate · man semanage- + Tab Tab · man firewall-cmd then /add-port · man dnf.conf | grep baseurl",
    tldr: { page: "man" },
  },
  {
    term: "man -k",
    definition:
      "An option of man. Also called apropos.\n\nIt does not open a page by name. It searches the manual index for pages whose description mentions the word.\n\nParts of man -k prop:\nman → the command.\n-k → the option (keyword / apropos).\nprop → the argument (the word to search).\n\nUse it when you do not remember the exact command name: man -k extent, man -k fstab, man -k volume.",
    example: "man -k prop · man -k lvm · man -k extent · apropos lvm",
    tldr: { page: "apropos" },
  },
  {
    term: "vim",
    definition:
      "Text editor in the terminal. vim FILE. i enters insert mode (you type). Esc returns to normal mode. :wq Enter saves and quits. :q! Enter quits without saving.\n\nSearch: /PHRASE Enter (same as in man). n next. N (Shift+n) previous.\n\nFor the port 82 lab: vim /etc/httpd/conf/httpd.conf, /Listen, change Listen 80 to Listen 82 on the line without #, Esc, :wq.",
    example: "vim /etc/httpd/conf/httpd.conf",
    tldr: { page: "vim" },
  },
  {
    term: "grep",
    definition:
      "Filters lines. It prints the ones that contain the text and drops the rest. It reads a file (grep PHRASE FILE) or whatever arrives on a pipe (command | grep PHRASE). -E allows several phrases split by | inside the quotes: each | is an \"or\". Without -E, that | is just another character. -i ignores case. ^ at the start of the phrase requires the line to begin that way. -w requires the whole word.",
    example:
      "man dnf.conf | grep -E 'baseurl|gpgcheck|enabled' → from the manual page, only the lines with one of those three · grep ich /usr/share/dict/words > /root/lines → words that contain ich, saved in that file · grep '^Listen' /etc/httpd/conf/httpd.conf → lines that start with Listen",
    tldr: { page: "grep" },
  },
  {
    term: "cp",
    definition:
      "Copies files or directories. Order: cp SOURCE DEST. First what you copy, then where. If DEST is an existing directory, the file goes inside with the same name. If DEST is a path with a file name, it lands there with that name (rename while copying). -p keeps owner/mode/timestamps from the source (root needed for ownership). --parents recreates the source path under the destination. It does not assign a new owner: that is chown afterwards.",
    example:
      "cp /home/erik/foto.jpg /root/copia.jpg → source /home/erik/foto.jpg, dest /root/copia.jpg (same content, new name) · cp /home/erik/foto.jpg /root/erikfiles/ → enters that folder as foto.jpg · cp --parents -p /home/erik/a.txt /root/erikfiles → becomes /root/erikfiles/home/erik/a.txt and keeps the owner",
    tldr: { page: "cp" },
  },
  {
    term: "umask",
    definition: "Permission mask when creating files or directories. It clears bits from the default mode. A higher umask leaves fewer open permissions.",
    example: "umask 022 → new files often end up 644; umask → shows the current mask",
    tldr: { page: "umask" },
  },
  {
    term: "ACL",
    definition:
      "Access Control List: fine-grained permissions per user or group, beyond owner/group/others from chmod. On the exam they usually ask for setfacl and getfacl. Usage examples live on those two entries.",
  },
  {
    term: "getfacl",
    definition: "Shows the ACLs on a file or directory: user, group, other, and mask. Use it to verify the lab, not only chmod.",
    example: "getfacl /var/tmp/fstab",
    tldr: { page: "getfacl", platform: "linux" },
  },
  {
    term: "setfacl",
    definition: "Sets or removes ACLs. -m modifies, -x removes one entry, -b clears all extended ACLs.",
    example: "setfacl -m u:erik:rw /var/tmp/fstab",
    tldr: { page: "setfacl", platform: "linux" },
  },
  {
    term: "userdel",
    definition:
      "Deletes a user. With -r: account + home + mail. Without -r: the home stays. Does not remove crontab, files outside the home, ACLs on other paths, or sudoers. To wipe everything on a practice VM you need more (crontab, find -nouser, lab folders). The user cannot have an open session. On XFS the home is gone.",
    example: "userdel -r erik",
    tldr: { page: "userdel", platform: "linux" },
  },
  {
    term: "usermod",
    definition:
      "Changes an existing user. -aG adds a secondary group without dropping the others (without -a, -G replaces the whole list). -s changes the shell. -l renames the login. -g changes the primary group. -d -m moves the home.",
    example: "usermod -s /sbin/nologin diego · usermod -aG sysadm felipe",
    tldr: { page: "usermod", platform: "linux" },
  },
  {
    term: "groupdel",
    definition:
      "Deletes a group. It cannot be anyone's primary group: if it fails, check getent group NAME and change the primary with usermod -g OTHER user, or delete those users. If the group was only secondary (like sysadm in the lab), groupdel is enough.",
    example: "groupdel sysadm",
    tldr: { page: "groupdel", platform: "linux" },
  },
  {
    term: "ugo",
    aliases: ["UGO", "u g o", "rwx"],
    definition:
      "The three permission classes, in order: u (user/owner), g (group), o (other).\n\nIn ls -l you see three triples: rwxrwxrwx → owner, group, others.\nIn numeric chmod: three digits, one per class (e.g. 644 = u=6, g=4, o=4).\n\nEach triple adds the same bits:\n4 = r\n2 = w\n1 = x\n\n7 = rwx (4+2+1)\n6 = rw- (4+2)\n5 = r-x (4+1)\n4 = r--\n3 = -wx (2+1)\n2 = -w-\n1 = --x\n0 = --- (nothing for that class; it does not mean \"root\")\n\nSame bits, different meaning on a file vs a directory:\n\nOn a file\n• r = read the contents\n• w = change / delete the file\n• x = run it (script, binary)\n• 7 = read, write, and execute\n\nOn a directory\n• r = list names (ls)\n• w = create and delete inside\n• x = enter (cd) and open what is inside — not \"run a program\"\n• 7 = list, create, and enter\n• 6 = r+w without x: not enough to cd or create inside (that is why 2660/2664 fail for /shared/sysadm; you need 2770)\n\nDirectory detail: see \"directory permissions\".\n\nFile example: chmod 666 → everyone reads and writes, nobody executes.\nDirectory example: chmod 770 → owner and group list, create, and enter; others nothing.",
    example: "ls -l · chmod 644 file · chmod 755 dir · chmod 2770 /shared/sysadm · chmod u=rwx,g=rx,o=rx script",
    tldr: { page: "chmod" },
  },
  {
    term: "user · owner",
    aliases: ["u", "owner", "dueño", "user::"],
    definition:
      "The first ugo class: the file owner (ls -l user column / getfacl user::).\n\nIn chmod it is u or the first of the three digits (in 644, the 6).\nLetter form: chmod u+x, u=rw, u-w.\n\nRoot is often the owner in system labs; owner permission is not the same as \"being root\": root can bypass mode bits; the owner only gets what their rwx triple says.",
    example: "chmod u=rw file · chmod 600 file → only the owner reads and writes",
    tldr: { page: "chmod" },
  },
  {
    term: "group · group",
    aliases: ["g", "owning group", "group::"],
    definition:
      "The second ugo class: the file's owning group (ls -l / getfacl group::).\n\nIn chmod it is g or the middle digit (in 644, the first 4 = group read-only).\nLetter form: chmod g=r, g-w, g+x.\n\nAnyone in that group uses this triple (if they are not the owner). Do not confuse with a account's secondary groups (id / -G): this is the file's group.",
    example: "chmod g=r /var/tmp/fstab · chmod 640 file → group read-only",
    tldr: { page: "chmod" },
  },
  {
    term: "other · others",
    aliases: ["o", "others", "otros", "other::"],
    definition:
      "The third ugo class: everyone who is not the owner and not in the owning group.\n\nIn chmod it is o or the last digit (in 644, the final 4 = read-only).\nLetter form: chmod o=r, o-rwx, o+x.\n\nOpening other for write (chmod o+w / 666) lets anyone write: ACL labs often keep other read-only and add exceptions with setfacl.",
    example: "chmod o=r file · chmod 644 file → others read-only",
    tldr: { page: "chmod" },
  },
  {
    term: "chmod",
    definition:
      "Changes permissions on a file or directory.\n\nIn man chmod, the number can have up to four digits. Each one adds 4, 2, and 1.\n\n2770 reads like this:\n2, the first: set group ID (setgid).\n7, the second: the owner. 4+2+1, read, write, and enter.\n7, the third: the group, the same three.\n0, the fourth: everyone else. Nobody.\n\nOn a directory, that 1 is enter. Without it, 6 cannot cd or create a file. 2660 does not work. 2770 does.\n\nThree digits alone are owner, group, and others (ugo). The leading one is the special bit: 4 setuid, 2 setgid, 1 sticky.\n\nLetter form also works: u=owner, g=group, o=others, a=all. + adds, - removes, = sets.\nQuick table: see ugo.",
    example: "chmod 644 file · chmod 755 dir · chmod 2770 /shared/sysadm · chmod u+x script.sh · chmod g-w,o-rwx file",
    tldr: { page: "chmod" },
  },
  {
    term: "directory permissions",
    definition:
      "On a directory, r w x do not mean the same thing as on a file.\n\nr = list the names (ls).\nw = create and delete inside.\nx = enter (cd) and open what is inside.\n\nWithout x you cannot enter, even with r and w. Creating a file also needs x: it takes w and x together.\n\n7 = 4+2+1, all three: list, create, and enter.\n6 = 4+2, no enter. That is why 2660 does not work for /shared/sysadm and 2770 does.\n0 = no list, no create, no enter.",
    example: "chmod 2770 /shared/sysadm → the group can enter and create · chmod 2660 cannot enter",
    tldr: { page: "chmod" },
  },
  {
    term: "setuid",
    definition:
      "Special bit 4 (the first digit of chmod). On an executable, the process runs as the file's owner (classic example: passwd as root). Almost unused on directories. Shows as s in the owner's x place: rws---. A capital S means the bit is on but owner execute is missing.",
    example: "chmod 4755 /path/to/bin → 4 = setuid",
    tldr: { page: "chmod" },
  },
  {
    term: "setgid",
    definition:
      "Special bit 2. In man chmod it is the first digit: set group ID.\n\nOn a directory, new files and folders inherit that directory's owning group.\nIn the lab that is /shared/sysadm with chmod 2770. If Felipe touches a file there, the file's group is sysadm.\n\nOn an executable, the process runs as the file's group.\n\nShows as s in the group: drwxrws---.\nA capital S means group execute is missing. Without that x you cannot enter or create inside.",
    example: "chmod 2770 /shared/sysadm → 2 = setgid + 770",
    tldr: { page: "chmod" },
  },
  {
    term: "sticky",
    definition:
      "Special bit 1. On a directory writable by many (like /tmp), only the file's owner (or root) can delete it. Shows as t at the end: drwxrwxrwt. A capital T means the bit is on but others' execute is missing. Not what the setgid lab asks for: that one needs group inheritance, not delete protection.",
    example: "chmod 1777 /tmp → 1 = sticky + 777",
    tldr: { page: "chmod" },
  },
  {
    term: "special chmod bits",
    definition:
      "The first digit of chmod is not owner, group, or others. It is the special bit.\n\n4 setuid.\n2 setgid.\n1 sticky.\n\nThey can be added: 3 = setgid+sticky, 6 = setuid+setgid, 7 = all three.\n\nThen come the three normal digits. 2770 = setgid + rwxrwx---.",
    example: "4 setuid · 2 setgid · 1 sticky",
  },
  {
    term: "LVM",
    aliases: ["Logical Volume Manager"],
    definition:
      "Logical Volume Manager: a way to use disks in layers, with names, instead of depending only on raw /dev/sdb1.\n\nLayers (real names)\n• PV (Physical Volume): disk or partition marked with pvcreate.\n• VG (Volume Group): one or more PVs joined into a pool of space.\n• LV (Logical Volume): named slice cut from the VG; you format and mount it.\n\nWhat is it for?\nA sysadmin uses it when Ops wants a shared space (service files, dumps, data) that has a name, mounts on a folder, and can grow later without wiping everything and repartitioning by hand.\n\nFlow\ndisk or partition → PV → VG → LV → filesystem → mount.\n\nLEGO analogy (only to visualize): the PV is a plate you prepare; the VG is joining plates into a platform; the LV is the building on top that you actually use. PEs are the fixed-size bricks the VG hands out.\n\next4 and /mnt/wshare are no longer LVM: that is the format and the mount on top of the LV.",
    example: "pvcreate /dev/sdb1 · vgcreate -s 8M wgroup /dev/sdb1 · lvcreate -n wshare -l 50 wgroup · mkfs.ext4 /dev/wgroup/wshare · mkdir -p /mnt/wshare · mount /dev/wgroup/wshare /mnt/wshare",
  },
  {
    term: "PV · physical volume",
    aliases: ["PV", "physical volume", "Physical Volume", "Physical Volumes"],
    definition:
      "Physical Volume (PV).\n\nWhat is it?\nA disk or partition you initialize with pvcreate so LVM can use it as storage space.\n\nOnce it is a PV, LVM has prepared that device to join a VG. You still cannot use it as an LV or mount it directly as a filesystem.\n\nWhat is it for?\nIt is the entry point of physical storage into LVM. Without a PV, LVM cannot put that device in a VG, so you cannot create LVs from it.\n\nLEGO analogy (optional): the PV is the plate you prepare. It is not yet the VG or the LV; it only makes that disk/partition ready to join the group.\n\nIn the lab\nUse partition /dev/sdb1 on the extra disk, not the system disk that holds / and /boot.\n\nWatch out\nIf you initialize the whole disk (/dev/sdb) instead of its partition (/dev/sdb1), you can block the remaining space for other partitions, such as swap. That is why this lab uses a specific partition.\n\nLVM flow: disk or partition → PV → VG → LV → filesystem.",
    example: "pvcreate /dev/sdb1 · pvs · pvdisplay",
    tldr: { page: "pvcreate", platform: "linux" },
  },
  {
    term: "VG · volume group",
    aliases: ["VG", "volume group", "Volume Group", "Volume Groups"],
    definition:
      "Volume Group (VG).\n\nWhat is it?\nA set of one or more PVs grouped into a single pool of storage. From that pool you create LVs, which you then use as storage devices.\n\nWhat is it for?\nThe VG is the common space you cut LVs from. It lets you manage one or more PVs as one logical unit.\n\nWhen you create it you set:\n• Group name: in the lab, wgroup.\n• PE size: each Physical Extent is an allocation unit. In the lab each PE is 8 MiB (-s 8M).\n\nWithout a VG you have no storage pool to create LVs from.\n\nLEGO analogy (optional): you already have PVs prepared; the VG is joining them into a platform you later cut LVs from.\n\nLVM flow: disk or partition → PV → VG → LV → filesystem.",
    example: "vgcreate -s 8M wgroup /dev/sdb1 · vgs · vgdisplay",
    tldr: { page: "vgcreate", platform: "linux" },
  },
  {
    term: "LV · logical volume",
    aliases: ["LV", "logical volume", "Logical Volume", "Logical Volumes"],
    definition:
      "Logical Volume (LV).\n\nWhat is it?\nThe named slice you cut from a VG. That is what you format (ext4) and mount on a folder.\n\nWhat is it for?\nThe system and you talk about a named disk (/dev/wgroup/wshare), not \"some weird piece of sdb1\". Later you can grow it (lvextend) without redoing the PV partition layout.\n\nLEGO analogy (optional): the LV is the building on top of the VG; that is what you format and mount for real.\n\nIn the lab\nThat LV is named wshare: 50 PE of 8 MiB = 400 MB.\n\nLab command: lvcreate -n wshare -l 50 wgroup\n• -n wshare: LV name\n• -l 50: 50 extents (lowercase). 50 × 8 MiB = 400 MB\n• wgroup: VG you cut from",
    example: "lvcreate -n wshare -l 50 wgroup · lvs",
    tldr: { page: "lvcreate", platform: "linux" },
  },
  {
    term: "resize",
    aliases: ["resize LV", "resize filesystem", "change size"],
    definition:
      "Change the size of something that already exists. In these labs that almost always means two different layers:\n\n1) The LV (the LVM \"disk\": /dev/vgroup/vo). You read it with lvs.\n2) The filesystem on top (ext4). You read it with df -h /mnt/vo.\n\nResize = leave those two layers at the size the task asks for, together.\n\nGrow / extend\nMore space: lvextend (or lvresize upward). If only the LV grows, lvs changes and df does not: ext4 is still small. Then you need resize2fs, or -r on the same lvextend so LVM grows the filesystem.\n\nShrink / reduce\nLess space: lvreduce / lvresize downward. Order matters more here: if you shrink the LV without shrinking the filesystem, ext4 stays larger than the disk and breaks. That is why -r (or resize2fs first) is critical.\n\nIn one line\n\"Resize the LV and the filesystem\" = the volume and what df shows must end up aligned to the requested size (for example ~50 MB or ~230 MB).\n\nCommands that do resize\n• lvextend → only grows the LV\n• lvreduce → only shrinks the LV\n• lvresize → sets an exact size (up or down)\n• resize2fs → resize of the ext4\n• -r on lvextend/lvresize → filesystem resize in the same step",
    example: "lvs · df -h /mnt/vo · lvextend -L 230M -r /dev/vgroup/vo · lvresize -r -L 50M /dev/vgroup/vo",
  },
  {
    term: "PE · extent",
    aliases: ["PE", "extent", "extents", "Physical Extent", "Physical Extents"],
    definition:
      "Physical Extent (PE): the fixed-size brick inside the VG. It is not another disk.\n\nWhat is it?\nThe unit LVM uses to allocate space inside the group.\n\nWhat is it for?\nWhen you create the VG, -s 8M means each brick is 8 MiB.\nWhen you create the LV, -l 50 means you want 50 bricks.\n50 × 8 = 400 MB. Not \"50 MB\".\n\nLVM grows and allocates PE by PE, not byte by byte by hand.",
    example: "vgcreate -s 8M wgroup /dev/sdb1 · lvcreate -n wshare -l 50 wgroup",
  },
  {
    term: "wgroup",
    definition:
      "The name Ops gave to the VG in this lab.\n\nWhat is it?\nNot a command or a different object type: only the name of the volume group (the LEGO platform).\n\nWhat is it for?\nIt identifies the pool of space you later cut wshare from.\n\nHow you create it\nvgcreate -s 8M wgroup /dev/sdb1\n• vgcreate: creates the VG.\n• -s 8M: each PE is 8 MiB.\n• wgroup: the group name (this one).\n• /dev/sdb1: PV added to the group.\n\nThe system disk (with / and /boot) does not go here.",
    example: "vgcreate -s 8M wgroup /dev/sdb1 · vgs · vgdisplay",
    tldr: { page: "vgcreate", platform: "linux" },
  },
  {
    term: "wshare",
    definition:
      "Not a command. It is only the name Ops gave the LV in this lab (\"shared space\"). Another task might call it data, appdata, lv_share, or anything else: what matters is the name in the text, not the word wshare itself.\n\nWhat is it?\nThe logical volume (the LEGO building) that lives inside VG wgroup. On disk it shows up as /dev/wgroup/wshare.\n\nWhat is it for?\nIn real life Ops does not want dumps, uploads, or service data dropped straight onto / (the system disk). They want a named chunk of disk, separate, that:\n• mounts on a fixed folder (/mnt/wshare) so apps and people write there;\n• survives reboot (fstab + UUID): a manual mount alone leaves /mnt/wshare empty after reboot even though the LV still exists;\n• can grow later (lvextend) without wiping / or repartitioning blindly.\n\nThe LV is only the named \"disk\". It still has no files: you need mkfs.ext4 (format) and a mount. Without a format there is no usable folder; without a mount nothing shows under /mnt/wshare; without fstab it does not come back alone.\n\nHow you create it\nlvcreate -n wshare -l 50 wgroup\n• lvcreate: creates the LV.\n• -n wshare: volume name (this one).\n• -l 50: 50 PE (lowercase L). With 8 MiB PE → 400 MB. Uppercase -L is something else (size in MB).\n• wgroup: VG you cut from.\n\nYou get /dev/wgroup/wshare. Then: mkfs.ext4, mount, and fstab by UUID.",
    example: "lvcreate -n wshare -l 50 wgroup · mkfs.ext4 /dev/wgroup/wshare · mkdir -p /mnt/wshare · mount /dev/wgroup/wshare /mnt/wshare",
    tldr: { page: "lvcreate", platform: "linux" },
  },
  {
    term: "fstab",
    definition:
      "The file /etc/fstab. It says what mounts at boot and where.\n\nEach line has six fields, in order:\n1. what (UUID=…)\n2. where (/mnt/wshare)\n3. type (ext4, xfs, swap)\n4. options (defaults)\n5. dump (almost always 0)\n6. boot check (0 skips; 1 is root; 2 is the rest)\n\nSample line (replace the UUID with blkid's):\nUUID=FROM-BLKID /mnt/wshare ext4 defaults 0 0\n\nSaving the file does not mount now. The next boot does. To test now: mount -a.\n\nUUID comes from blkid on the LV (/dev/wgroup/wshare), not on partition sdb1.\nDo not use /dev/sdX: that name can change.\nThe /var/tmp/fstab copy in the permissions lab is ACL practice only: it mounts nothing.",
    example: "blkid /dev/wgroup/wshare · mount -a",
    tldr: { page: "fstab", platform: "linux" },
  },
  {
    term: "al boot",
    definition:
      "The mount comes back by itself after a reboot. It is not the /boot partition. In this lab it is an /etc/fstab line with the LV's UUID (blkid /dev/wgroup/wshare), not /dev/sdX, because that name can change.\n\nTypical line (replace FROM-BLKID):\nUUID=FROM-BLKID /mnt/wshare ext4 defaults 0 0\n\nWithout that line the LV still exists, but /mnt/wshare is empty after reboot.",
    example: "blkid /dev/wgroup/wshare · mount -a",
    tldr: { page: "fstab", platform: "linux" },
  },
  {
    term: "tuned",
    definition:
      "The package and the service. systemctl enable --now tuned starts it and leaves it for the next boot. That process is what applies the profile. It is not the command: the command is tuned-adm. Both come in the same package. They are not installed separately.",
    example: "rpm -q tuned · systemctl enable --now tuned",
  },
  {
    term: "tuned-adm",
    definition:
      "The command that talks to the tuned service. recommend only prints a name and does not save it. profile NAME applies it now and writes it to /etc/tuned/active_profile. active shows the profile that is set. Without the tuned service running, there is nobody to apply the profile to.",
    example: "tuned-adm recommend · tuned-adm profile NAME · tuned-adm active",
    tldr: { page: "tuned-adm", platform: "linux" },
  },
  {
    term: "copy and paste",
    definition:
      "There are three clipboards, and each key talks to only one. Bash cuts the line you are typing (Ctrl+K, Ctrl+U, Ctrl+W) and puts it back with Ctrl+Y. The desktop terminal, the one on the exam workstation, uses the desktop clipboard: Ctrl+Shift+C copies, Ctrl+Shift+V or Shift+Insert pastes; selecting with the left button and pasting with the middle button uses that same one. Neovim keeps its own: yy or y copy, p pastes, and the text stays inside the editor. On a bare console, with no desktop, the desktop clipboard does not exist.",
  },
  {
    term: "Ctrl+C",
    definition:
      "In the terminal it interrupts the command that is running. In a desktop program, such as the task panel or the browser, it copies the selected text. On the exam that key alone can freeze the terminal or the browser. Copying from the desktop terminal is Ctrl+Shift+C.",
  },
  {
    term: "Ctrl+V",
    definition:
      "In bash the next key is taken literally: it pastes nothing. In a desktop program it pastes the clipboard. In the desktop terminal, paste is Ctrl+Shift+V or Shift+Insert.",
  },
  {
    term: "Ctrl+Shift+C",
    definition:
      "Copies in the desktop terminal and puts the text on the desktop clipboard. Shift leaves Ctrl+C free to interrupt the command. On a bare console this combination does not exist.",
  },
  {
    term: "Ctrl+Shift+V",
    definition:
      "Pastes the desktop clipboard into the desktop terminal. Bash pastes its own cut with Ctrl+Y. Neovim pastes its own with p.",
  },
  {
    term: "Shift+Insert",
    definition:
      "Pastes in the desktop terminal. It uses the same clipboard as Ctrl+Shift+V.",
  },
  {
    term: "Ctrl+K",
    definition:
      "In bash it cuts from the cursor to the end of the line you are typing. That goes to bash's cut buffer and comes back with Ctrl+Y. Text already printed on the screen stays there. In Neovim, cutting a line is dd.",
  },
  {
    term: "Ctrl+U",
    definition:
      "In bash it cuts from the cursor to the start of the line you are typing. It comes back with Ctrl+Y.",
  },
  {
    term: "Ctrl+W",
    definition:
      "In bash it cuts the previous word of the line you are typing. It comes back with Ctrl+Y. In the browser it closes the tab. In Neovim, cutting is d or dd.",
  },
  {
    term: "Ctrl+Y",
    definition:
      "In bash it pastes the last piece cut from the line with Ctrl+K, Ctrl+U, or Ctrl+W. Alt+Y, right after that, swaps in an older cut. The desktop clipboard pastes with Ctrl+Shift+V. Neovim pastes with p.",
  },
  {
    term: "Alt+Y",
    definition:
      "In bash, after a Ctrl+Y, it swaps that paste for an older cut from the same line. It is still bash's cut buffer.",
  },
  {
    term: "Ctrl+R",
    definition:
      "In bash it searches backward through command history. In Neovim insert mode, Ctrl+R then \" inserts what you copied with y. The key is the same and the program decides which of the two it does.",
  },
  {
    term: "yy",
    definition:
      "In Neovim normal mode it copies the cursor's line and leaves it in place. p pastes it below and P pastes it above, inside Neovim. dd cuts that line: it copies and deletes it. The desktop clipboard is Ctrl+Shift+C.",
  },
  {
    term: "y (Neovim)",
    definition:
      "In Neovim normal mode it copies without deleting. yy copies the whole line. After v (characters) or V (the line), y copies that selection. p pastes it inside Neovim.",
  },
  {
    term: "p (Neovim)",
    definition:
      "In Neovim normal mode it pastes below the cursor what you copied with yy or y. P pastes it above. In bash, pasting the line is Ctrl+Y. In the desktop terminal it is Ctrl+Shift+V.",
  },
  {
    term: "dd",
    definition:
      "In Neovim normal mode it cuts the line: it copies and deletes it. p pastes it. yy copies that line and leaves it written. In bash, cutting the line you are typing is Ctrl+K or Ctrl+U.",
  },
  {
    term: "screen",
    definition:
      "Copies, with the keyboard, text that has already been printed on the screen. It is not part of a minimal install. Ctrl+A then [ opens copy mode, the arrows move, Space marks the start and Space again marks the end, Ctrl+A then ] pastes. The buffer belongs to screen. Bash still pastes with Ctrl+Y.",
    tldr: { page: "screen" },
  },
  {
    term: "ls",
    definition:
      "Lists what is in a directory. With no options, names only. -l is the long list: mode, owner, group, and size. -a includes names that start with a dot. -n prints UID and GID as numbers. -d does not enter: it shows the directory itself. -Z adds the SELinux context.",
    example: "ls -lan → long, hidden, numeric UID and GID · ls -ld /shared/sysadm → the directory, not its contents · ls -Zd PATH → that directory's context",
    tldr: { page: "ls" },
  },
  {
    term: "ls -lan",
    definition:
      "Long listing, including hidden names, with owner and group as numbers. -l is long, -a includes . and .., -n replaces the owner and group names with the UID and the GID. Use it when the name is not enough to see who owns the file.",
    example: "ls -lan /home/thiago",
    tldr: { page: "ls" },
  },
  {
    term: "ls -ld",
    definition:
      "Shows the directory itself, not what is inside. Without -d, ls enters and lists the contents. With -l you can read setgid: drwxrws--- has s in the group's execute slot.",
    example: "ls -ld /shared/sysadm",
    tldr: { page: "ls" },
  },
  {
    term: "ls -Zd",
    definition:
      "Shows the SELinux context of the directory itself. -Z is the context and -d does not enter. Without -d, -Z lists the context of each file inside.",
    example: "ls -Zd /srv/company-drop",
    tldr: { page: "ls" },
  },
  {
    term: "cd",
    definition: "Changes directory. With no argument it goes to the home of whoever is logged in. cd - returns to the previous directory.",
    example: "cd /etc/yum.repos.d/ && ls",
    tldr: { page: "cd" },
  },
  {
    term: "cat",
    definition: "Prints a whole file on the terminal. It does not page: a long file scrolls away. To see a piece, use head or grep.",
    example: "cat /etc/vconsole.conf",
    tldr: { page: "cat" },
  },
  {
    term: "echo",
    definition: "Prints the text you give it. >> appends that text to a file. > overwrites the file. Inside single quotes the shell does not touch the text.",
    example: "echo prueba >> /var/tmp/fstab",
    tldr: { page: "echo" },
  },
  {
    term: "mkdir",
    definition: "Creates a directory. -p also creates parents that are missing and stays quiet if the last one already exists. Without -p, a path whose parent is missing fails.",
    example: "mkdir -p /shared/sysadm",
    tldr: { page: "mkdir" },
  },
  {
    term: "touch",
    definition: "Creates an empty file if it does not exist. If it exists, it updates the timestamp. Also used to leave an empty file another program will read, such as /.autorelabel.",
    example: "touch /.autorelabel",
    tldr: { page: "touch" },
  },
  {
    term: "id",
    definition: "Shows the UID, primary group, and secondary groups of a user. With no argument, those of whoever is at the prompt. Use it to check a useradd or a usermod -aG.",
    example: "id thiago",
    tldr: { page: "id" },
  },
  {
    term: "useradd",
    definition:
      "Creates a user. -m creates the home. -u sets the UID. -g is the primary group. -G adds secondary groups at creation. The password is not set here: passwd comes after.",
    example: "useradd -m -G developer thiago",
    tldr: { page: "useradd", platform: "linux" },
  },
  {
    term: "groupadd",
    definition: "Creates a group. The user is added later with useradd -G or usermod -aG. groupadd does not put anyone in the group.",
    example: "groupadd developer",
    tldr: { page: "groupadd", platform: "linux" },
  },
  {
    term: "passwd",
    definition: "Changes a password. With no argument, the password of whoever is logged in: it asks twice. passwd USER, as root, changes that account. It does not create the user.",
    example: "passwd thiago",
    tldr: { page: "passwd" },
  },
  {
    term: "chown",
    definition: "Changes the owner and group of a file. Owner and group go together: USER:GROUP. -R walks down the directory. It does not set mode: that is chmod.",
    example: "chown erik:erik /var/tmp/fstab",
    tldr: { page: "chown" },
  },
  {
    term: "getent",
    definition: "Reads a system database: passwd, group, or shadow. It prints that account's line, from a local file or from another source. getent group NAME says whether the group exists and who is in it.",
    example: "getent passwd thiago · getent group developer",
    tldr: { page: "getent" },
  },
  {
    term: "su -",
    definition:
      "Opens a login as that user: it loads their home and their environment. Do not drop the dash. su USER without the dash is not a login. su - -c 'COMMAND' runs that and returns. To test a permission, the command has to stay inside the quotes.",
    example: "su - felipe · su - erik -c 'echo prueba >> /var/tmp/fstab'",
    tldr: { page: "su" },
  },
  {
    term: "dnf",
    definition:
      "Installs and looks up packages. repolist shows enabled repos. install -y installs without asking. --repo= limits the search to those repos. provides PATH says which package ships that file. clean all drops the cache. list available lists what can be installed.",
    example: "dnf repolist · dnf install -y --repo=BaseOS --repo=AppStream words · dnf provides /usr/sbin/semanage",
    tldr: { page: "dnf", platform: "linux" },
  },
  {
    term: "find",
    definition:
      "Finds files by name, owner, type, or age. -user is the owner, -type f is a file, -mtime -1 is the last day. -exec COMMAND {} \\; runs that command on each result. 2>/dev/null hides Permission denied.",
    example: "find / -user erik -mtime -1 -type f",
    tldr: { page: "find" },
  },
  {
    term: "tar",
    definition:
      "Packs, lists, or extracts. Each letter is one option. In this lab they are written together.\n\nc creates the archive.\nt lists what is inside, without extracting.\nx extracts. This lab does not use it.\nj is bzip2. The file ends up .tar.bz2.\nz is gzip. That would leave a .tar.gz and the lab is not done.\nf is the archive name and comes last: the next word is the path.\nv is verbose: it prints each name while it works. It is not the file.\n\ntar -cjf /root/myetcbackup.tar.bz2 /etc\ncreates, compresses with bzip2, and writes that file. /etc is what goes inside.\n\ntar -tjf /root/myetcbackup.tar.bz2\nlists that .tar.bz2. It does not create anything.\n\ncjv does not do this. c creates, j is bzip2, v only talks. f is missing, so it does not write /root/myetcbackup.tar.bz2: it dumps the archive on the terminal.\n\nIn man tar, /bzip2 jumps to -j, --bzip2. /--list is t. /--file is f. If you see 1m and 22m stuck to the word, that is bold.",
    example: "tar -cjf /root/myetcbackup.tar.bz2 /etc · tar -tjf /root/myetcbackup.tar.bz2 | head",
    tldr: { page: "tar" },
  },
  {
    term: "systemctl",
    definition:
      "Manages systemd units. status changes nothing. start and stop are for now. enable leaves it for the next boot and disable removes that. enable --now starts it now and leaves it for boot. restart makes it read the configuration again.",
    example: "systemctl enable --now httpd · systemctl status httpd",
    tldr: { page: "systemctl", platform: "linux" },
  },
  {
    term: "journalctl",
    definition: "Reads the systemd journal. -u UNIT keeps only that service. -b is this boot. -f follows new lines. It does not replace ausearch: SELinux denials are a different log.",
    example: "journalctl -u httpd -b",
    tldr: { page: "journalctl", platform: "linux" },
  },
  {
    term: "hostnamectl",
    definition: "Shows or changes the hostname. set-hostname changes it now and saves it. It is not a network profile: nmcli connection up is not required. status, or hostnamectl alone, shows the current name.",
    example: "hostnamectl set-hostname client.linux.lab",
    tldr: { page: "hostnamectl", platform: "linux" },
  },
  {
    term: "localectl",
    definition:
      "Changes the keymap on this machine. set-keymap is the console of the VirtualBox window. set-x11-keymap is the graphical one, and that window does not use it. The Latin American console map is named la-latin1, with no leading dash: localectl set-keymap la-latin1. The hyphen belongs to the set-keymap subcommand, not to the map name. list-keymaps lists the names MAP accepts. Afterwards, localectl status should say VC Keymap: la-latin1. Leave the server on us, because the rescue shell is typed on that console. An SSH session does not change: there the keyboard is your machine's. man localectl | grep set-keymap does find it. The line is set-keymap MAP [TOGGLEMAP]: MAP is the name, la-latin1. The 1m, 22m and 0m stuck to the word are the manual's bold markers, not missing text. 1m turns bold on and 22m or 0m turns it off. grep cuts the paragraph at that line. To read the whole entry, open man localectl and search /set-keymap.",
    example: "localectl set-keymap la-latin1 · localectl list-keymaps · localectl status",
    tldr: { page: "localectl", platform: "linux" },
  },
  {
    term: "loginctl",
    definition: "Lists login sessions. Use it to see whether a user is still logged in before deleting them: userdel cannot remove an open session.",
    example: "loginctl list-sessions",
    tldr: { page: "loginctl", platform: "linux" },
  },
  {
    term: "reboot",
    definition: "Reboots. On a normal boot, reboot is enough. If bash is process 1, you need exec /sbin/reboot -f: without -f the kernel panics.",
    example: "reboot · exec /sbin/reboot -f",
    tldr: { page: "reboot" },
  },
  {
    term: "mount",
    definition:
      "Shows or mounts filesystems. With no arguments it lists what is mounted. -o remount,rw mounts a root that booted read-only so it can be written. The mount point is the last argument.",
    example: "mount -o remount,rw / · mount -o remount,rw /sysroot",
    tldr: { page: "mount" },
  },
  {
    term: "nmcli",
    definition:
      "Configures NetworkManager from the terminal. connection show lists profiles: NAME is what you pass to modify, DEVICE is the NIC. connection modify saves the address, gateway, and DNS. connection up applies it now. -f prints one field. ip a does not show DNS.",
    example: "nmcli connection show · nmcli -f ipv4.dns connection show hostonly · nmcli connection up hostonly",
    tldr: { page: "nmcli", platform: "linux" },
  },
  {
    term: "ip",
    definition: "Looks at the network. ip -br a is the short list of NICs and addresses. ip a is the same list, longer. It does not change the profile: that is nmcli. lo is the machine talking to itself and is not edited.",
    example: "ip -br a",
    tldr: { page: "ip" },
  },
  {
    term: "curl",
    definition: "Requests a URL and prints the answer. -I asks for headers only. Use it to see whether a port or a service answers, without a browser.",
    example: "curl -I http://127.0.0.1:82/",
    tldr: { page: "curl" },
  },
  {
    term: "firewall-cmd",
    definition:
      "Opens or closes ports in firewalld. --add-port=PORT/tcp opens one. --permanent saves it. Without --permanent, a reboot drops it. --reload applies what was saved. Until the reload, the permanent change is not active.",
    example: "firewall-cmd --add-port=82/tcp --permanent && firewall-cmd --reload",
    tldr: { page: "firewall-cmd", platform: "linux" },
  },
  {
    term: "getenforce",
    definition: "Prints the SELinux mode right now: Enforcing, Permissive, or Disabled. It does not change it. Enforcing blocks. Permissive warns and allows.",
    example: "getenforce",
    tldr: { page: "getenforce", platform: "linux" },
  },
  {
    term: "semanage",
    definition:
      "Changes SELinux policy and saves it. port -l lists labeled ports. port -a -t TYPE -p tcp PORT adds one. fcontext records the context of a path for a later restorecon. It is not in a minimal install: the package is policycoreutils-python-utils.\n\nPort syntax is in man semanage-port, not man semanage. At the shell: man semanage- then Tab Tab lists those pages.",
    example: "man semanage-port · semanage port -l | grep http · semanage port -a -t http_port_t -p tcp 82",
    tldr: { page: "semanage", platform: "linux" },
  },
  {
    term: "restorecon",
    definition: "Applies the context the policy already has recorded. -v says when it relabeled. It does not invent a new label: if the rule is missing, semanage fcontext comes first.",
    example: "restorecon -v /etc/NetworkManager/system-connections/NOMBRE.nmconnection",
    tldr: { page: "restorecon", platform: "linux" },
  },
  {
    term: "getsebool",
    definition: "Shows one SELinux boolean. -a lists them all. It does not change one: that is setsebool. on allows, off does not.",
    example: "getsebool -a | grep ftp",
    tldr: { page: "getsebool", platform: "linux" },
  },
  {
    term: "ausearch",
    definition: "Searches the audit log. -m avc keeps SELinux denials. -ts recent is what just happened. It is not journalctl: SELinux AVCs are here.",
    example: "ausearch -m avc -ts recent",
    tldr: { page: "ausearch", platform: "linux" },
  },
  {
    term: "podman",
    definition:
      "Runs containers without a daemon. run creates and starts one. -d leaves it in the background. --name sets the name. -v SOURCE:DEST:Z mounts a directory and Z fixes the context. generate systemd writes the unit so systemd can start it.",
    example: "podman run -d --name mycontainer localhost/text2pdf:latest · man podman-generate-systemd",
    tldr: { page: "podman", platform: "linux" },
  },
  {
    term: "flatpak",
    definition:
      "Installs applications apart from dnf.\n\nIf the command is missing on the machine, install the package with dnf first (DNF repos already set up): dnf install -y flatpak. Without that, remote-add and install will not run.\n\nA remote is the app store (like a dnf .repo): URL + a short name. That name does not have to be flathub; on the exam it is usually whatever the ticket says. flathub is only the public store for home practice.\n\nremote-add registers the store (it does not install apps). install downloads an app. --user is that account, --system is the machine. list shows what is installed. uninstall removes one. A system remote does not show up for another user when they use --user.",
    example: "dnf install -y flatpak · flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo · flatpak install -y --system flathub org.gnome.Calculator",
    tldr: { page: "flatpak", platform: "linux" },
  },
  {
    term: "lsblk",
    definition: "Lists disks and partitions as a tree. -f adds the filesystem and the UUID. The disk that holds / and /boot is not partitioned again.",
    example: "lsblk -f",
    tldr: { page: "lsblk", platform: "linux" },
  },
  {
    term: "blkid",
    definition: "Prints the UUID and type of a device. That UUID is what goes in fstab when the line does not use the /dev name, which can change order.",
    example: "blkid /dev/sdb1",
    tldr: { page: "blkid", platform: "linux" },
  },
  {
    term: "parted",
    definition:
      "Partitions a disk without a menu (alternative to fdisk). mklabel writes the table. mkpart creates a partition. set N lvm on sets the LVM type (like 8e in fdisk).\n\nThe unit belongs on the number: 400MiB is not 400MB. The disk that holds / is left alone.\nThe video prefers fdisk because it is interactive; parted is fine as one command.",
    example: "parted /dev/sdb --script mklabel gpt mkpart primary 1MiB 600MiB · parted /dev/sdb set 1 lvm on",
    tldr: { page: "parted", platform: "linux" },
  },
  {
    term: "pvcreate",
    definition:
      "Command that marks a disk or partition as a PV (Physical Volume).\n\nWhy you use it: until you run this, LVM will not touch that disk. It is the first step.\n\nIt does not create the group or the shared volume: those are vgcreate and lvcreate.\n\nThe argument is the full path: /dev/sdb1. Typing only sdb fails (No device found).\nIf you mark the whole disk (/dev/sdb), there is no room for swap: avoid that in the wshare lab. Video Q15b sometimes marks the whole disk only to build its vo prep.",
    example: "pvcreate /dev/sdb1 · pvs",
    tldr: { page: "pvcreate", platform: "linux" },
  },
  {
    term: "vgcreate",
    definition:
      "Command that creates the VG (volume group = plates joined).\n\nWhy you use it: you put the PV into a named pool. From there you cut the LV.\n\nTypical order: vgcreate -s 8M wgroup /dev/sdb1\n-s 8M → option: each brick (PE) is 8 MB. 8M stays together.\nwgroup → argument: group name.\n/dev/sdb1 → argument: the PV you add.\n\nWithout -s 8M, the lab task (8 MB PE) is not met.",
    example: "vgcreate -s 8M wgroup /dev/sdb1 · vgs",
    tldr: { page: "vgcreate", platform: "linux" },
  },
  {
    term: "lvcreate",
    definition:
      "Command that creates the LV (logical volume = the building) inside a VG.\n\nWhy you use it: it is the named space you then format and mount.\n\nIn this lab: lvcreate -n wshare -l 50 wgroup\n-n wshare → option: LV name.\n-l 50 → option: 50 bricks (lowercase L). 50 × 8 MB = 400 MB.\n-L uppercase → different option (size in MB): not what the task wants if it asks for extents.\nwgroup → argument: which group you cut from.\n\nYou get /dev/wgroup/wshare.\n\nPrep from video Q15b (other lab): lvcreate -L 180M -n vo vgroup → there -L is correct, because it asks for 180 megabytes, not extents.",
    example: "lvcreate -n wshare -l 50 wgroup · lvcreate -L 180M -n vo vgroup · lvs",
    tldr: { page: "lvcreate", platform: "linux" },
  },
  {
    term: "lvextend",
    aliases: ["extend LV", "grow LV"],
    definition:
      "Grows an LV that already exists. It does not create a new one: that is lvcreate.\n\nKey arguments (as in video Q15b):\n• -L 230M → final size in megabytes (uppercase L). Also -L +50M to add.\n• -l (lowercase) → extent count: a different thing; do not use it if the task talks in MB.\n• -r → resize the filesystem in the same step (fast method). Without -r, lvs already shows the new size but df stays small: you still need resize2fs (ext4).\n• /dev/vgroup/vo → LV path (VG/name).\n\nVideo method 1: lvextend -L 230M /dev/vgroup/vo then resize2fs /dev/vgroup/vo.\nMethod 2: lvextend -L 230M -r /dev/vgroup/vo.\n\ndf often shows less than lvs: ext4 reserve and metadata; that is normal.",
    example: "lvextend -L 230M /dev/vgroup/vo · resize2fs /dev/vgroup/vo · lvextend -L 230M -r /dev/vgroup/vo",
    tldr: { page: "lvextend", platform: "linux" },
  },
  {
    term: "lvresize",
    aliases: ["lvreduce", "resize LV"],
    definition:
      "Changes an LV to an exact size (can grow or shrink). lvextend only grows; lvreduce only shrinks. lvresize does both.\n\nOptions:\n• -L 50M → final size in MB (uppercase).\n• -l 5 → size in extents (lowercase). With PE 10M: 5 × 10 = exactly 50 MB.\n• -r → moves the filesystem with the LV. When shrinking, without -r the filesystem can stay larger than the LV and break.\n• /dev/vgroup/vo → the LV.\n\nTip from the Q17 comment (recommended when shrinking):\nlvreduce -r -l 5 /dev/vgroup/vo\n• -r skips manual resize2fs (no guessing 50M vs 55M).\n• -l 5 uses extents: with -s 10M on the VG → 50 MB without converting MB by eye.\n\nLong video method: umount → (e2fsck -f) → resize2fs … 50M → lvreduce -l 5 → mount.\nUnmount before shrinking.",
    example: "lvreduce -r -l 5 /dev/vgroup/vo · lvresize -r -L 50M /dev/vgroup/vo · umount /mnt/vo",
    tldr: { page: "lvresize", platform: "linux" },
  },
  {
    term: "resize2fs",
    definition:
      "Resizes an ext2/ext3/ext4 filesystem to match the device.\n\nWhy with LVM: after lvextend without -r, the LV is already larger but ext4 is not. resize2fs /dev/vgroup/vo makes df use the new space.\n\nThe argument is the LV device (or partition), not the mount point. Growing can be done while mounted. Shrinking often needs an unmount and shrinking the filesystem before the LV.\n\nWith lvextend -r you do not run resize2fs by hand: LVM triggers it.",
    example: "lvextend -L 230M /dev/vgroup/vo · resize2fs /dev/vgroup/vo",
    tldr: { page: "resize2fs", platform: "linux" },
  },
  {
    term: "vgextend",
    definition:
      "Adds another PV to a VG that already exists. It does not create the group: that is vgcreate.\n\nWhen: vgs shows little or no free space and you need to grow the LV.\n\nOrder: vgextend vgroup /dev/PARTICION\n• vgroup → the VG.\n• /dev/PARTICION → new PV (partition or disk already run through pvcreate).\n\nThen: lvextend -r … to use that space on the LV. Without vgextend, lvextend fails if the group has no free space.",
    example: "pvcreate /dev/sdb3 · vgextend vgroup /dev/sdb3 · lvextend -r -L +50M /dev/vgroup/vo",
    tldr: { page: "vgextend", platform: "linux" },
  },
  {
    term: "lvs",
    definition:
      "Lists Logical Volumes. It changes nothing.\n\nBefore and after lvextend/lvresize: read the LV size here.\nIf lvs already changed and df -h /mnt/vo did not, -r or resize2fs is still missing.",
    example: "lvs · lvs /dev/vgroup/vo · lvs -o lv_name,vg_name,lv_size",
    tldr: { page: "lvs", platform: "linux" },
  },
  {
    term: "vgs",
    definition:
      "Lists Volume Groups and how much free space they have. It changes nothing.\n\nIf VFree is 0, you cannot lvextend until you vgextend with another PV.",
    example: "vgs · vgdisplay",
    tldr: { page: "vgs", platform: "linux" },
  },
  {
    term: "pvs",
    definition: "Lists Physical Volumes. It changes nothing. Use it to see whether the PV was created and which VG it belongs to.",
    example: "pvs · pvdisplay",
    tldr: { page: "pvs", platform: "linux" },
  },
  {
    term: "fdisk",
    definition:
      "Partitions a disk with an interactive menu (the Q15/Q16 video path). The argument is the disk: /dev/sdb, not /dev/sdb1.\n\nUseful keys:\n• m → help\n• n → new partition · p → primary · Enter for number and first sector (defaults)\n• +450M or +420M → size (together, no space). Extra margin helps with MB vs MiB and the 2048 offset\n• t → type: 8e = Linux LVM · 82 = Linux swap (L lists codes)\n• p → print the table\n• w → write and quit · q → quit without saving (discards)\n\nAfter LVM: pvcreate /dev/sdb1. After swap: mkswap /dev/sdb2.",
    example: "fdisk /dev/sdb",
    tldr: { page: "fdisk", platform: "linux" },
  },
  {
    term: "mkfs.ext4",
    definition: "Formats a volume as ext4. The argument is the device, not the mount point. Formatting erases what was there.",
    example: "mkfs.ext4 /dev/wgroup/wshare · mkfs.ext4 /dev/vgroup/vo",
    tldr: { page: "mkfs.ext4", platform: "linux" },
  },
  {
    term: "mkswap",
    definition: "Marks a partition as swap. It does not turn it on: that is swapon. The fstab line comes after, so it comes back by itself.",
    example: "mkswap /dev/sdb2",
    tldr: { page: "mkswap", platform: "linux" },
  },
  {
    term: "swapon",
    definition:
      "Turns on swap that mkswap already marked.\n\n• swapon /dev/sdb2 → activates that partition now\n• swapon --show or -s → lists active ones (changes nothing)\n• swapon -a → activates every swap line in /etc/fstab (after you add the line)\n\nWithout the fstab line, a reboot drops it. In fstab the trick is: UUID=… swap swap defaults 0 0 (the word swap twice).",
    example: "swapon /dev/sdb2 · swapon --show · swapon -a",
    tldr: { page: "swapon", platform: "linux" },
  },
  {
    term: "vo",
    definition:
      "LV name in the resize lab / video Q15b. Lives in VG vgroup. Path: /dev/vgroup/vo.\n\nTypical video prep: lvcreate -L 180M -n vo vgroup. Then extend to ~230M with lvextend (and -r or resize2fs). In the PDF the target is often ~50 MB with lvresize -r.",
    example: "lvcreate -L 180M -n vo vgroup · lvextend -L 230M -r /dev/vgroup/vo",
    tldr: { page: "lvcreate", platform: "linux" },
  },
  {
    term: "vgroup",
    definition:
      "VG name in the resize lab / video Q15b (different from wgroup in the wshare lab).\n\nVideo prep: vgcreate -s 10M vgroup /dev/sdb. -s 10M = each PE is 10 MB. Then lvcreate -L 180M -n vo vgroup.",
    example: "vgcreate -s 10M vgroup /dev/sdb · vgs",
    tldr: { page: "vgcreate", platform: "linux" },
  },
  {
    term: "crontab",
    definition: "Edits or lists one user's job table. -l lists, -e edits, -r deletes. -u USER, as root, is that account's table. It is not a systemd timer.",
    example: "crontab -l -u erik",
    tldr: { page: "crontab" },
  },
  {
    term: "subnet mask",
    aliases: [
      "netmask",
      "CIDR",
      "/24",
      "255.255.255.0",
      "prefix",
      "prefix length",
    ],
    definition:
      "Says which part of the IP is the network and which part is the host.\n\nTwo ways to write the same common lab/exam mask:\n• CIDR: /24 → the first 24 bits are the network; the last number (.0–.255) is the host.\n• Dotted decimal: 255.255.255.0 → same mask as /24.\n\nExample: 172.16.1.0/24 = the whole 172.16.1.x network (client .12 and server .13). The exam sheet may write 172.24.14.0/255.255.255.0: that is the network plus that mask, not something else.\n\nIn commands you almost always use CIDR: 172.16.1.12/24 in nmcli, allow 172.16.1.0/24 in chrony. You do not need …/255.255.255.0 there.\n\nIt is not always /24: the ticket may ask for /16, /25, etc. Read the sheet.",
    example: "nmcli … ipv4.addresses 172.16.1.12/24 · allow 172.16.1.0/24",
  },
  {
    term: "NTP",
    aliases: ["ntp", "chrony", "chronyd", "chronyc", "chrony.conf"],
    definition:
      "Network Time Protocol: keep machine clocks aligned over the network so they show the same time.\n\nOn RHEL/Rocky the NTP client/server is chrony (chronyd service, config /etc/chrony.conf). You do not need a separate package named ntp.\n\nLab (Q11): the server (172.16.1.13) serves time (allow + firewall ntp service = UDP 123). The client points at that server (server … iburst) and chronyc sources must show that IP, not only localhost.\n\nPersistent = chronyd enabled on both.",
    example: "dnf install -y chrony · allow 172.16.1.0/24 · server 172.16.1.13 iburst · firewall-cmd --add-service=ntp --permanent && firewall-cmd --reload · systemctl enable --now chronyd · chronyc sources -v",
    tldr: { page: "chronyc", platform: "linux" },
  },
  {
    term: "NFS",
    aliases: ["nfs", "nfs-utils", "/etc/exports"],
    definition:
      "Network File System: share a folder from the server so another host can mount it over the network and see it as local.\n\nOn the server: install nfs-utils, write /etc/exports (which folder, to whom, with what options), exportfs -r, enable nfs-server, and open the nfs service in the firewall.\n\nOn the client: nfs-utils too. First showmount -e SERVER_IP. If that fails, autofs or mount will not work.\n\nIt is not the same as autofs: NFS is the share; autofs (or fstab/mount) is how the client mounts it.",
    example: "echo '/home/guests/netuser1 172.16.1.12(rw,sync,no_root_squash)' >> /etc/exports · exportfs -r · showmount -e 172.16.1.13",
    tldr: { page: "exportfs", platform: "linux" },
  },
  {
    term: "autofs",
    aliases: ["automount", "auto.master", "/etc/auto.master", "auto.master.d"],
    definition:
      "Service that mounts a folder only when someone enters the path, and unmounts it after it sits unused for a while.\n\nWhat for?\nNetwork homes or shares (NFS) without leaving them mounted all day in fstab. If the server is down at boot, fstab can hang you; autofs waits until someone hits the path.\n\nHow you set it up (Q08 video / lab)\n1. Map /etc/auto.netdir: netuser1 -rw 172.16.1.13:/home/guests/netuser1 (subdir → host:/export).\n2. Drop-in /etc/auto.master.d/netdir.autofs: /netdir /etc/auto.netdir (base → map). A line in /etc/auto.master also works.\n3. systemctl enable --now autofs.\n\nExample: ls /netdir/netuser1 triggers the mount; mount | grep netuser1 confirms it.\n\nIt does not replace NFS: the server still exports. autofs is only on-demand mounting on the client.\nThe user's UID/GID must match on server and client.\nBefore fighting the map: showmount -e from the client must list the export.",
    example: "printf '%s\\n' 'netuser1 -rw 172.16.1.13:/home/guests/netuser1' > /etc/auto.netdir · printf '%s\\n' '/netdir /etc/auto.netdir' > /etc/auto.master.d/netdir.autofs · systemctl enable --now autofs · ls /netdir/netuser1",
    tldr: { page: "automount", platform: "linux" },
  },
  {
    term: "exportfs",
    definition: "Publishes or reviews what NFS is exporting. -v lists them with the options. -r rereads /etc/exports. Editing the file is not enough: it has to be published.",
    example: "exportfs -v · exportfs -r",
    tldr: { page: "exportfs", platform: "linux" },
  },
  {
    term: "showmount",
    definition: "Asks an NFS server what it exports. -e HOST lists the exports. Use it to check from the client, before mounting.",
    example: "showmount -e server",
    tldr: { page: "showmount", platform: "linux" },
  },
  {
    term: "sed",
    definition:
      "Edits text line by line. -i changes the file. Without -i it only prints. s replaces the first match on each line. ^ requires the start of the line. It is not set: set is a different bash builtin. For hand edits on the exam, vim is usually clearer.",
    example: "sed -n '/Listen/p' /etc/httpd/conf/httpd.conf → prints only the Listen lines, without touching the file",
    tldr: { page: "sed" },
  },
  {
    term: "visudo",
    definition: "Opens sudoers and does not save it if the syntax is wrong. It is the safe editor. Do not edit /etc/sudoers with vim directly: one mistake can leave you without sudo.",
    example: "visudo",
    tldr: { page: "visudo", platform: "linux" },
  },
  {
    term: "chroot",
    definition: "Makes this shell treat another directory as /. In an rd.break rescue, / is the initramfs in memory and the installed disk is mounted at /sysroot. chroot /sysroot enters it, so passwd and touch write to the disk instead of memory. exit leaves, and / is the initramfs again.",
    example: "chroot /sysroot",
    tldr: { page: "chroot" },
  },
];

export function glossaryFor(locale: Locale): GlossaryEntry[] {
  return locale === "en" ? en : es;
}
