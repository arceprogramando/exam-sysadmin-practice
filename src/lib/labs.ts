import type { Locale } from "./i18n";
import { LAB_EN } from "./labs-en";

export const YT_PLAYLIST =
  "https://www.youtube.com/playlist?list=PLzwsIhHG_OdZiC6ugglW4TzjIM8wrJDrt";

export const REDHAT_EXAM_VIDEO = "https://www.youtube.com/watch?v=Me6Y12-sux8";

export const REDHAT_EXAM_VIDEO_TITLE = "video público sobre el formato del examen";

export const LAB_REPO = "https://github.com/nbaud/rhcsa_lab";

/** Videos de la playlist de práctica, en ese orden. */
const yt = (id: string) => `https://www.youtube.com/watch?v=${id}`;

const YT = {
  vagrant9: yt("wQkpSwSzp5k"),
  vagrant10: yt("hMUA_hCIFJQ"),
  nmtui: yt("fhrYQwGrjZw"),
  nmcli: yt("BMRXlUFAOA8"),
  repos: yt("PrJT4y1sk-g"),
  reposLocal: yt("Z_ajOZjmYTM"),
  selinuxPort: yt("71BWFUvLXZI"),
  users: yt("iy3YU6IDQAc"),
  setgid: yt("CYdEgCMUz-Q"),
  cron: yt("zwH-noYukwI"),
  autofs: yt("N3eZMi4I3oY"),
  tar: yt("CqpUq__LBJ0"),
  acl: yt("JFY-XyATtR8"),
  chrony: yt("TvQWBDA7qHQ"),
  find: yt("OjKxQYuItxY"),
  grep: yt("vVeZENoGrS8"),
  uid: yt("Mg3OdomnoJo"),
  lvmCreate: yt("YIDlpaz2FGQ"),
  lvmExtend: yt("wHeBnPtMroY"),
  swap: yt("60CPUPN2cYo"),
  lvmResize: yt("pEsAZjsdFQc"),
  tuned: yt("I1f0NMoY1eQ"),
  loginUser: yt("ZUI1-zr6N8M"),
  loginAll: yt("LV6C2bOxIvE"),
  podmanRegistry: yt("eIyivl1AvpA"),
  podmanPull: yt("OnEKJlzJEv4"),
  podmanSystemd: yt("ln_rtv3oDfE"),
  rootRdBreak: yt("y7Qy9MiIzAc"),
  rootInitBash: yt("nbt5adKvn9M"),
  flatpak: yt("K426-l3Ji4U"),
  flatpakReview: `${yt("l3Sj-ZBysFU")}&t=199s`,
  scripting: yt("81wAczPBcOQ"),
  timers: yt("01sICGFsS2k"),
  selinuxFtp: yt("3mYwqNE5at8"),
  harunaTools: yt("Nf5Q1kMw6cM"),
  harunaSystems: yt("aeDBzawCJiI"),
  harunaDeploy: yt("Lb70UqXPmJs"),
  harunaUsers: yt("VzyppUlTXFs"),
  harunaSecurity: yt("Ks82UfTHEw8"),
} as const;

export interface LabVideo {
  title: string;
  url: string;
}

export interface LabCommand {
  cmd: string;
  why: string;
  /** Quién ejecuta el comando: root, felipe, consola VM, etc. */
  as?: string;
  /** Same id = mutually exclusive alternatives; pick one. */
  orGroup?: string;
  /** Short label next to Opción N, e.g. cp --parents */
  orName?: string;
  /** Optional aside. A small mark on this command; the text shows on hover. */
  slip?: string;
}

export type Edition = "v10" | "v9";

const PODMAN_IDS = new Set(["lab-20", "lab-21", "lab-22"]);
const FLATPAK_IDS = new Set(["extra-04", "extra-05"]);
const EDITION_KEY = "arceprog:rhcsa-edition";

export function loadEdition(): Edition {
  if (typeof localStorage === "undefined") return "v10";
  return localStorage.getItem(EDITION_KEY) === "v9" ? "v9" : "v10";
}

export function saveEdition(edition: Edition): void {
  localStorage.setItem(EDITION_KEY, edition);
}

/** v10: Flatpak in the main list, Podman in extras. v9 keeps the original tracks. */
export function trackFor(lab: Lab, edition: Edition): Lab["track"] {
  if (edition === "v10" && PODMAN_IDS.has(lab.id)) return "extra";
  if (edition === "v10" && FLATPAK_IDS.has(lab.id)) return "pdf";
  return lab.track;
}

/** The container topic that is not the one you are practicing. It stays visible as an extra and does not count as missing. */
export function isOffEdition(labId: string, edition: Edition): boolean {
  return edition === "v10" ? PODMAN_IDS.has(labId) : FLATPAK_IDS.has(labId);
}

function machineRank(where: string): number {
  const text = where.toLowerCase();
  const client = text.includes("client");
  const server = text.includes("server");
  if (client && server) return 2;
  if (server) return 1;
  return 0;
}

/** Number on the practice list. 01, 02, 03 down the client block, then the server, then both machines, then extras. The keyboard setup stays 00. */
export function labCode(id: string, edition: Edition = loadEdition()): string {
  if (id === "setup-keyboard") return "00";
  const ranked = LABS.filter((lab) => lab.id !== "setup-keyboard").map((lab) => ({
    id: lab.id,
    track: trackFor(lab, edition),
    rank: machineRank(lab.where),
  }));
  const pdf = ranked.filter((item) => item.track === "pdf").sort((a, b) => a.rank - b.rank);
  const extras = ranked.filter((item) => item.track === "extra");
  const index = [...pdf, ...extras].findIndex((item) => item.id === id);
  if (index < 0) return id;
  return String(index + 1).padStart(2, "0");
}

export interface Lab {
  id: string;
  track: "pdf" | "extra" | "setup";
  title: string;
  /** Situación del lab, en una o dos frases. */
  story?: string;
  objective: string[];
  where: string;
  steps: string[];
  note?: string;
  help: {
    tip: string;
    videoHint: string;
    videos: LabVideo[];
    commands: LabCommand[];
  };
}

export const LABS: Lab[] = [
  {
    id: "setup-keyboard",
    track: "setup",
    title: "El teclado de la consola no coincide",
    story: "En la ventana de la máquina virtual las teclas no salen como las ves. En el cliente se puede pasar al latinoamericano. En el servidor hay que dejar el de Estados Unidos, porque el rescate se escribe ahí.",
    objective: [
      "En vagrant ssh el teclado lo pone tu máquina.",
      "En el client podés pasar a latam / la-latin1 para la consola de la VM.",
      "En el server dejá el teclado en us.",
    ],
    where: "client · vagrant ssh. El server se deja en us",
    steps: [
      "Esta ventana de vagrant ssh usa el teclado de tu máquina. Aunque localectl status diga us, acá escribís en español.",
      "Si vas a escribir en la ventana de VirtualBox del client: sudo localectl set-x11-keymap latam y sudo localectl set-keymap la-latin1. Si solo entrás por SSH, podés dejarlo en us.",
      "En el server no corras esos dos. El rescate se escribe en la consola de esa VM y arranca en us.",
    ],
    help: {
      tip: "En vagrant ssh escribís con el teclado de tu máquina. El us molesta en la consola de la VM: la ventana de VirtualBox, GRUB o init=/bin/bash. Ahí, si VC Keymap es us, la tecla que ves no es la letra que sale.",
      videoHint: "El teclado no tiene video propio. Estos son los de armar la VM con Vagrant (Rocky 9 y Rocky 10).",
      videos: [
        { title: "Lab 00a: Vagrant y VirtualBox (Rocky 9)", url: YT.vagrant9 },
        { title: "Lab 00b: Vagrantfile para Rocky 10", url: YT.vagrant10 },
      ],
      commands: [
        { cmd: "localectl --help", why: "Lista los comandos. No hay get ni set. Para ver lo que está puesto se usa status. Para cambiar, los que empiezan con set-. Esos piden sudo.", as: "root" },
        { cmd: "man localectl", why: "La misma lista, con la explicación de cada argumento. set-keymap es la consola. set-x11-keymap es el gráfico.", as: "root" },
        { cmd: "localectl status", why: "VC Keymap es la consola de la VM. X11 Layout es el gráfico. unset quiere decir que no hay uno configurado. Ninguno de los dos cambia lo que escribís en vagrant ssh.", as: "consola VM" },
        { cmd: "localectl list-x11-keymap-layouts", why: "Teclados gráficos. us es inglés de Estados Unidos. latam es latinoamericano.", as: "root" },
        { cmd: "localectl list-keymaps", why: "Teclados de la consola. El latinoamericano acá se llama la-latin1, no latam.", as: "root" },
        { cmd: "sudo localectl set-x11-keymap latam", why: "Cambia el gráfico de la VM. Esta SSH no lo usa. X11 Layout unset es normal si nunca se configuró. No lo hagas en el server.", as: "root" },
        { cmd: "sudo localectl set-keymap la-latin1", why: "Cambia la consola de la VM, no esta SSH. Sirve si escribís en la ventana de VirtualBox. En el server no lo hagas: el rescate se escribe ahí.", as: "consola VM" },
        { cmd: "cat /etc/vconsole.conf", why: "KEYMAP es el que puede cargar la consola al boot. En el server tiene que seguir en us.", as: "root" },
      ],
    },
  },
  {
    id: "lab-01-root-client",
    track: "pdf",
    title: "El cliente olvidó la contraseña de root",
    story: "Tuvimos un percance. Esta máquina la configuró un antiguo empleado que renunció, perdimos la comunicación y la necesitamos urgente para seguir con las configuraciones.",
    objective: [
      "Reset de la contraseña de root en el client.",
      "Nueva contraseña: student.",
      "SELinux coherente antes del boot normal.",
    ],
    where: "client",
    steps: [
      "Interrumpí el boot del client y recuperá el acceso de root.",
      "Poné la contraseña de root en student (las dos veces iguales).",
      "SELinux tiene que quedar coherente antes de volver al boot normal (autorelabel si hace falta).",
    ],
    note: "Es el mismo rescate que en el server, también con password student. Practicá los dos. A mí me funcionó init=/bin/bash. rd.break puede no armar /sysroot en v10.",
    help: {
      tip: "Esto se hace en la ventana de la VM del client. SSH no sirve: no hay forma de editar GRUB desde afuera. En passwd escribí student dos veces. Si no coinciden, dice passwords do not match. Authentication token manipulation error también sale si el disco sigue en solo lectura.",
      videoHint: "Q22b es init=/bin/bash, el que me funcionó. Q22a es rd.break y puede no funcionar en v10.",
      videos: [
        { title: "Q22b: Reset de root (init=/bin/bash)", url: YT.rootInitBash },
        { title: "Q22a: Reset de root (rd.break)", url: YT.rootRdBreak },
      ],
      commands: [
        { cmd: "En GRUB: tecla e, al final de la línea que empieza con linux, agregar init=/bin/bash. Ctrl-x para arrancar.", why: "Es el que me funcionó. Q22b. La raíz queda en /, no en /sysroot.", as: "consola VM", orGroup: "root-rescue", orName: "init=/bin/bash" },
        { cmd: "mount -o remount,rw /", why: "Acá la raíz es /, no /sysroot. Arranca solo lectura. Sin este remount, passwd no puede guardar la contraseña.", as: "root", orGroup: "root-rescue", orName: "init=/bin/bash" },
        { cmd: "passwd", why: "Pide la contraseña dos veces: las dos tienen que ser student. No hace falta escribir root: en este shell ya sos root.", as: "root", orGroup: "root-rescue", orName: "init=/bin/bash" },
        { cmd: "touch /.autorelabel", why: "La línea del enunciado «SELinux coherente antes del boot normal» es este comando. No hay otro paso para esa frase. passwd toca /etc/shadow desde este shell y el archivo puede quedar con una etiqueta que SELinux no acepta. Este archivo vacío hace que el próximo boot reetiquete el disco antes de arrancar normal. Sin eso, en enforcing nadie puede entrar, ni root con la clave nueva. Ese primer arranque tarda más.", as: "root", orGroup: "root-rescue", orName: "init=/bin/bash" },
        { cmd: "sync", why: "Baja a disco lo que todavía está en memoria, antes de cortar.", as: "root", orGroup: "root-rescue", orName: "init=/bin/bash" },
        { cmd: "exec /sbin/reboot -f", why: "Reinicia ya. El -f no se saca. En este arranque bash es el proceso 1 y no hay systemd. Sin -f, reboot pide el cierre normal y mata ese proceso 1. El kernel se queda en Kernel panic - not syncing: Attempted to kill init. No vuelve el shell: reset de la VM. exec reemplaza el shell para que el reinicio ocupe ese proceso 1. exit hace el mismo panic. La edición de GRUB era solo de ese arranque.", as: "root", orGroup: "root-rescue", orName: "init=/bin/bash" },
        { cmd: "En GRUB: tecla e, al final de la línea que empieza con linux, agregar rd.break. Ctrl-x para arrancar.", why: "Es el otro video, Q22a. Puede no funcionar en v10. Si /sysroot no existe, volvé a la opción 1.", as: "consola VM", orGroup: "root-rescue", orName: "rd.break" },
        { cmd: "mount -o remount,rw /sysroot", why: "Pone escribible el sistema que rd.break dejó en /sysroot. Si dice que /sysroot no existe, este método no entró. Ahí se vuelve a la opción 1.", as: "root", orGroup: "root-rescue", orName: "rd.break" },
        { cmd: "chroot /sysroot", why: "rd.break para en el initramfs. En ese shell, / es un sistema chico que vive en memoria y se pierde al reiniciar. El disco instalado está montado al lado, en /sysroot: ahí están el /etc/shadow de verdad y la raíz donde tiene que quedar /.autorelabel. passwd y touch escriben rutas que arrancan en /. Sin este chroot, passwd cambia el shadow de la memoria (el de afuera dice all authentication tokens updated successfully y no queda nada) y touch crea /.autorelabel en esa misma memoria. El próximo boot no ve ninguno de los dos. chroot /sysroot hace que este shell tome /sysroot como /. El prompt cambia. Desde ahí, /etc/shadow es el del disco y /.autorelabel cae en la raíz que va a bootear. exit vuelve al shell de afuera, donde / otra vez es el initramfs.", as: "root", orGroup: "root-rescue", orName: "rd.break" },
        { cmd: "passwd", why: "Otra vez student dos veces, iguales.", as: "root", orGroup: "root-rescue", orName: "rd.break" },
        { cmd: "touch /.autorelabel", why: "La línea del enunciado «SELinux coherente antes del boot normal» es este comando. No hay otro paso para esa frase. passwd toca /etc/shadow y puede dejarle una etiqueta que SELinux no acepta. Sin este archivo, el boot normal en enforcing no deja entrar a nadie. El primer arranque reetiqueta el disco y tarda más.", as: "root", orGroup: "root-rescue", orName: "rd.break" },
        { cmd: "exit", why: "Sale del chroot y vuelve al shell de rd.break.", as: "root", orGroup: "root-rescue", orName: "rd.break" },
        { cmd: "reboot", why: "Sigue el boot. En el video de rd.break el orden es exit y después reboot.", as: "root", orGroup: "root-rescue", orName: "rd.break" },
      ],
    },
  },
  {
    id: "lab-grub",
    track: "pdf",
    title: "El menú de arranque se queda demasiado tiempo",
    story: "Roman reinició el client y el menú de arranque se quedó en pantalla más de lo que Operaciones tolera.\n\nNecesitamos que espere 10 segundos, que el menú no quede a la vista y que el kernel arranque con quiet. Tiene que seguir así después de otro reboot.",
    objective: [
      "GRUB_TIMEOUT=10.",
      "GRUB_TIMEOUT_STYLE=hidden.",
      "quiet en la línea del kernel.",
      "Aplicado al grub.cfg.",
    ],
    where: "client",
    steps: [
      "En el client, editá /etc/default/grub.",
      "Timeout 10 y estilo hidden.",
      "La línea del kernel tiene que incluir quiet.",
      "Regenerá grub.cfg. No alcanza con guardar el archivo.",
    ],
    note: "Va después del rescate de root: los dos tocan el arranque. El rescate edita GRUB una sola vez. Este cambio queda en disco.",
    help: {
      tip: "El archivo que se edita es /etc/default/grub. grub.cfg no se edita a mano: se regenera con grub2-mkconfig.\nSi /sys/firmware/efi no existe, la salida es /boot/grub2/grub.cfg. Si existe, en Rocky suele ser /boot/efi/EFI/rocky/grub.cfg.",
      videoHint: "Está en la playlist del otro repo, parte 6. El video recorre varias tareas de deploy; esta es la de GRUB (timeout, hidden y quiet).",
      videos: [{ title: "Parte 6: GRUB", url: YT.harunaDeploy }],
      commands: [
        { cmd: "ls /sys/firmware/efi", why: "Si dice que no existe, la máquina es BIOS: el cfg es /boot/grub2/grub.cfg. Si lista archivos, es UEFI.", as: "root" },
        { cmd: "grep -E '^GRUB_TIMEOUT|^GRUB_TIMEOUT_STYLE|^GRUB_CMDLINE_LINUX=' /etc/default/grub", why: "Ver el timeout, el estilo y la línea del kernel antes de cambiarlos.", as: "root" },
        { cmd: "vim /etc/default/grub", why: "Dejá GRUB_TIMEOUT=10 y GRUB_TIMEOUT_STYLE=hidden.\nEn GRUB_CMDLINE_LINUX= tiene que aparecer quiet, junto a lo que ya estaba (rhgb se puede dejar). No borres el resto de la línea.", as: "root" },
        { cmd: "grub2-mkconfig -o /boot/grub2/grub.cfg", why: "BIOS. Escribe el menú real. Sin este comando, /etc/default/grub cambió y el próximo boot sigue igual.", as: "root", orGroup: "grub-out", orName: "BIOS" },
        { cmd: "grub2-mkconfig -o /boot/efi/EFI/rocky/grub.cfg", why: "UEFI en Rocky. Misma idea, otro archivo de salida. Si la carpeta no existe, no es este caso.", as: "root", orGroup: "grub-out", orName: "UEFI" },
        { cmd: "grep -E 'timeout|quiet' /boot/grub2/grub.cfg | head", why: "Comprobar que el cfg regenerado menciona el timeout y quiet. En UEFI mirá el cfg de EFI.", as: "root" },
      ],
    },
  },
  {
    id: "lab-01",
    track: "pdf",
    title: "Hay que nombrar al cliente y sacarlo de la red principal",
    story: "Necesitamos conectar dos computadoras fuera de la red principal. Esta es la máquina cliente: hay que ponerle nombre y configurarle la dirección, la puerta de enlace y el DNS.",
    objective: [
      "IP 172.16.1.12/24 en la interfaz del lab.",
      "Gateway 172.16.1.1 y DNS 172.16.1.1.",
      "Hostname client.linux.lab.",
      "Persistente tras reboot.",
    ],
    where: "client",
    steps: [
      "IP 172.16.1.12/24 en la interfaz del lab (enp0s8).",
      "Gateway 172.16.1.1 y DNS 172.16.1.1.",
      "Hostname client.linux.lab.",
      "Todo persistente. Después de reboot, nmcli y hostnamectl tienen que mostrar lo mismo.",
    ],
    note: "Vagrant arranca el client como node-a.lab y deja enp0s8 sin IP. El lab pide client.linux.lab y 172.16.1.12/24.",
    help: {
      tip: "En el examen se edita el perfil que ya existe, no se crea otro encima. El nombre para el comando es la columna NAME, no la placa. En una salida donde DEVICE enp0s8 está en la fila hostonly, el modify usa hostonly. enp0s3 es la NAT de Vagrant (suele tener 10.0.2.15): no la pases a manual. lo es la máquina hablándose a sí misma: no se toca.",
      videoHint: "Q01a es nmtui. Q01b es nmcli y hostnamectl. Los dos hacen la misma red.",
      videos: [
        { title: "Q01a: Red con nmtui", url: YT.nmtui },
        { title: "Q01b: Red con nmcli y hostnamectl", url: YT.nmcli },
      ],
      commands: [
        { cmd: "nmcli connection show", why: "No cambia nada. Lista los perfiles guardados, una fila por perfil. NAME es el nombre que vas a escribir en el modify: puede no coincidir con la placa. DEVICE es la placa que ese perfil está usando ahora. Si ves enp0s3 y enp0s8, no se elige el primero: se elige la fila cuyo DEVICE es la placa del lab. En el ejemplo, DEVICE enp0s8 está en la fila cuyo NAME es hostonly, así que el comando usa hostonly. lo es el loopback, la máquina consigo misma. Esa fila no se edita. Tab no hace falta para esto. Si al apretarlo salen archivos de la carpeta, el shell no tiene cargadas las palabras de nmcli. En el examen no se instala nada para arreglarlo: el nombre se copia de la columna NAME.", as: "root" },
        { cmd: "ip -br a", why: "Para saber cuál placa es la del lab, antes de cambiar nada. El nombre enp0s3 o enp0s8 no dice el rol: es el orden en que VirtualBox enchufó las placas. La que ya tiene 10.0.2.15 es la entrada, la NAT. No se pasa a manual. La otra ethernet es la del lab: en este Vagrant suele ser enp0s8 y arranca sin dirección. Esa palabra se busca en la columna DEVICE de connection show. La NAME de esa misma fila es la que se modifica. lo es la máquina consigo misma: no se toca.", as: "root" },
        { cmd: "nmtui", why: "En la conexión de enp0s8: IPv4 en Manual, Address 172.16.1.12/24, Gateway 172.16.1.1 y, en DNS servers, Add 172.16.1.1. Si dice <Add...>, el DNS no está puesto.", as: "root", orGroup: "net-set", orName: "nmtui" },
        { cmd: "nmcli connection modify NOMBRE ipv4.method manual ipv4.addresses 172.16.1.12/24 ipv4.gateway 172.16.1.1 ipv4.dns 172.16.1.1", why: "NOMBRE es la columna NAME de la fila del lab, no la placa. Si esa fila dice hostonly y DEVICE enp0s8, el comando es modify hostonly. Guarda la IP, el gateway y el DNS en ese perfil. ipv4.dns es el pedazo que anota el DNS. Sin eso, el DNS no queda. sudo hace falta si el prompt es vagrant@. Si ya es root@, sudo no suma nada.", as: "root", orGroup: "net-set", orName: "nmcli" },
        { cmd: "restorecon -v /etc/NetworkManager/system-connections/NOMBRE.nmconnection", why: "No es un paso de siempre. Solo si el modify anterior dice Permission denied al renombrar el .nmconnection, aunque el prompt ya sea root@. El archivo se llama como la columna NAME: si el perfil es hostonly, el archivo es hostonly.nmconnection. SELinux no deja que NetworkManager lo reemplace. Este comando no guarda el DNS. Corrige la etiqueta y, si hacía falta, avisa Relabeled. Después se vuelve a correr el modify.", as: "root" },
        { cmd: "nmcli -f ipv4.dns connection show NOMBRE", why: "No cambia nada. NOMBRE es otra vez la columna NAME, por ejemplo hostonly. Muestra solo el DNS guardado en ese perfil. Si quedó, la línea dice ipv4.dns: 172.16.1.1. Si sale vacío, no quedó. ip a no muestra el DNS.", as: "root" },
        { cmd: "nmcli connection up NOMBRE", why: "Aplica ahora lo que el modify ya guardó en ese perfil. No es lo que lo hace persistente: el modify ya lo escribió en disco. up sirve para no esperar al reboot. NOMBRE sigue siendo la columna NAME.", slip: "Me pasó: el perfil quedó bien y activé enp0s3 en vez de enp0s8. Por eso la IP seguía igual.", as: "root" },
        { cmd: "hostnamectl set-hostname client.linux.lab", why: "Cambia el hostname ya, y lo guarda. No hace falta nmcli connection up ni ningún otro up: el hostname no es parte del perfil de red. Después de un reboot, hostnamectl tiene que seguir diciendo client.linux.lab.", as: "root" },
        { cmd: "man nmcli", why: "En el examen esto es legal. Buscá connection modify.", as: "root" },
      ],
    },
  },
  {
    id: "lab-02-root-server",
    track: "pdf",
    title: "El servidor olvidó la contraseña de root",
    story: "El mismo percance, en la otra máquina. El empleado se fue y nadie puede entrar como root. Hay que recuperar el servidor para seguir trabajando.",
    objective: [
      "Reset de la contraseña de root en el server.",
      "Nueva contraseña: student.",
      "SELinux coherente antes del boot normal.",
    ],
    where: "server",
    steps: [
      "Interrumpí el boot del server y recuperá el acceso de root.",
      "Poné la contraseña de root en student (las dos veces iguales).",
      "SELinux tiene que quedar coherente antes de volver al boot normal (autorelabel si hace falta).",
    ],
    note: "Es el mismo rescate que en el client, también con password student. Practicá los dos. A mí me funcionó init=/bin/bash. rd.break puede no armar /sysroot en v10.",
    help: {
      tip: "Esto se hace en la ventana de la VM del server. SSH no sirve: no hay forma de editar GRUB desde afuera. En passwd escribí student dos veces. Si no coinciden, dice passwords do not match. Authentication token manipulation error también sale si el disco sigue en solo lectura.",
      videoHint: "Q22b es init=/bin/bash, el que me funcionó. Q22a es rd.break y puede no funcionar en v10.",
      videos: [
        { title: "Q22b: Reset de root (init=/bin/bash)", url: YT.rootInitBash },
        { title: "Q22a: Reset de root (rd.break)", url: YT.rootRdBreak },
      ],
      commands: [
        { cmd: "En GRUB: tecla e, al final de la línea que empieza con linux, agregar init=/bin/bash. Ctrl-x para arrancar.", why: "Es el que me funcionó. Q22b. La raíz queda en /, no en /sysroot.", as: "consola VM", orGroup: "root-rescue", orName: "init=/bin/bash" },
        { cmd: "mount -o remount,rw /", why: "Acá la raíz es /, no /sysroot. Arranca solo lectura. Sin este remount, passwd no puede guardar la contraseña.", as: "root", orGroup: "root-rescue", orName: "init=/bin/bash" },
        { cmd: "passwd", why: "Pide la contraseña dos veces: las dos tienen que ser student. No hace falta escribir root: en este shell ya sos root.", as: "root", orGroup: "root-rescue", orName: "init=/bin/bash" },
        { cmd: "touch /.autorelabel", why: "La línea del enunciado «SELinux coherente antes del boot normal» es este comando. No hay otro paso para esa frase. passwd toca /etc/shadow desde este shell y el archivo puede quedar con una etiqueta que SELinux no acepta. Este archivo vacío hace que el próximo boot reetiquete el disco antes de arrancar normal. Sin eso, en enforcing nadie puede entrar, ni root con la clave nueva. Ese primer arranque tarda más.", as: "root", orGroup: "root-rescue", orName: "init=/bin/bash" },
        { cmd: "sync", why: "Baja a disco lo que todavía está en memoria, antes de cortar.", as: "root", orGroup: "root-rescue", orName: "init=/bin/bash" },
        { cmd: "exec /sbin/reboot -f", why: "Reinicia ya. El -f no se saca. En este arranque bash es el proceso 1 y no hay systemd. Sin -f, reboot pide el cierre normal y mata ese proceso 1. El kernel se queda en Kernel panic - not syncing: Attempted to kill init. No vuelve el shell: reset de la VM. exec reemplaza el shell para que el reinicio ocupe ese proceso 1. exit hace el mismo panic. La edición de GRUB era solo de ese arranque.", as: "root", orGroup: "root-rescue", orName: "init=/bin/bash" },
        { cmd: "En GRUB: tecla e, al final de la línea que empieza con linux, agregar rd.break. Ctrl-x para arrancar.", why: "Es el otro video, Q22a. Puede no funcionar en v10. Si /sysroot no existe, volvé a la opción 1.", as: "consola VM", orGroup: "root-rescue", orName: "rd.break" },
        { cmd: "mount -o remount,rw /sysroot", why: "Pone escribible el sistema que rd.break dejó en /sysroot. Si dice que /sysroot no existe, este método no entró. Ahí se vuelve a la opción 1.", as: "root", orGroup: "root-rescue", orName: "rd.break" },
        { cmd: "chroot /sysroot", why: "rd.break para en el initramfs. En ese shell, / es un sistema chico que vive en memoria y se pierde al reiniciar. El disco instalado está montado al lado, en /sysroot: ahí están el /etc/shadow de verdad y la raíz donde tiene que quedar /.autorelabel. passwd y touch escriben rutas que arrancan en /. Sin este chroot, passwd cambia el shadow de la memoria (el de afuera dice all authentication tokens updated successfully y no queda nada) y touch crea /.autorelabel en esa misma memoria. El próximo boot no ve ninguno de los dos. chroot /sysroot hace que este shell tome /sysroot como /. El prompt cambia. Desde ahí, /etc/shadow es el del disco y /.autorelabel cae en la raíz que va a bootear. exit vuelve al shell de afuera, donde / otra vez es el initramfs.", as: "root", orGroup: "root-rescue", orName: "rd.break" },
        { cmd: "passwd", why: "Otra vez student dos veces, iguales.", as: "root", orGroup: "root-rescue", orName: "rd.break" },
        { cmd: "touch /.autorelabel", why: "La línea del enunciado «SELinux coherente antes del boot normal» es este comando. No hay otro paso para esa frase. passwd toca /etc/shadow y puede dejarle una etiqueta que SELinux no acepta. Sin este archivo, el boot normal en enforcing no deja entrar a nadie. El primer arranque reetiqueta el disco y tarda más.", as: "root", orGroup: "root-rescue", orName: "rd.break" },
        { cmd: "exit", why: "Sale del chroot y vuelve al shell de rd.break.", as: "root", orGroup: "root-rescue", orName: "rd.break" },
        { cmd: "reboot", why: "Sigue el boot. En el video de rd.break el orden es exit y después reboot.", as: "root", orGroup: "root-rescue", orName: "rd.break" },
      ],
    },
  },
  {
    id: "lab-02",
    track: "pdf",
    title: "Hay que nombrar al servidor y sacarlo de la red principal",
    story: "La otra computadora del par. Es el servidor: hay que ponerle nombre y la dirección de esta red, para que el cliente pueda llegar.",
    objective: [
      "IP 172.16.1.13/24 en la interfaz del lab.",
      "Gateway 172.16.1.1 y DNS 172.16.1.1.",
      "Hostname server.linux.lab.",
      "Persistente tras reboot.",
    ],
    where: "server",
    steps: [
      "IP 172.16.1.13/24 en la interfaz del lab (enp0s8).",
      "Gateway 172.16.1.1 y DNS 172.16.1.1.",
      "Hostname server.linux.lab.",
      "Todo persistente. Después de reboot, nmcli y hostnamectl tienen que mostrar lo mismo.",
    ],
    note: "Vagrant arranca el server como node-b.lab y deja enp0s8 sin IP. El lab pide server.linux.lab y 172.16.1.13/24. El rescate de root está en el lab anterior, con password student.",
    help: {
      tip: "En el examen se edita el perfil que ya existe, no se crea otro encima. El nombre para el comando es la columna NAME, no la placa. En una salida donde DEVICE enp0s8 está en la fila hostonly, el modify usa hostonly. enp0s3 es la NAT de Vagrant (suele tener 10.0.2.15): no la pases a manual. lo es la máquina hablándose a sí misma: no se toca.",
      videoHint: "Q01a es nmtui. Q01b es nmcli y hostnamectl. Los dos hacen la misma red. Es la misma tarea que en el client, con la IP y el hostname del server.",
      videos: [
        { title: "Q01a: Red con nmtui", url: YT.nmtui },
        { title: "Q01b: Red con nmcli y hostnamectl", url: YT.nmcli },
      ],
      commands: [
        { cmd: "nmcli connection show", why: "No cambia nada. Lista los perfiles guardados, una fila por perfil. NAME es el nombre que vas a escribir en el modify: puede no coincidir con la placa. DEVICE es la placa que ese perfil está usando ahora. Si ves enp0s3 y enp0s8, no se elige el primero: se elige la fila cuyo DEVICE es la placa del lab. En el ejemplo, DEVICE enp0s8 está en la fila cuyo NAME es hostonly, así que el comando usa hostonly. lo es el loopback, la máquina consigo misma. Esa fila no se edita. Tab no hace falta para esto. Si al apretarlo salen archivos de la carpeta, el shell no tiene cargadas las palabras de nmcli. En el examen no se instala nada para arreglarlo: el nombre se copia de la columna NAME.", as: "root" },
        { cmd: "ip -br a", why: "Para saber cuál placa es la del lab, antes de cambiar nada. El nombre enp0s3 o enp0s8 no dice el rol: es el orden en que VirtualBox enchufó las placas. La que ya tiene 10.0.2.15 es la entrada, la NAT. No se pasa a manual. La otra ethernet es la del lab: en este Vagrant suele ser enp0s8 y arranca sin dirección. Esa palabra se busca en la columna DEVICE de connection show. La NAME de esa misma fila es la que se modifica. lo es la máquina consigo misma: no se toca.", as: "root" },
        { cmd: "nmtui", why: "En la conexión de enp0s8: IPv4 en Manual, Address 172.16.1.13/24, Gateway 172.16.1.1 y, en DNS servers, Add 172.16.1.1. Si dice <Add...>, el DNS no está puesto.", as: "root", orGroup: "net-set", orName: "nmtui" },
        { cmd: "nmcli connection modify NOMBRE ipv4.method manual ipv4.addresses 172.16.1.13/24 ipv4.gateway 172.16.1.1 ipv4.dns 172.16.1.1", why: "NOMBRE es la columna NAME de la fila del lab, no la placa. Si esa fila dice hostonly y DEVICE enp0s8, el comando es modify hostonly. Guarda la IP, el gateway y el DNS en ese perfil. ipv4.dns es el pedazo que anota el DNS. Sin eso, el DNS no queda. sudo hace falta si el prompt es vagrant@. Si ya es root@, sudo no suma nada.", as: "root", orGroup: "net-set", orName: "nmcli" },
        { cmd: "restorecon -v /etc/NetworkManager/system-connections/NOMBRE.nmconnection", why: "No es un paso de siempre. Solo si el modify anterior dice Permission denied al renombrar el .nmconnection, aunque el prompt ya sea root@. El archivo se llama como la columna NAME: si el perfil es hostonly, el archivo es hostonly.nmconnection. SELinux no deja que NetworkManager lo reemplace. Este comando no guarda el DNS. Corrige la etiqueta y, si hacía falta, avisa Relabeled. Después se vuelve a correr el modify.", as: "root" },
        { cmd: "nmcli -f ipv4.dns connection show NOMBRE", why: "No cambia nada. NOMBRE es otra vez la columna NAME, por ejemplo hostonly. Muestra solo el DNS guardado en ese perfil. Si quedó, la línea dice ipv4.dns: 172.16.1.1. Si sale vacío, no quedó. ip a no muestra el DNS.", as: "root" },
        { cmd: "nmcli connection up NOMBRE", why: "Aplica ahora lo que el modify ya guardó en ese perfil. No es lo que lo hace persistente: el modify ya lo escribió en disco. up sirve para no esperar al reboot. NOMBRE sigue siendo la columna NAME.", slip: "Me pasó: el perfil quedó bien y activé enp0s3 en vez de enp0s8. Por eso la IP seguía igual.", as: "root" },
        { cmd: "hostnamectl set-hostname server.linux.lab", why: "Cambia el hostname ya, y lo guarda. No hace falta nmcli connection up ni ningún otro up: el hostname no es parte del perfil de red. Después de un reboot, hostnamectl tiene que seguir diciendo server.linux.lab.", as: "root" },
        { cmd: "man nmcli", why: "En el examen esto es legal. Buscá connection modify.", as: "root" },
      ],
    },
  },
  {
    id: "lab-ssh-key",
    track: "pdf",
    title: "Roman tiene que entrar al server sin escribir la clave",
    story: "A Roman le pidieron un chequeo que corre desde el client contra el server.\n\nCada vez que entra como root le piden la contraseña y el script se traba. Necesitamos una llave: el client se presenta solo y el server lo deja pasar.",
    objective: [
      "Llave de root en el client.",
      "La pública queda autorizada en el server.",
      "ssh root@172.16.1.13 entra sin contraseña.",
    ],
    where: "server",
    steps: [
      "Antes: las dos máquinas con IP (labs de red). La llave se crea en el client.",
      "Generar la llave de root en el client, sin passphrase.",
      "Copiar la pública al root del server (172.16.1.13).",
      "Probar desde el client: entra sin pedir clave.",
    ],
    note: "En la lista va en server porque hace falta tener las dos máquinas. El ssh-keygen es en el client.",
    help: {
      tip: "La privada no se copia. Se copia la .pub, y queda en /root/.ssh/authorized_keys del server.",
      videoHint: "Está en la playlist del otro repo, parte 9. El video es de seguridad; esta tarea es la llave de root de una máquina a la otra.",
      videos: [{ title: "Parte 9: llave SSH", url: YT.harunaSecurity }],
      commands: [
        { cmd: "ssh-keygen -t ed25519 -N '' -f /root/.ssh/id_ed25519", why: "Client. Crea la pareja. -N '' es sin passphrase: si no, el script igual pide algo. Si dice que ya existe, no la pises.", as: "root" },
        { cmd: "ssh-copy-id -i /root/.ssh/id_ed25519.pub root@172.16.1.13", why: "Client. Pide la contraseña de root del server una vez y agrega la pública a authorized_keys.", as: "root" },
        { cmd: "ssh root@172.16.1.13", why: "Client. Tiene que entrar sin pedir contraseña. El prompt es el del server.", as: "root" },
      ],
    },
  },
  {
    id: "lab-11",
    track: "pdf",
    title: "Las dos máquinas no marcan la misma hora",
    story: "El reloj del servidor y el del cliente tienen que quedar alineados, y seguir así después de reiniciar.",
    objective: [
      "Server 172.16.1.13 ofrece NTP.",
      "Client 172.16.1.12 sincroniza contra ese server.",
      "Persistente en las dos.",
    ],
    where: "server",
    steps: [
      "Antes: repos DNF ok en cada máquina donde instales chrony (lab Repositorios DNF).",
      "El server (172.16.1.13) tiene que responder NTP.",
      "El client (172.16.1.12) usa ese server como fuente.",
      "Persistente en los dos.",
    ],
    help: {
      tip: "Igual configurás las dos máquinas; en la lista va en server, después del reset de root y de la red. allow en el server y el firewall van juntos. chronyc sources en el client tiene que mostrar 172.16.1.13, no solo localhost.",
      videoHint: "Video de este lab: Q11.",
      videos: [{ title: "Q11: chrony / NTP", url: YT.chrony }],
      commands: [
        { cmd: "dnf repolist && dnf install -y chrony", why: "En cada VM donde falte chrony: primero repos en ESA máquina, después install.", as: "root" },
        { cmd: "man chrony.conf", why: "allow en el server, pool o server en el client.", as: "root" },
        { cmd: "server 172.16.1.13 iburst", why: "Línea para /etc/chrony.conf del client. Comentá los pool públicos si tapan a esta fuente.", as: "info" },
        { cmd: "allow 172.16.1.0/24", why: "En el server, para aceptar al client.", as: "root" },
        { cmd: "firewall-cmd --add-service=ntp --permanent && firewall-cmd --reload", why: "UDP 123 en el server.", as: "root" },
        { cmd: "systemctl enable --now chronyd && chronyc sources -v", why: "Activar y ver que la fuente quedó seleccionada.", as: "root" },
      ],
    },
  },
  {
    id: "lab-03",
    track: "pdf",
    title: "Sin internet, los paquetes salen de un estante local",
    story: "No hay salida a internet. Nos pasan dos direcciones, BaseOS y AppStream, y de ahí tiene que instalarse el diccionario de palabras.",
    objective: [
      "Un repo de nombre BaseOS con baseurl http://dl.rockylinux.org/pub/rocky/10/BaseOS/x86_64/os/.",
      "Un repo de nombre AppStream con baseurl http://dl.rockylinux.org/pub/rocky/10/AppStream/x86_64/os/.",
      "dnf list available lista paquetes de esos repos.",
      "Instalar words. Deja /usr/share/dict/words, el diccionario del lab de grep.",
    ],
    where: "client",
    steps: [
      "No es un lab de las dos a la vez: se hace en la VM donde necesites instalar (client o server).",
      "BaseOS y AppStream tienen que figurar en dnf repolist.",
      "gpgcheck desactivado en esos dos repos, si el lab lo pide.",
      "La config queda en /etc/yum.repos.d/ y sobrevive reboot.",
      "dnf list available tiene que devolver paquetes.",
    ],
    note: "En el examen casi no hay internet: el repo suele ser interno (DVD/ISO montada con file://, o un http:// del lab). En este Vagrant, si no montás una ISO, podés usar los repos que ya trae la box o un mirror que responda. Los labs que instalan (acl, chrony, words, tuned, …) asumen que en ESA máquina ya corriste este paso.",
    help: {
      tip: "Como en el video Q03: dnf lee solo archivos en /etc/yum.repos.d/ que terminen en .repo (ej. local.repo). Entrás ahí (cd /etc/yum.repos.d/), creás el archivo a mano con dos bloques BaseOS y AppStream, y memorizás la forma: [id], name=, baseurl= (la URL o file:// del enunciado, copiar/pegar), enabled=1, gpgcheck=0. Sin repos, el resto del examen se traba. Un baseurl que no existe deja dnf muerto. En este Rocky alcanzan esos dos: Debug, Source y CRB no van en el archivo.",
      videoHint: "Videos de este lab: Q03, y otro canal (Mingtao SUN) con el repo local a mano, sin internet.",
      videos: [
        { title: "Q03: Repositorios YUM/DNF", url: YT.repos },
        {
          title: "How to Manually Configure a Local YUM/DNF Repository (No Internet!) · Mingtao SUN",
          url: YT.reposLocal,
        },
      ],
      commands: [
        { cmd: "man dnf.conf", why: "La página que explica gpgcheck, enabled y baseurl. Se lee antes de escribir el archivo.", as: "root" },
        { cmd: "man dnf.conf | grep -E 'baseurl|gpgcheck|enabled'", why: "man escribe la página. El | se la pasa a grep en vez de mostrarla. grep imprime solo las líneas donde aparece alguna de las frases. -E prende la regex extendida: el | de adentro de las comillas significa «o». Sin -E, ese | es un carácter más y no separa las tres palabras. baseurl, gpgcheck y enabled son las de este lab.", as: "root" },
        { cmd: "cd /etc/yum.repos.d/ && ls", why: "Primero: entrar a la carpeta de los repos (dnf/yum la usan igual). Hay que saberla de memoria. Ahí se crea el .repo; si el archivo no termina en .repo, dnf lo ignora.", as: "root" },
        { cmd: "dnf repolist", why: "Ver qué repos están enabled ahora en ESTA máquina (antes y después de crear el archivo).", as: "root" },
        { cmd: "cat > /etc/yum.repos.d/local.repo <<'EOF'\n[BaseOS]\nname=BaseOS\nbaseurl=http://dl.rockylinux.org/pub/rocky/10/BaseOS/x86_64/os/\nenabled=1\ngpgcheck=0\n\n[AppStream]\nname=AppStream\nbaseurl=http://dl.rockylinux.org/pub/rocky/10/AppStream/x86_64/os/\nenabled=1\ngpgcheck=0\nEOF", why: "BaseOS: http://dl.rockylinux.org/pub/rocky/10/BaseOS/x86_64/os/. AppStream: http://dl.rockylinux.org/pub/rocky/10/AppStream/x86_64/os/. En rocky.repo esas líneas están comentadas con $contentdir, $releasever y $basearch. Acá van ya escritas: pub/rocky, 10 y x86_64.", as: "root" },
        { cmd: "dnf config-manager --setopt=REPOS.gpgcheck=0 --save", why: "Solo si los repos ya existen y falta apagar GPG. El nombre sale de repolist.", as: "root" },
        { cmd: "dnf clean all && dnf repolist && dnf list available | head", why: "Comprobar: repolist muestra BaseOS y AppStream; list available tiene que listar paquetes (si la URL/file no existe, acá falla).", as: "root" },
        { cmd: "dnf install -y --repo=BaseOS --repo=AppStream words && ls /usr/share/dict/words", why: "Prueba de que el repo instala. words deja /usr/share/dict/words, el diccionario del lab de grep. En una mínima no está. Van los dos repos: el paquete puede estar en uno y una dependencia en el otro. Con solo --repo=AppStream, dnf no ve BaseOS y dice nothing provides. Sin --repo, también usa los de Rocky y un install que sale bien no prueba que lo sirvió local.repo. Si el paquete no se llama words, dnf provides /usr/share/dict/words dice el nombre.", as: "root" },
      ],
    },
  },
  {
    id: "lab-04",
    track: "pdf",
    title: "El sitio tiene que atender en un puerto que no es el de siempre",
    story: "El servidor web sigue con SELinux activo. Tiene que contestar en el puerto 82, y seguir haciéndolo después de reiniciar.",
    objective: [
      "httpd escucha en TCP 82.",
      "SELinux en enforcing.",
      "Persistente tras reboot.",
    ],
    where: "server",
    steps: [
      "Apache tiene que escuchar en el puerto 82.",
      "No pongas SELinux en permissive ni lo desactives.",
      "No muevas ni reetiquetes los archivos de /var/www/html.",
      "Tiene que seguir escuchando después de reboot.",
    ],
    help: {
      tip: "El puerto y el firewall son dos cosas distintas. SELinux puede dejar pasar el puerto y firewalld igual lo bloquea, o al revés. El ejemplo de semanage está en man semanage-port: en el shell, man semanage- y Tab Tab lista esas páginas.",
      videoHint: "Video de este lab: Q04.",
      videos: [{ title: "Q04: SELinux, Apache en el puerto 82", url: YT.selinuxPort }],
      commands: [
        { cmd: "getenforce", why: "No cambia nada. Pregunta el modo de SELinux e imprime una sola palabra.\nEnforcing: bloquea lo que la política no permite. Si Apache intenta el 82 sin permiso, no lo abre.\nPermissive: lo anota en el log y lo deja pasar.\nDisabled: SELinux no está corriendo.\nAl terminar tiene que decir Enforcing. Pasarlo a Permissive para que Apache arranque no cumple el lab.", as: "root" },
        { cmd: "dnf repolist && dnf install -y policycoreutils-python-utils", why: "semanage no viene en la mínima: el shell dice orden no encontrada. El paquete sale del repo DNF local de esta máquina, en AppStream.\nPara ver el nombre: dnf provides /usr/sbin/semanage. El patrón */semanage a veces no coincide y dnf dice que no hay resultados.", as: "root" },
        { cmd: "dnf install -y httpd", why: "Si grep dice que /etc/httpd/conf/httpd.conf no existe, Apache no está instalado. El paquete sale del repo DNF local. En el Vagrant a veces ya viene; en una mínima, no.", as: "root" },
        { cmd: "grep -n Listen /etc/httpd/conf/httpd.conf", why: "No cambia el puerto. Muestra la línea donde Apache dice en qué puerto escucha, con su número.\nSuele decir Listen 80. La que cuenta es la que no tiene # adelante. #Listen 12.34.56.78:80 es un comentario y se deja.\nSin el cambio de abajo, Apache sigue en el 80 aunque SELinux y el firewall ya permitan el 82.", as: "root" },
        { cmd: "vim /etc/httpd/conf/httpd.conf", why: "Mismo cambio que en el video: Listen 80 pasa a Listen 82.\nAbrí el archivo. /Listen y Enter salta a esa palabra (n la próxima si hay varias).\nLa línea que cuenta es Listen 80 sin # adelante. i entra en inserción, cambiá el 80 por 82, Esc, :wq Enter guarda y sale.\n:q! sale sin guardar si te equivocaste.\nDespués el grep de arriba tiene que mostrar Listen 82. No toques /var/www/html.", as: "root" },
        { cmd: "man semanage-port", why: "man semanage solo es la página general: no trae el ejemplo del puerto.\nLas páginas chicas se llaman semanage-port, semanage-fcontext, etc. En el prompt escribí man semanage- y apretá Tab dos veces: bash lista esas páginas. Completá semanage-port y Enter.\nAdentro el visor es less. /Examples o /port y Enter. n / N (Shift+n) saltan entre coincidencias. Espacio baja una pantalla, b sube, q sale.\nEn EXAMPLES hay un SSH con -a -t … -p tcp. Adaptarlo: tipo http_port_t y puerto 82.", as: "root" },
        { cmd: "semanage port -l | grep http", why: "No cambia nada. Lista los puertos que SELinux ya etiquetó y deja solo las líneas de http.\nhttp_port_t es la etiqueta de los puertos donde Apache puede escuchar.\nSi 82 no aparece ahí, en Enforcing Apache no puede usarlo, aunque httpd.conf diga Listen 82. Por eso un restart antes de agregarlo falla.", as: "root" },
        { cmd: "semanage port -a -t http_port_t -p tcp 82", why: "Agrega el 82 a la etiqueta http_port_t, en TCP. -a agrega, -t es el tipo y -p tcp es el protocolo.\nQueda en la política y sigue después del reboot. No toca los archivos de /var/www/html: acá el bloqueo es el puerto.\nLas líneas policy capability son normales: SELinux reescribe la política. Si vuelve el prompt y no dice error, quedó. Comprobar con semanage port -l | grep http: el 82 tiene que aparecer en http_port_t.\nSi dice que el puerto ya está definido, ya estaba. No hace falta correrlo de nuevo.", as: "root" },
        { cmd: "firewall-cmd --add-port=82/tcp --permanent && firewall-cmd --reload", why: "firewalld es otra barrera, aparte de SELinux.\n--add-port=82/tcp abre el 82.\n--permanent lo guarda en disco. Sin eso, al reboot el puerto se cierra.\n--reload aplica ahora lo guardado. Hasta el reload, el cambio permanente no entra en vigor.\nSi olvidás la sintaxis: man firewall-cmd y /add-port.", as: "root" },
        { cmd: "systemctl enable --now httpd", why: "enable lo deja para el próximo boot. Sin esto, después del reboot no hay nadie en el 82.\n--now también lo arranca ahora. Si ya estaba corriendo, igual hace falta el restart de abajo para que lea Listen 82.", as: "root" },
        { cmd: "systemctl restart httpd && ss -ltnp | grep 82", why: "restart corta Apache y lo vuelve a levantar para que lea Listen 82. Si el puerto de SELinux falta, el restart falla: volvé a semanage port.\nss -ltnp lista qué procesos escuchan en TCP. grep 82 deja solo esa línea.\nSi aparece httpd en :82, está escuchando. Si no hay línea, no quedó.", as: "root" },
        { cmd: "curl -I http://127.0.0.1:82", why: "Pregunta desde esta misma máquina si Apache contesta en el 82. -I pide solo los encabezados. 127.0.0.1 no cruza el firewall.\nHTTP/1.1 200: hay página y la sirvió. En el examen lo normal es esto: /var/www/html ya trae el archivo, y el enunciado pide no moverlo ni reetiquetarlo.\nHTTP/1.1 403 Forbidden: Apache está en el 82, pero la carpeta no tiene index.html. En este clon vacío es lo esperado. No crees un archivo ahí.\nCould not connect: nadie escucha en el 82. El Listen no quedó, o httpd no está corriendo. La carpeta vacía no da ese error.", as: "root" },
        { cmd: "curl -I http://172.16.1.13:82", why: "Desde el client. Esta sí cruza el firewall: es la prueba de afuera.\nEl mismo código que en el server. 200 si hay página, 403 si /var/www/html está vacío, Could not connect si el puerto no está abierto o httpd no escucha.", as: "client" },
      ],
    },
  },
  {
    id: "lab-fcontext",
    track: "pdf",
    title: "La página de Roman no se ve y SELinux sigue activo",
    story: "Roman copió una página a /var/www/html/roman desde su home.\n\nApache está en enforcing y contesta 403: el archivo no tiene la etiqueta de contenido web. Necesitamos etiquetarlo para que sobreviva al relabel, sin pasar SELinux a permissive y sin tocar el puerto.",
    objective: [
      "SELinux sigue en enforcing.",
      "/var/www/html/roman etiquetado httpd_sys_content_t.",
      "La etiqueta queda en la política (semanage fcontext).",
    ],
    where: "server",
    steps: [
      "Después del lab del puerto, si ese ya está. Este no cambia el Listen.",
      "Dejá SELinux en enforcing.",
      "El árbol /var/www/html/roman tiene que ser httpd_sys_content_t.",
      "Persistente: semanage fcontext y después restorecon.",
    ],
    note: "El lab del puerto pide no reetiquetar el html que ya venía. Acá el archivo lo trajo Roman y nació con la etiqueta equivocada.",
    help: {
      tip: "chcon cambia la etiqueta ahora y un restorecon o un autorelabel la puede borrar. semanage fcontext la anota en la política; restorecon la aplica desde esa política.\nEl tipo de una página estática es httpd_sys_content_t. No es http_port_t: ese es el del puerto.",
      videoHint: "Misma playlist, parte 9. Más adelante etiqueta el contenido de Apache. El puerto de ese video es 85; acá el puerto ya está en el lab anterior.",
      videos: [{ title: "Parte 9: contexto SELinux", url: YT.harunaSecurity }],
      commands: [
        { cmd: "getenforce", why: "Tiene que decir Enforcing. Permissive no cumple.", as: "root" },
        { cmd: "mkdir -p /var/www/html/roman && cp /etc/hosts /var/www/html/roman/index.html && ls -Z /var/www/html/roman", why: "Copia de práctica. ls -Z muestra el tipo. Si dice admin_home_t o default_t, Apache en enforcing no lo sirve.", as: "root" },
        { cmd: "semanage fcontext -a -t httpd_sys_content_t '/var/www/html/roman(/.*)?'", why: "Anota la regla. El (/.*)? cubre la carpeta y lo que hay adentro. Si dice que ya está definida, no la agregues de nuevo.", as: "root" },
        { cmd: "restorecon -Rv /var/www/html/roman", why: "Aplica la regla. Tiene que avisar Relabeled hacia httpd_sys_content_t.", as: "root" },
        { cmd: "ls -Z /var/www/html/roman && curl -sI http://127.0.0.1/roman/index.html | head -n 1", why: "La Z tiene que mostrar httpd_sys_content_t. El curl usa el puerto que Apache tenga ahora (80, o 82 si ya hiciste ese lab).", as: "root" },
      ],
    },
  },
  {
    id: "lab-05",
    track: "pdf",
    title: "Llega gente nueva y no todos pueden administrar",
    story: "Hay que crear las cuentas y un grupo para los que administran. Uno de ellos puede usar sudo. El resto, no. Thiago es developer: entra, pero no administra.",
    objective: [
      "Grupo sysadm y grupo developer.",
      "Usuarios: felipe y erik en sysadm; thiago en developer; diego con /sbin/nologin.",
      "Contraseña de los cuatro: lalala.",
      "sysadm puede sudo useradd.",
      "felipe puede sudo passwd sin que pida contraseña.",
      "Desde felipe: crear los usuarios joaquin y roman con sudo.",
    ],
    where: "client",
    steps: [
      "Grupo sysadm y grupo developer.",
      "Felipe: grupo secundario sysadm.",
      "Erik: grupo secundario sysadm.",
      "Thiago: grupo secundario developer, con shell, y fuera de sysadm.",
      "Diego: sin shell interactiva (/sbin/nologin) y fuera de sysadm.",
      "Contraseña del ejercicio para los cuatro: lalala.",
      "Quien esté en sysadm puede crear usuarios con sudo.",
      "Felipe puede cambiar la contraseña de otros usuarios sin que sudo le pida contraseña.",
      "Como felipe, crear los usuarios joaquin y roman (prueba del sudo useradd).",
      "Persistente.",
    ],
    help: {
      tip: "El grupo de este lab es sysadm, no wheel. Si el usuario ya existe, el secundario se suma con usermod -aG, no con otro useradd. La regla de sudo va con visudo: un error de sintaxis te deja sin sudo. NOPASSWD es solo para passwd de felipe; el useradd del grupo %sysadm sí puede pedir la clave de felipe. userdel -r USUARIO borra cuenta + home + mail, no el crontab ni archivos fuera del home ni sudoers ni ACL. groupdel GRUPO: el grupo no puede ser primario de nadie.",
      videoHint: "Video de este lab: Q05.",
      videos: [{ title: "Q05: Usuarios, grupos y sudo", url: YT.users }],
      commands: [
        { cmd: "id felipe", why: "No cambia nada. Si el usuario existe, muestra uid, gid y grupos. getent passwd felipe también sirve: una línea con la cuenta. Si no existe, id dice no such user.", as: "root" },
        { cmd: "getent passwd", why: "Lista todas las cuentas. Solo nombres: getent passwd | cut -d: -f1. Usuarios de persona (UID 1000 o más, sin nobody): getent passwd | awk -F: '$3 >= 1000 && $3 < 65534 {print $1}'. Ahí tienen que aparecer felipe, erik, thiago y diego.", as: "root" },
        { cmd: "groupadd sysadm", why: "Crear el grupo del enunciado.", as: "root" },
        { cmd: "useradd -G sysadm felipe && useradd -G sysadm erik", why: "-G es secundario. No uses -g si no querés cambiar el grupo primario. Solo si el usuario todavía no existe.", as: "root" },
        { cmd: "usermod -aG sysadm felipe", why: "Si felipe ya existía, esto suma sysadm sin sacar los grupos secundarios que ya tenía. El grupo va primero, el usuario después. Sin -a, -G reemplaza la lista entera y se pierden los otros. Comprobar con id felipe. Lo mismo para erik.", as: "root" },
        { cmd: "useradd -s /sbin/nologin diego", why: "Diego no entra a una shell y no va a sysadm.", as: "root" },
        { cmd: "groupadd developer", why: "El otro rol. Quien desarrolla entra a una shell y no administra.", as: "root" },
        { cmd: "useradd -G developer thiago", why: "Thiago queda en developer, no en sysadm. El shell por defecto es /bin/bash, así que sí puede entrar. La contraseña se pone con passwd, igual que los otros.", as: "root" },
        { cmd: "usermod -l erik Erik", why: "Renombra el login: el nombre nuevo va primero. Erik no puede estar logueado. El home y el grupo primario no cambian solos. Home y carpeta: usermod -l erik -d /home/erik -m Erik. Grupo primario: groupmod -n erik Erik.", as: "root" },
        { cmd: "man usermod | grep -- '-l'", why: "Busca la opción -l en el manual. man usermod | grep -l falla: -l es opción de grep, no el texto. El -- dice que lo de atrás es el patrón. Sale -l, --login NEW_LOGIN. También puede salir -L, --lock, porque --lock contiene -l.", as: "root" },
        { cmd: "passwd felipe", why: "Repetilo para erik, thiago y diego. La contraseña del ejercicio es lalala.", as: "root" },
        { cmd: "visudo -f /etc/sudoers.d/sysadm", why: "Ahí van las dos reglas (grupo + felipe). El archivo queda en 440.", as: "root" },
        { cmd: "%sysadm ALL=(ALL) /usr/sbin/useradd", why: "El grupo puede crear usuarios. El % indica grupo. Sin NOPASSWD: sudo pide la clave de felipe.", as: "root" },
        { cmd: "felipe ALL=(ALL) NOPASSWD: /usr/bin/passwd", why: "Solo Felipe, solo passwd, sin contraseña de sudo. Tiene que ser /usr/bin/passwd, no passwd a secas.", as: "root" },
        { cmd: "sudo -l -U felipe", why: "Leer la regla antes de probar con su - felipe. Tiene que listar useradd (por %sysadm) y passwd con NOPASSWD.", as: "root" },
        { cmd: "su - felipe", why: "Pasás a la sesión de felipe para probar el sudo de verdad. La clave es lalala.", as: "root" },
        { cmd: "sudo /usr/sbin/useradd joaquin", why: "Prueba del %sysadm: felipe crea joaquin. Suele pedir la contraseña de felipe (lalala). Si dice permission denied, falta la regla del grupo o felipe no está en sysadm.", as: "felipe" },
        { cmd: "sudo /usr/sbin/useradd roman", why: "Misma prueba: felipe crea roman. Si sudo ya cacheó la clave, puede no pedirla de nuevo. Roman lo usan labs siguientes (pwquality).", as: "felipe" },
        { cmd: "sudo /usr/bin/passwd joaquin", why: "Prueba del NOPASSWD: no tiene que pedir la clave de sudo. Sí pide la contraseña nueva de joaquin dos veces. Si sudo pide lalala otra vez, falta NOPASSWD o el path no es /usr/bin/passwd.", as: "felipe" },
        { cmd: "sudo /usr/bin/passwd roman", why: "Otra vez NOPASSWD: no pide sudo; sí la clave nueva de roman dos veces.", as: "felipe" },
        { cmd: "id joaquin && id roman", why: "Tienen que existir las dos cuentas. Después exit para volver a root.", as: "felipe" },
        { cmd: "userdel -r erik", why: "Borra: la cuenta (passwd/shadow/group), el home (/home/erik) y el mail spool. Sin -r el home queda. No borra: crontab (/var/spool/cron/…), archivos fuera del home (ej. /root/erikfiles, /shared), ACL en otros paths, líneas de sudoers, ni procesos/sesiones abiertas. Sin sesión abierta: loginctl terminate-user erik si hace falta. En XFS el home no se recupera: otro useradd deja la carpeta vacía.", as: "root" },
        { cmd: "crontab -u erik -r; rm -f /var/spool/cron/erik /var/spool/cron/crontabs/erik; find / -nouser -o -nogroup 2>/dev/null; setfacl -b /var/tmp/fstab 2>/dev/null", why: "Extra (VM de práctica limpia): userdel -r no alcanza si querés borrar todo lo del usuario. Sacá el crontab (con -u si la cuenta aún existe, o el archivo en spool si ya la borraste), buscá archivos/dirs huérfanos con find -nouser/-nogroup, limpiá ACL de prueba y, si aplica, rm de carpetas de lab (/root/erikfiles, /shared) y la regla en sudoers.d. Para reset total de la box, mejor snapshot o vagrant destroy.", as: "root" },
        { cmd: "groupdel sysadm", why: "Borrar un grupo: groupdel NOMBRE. Tiene que estar vacío como grupo primario: primero borrá o cambiá de grupo a los usuarios que lo tengan de primario (usermod -g OTRO usuario). Si solo era secundario, userdel o usermod -G ya lo sacan de la lista. getent group sysadm comprueba que ya no está.", as: "root" },
      ],
    },
  },
  {
    id: "lab-pwquality",
    track: "pdf",
    title: "La contraseña de Roman no puede ser corta ni eterna",
    story: "Seguridad le mandó a Roman las reglas de las cuentas del client.\n\nNecesitamos que una clave nueva tenga al menos 8 caracteres y que no dure más de 30 días. La de Roman, que ya existe o hay que crearla, tiene que quedar con ese máximo.",
    objective: [
      "Largo mínimo 8.",
      "Edad máxima 30 días para las cuentas nuevas.",
      "roman con máximo de 30 días.",
    ],
    where: "client",
    steps: [
      "Después de las cuentas (lab de usuarios), en el client.",
      "minlen 8 en pwquality.",
      "PASS_MAX_DAYS 30 en login.defs.",
      "Usuario roman, y chage -M 30 roman.",
    ],
    help: {
      tip: "Son dos archivos distintos. pwquality.conf decide el largo cuando alguien corre passwd. login.defs PASS_MAX_DAYS se aplica a las cuentas que nacen después. roman ya creado no lo hereda: hace falta chage -M.",
      videoHint: "Está en la playlist del otro repo, parte 8. Ahí pone largo mínimo 8 y edad máxima 30.",
      videos: [{ title: "Parte 8: política de contraseñas", url: YT.harunaUsers }],
      commands: [
        { cmd: "id roman || useradd roman && echo 'Roman.pass.1' | passwd --stdin roman", why: "Si no existe, crealo. La clave de práctica tiene más de 8 caracteres.", as: "root" },
        { cmd: "grep -E '^minlen' /etc/security/pwquality.conf || echo 'minlen = 8' >> /etc/security/pwquality.conf", why: "Largo mínimo. Si la línea ya está comentada con #, descomentala en vim en vez de duplicarla.", as: "root" },
        { cmd: "grep ^PASS_MAX_DAYS /etc/login.defs", why: "Edad máxima de las cuentas nuevas. Tiene que quedar 30. Si ves 99999, cambiala.", as: "root" },
        { cmd: "sed -i 's/^PASS_MAX_DAYS.*/PASS_MAX_DAYS\\t30/' /etc/login.defs", why: "Deja 30 en la línea activa. No toca la que empieza con #.", as: "root" },
        { cmd: "chage -M 30 roman && chage -l roman", why: "Aplica el máximo a Roman. Maximum number of days between password change tiene que decir 30.", as: "root" },
      ],
    },
  },
  {
    id: "lab-06",
    track: "pdf",
    title: "Una carpeta compartida donde lo nuevo queda del grupo",
    story: "Varias personas escriben en la misma carpeta. Los archivos que crean tienen que nacer ya del grupo, no solo de quien los creó.",
    objective: [
      "Directorio /shared/sysadm.",
      "Grupo dueño sysadm, setgid.",
      "Dueño y grupo leen, crean y entran. Los demás no.",
    ],
    where: "client",
    steps: [
      "Crear /shared/sysadm.",
      "Grupo dueño: sysadm.",
      "Dueño y grupo leen, escriben y entran. Otros no.",
      "Los archivos nuevos heredan el grupo sysadm (setgid).",
      "Persistente: es un permiso del directorio, no hace falta fstab.",
    ],
    help: {
      tip: "En una carpeta, r es ver los nombres, w es crear o borrar adentro, y x es entrar. El 7 junta las tres. El 6 es solo r y w: 2660 no deja entrar ni crear. El primer dígito es el bit especial: 4 setuid, 2 setgid, 1 sticky. Este lab necesita el 2. Se ve como s en el grupo: drwxrws---. Probalo creando un archivo con uno de los usuarios, no con root.",
      videoHint: "Video de este lab: Q06.",
      videos: [{ title: "Q06: Directorio compartido con setgid", url: YT.setgid }],
      commands: [
        { cmd: "mkdir -p /shared/sysadm", why: "Crear la ruta.", as: "root" },
        { cmd: "chown root:sysadm /shared/sysadm", why: "El grupo dueño tiene que ser sysadm. Sin eso, el setgid haría heredar otro grupo.", as: "root" },
        { cmd: "chmod 2770 /shared/sysadm", why: "El 2 es setgid en la carpeta.\n\nLos archivos y carpetas nuevos heredan el grupo dueño de esta carpeta (sysadm), no el grupo primario de quien los crea. Si Felipe es grupo felipe y hace un touch acá, el archivo queda grupo sysadm.\n\nEn un directorio los tres bits no son los de un archivo:\nr = ver los nombres (ls).\nw = crear y borrar adentro.\nx = entrar (cd) y abrir lo que está adentro. Sin x no se entra, aunque haya r y w.\n\n2770 = 2 + 770.\n7 del dueño y 7 del grupo: 4+2+1, las tres. Nada de eso queda implícito.\n0 del resto: ni ver, ni crear, ni entrar.\n\n2070 no. Ese 0 del medio le saca todo al dueño de la carpeta, que es root. Felipe y Erik no son el dueño: entran por el segundo 7, porque están en sysadm.\n\n2660 no sirve. El 6 es 4+2, leer y escribir, sin el 1 de entrar. En una carpeta, sin x no se puede hacer cd ni crear un archivo. El setgid quedaría como S mayúscula: el bit está, pero falta la x del grupo.", as: "root" },
        { cmd: "Bits especiales (el primer dígito): 4 setuid, 2 setgid, 1 sticky", why: "setuid (4): en un ejecutable, el proceso corre con el dueño del archivo. El ejemplo clásico es passwd, que corre como root. En un directorio casi no se usa.\n\nsetgid (2): en un directorio, hereda el grupo. Es este lab. En un ejecutable, el proceso corre con el grupo del archivo.\n\nsticky (1): en un directorio escribible por varios, como /tmp, solo el dueño del archivo o root puede borrarlo. Se ve como t al final: drwxrwxrwt.\n\nAcá no hace falta sticky. El lab pide heredar el grupo.", as: "info" },
        { cmd: "ls -ld /shared/sysadm", why: "Tiene que verse drwxrws---. La s en el lugar de la x del grupo es el setgid. Si ves una S mayúscula, el bit está pero falta el permiso de ejecución del grupo: algo mal en el 770.", as: "root" },
        { cmd: "su - felipe -c 'touch /shared/sysadm/prueba && ls -l /shared/sysadm'", why: "Prueba real: el archivo nuevo tiene que quedar grupo sysadm, aunque el grupo primario de Felipe sea otro.", as: "felipe" },
      ],
    },
  },
  {
    id: "lab-07",
    track: "pdf",
    title: "Erik quiere un aviso que se anote solo",
    story: "Erik no va a estar mirando la máquina. Quiere que, cada minuto, quede anotado el texto que le pidieron, sin que él lo escriba.",
    objective: [
      "Usuario erik.",
      "Cada 1 minuto.",
      "logger con el texto \"Ex200 Testing\".",
    ],
    where: "client",
    steps: [
      "Usuario: erik.",
      "Cada 1 minuto.",
      "Acción: logger con el texto Ex200 Testing.",
      "Persistente.",
    ],
    help: {
      tip: "crontab -e abre el crontab de root si estás como root. Para Erik hace falta -u erik. El servicio crond tiene que estar activo.\nCuidado con el texto: tiene que ser exactamente Ex200 Testing (sin espacio entre Ex y 200). Ex 200 Testing deja el cron corriendo pero no cumple el enunciado.",
      videoHint: "Video de este lab: Q07.",
      videos: [{ title: "Q07: Cron con logger", url: YT.cron }],
      commands: [
        { cmd: "systemctl enable --now crond", why: "Sin el servicio, el crontab no corre.", as: "root" },
        { cmd: "crontab -u erik -e", why: "Editar la tabla de Erik, no la de root.", as: "root" },
        { cmd: "* * * * * logger \"Ex200 Testing\"", why: "Los cinco asteriscos son cada minuto.", as: "root" },
        { cmd: "crontab -u erik -l", why: "Ver que quedó guardada.", as: "root" },
        { cmd: "journalctl -t erik --since '2 min ago'", why: "logger usa el usuario como identificador. Esperá un minuto.", as: "root" },
      ],
    },
  },
  {
    id: "lab-at",
    track: "pdf",
    title: "Roman necesita un aviso de una sola vez",
    story: "El cron de Erik se repite cada minuto. Esto es otra cosa.\n\nA Roman le pidieron que, dentro de dos minutos, quede escrito un texto en un archivo. Una sola vez. Si la máquina sigue prendida, no tiene que volver a correr.",
    objective: [
      "Servicio atd activo.",
      "Dentro de 2 minutos escribe el texto.",
      "Archivo /root/roman-at.txt con This task was easy!",
    ],
    where: "client",
    steps: [
      "Después del cron, en el client. No uses crontab para esto.",
      "atd tiene que estar enabled.",
      "Un at a now + 2 minutes.",
      "El archivo aparece solo. No lo crees a mano para cumplir.",
    ],
    help: {
      tip: "cron es repetible. at es una vez. El comando que programás es el que escribe el archivo; si hacés el echo ahora, no estás probando at.",
      videoHint: "Está en la playlist del otro repo, parte 6, junto con el cron. Esta tarea es el at de una sola vez.",
      videos: [{ title: "Parte 6: at", url: YT.harunaDeploy }],
      commands: [
        { cmd: "dnf repolist && dnf install -y at && systemctl enable --now atd", why: "at no siempre está. Sin atd el trabajo queda en la cola y no corre.", as: "root" },
        { cmd: "echo 'echo \"This task was easy!\" > /root/roman-at.txt' | at now + 2 minutes", why: "Programa el echo para dentro de 2 minutos. at imprime el número de job.", as: "root" },
        { cmd: "atq", why: "Tiene que listar el job hasta que se cumpla. Después la cola queda vacía.", as: "root" },
        { cmd: "cat /root/roman-at.txt", why: "Esperá los 2 minutos. El archivo tiene que decir This task was easy!", as: "root" },
      ],
    },
  },
  {
    id: "lab-09",
    track: "pdf",
    title: "Antes de tocar la configuración, hay que guardar /etc",
    story: "Vamos a cambiar cosas del sistema. Primero se comprime /etc en un archivo, por si hay que volver atrás.",
    objective: [
      "Archivo /root/myetcbackup.tar.bz2.",
      "Contiene /etc.",
      "Compresión bzip2.",
    ],
    where: "client",
    steps: [
      "Crear /root/myetcbackup.tar.bz2.",
      "Tiene que contener /etc.",
      "Compresión bzip2, extensión .tar.bz2.",
    ],
    help: {
      tip: "j es bzip2. z es gzip. Si el archivo queda .gz, el lab no está cumplido aunque pese menos.",
      videoHint: "Video de este lab: Q09.",
      videos: [{ title: "Q09: Archivo tar.bz2 de /etc", url: YT.tar }],
      commands: [
        { cmd: "man tar", why: "Primero el manual: adentro el visor es less.\n\nCómo buscar:\n/FRASE Enter → busca hacia abajo.\nn → siguiente match. N (Shift+n) → el anterior.\n?FRASE → busca hacia arriba.\nEspacio / f → baja una pantalla. b → sube. q → sale.\n\nPara este lab:\n/bzip2 → salta a -j, --bzip2.\n/--list → la t de tar -tjf (listar sin extraer).\n/--file → la f, el nombre del archivo (va última).\n/create o /-c → la c de crear.\n\ncjv no es el del lab: v es verbose y, sin f, no escribe el .tar.bz2.", as: "root" },
        { cmd: "tar -cjf /root/myetcbackup.tar.bz2 /etc", why: "c crea, j comprime con bzip2, f es el archivo de salida (va al final: lo que sigue es la ruta).", as: "root" },
        { cmd: "tar -tjf /root/myetcbackup.tar.bz2 | head", why: "Listar sin descomprimir, para verificar. head muestra solo las primeras líneas (por defecto 10): alcanza para ver que el .tar.bz2 tiene contenido, sin tirar miles de rutas de /etc en la pantalla.", as: "root" },
      ],
    },
  },
  {
    id: "lab-links",
    track: "pdf",
    title: "Roman necesita dos atajos al mismo archivo",
    story: "Roman tiene las notas en /root/roman/notas.txt y las quiere abrir desde /root/roman/atajos.\n\nNecesitamos dos caminos: uno simbólico, que apunte al nombre, y uno duro, que sea el mismo archivo. Si alguien borra el nombre original, el duro tiene que seguir teniendo el texto.",
    objective: [
      "Archivo /root/roman/notas.txt.",
      "Enlace simbólico notas-soft.",
      "Enlace duro notas-hard, mismo inodo.",
    ],
    where: "client",
    steps: [
      "Después del backup de /etc: mismo tema, archivos.",
      "Crear notas.txt.",
      "notas-soft con ln -s.",
      "notas-hard con ln, sin -s. ls -li tiene que mostrar el mismo inodo que notas.txt.",
    ],
    help: {
      tip: "ln -s crea un acceso directo: si el original desaparece, el soft queda colgado. ln sin -s suma otro nombre al mismo inodo. No se puede hacer un hard link a un directorio ni de un disco a otro.",
      videoHint: "Está en la playlist del otro repo, parte 1. Ahí hace el enlace simbólico y el duro.",
      videos: [{ title: "Parte 1: enlaces", url: YT.harunaTools }],
      commands: [
        { cmd: "mkdir -p /root/roman/atajos && echo 'notas de roman' > /root/roman/notas.txt", why: "El archivo real. El texto es para reconocer después cuál sobrevive.", as: "root" },
        { cmd: "ln -s /root/roman/notas.txt /root/roman/atajos/notas-soft", why: "Simbólico. ls -l lo muestra con -> hacia la ruta.", as: "root" },
        { cmd: "ln /root/roman/notas.txt /root/roman/atajos/notas-hard", why: "Duro. Sin -s. Tiene que ser el mismo filesystem que el original.", as: "root" },
        { cmd: "ls -li /root/roman/notas.txt /root/roman/atajos/notas-hard /root/roman/atajos/notas-soft", why: "notas.txt y notas-hard comparten el número de inodo (primera columna) y el link count sube a 2. El soft tiene otro inodo y una flecha.", as: "root" },
      ],
    },
  },
  {
    id: "lab-10",
    track: "pdf",
    title: "Erik tiene que cambiar un archivo que no es suyo",
    story: "Los dueños del archivo son root y el grupo root. El grupo root solo puede leerlo. Hoy Erik necesita poder leerlo y hacer cambios, porque le tocó revisar esa copia de fstab. Felipe está en otro proyecto y no tiene que ver el archivo. Los demás pueden leerlo, pero no escribir.\n\nPara eso hacen falta ACL (setfacl/getfacl). En Rocky mínima / Vagrant a menudo el paquete acl no viene instalado: si el shell dice command not found, instalalo con dnf antes de seguir.",
    objective: [
      "Paquete acl instalado si setfacl no existe (dnf install acl).",
      "Copia /etc/fstab → /var/tmp/fstab, dueño root:root.",
      "Grupo root: solo lectura.",
      "erik: lectura y escritura.",
      "felipe: sin acceso.",
      "others: solo lectura.",
    ],
    where: "client",
    steps: [
      "Antes: repos DNF ok en el client (lab Repositorios DNF).",
      "Si setfacl no está (command not found), instalar el paquete acl.",
      "Copiar /etc/fstab a /var/tmp/fstab.",
      "Dueño root y grupo root. El grupo solo lee.",
      "Sin bit de ejecución.",
      "Erik: lectura y escritura.",
      "Felipe: sin acceso.",
      "Otros: solo lectura.",
    ],
    help: {
      tip: "ACL (Access Control List): permisos extra por usuario o por grupo, encima del chmod. Se usa cuando el dueño/grupo/otros del chmod no alcanza: por ejemplo un archivo de root donde erik necesita escribir y felipe no puede ni leer, sin meter a erik en el grupo dueño ni abrir other a escritura.\n\nEn esta box de Vagrant (Rocky mínima) setfacl/getfacl suelen faltar: which setfacl o setfacl --help; si dice command not found, dnf install -y acl (con BaseOS/AppStream ya andando). Sin ese paquete el lab no se puede hacer.\n\nFormato tipo:nombre:permisos. Dos tipos: u:erik:rw (usuario) y g:sysadm:r (grupo). No existe ug: junto: o u: o g:. -m modifica; -x borra una entrada.\n\nmask:: en getfacl es el techo de las ACL nombradas (user:erik:, user:felipe:, …): no es un usuario. Si erik tiene rw- y mask::rw-, el efectivo es rw-. Si la máscara fuera solo r--, el efectivo quedaría en lectura aunque diga rw-. No limita al dueño (user::) ni a other::. Al dar rw a erik, el sistema suele subir mask:: solo. Más detalle en el glosario (mask).",
      videoHint: "Video de este lab: Q10.",
      videos: [{ title: "Q10: ACL en /var/tmp/fstab", url: YT.acl }],
      commands: [
        { cmd: "which setfacl || dnf install -y acl", why: "Si which imprime una ruta (/usr/bin/setfacl), ya está. Si falla o el shell dice command not found, instalá el paquete acl. En Rocky de Vagrant a menudo no viene. Hace falta BaseOS/AppStream (lab Repositorios DNF). Sin setfacl no hay ACL.", as: "root" },
        { cmd: "cp /etc/fstab /var/tmp/fstab && chown root:root /var/tmp/fstab && chmod 644 /var/tmp/fstab", why: "644 son tres dígitos, sin ejecución.\n6, el dueño root: lee y escribe.\n4, el grupo root: solo lee.\n4, others: solo lee.\nErik y Felipe no salen de estos tres: eso va en las ACL de abajo.", as: "root" },
        { cmd: "setfacl -m u:erik:rw /var/tmp/fstab", why: "ACL de usuario: u = user, erik = nombre, rw = permisos. Lee y escribe. Suele subir mask:: a rw- para que el efectivo de erik pueda ser escritura.", as: "root" },
        { cmd: "setfacl -m u:felipe:--- /var/tmp/fstab", why: "Misma forma u:nombre:permisos. --- (o 0) = sin acceso.", as: "root" },
        { cmd: "setfacl -m g:sysadm:r /var/tmp/fstab", why: "Ejemplo de ACL de grupo: g:nombre:permisos. Este lab no lo pide; acá alcanzan las dos de usuario.", as: "root" },
        { cmd: "getfacl /var/tmp/fstab", why: "Ver user::, user:nombre:, group::, mask:: y other::.\n\nmask:: es el techo de user:erik: / user:felipe: (y a menudo group:: efectivo), no un usuario. Con user:erik:rw- y mask::rw-, erik escribe de verdad. user:: (root) y other:: no pasan por esa máscara. getfacl -e marca el #effective: si la máscara corta.", as: "root" },
        { cmd: "su - erik -c 'echo prueba >> /var/tmp/fstab'", why: "Prueba real: el >> tiene que ir adentro de las comillas. Si va afuera, escribe root y no estás probando a erik.", as: "erik" },
      ],
    },
  },
  {
    id: "lab-12",
    track: "pdf",
    title: "Erik no recuerda qué archivos tocó",
    story: "Erik es nuevo y no recuerda qué archivos modificó. Quiere copiarlos con la misma estructura de carpetas de donde estaban la primera vez.",
    objective: [
      "Archivos de erik modificados en las últimas 24 h.",
      "Copiarlos a /root/erikfiles.",
      "Conservar la estructura de rutas.",
    ],
    where: "client",
    steps: [
      "Listar: dueño erik, archivos, modificados en las últimas 24 h.",
      "Crear /root/erikfiles.",
      "Copiar conservando la ruta (cp --parents).",
      "Comprobar con ls -R.",
    ],
    note: "El destino es /root/erikfiles.",
    help: {
      tip: "Orden: listar → mkdir → find+cp → comprobar.\nFiltros: -user erik, -type f, -mtime -1. Destino: /root/erikfiles. --parents conserva carpetas.\n\nEn el video lo escriben y ejecutan así (con natasha):\nfind / xdev -user natasha … -exec cp --parents {} /root/natashafiles \\+ 2>/dev/null\nOjo: xdev sin - no es la opción. find lo toma como otra ruta (carpeta xdev); si no existe, el error se come con 2>/dev/null y igual puede meter /proc. Acá usá -xdev.\nEl video cierra con \\+; con cp --parents suele fallar si hay padres distintos. Acá usá \\; (un cp por archivo).",
      videoHint: "Video de este lab: Q12.",
      videos: [{ title: "Q12: find y copiar conservando rutas", url: YT.find }],
      commands: [
        {
          cmd: "find / -xdev -user erik -type f -mtime -1 2>/dev/null",
          why: "Paso 1 — solo listar.\n-xdev: no entra a /proc. En el video: find / xdev … sin guión — eso no activa -xdev.\n-user erik · -type f · -mtime -1 · 2>/dev/null.\nSi no sale nada: su - erik, touch ~/prueba, y repetí.",
          as: "root",
        },
        {
          cmd: "mkdir -p /root/erikfiles",
          why: "Paso 2 — carpeta destino. Sin esto, el cp del paso 3 puede fallar.",
          as: "root",
        },
        {
          cmd: "find / -xdev -user erik -type f -mtime -1 -exec cp --parents {} /root/erikfiles/ \\; 2>/dev/null",
          why: "Paso 3 — buscar y copiar (versión del lab).\n\n-exec … \\; → un cp por archivo; {} es la ruta.\ncp --parents → /home/erik/nota.txt queda /root/erikfiles/home/erik/nota.txt.\n\nEn el video: xdev sin - y cierran con \\+. Acá: -xdev y \\;.",
          as: "root",
        },
        {
          cmd: "ls -R /root/erikfiles",
          why: "Paso 4 — tiene que verse home/erik/… (o la ruta real que haya tocado erik).",
          as: "root",
        },
      ],
    },
  },
  {
    id: "lab-find-size",
    track: "pdf",
    title: "Roman quiere los archivos grandes, no los de ayer",
    story: "El find de Erik junta lo que él tocó en el último día.\n\nA Roman le pidieron otra cosa: de /usr, los archivos que pesen más de 3 MB y menos de 10 MB, copiados a /root/roman-big con la carpeta de donde salieron.",
    objective: [
      "Solo archivos de /usr.",
      "Más de 3 MB y menos de 10 MB.",
      "Copiados a /root/roman-big conservando la ruta.",
    ],
    where: "client",
    steps: [
      "Después del find de Erik. Acá el filtro es el tamaño, no el dueño.",
      "find en /usr, -type f, dos -size.",
      "Copiar con --parents a /root/roman-big.",
    ],
    help: {
      tip: "En find, +3M es más grande que 3 MiB y -10M es más chico que 10 MiB. Los dos -size se combinan. -type f deja afuera los directorios.",
      videoHint: "Misma playlist, parte 1. El find por tamaño está en ese video. El de Erik (dueño y fecha) sigue siendo el Q12 de la otra lista.",
      videos: [{ title: "Parte 1: find por tamaño", url: YT.harunaTools }],
      commands: [
        { cmd: "find /usr -type f -size +3M -size -10M", why: "Lista. Si no sale nada, no hay archivos en ese rango: no inventes el tamaño.", as: "root" },
        { cmd: "mkdir -p /root/roman-big", why: "Destino antes de copiar.", as: "root" },
        { cmd: "find /usr -type f -size +3M -size -10M -exec cp --parents {} /root/roman-big \\;", why: "\\; es un cp por archivo para que --parents funcione. Puede tardar si hay muchos.", as: "root" },
        { cmd: "find /root/roman-big -type f | head", why: "Tiene que verse la ruta de /usr debajo de roman-big, no archivos sueltos.", as: "root" },
      ],
    },
  },
  {
    id: "lab-13",
    track: "pdf",
    title: "El proyecto ruso busca cómo llamarse",
    story: "Los repos de DNF ya quedaron, así que se puede bajar words y usar el diccionario. El proyecto ruso cambia de nombre y nos vamos a guiar por las palabras que contienen ich. Esa lista hay que guardarla.",
    objective: [
      "Fuente: /usr/share/dict/words.",
      "Líneas que contienen ich.",
      "Guardar en /root/lines.",
    ],
    where: "client",
    steps: [
      "Antes: en el client, repos DNF ok (lab Repositorios DNF) si hace falta instalar el diccionario.",
      "Fuente: /usr/share/dict/words.",
      "Quedate con las palabras que contienen ich.",
      "Guardar el resultado en /root/lines.",
    ],
    help: {
      tip: "Si el diccionario no existe, no inventes el archivo: el paquete que lo provee se instala con dnf, después de tener repos en esta máquina.",
      videoHint: "Video de este lab: Q13.",
      videos: [{ title: "Q13: grep en un diccionario", url: YT.grep }],
      commands: [
        { cmd: "man grep", why: "Por si el enunciado pide inicio de línea o palabra entera.", as: "root" },
        { cmd: "dnf repolist; ls /usr/share/dict/words || dnf provides /usr/share/dict/words", why: "Primero repos en el client. Si no está words, dnf provides dice el paquete (a menudo words o similar) y lo instalás con dnf install.", as: "root" },
        { cmd: "grep ich /usr/share/dict/words > /root/lines", why: "ich en cualquier parte de la línea. No hace falta -E.", as: "root" },
        { cmd: "wc -l /root/lines && head /root/lines", why: "Tiene que haber líneas, y todas con ich.", as: "root" },
      ],
    },
  },
  {
    id: "lab-14",
    track: "pdf",
    title: "Arce trajo sus archivos de otra máquina",
    story: "Arce trabajaba en otra máquina. Sus archivos vinieron con él.\n\nEsos archivos no guardan el nombre arce. Guardan el número de la cuenta, el 1111.\n\nSi acá la cuenta nace con otro número, los archivos no lo toman como dueño. Siguen diciendo 1111.",
    objective: [
      "Usuario arce.",
      "UID 1111.",
      "Contraseña lalala.",
    ],
    where: "client",
    steps: [
      "Usuario: arce.",
      "UID: 1111.",
      "Contraseña del ejercicio: lalala.",
    ],
    note: "El usuario de este lab es arce.",
    help: {
      tip: "Si el UID 1111 ya existe, id 1111 te lo dice antes de que useradd falle.",
      videoHint: "Video de este lab: Q14.",
      videos: [{ title: "Q14: Usuario con UID fijo", url: YT.uid }],
      commands: [
        { cmd: "getent passwd 1111", why: "Ver si el UID está libre.", as: "root" },
        { cmd: "useradd -u 1111 arce", why: "-u fija el UID.", as: "root" },
        { cmd: "echo 'lalala' | passwd --stdin arce", why: "Contraseña del ejercicio, sin modo interactivo. Misma idea que felipe/erik: lalala.", as: "root" },
        { cmd: "id arce", why: "Tiene que mostrar uid=1111.", as: "root" },
      ],
    },
  },
  {
    id: "lab-15",
    track: "pdf",
    title: "Operaciones quiere un disco compartido que no se pierda al reiniciar",
    story:
      "Te pusieron de sysadmin junior en el server. Llegó un disco extra y sigue vacío: nadie lo usa.\n\nOperaciones pide un espacio con nombre para compartir archivos entre servicios (wshare), formateado y montado en /mnt/wshare. Tiene que volver solo después de un reboot: si alguien reinicia el server a la noche, la carpeta no puede quedar vacía.\n\nLVM arma capas (disco/partición → grupo → volumen con nombre) para poder crecer ese espacio después sin reparticionar a mano. En este lab: wgroup, wshare, PE de 8 MB, 50 extents.",
    objective: [
      "Grupo wgroup con bloques de 8 MB.",
      "Volumen wshare de 50 bloques, en ext4.",
      "Montado en /mnt/wshare y que vuelva solo al boot (por UUID).",
    ],
    where: "server",
    steps: [
      "Instalá lvm2 (trae pvcreate, vgcreate, lvcreate). En esta VM suele faltar.",
      "Ver el disco extra con lsblk (acá suele ser sdb; no toques sda con /).",
      "Con fdisk: partición ~+450M tipo 8e (LVM). Dejá el resto del disco para swap.",
      "pvcreate /dev/sdb1 → vgcreate -s 8M wgroup → lvcreate -n wshare -l 50.",
      "mkfs.ext4, montar en /mnt/wshare, fstab por UUID.",
    ],
    note: "Empezá instalando lvm2: sin eso pvcreate no existe. Camino único: fdisk como el video Q15. No marques el disco entero con pvcreate (/dev/sdb): después no hay swap. 50 × 8 MB = 400 MB. Glosario: LVM, PV, VG, LV, PE.",
    help: {
      tip: "Primero: dnf install -y lvm2. En esta VM de práctica pvcreate suele no estar; sin el paquete el lab se traba.\n\nDespués un solo camino (como el video): fdisk → pvcreate sdb1 → vg → lv → formato → mount → fstab.\n\nCapas: PV (partición marcada) → VG wgroup (tanque; PE = ladrillo, acá 8 MB) → LV wshare (50 PE = 400 MB) → ext4 + /mnt/wshare.\n\nNo uses parted ni pvcreate /dev/sdb en este lab. Tipo LVM en fdisk = 8e.",
      videoHint: "Q15: primero dnf install -y lvm2. Luego fdisk /dev/sdb: n → p → Enter → Enter → +450M → t → 8e → p → w. Después pvcreate /dev/sdb1.",
      videos: [{ title: "Q15: Crear y montar LVM", url: YT.lvmCreate }],
      commands: [
        { cmd: "dnf repolist && dnf install -y lvm2", why: "Paso 1 — instalá lvm2 YA. Trae pvcreate, vgcreate y lvcreate. En esta VM suelen faltar: si saltás este paso, más adelante vas a ver command not found. Repos del server primero (lab Repositorios DNF).", as: "root" },
        { cmd: "lsblk -f", why: "Paso 2 — disco extra. sda tiene / y /boot: no lo toques. sdb ~1G vacío: ese es. La ruta es /dev/sdb (siempre /dev/ + NAME).", as: "root" },
        {
          cmd: "fdisk /dev/sdb",
          why: "Paso 3 — entrá a fdisk con la ruta completa (/dev/sdb, no sdb solo).\n\nDentro, fdisk pregunta una cosa a la vez. En cada prompt:\n\nCommand (m for help): → n\n  (nueva partición)\nPartition type: → p\n  (primaria)\nPartition number: → Enter\n  (aceptá el default 1; no hace falta escribir 1)\nFirst sector (... default 2048): → Enter\n  (aceptá el default; no escribas 2048)\nLast sector (...): → +450M\n  (tamaño; el + va pegado, sin espacio)\n\nCommand (m for help): → t\n  (cambiar tipo de la partición)\nHex code (type L to list types): → 8e\n  (Linux LVM)\nCommand (m for help): → p\n  (minúscula; P mayúscula falla). Revisá algo así:\n\n  Device     Boot Start    End Sectors  Size Id Type\n  /dev/sdb1        2048 ...           450M 8e Linux LVM\n\n  Tiene que decir /dev/sdb1, ~450M e Id 8e / Linux LVM.\nCommand (m for help): → w\n  (guardar y salir; q descarta sin escribir)\n\nSi pregunta Remove signature?: y.\nQueda /dev/sdb1. El resto de sdb queda libre para el lab de swap.",
          as: "root",
        },
        { cmd: "lsblk -f", why: "Paso 4 — tiene que verse sdb1. Todavía sin filesystem de LVM encima: eso viene después.", as: "root" },
        { cmd: "pvcreate /dev/sdb1", why: "Paso 5 — marca la partición como PV. Con el 1 al final. Sin el 1 (/dev/sdb) gastás el disco entero y el swap no entra. Si dice command not found: volvé al paso 1 e instalá lvm2.", as: "root" },
        {
          cmd: "vgcreate -s 8M wgroup /dev/sdb1",
          why: "Paso 6 — creás el Volume Group (VG).\n\n¿Para qué pediría esto alguien?\nPorque no quieren “usar el disco crudo”: quieren un tanque con nombre (wgroup) del que después se sacan trozos con nombre (como wshare). Así mañana pueden agrandar ese espacio sin reparticionar a mano.\n\n¿Qué ganás al hacerlo?\nDejá de tener solo una partición marcada (PV) y pasás a tener un pool administrable: wgroup, partido en ladrillos de 8 MB (PE). Recién ahí podés crear el volumen wshare adentro.\n\nDesglose:\nvgcreate → comando\n-s → opción physicalextentsize: fija el tamaño de cada PE (Physical Extent = ladrillo del VG). Sin -s, el VG usa el default del sistema (suele ser 4M) y no cumplís el pedido de bloques de 8 MB.\n-s 8M → acá cada PE mide 8 MB. El 8M va junto, sin espacio (no 8 M). No pongas -s -8M: el segundo guion lo toma como tamaño negativo y falla.\nwgroup → nombre del tanque (así lo pide el lab)\n/dev/sdb1 → el PV que marcaste (con el 1)\n\nComprobá: vgs  → tiene que aparecer wgroup.",
          as: "root",
        },
        {
          cmd: "lvcreate -n wshare -l 50 wgroup",
          why: "Paso 7 — creás el Logical Volume (LV): el trozo con nombre que después formateás y montás.\n\n¿Para qué pediría esto alguien?\nOperaciones no quiere escribir dumps o archivos compartidos directo en / (el disco del sistema). Quieren un “disco” aparte con nombre (wshare), que se monte en /mnt/wshare y se pueda agrandar después.\n\n¿Qué ganás al hacerlo?\nDentro del tanque wgroup aparece /dev/wgroup/wshare. Todavía no tiene filesystem: eso es mkfs en el paso siguiente. Pero ya es el dispositivo usable.\n\nDesglose:\nlvcreate → comando\n-n wshare → nombre del LV\n-l 50 → cantidad de PE (ladrillos). L minúscula = extents, NO megabytes.\n  50 × 8 MB = 400 MB (porque el VG tiene PE de 8M).\n  -L mayúscula sería tamaño en MB/GB: otra cosa; acá el lab pide extents.\nwgroup → de qué VG lo cortás\n\nComprobá: lvs  → tiene que verse wshare. Ruta: /dev/wgroup/wshare.",
          as: "root",
        },
        { cmd: "mkfs.ext4 /dev/wgroup/wshare && mkdir -p /mnt/wshare", why: "Paso 8 — formato sobre el LV (no sobre sdb1) y carpeta de montaje.", as: "root" },
        { cmd: "mount /dev/wgroup/wshare /mnt/wshare && findmnt /mnt/wshare", why: "Paso 9 — usable ahora. Falta fstab para el reboot.", as: "root" },
        {
          cmd: "blkid /dev/wgroup/wshare",
          why: "Paso 10 — UUID del LV wshare (no el de sdb1 ni el de sda). Te tiene que salir algo así:\n\n/dev/wgroup/wshare: UUID=\"d92a4399-b6cd-4b4c-a097-baf3c4db1548\" BLOCK_SIZE=\"1024\" TYPE=\"ext4\"\n\nCopiá solo el valor entre comillas de UUID=\"...\". El tuyo va a ser otro número; este es un ejemplo.",
          as: "root",
        },
        {
          cmd: "vi /etc/fstab",
          why: "Paso 11 — persistencia al reboot. Abrí fstab con vi y al final agregá UNA línea (seis campos, separados por espacio).\n\nSi blkid te dio el UUID del ejemplo de arriba, la línea queda así:\n\nUUID=d92a4399-b6cd-4b4c-a097-baf3c4db1548 /mnt/wshare ext4 defaults 0 0\n\nSin comillas. Con TU UUID (no copies el ejemplo a ciegas si el tuyo es otro).\n\nEn vi: G va al final · o abre línea abajo · i inserta · Esc · :wq Enter guarda.\n:q! sale sin guardar si te equivocaste.\n\nSin esta línea, al reboot /mnt/wshare queda vacío aunque el LV siga existiendo.",
          as: "root",
        },
        {
          cmd: "umount /mnt/wshare && mount -a && findmnt /mnt/wshare",
          why: "Paso 12 — prueba fstab sin reiniciar (simula el boot).\n\numount /mnt/wshare → lo sacás a mano; la carpeta queda “vacía” otra vez.\nmount -a → lee /etc/fstab y monta todo lo pendiente (incluida tu línea UUID).\nfindmnt /mnt/wshare → tiene que volver a mostrar TARGET /mnt/wshare y FSTYPE ext4.\n\nSi findmnt no muestra nada: la línea de fstab está mal (UUID, tipazo, campos) o no se guardó.\nSi esto pasa, al reboot real /mnt/wshare también quedaría vacío.",
          as: "root",
        },
      ],
    },
  },
  {
    id: "lab-16",
    track: "pdf",
    title: "La máquina se queda sin memoria y necesita una reserva",
    story:
      "Cuando la RAM se llena, el sistema puede usar un pedazo de disco como reserva (swap) para no trabarse del todo.\n\nOperaciones pide ~400 MB de swap en el server, activo ahora y que vuelva solo después de un reboot.\n\nVas a usar el espacio libre del mismo disco extra del lab anterior (sdb): sdb1 ya es LVM (wshare); el swap va en una partición nueva (sdb2).",
    objective: [
      "Partición swap de 400 MB.",
      "Activa ahora y en fstab.",
    ],
    where: "server",
    steps: [
      "Ver con lsblk que sdb1 (LVM) existe y queda espacio libre en sdb.",
      "Con fdisk: segunda partición ~+420M tipo 82 (swap). No toques sdb1.",
      "mkswap + swapon ahora.",
      "fstab por UUID (vi) y probar con swapon -a.",
    ],
    note: "Hacé este lab después del LVM (wshare). Camino único: fdisk como el video Q16. No uses parted acá. En Last sector usá +420M (el lab pide ~400 MB; +420M da margen). Tipo swap = 82 (o alias swap).",
    help: {
      tip: "Un solo camino (como el video): fdisk → mkswap sdb2 → swapon → blkid → fstab → swapon -a.\n\nSi en el lab anterior marcaste el disco entero con pvcreate (/dev/sdb), no queda espacio: este lab necesita una partición aparte.\n\nSwap no es ext4: se formatea con mkswap, no con mkfs. En fstab la línea lleva swap swap (punto de montaje y tipo).",
      videoHint: "Q16: primero lsblk. Luego fdisk /dev/sdb: n → p → Enter (nº 2) → Enter (First sector) → +420M → t → 2 → 82 → p → w. Después mkswap /dev/sdb2, swapon, fstab con vi.",
      videos: [{ title: "Q16: Partición swap de 400M", url: YT.swap }],
      commands: [
        {
          cmd: "lsblk -f",
          why: "Paso 1 — mirá el disco extra.\n\nsdb1 tiene que existir (LVM del lab anterior).\nTiene que quedar espacio libre en sdb (sin particionar) para el swap.\nEn el video: sda1 = LVM, sda2 = swap. Acá suele ser sdb1 / sdb2.\nNo toques sda (tiene /).",
          as: "root",
        },
        {
          cmd: "fdisk /dev/sdb",
          why: "Paso 2 — entrá a fdisk con la ruta del disco (/dev/sdb, no /dev/sdb1).\n\nDentro, fdisk pregunta una cosa a la vez. En cada prompt:\n\nCommand (m for help): → n\n  (nueva partición; no borres la 1)\nPartition type: → p\n  (primaria)\nPartition number: → Enter\n  (default 2 si ya existe sdb1)\nFirst sector (...): → Enter\n  (aceptá el default; arranca después de sdb1)\nLast sector (...): → +420M\n  (usá exactamente +420M: el + significa “420 MB desde acá”. El lab pide ~400 MB; con +420M no te quedás corto. Junto, sin espacio. No pongas -420M ni solo 420M)\n\nCommand (m for help): → t\n  (cambiar tipo)\nPartition number: → 2\n  (la nueva; no pongas 1: esa es LVM)\nHex code or alias: → 82\n  (Linux swap; también acepta el alias swap)\nCommand (m for help): → p\n  (minúscula). Revisá algo así:\n\n  Device     Boot Start ...  Size Id Type\n  /dev/sdb1  ...         ~450M 8e Linux LVM\n  /dev/sdb2  ...         ~420M 82 Linux swap\n\nCommand (m for help): → w\n  (guardar; q descarta)\n\nSi pregunta Remove signature?: y.",
          as: "root",
        },
        {
          cmd: "lsblk -f",
          why: "Paso 3 — tiene que verse sdb2. Todavía puede no decir TYPE=swap: eso lo pone mkswap.",
          as: "root",
        },
        {
          cmd: "mkswap /dev/sdb2",
          why: "Paso 4 — formatea la partición como swap.\n\n¿Para qué?\nSin esto el kernel no la usa como reserva de memoria: solo es una partición vacía con tipo 82.\n\nNo uses mkfs.ext4 acá. Es mkswap.\nEn el video suele ser /dev/sda2; acá /dev/sdb2.\nblkid después debería mostrar TYPE=\"swap\".",
          as: "root",
        },
        {
          cmd: "swapon /dev/sdb2 && swapon --show",
          why: "Paso 5 — activá el swap ahora.\n\nswapon /dev/sdb2 → lo prende en esta sesión.\nswapon --show (o -s) → tiene que listar sdb2 (o su UUID).\n\nEsto solo dura hasta el reboot: falta fstab.",
          as: "root",
        },
        {
          cmd: "blkid /dev/sdb2",
          why: "Paso 6 — UUID de la partición swap (no el de wshare ni sdb1). Te tiene que salir algo así:\n\n/dev/sdb2: UUID=\"e284f4ce-38f5-423f-ae6a-6bee5326da22\" TYPE=\"swap\"\n\nEn blkid el UUID viene entre comillas: está bien. Al pegarlo en fstab, sacá las comillas.\nCopiá solo el valor. El tuyo puede ser otro número.",
          as: "root",
        },
        {
          cmd: "vi /etc/fstab",
          why: "Paso 7 — persistencia al reboot. Abrí fstab con vi y al final agregá UNA línea (seis campos).\n\nEjemplo correcto (con un UUID real de swap; el tuyo será otro):\n\nUUID=e284f4ce-38f5-423f-ae6a-6bee5326da22 swap swap defaults 0 0\n\nMal (no copies así):\nUUID=\"e284f4ce-…\" swap swap …   ← sin comillas alrededor del UUID\n\nTruco: van dos veces la palabra swap (dónde + tipo). No es /mnt/….\nDejá intactas las líneas de /, /boot y /mnt/wshare.\n\nEn vi: G → o → i → pegá la línea → Esc → :wq Enter.\n\nSin esta línea, al reboot el swap nuevo no vuelve.",
          as: "root",
        },
        {
          cmd: "swapoff /dev/sdb2; swapon -a && swapon --show",
          why: "Paso 8 — prueba fstab sin reiniciar (simula el boot).\n\n¿Para qué?\nComprobar que la línea de fstab prende el swap sola, sin reiniciar de verdad.\n\nswapoff /dev/sdb2 → lo apagás a mano (queda como “recién booteado” sin esa reserva).\nswapon -a → lee /etc/fstab y activa TODO el swap de ahí (incluida tu línea UUID).\nswapon --show → tiene que volver a listar /dev/sdb2 (SIZE ~420M).\n\nEl ; asegura que swapoff corra igual. El && solo llega al --show si swapon -a salió bien.\n\nSi no aparece: UUID con comillas, tipazo, o no guardaste con :wq.",
          as: "root",
        },
      ],
    },
  },
  {
    id: "lab-17",
    track: "pdf",
    title: "Hay que cambiar el tamaño del volumen sin perder datos",
    story:
      "Operaciones tiene un volumen vo (filesystem montado) demasiado grande y quiere dejarlo cerca de 50 MB (vale 30–70), sin perder datos.\n\nAchicar mal se rompe: si bajás solo el LV y el ext4 sigue grande, el filesystem no cabe. Hay que achicar primero el ext4 y después el LV (camino del video Q17).\n\nEn esta VM, después de wshare + swap, vo todavía no existe: primero lo armás (prep) y después lo achicás.",
    objective: [
      "LV vo en el VG vgroup.",
      "Tamaño final cerca de 50 MB (vale 30–70).",
      "Filesystem ajustado junto con el LV.",
    ],
    where: "server",
    steps: [
      "Si vo no existe: prep con fdisk (sdb3 ~+130M, tipo 8e) → vgroup PE 10M → vo 12 extents → ext4 en /mnt/vo.",
      "Desmontar /mnt/vo.",
      "Camino del video Q17: e2fsck → resize2fs 50M → lvreduce -l 5.",
      "Remontar y comprobar lvs + df (~50 MB).",
    ],
    note: "Camino único: video Q17 (resize2fs + lvreduce). No uses el prep de disco entero ni mezcles con lvreduce -r en este lab. PE = 10M; 12 extents = 120 MB; 5 extents = 50 MB. En el disco de práctica suele quedar ~150 MB libres después de sdb1/sdb2: +130M entra.",
    help: {
      tip: "Un solo camino (Q17): prep sdb3 → vo 120 MB → umount → e2fsck → resize2fs 50M → lvreduce -l 5 → mount.\n\n-l = extents (minúscula). Con PE 10M: -l 5 = 50 MB exactos.\n-L = megabytes (mayúscula): otra cosa.\n\nOrden al achicar: primero el filesystem (resize2fs), después el LV (lvreduce). Al revés falla.\n\nNo marques /dev/sdb entero: ahí viven wshare y swap. Q15b (agrandar) es otro video; no lo mezcles acá.",
      videoHint: "Q17: fdisk tercera partición +130M tipo 8e → vgcreate -s 10M vgroup → lvcreate -l 12 -n vo → umount → e2fsck -f → resize2fs 50M → lvreduce -l 5 → mount. Acá suele ser sdb3 (en el video sda3).",
      videos: [
        { title: "Q17: Resize de un logical volume", url: YT.lvmResize },
        { title: "Q15b: Extender un LV y el filesystem", url: YT.lvmExtend },
      ],
      commands: [
        {
          cmd: "lsblk -f && lvs 2>/dev/null; findmnt /mnt/vo 2>/dev/null || true",
          why: "Paso 1 — ¿ya existe vo?\n\nSi lvs muestra vo y findmnt muestra /mnt/vo: saltá la prep (pasos 2–6) y andá al umount.\nSi no hay vo: seguí con fdisk. Tiene que quedar espacio libre en sdb después de sdb1 (LVM) y sdb2 (swap).",
          as: "root",
        },
        {
          cmd: "fdisk /dev/sdb",
          why: "Paso 2 — prep · partición nueva (solo si no hay vo). Disco /dev/sdb, no sdb1/sdb2.\n\nEn cada prompt:\n\nCommand: → n\nPartition type: → p\nPartition number: → Enter\n  (default 3 si ya están 1 y 2)\nFirst sector: → Enter\nLast sector: → +130M\n  (+ pegado; no -130M)\n\nCommand: → t\nPartition number: → 3\n  (la nueva; no toques 1 ni 2)\nHex code: → 8e\n  (Linux LVM)\nCommand: → p\n  Revisá algo así:\n  /dev/sdb1 … 8e Linux LVM\n  /dev/sdb2 … 82 Linux swap\n  /dev/sdb3 … ~130M 8e Linux LVM\nCommand: → w",
          as: "root",
        },
        {
          cmd: "pvcreate /dev/sdb3",
          why: "Paso 3 — prep · marcá sdb3 como PV. Con el 3. No uses /dev/sdb (disco entero).",
          as: "root",
        },
        {
          cmd: "vgcreate -s 10M vgroup /dev/sdb3",
          why: "Paso 4 — prep · VG vgroup (nombre distinto de wgroup).\n\n-s 10M → cada PE mide 10 MB (junto, sin espacio; no -s -10M).\nvgroup → nombre del tanque de este lab.\n/dev/sdb3 → el PV nuevo.\n\nComprobá: vgs → vgroup con Ext 10.00m.",
          as: "root",
        },
        {
          cmd: "lvcreate -n vo -l 12 vgroup",
          why: "Paso 5 — prep · LV vo con 12 PE.\n\n-n vo → nombre\n-l 12 → 12 ladrillos (L minúscula). 12 × 10 MB = 120 MB.\nQueda /dev/vgroup/vo.\n\nDespués lo vamos a bajar a -l 5 (50 MB).",
          as: "root",
        },
        {
          cmd: "mkfs.ext4 /dev/vgroup/vo && mkdir -p /mnt/vo && mount /dev/vgroup/vo /mnt/vo && blkid /dev/vgroup/vo",
          why: "Paso 6 — prep · formato, montaje y UUID.\n\nmkfs.ext4 sobre el LV (no sobre sdb3).\nCopiá el UUID de blkid (sin comillas) para fstab.",
          as: "root",
        },
        {
          cmd: "vi /etc/fstab",
          why: "Paso 7 — prep · línea para que mount -a funcione después:\n\nUUID=EL-DE-BLKID /mnt/vo ext4 defaults 0 0\n\nSin comillas. No borres wshare ni swap.\nEn vi: G → o → pegá → Esc → :wq",
          as: "root",
        },
        {
          cmd: "lvs && df -h /mnt/vo",
          why: "Paso 8 — antes de achicar. lvs ~120M; df un poco menos (reserva ext4). Si no ves vo, volvé a la prep.",
          as: "root",
        },
        {
          cmd: "umount /mnt/vo",
          why: "Paso 9 — desmontar. El video Q17 lo hace siempre antes de achicar. Con el filesystem montado, resize2fs/lvreduce al achicar suelen fallar o ser peligrosos.",
          as: "root",
        },
        {
          cmd: "e2fsck -f /dev/vgroup/vo",
          why: "Paso 10 — chequeo del ext4 antes de resize2fs (camino del video).\n\n-f fuerza el check aunque parezca limpio.\nSi pide arreglar algo, aceptá (y) si es seguro; si no sabés, pará y mirá el mensaje.",
          as: "root",
        },
        {
          cmd: "resize2fs /dev/vgroup/vo 50M",
          why: "Paso 11 — achicá el filesystem primero a 50M.\n\n¿Para qué?\nEl ext4 tiene que quedar ≤ al LV nuevo. Si dejás el ext4 en 120M y bajás el LV a 50M, se rompe.\n\nUsá 50M (el lab acepta 30–70). Tiene que coincidir con el lvreduce de después: -l 5 con PE 10M = 50 MB.\nSi ponés 55M y después -l 5, lvreduce se queja: filesystem larger than requested size.",
          as: "root",
        },
        {
          cmd: "lvreduce -l 5 /dev/vgroup/vo",
          why: "Paso 12 — achicá el LV a 5 extents.\n\n-l 5 → L minúscula = extents, no megabytes.\nCon PE 10M: 5 × 10 = 50 MB.\nPuede pedir confirmación: escribí y.\n\nSin haber hecho resize2fs antes, esto falla.",
          as: "root",
        },
        {
          cmd: "mount -a && lvs && df -h /mnt/vo",
          why: "Paso 13 — remontar con fstab y comprobar.\n\nlvs → vo ~50.00m\ndf → cerca de 50M (suele mostrar un poco menos por reserva ext4)\nRango OK del lab: 30–70 MB.\n\nSi mount -a no monta: mirá la línea de /mnt/vo en fstab (UUID sin comillas).",
          as: "root",
        },
      ],
    },
  },
  {
    id: "lab-08",
    track: "pdf",
    title: "Una carpeta del servidor tiene que aparecer sola en el cliente",
    story:
      "netuser1 guarda su home en el server (/home/guests/netuser1). Desde el client tiene que abrir esa misma carpeta por red, como si estuviera local.\n\nNFS es el share: el server publica el directorio. Autofs es el montaje bajo demanda en el client: no monta nada hasta que alguien entra a /netdir/netuser1; ahí dispara el mount del export (172.16.1.13) y, si nadie lo usa un rato, lo desmonta solo. Si lo dejás fijo en fstab, queda montado siempre y un fallo de red al boot te puede trabar.\n\nEn el examen suele pedirse solo el client (el server ya viene armado). El video hace las dos máquinas de propósito: así entendés de dónde sale el export. El UID/GID de netuser1 tiene que coincidir en server y client; si no, el mount puede aparecer y los permisos igual fallan.",
    objective: [
      "Usuario netuser1, home /home/guests/netuser1, pass arceprog.",
      "Export NFS en el server.",
      "Client: /netdir/netuser1 monta 172.16.1.13.",
    ],
    where: "server",
    steps: [
      "Antes: repos DNF ok en server y en client (lab Repositorios DNF en cada una).",
      "Server: usuario netuser1 (pass arceprog), home /home/guests/netuser1 con dueño correcto, export NFS + firewall + nfs-server enable.",
      "Client: mismo usuario (mismo UID/GID si hace falta), paquetes autofs y nfs-utils.",
      "Client: auto.master.d apunta /netdir al mapa; el mapa monta netuser1 desde 172.16.1.13.",
      "Probar: entrar a /netdir/netuser1 y ver el mount. Persistente en las dos.",
    ],
    note: "Autofs suele llevar tiempo (el video lo marca como de lo más pesado). Si el reloj aprieta, priorizá otras tareas y volvé después.",
    help: {
      tip: "En la lista va al final del bloque server (igual tocás client). Orden del video: NFS + firewall en el server → showmount desde el client → recién ahí autofs.\nDos archivos en el client:\n1) drop-in en /etc/auto.master.d/ → base /netdir y ruta del mapa\n2) mapa /etc/auto.netdir → netuser1 -rw 172.16.1.13:/home/guests/netuser1\nDespués: systemctl enable --now autofs. Comprobá con ls /netdir/netuser1 y mount | grep netuser1.\nUID/GID iguales en las dos máquinas.",
      videoHint: "Video de este lab: Q08. El examen suele ser solo client; el video arma también el server.",
      videos: [{ title: "Q08: Autofs con NFS", url: YT.autofs }],
      commands: [
        { cmd: "dnf repolist && dnf install -y nfs-utils", why: "Server. Primero repos DNF en ESA VM, después nfs-utils.", as: "root" },
        { cmd: "mkdir -p /home/guests && useradd -d /home/guests/netuser1 netuser1 && echo arceprog | passwd --stdin netuser1 && chown -R netuser1:netuser1 /home/guests/netuser1", why: "Server. Usuario, home y dueño. Si el home quedó root:root, autofs monta pero no escribe. Anotá id netuser1 (UID/GID) para el client.", as: "root" },
        { cmd: "echo '/home/guests/netuser1 172.16.1.12(rw,sync,no_root_squash)' >> /etc/exports", why: "Server. Export solo hacia el client (172.16.1.12). Ajustá opciones si el lab pide otra cosa.", as: "root" },
        { cmd: "firewall-cmd --add-service=nfs --permanent && firewall-cmd --add-service=rpc-bind --permanent && firewall-cmd --add-service=mountd --permanent && firewall-cmd --reload", why: "Server. Sin firewall el client no ve el export. El video suma nfs; rpc-bind/mountd suelen hacer falta también. Siempre --permanent + reload.", as: "root" },
        { cmd: "exportfs -r && systemctl enable --now nfs-server", why: "Server. Publicar /etc/exports y dejar nfs-server al boot.", as: "root" },
        { cmd: "dnf repolist && dnf install -y autofs nfs-utils", why: "Client. autofs + cliente NFS. Primero repos en el client.", as: "root" },
        { cmd: "id netuser1 || useradd -u UID -g GID -d /home/guests/netuser1 netuser1; echo arceprog | passwd --stdin netuser1", why: "Client. Misma cuenta y pass. UID/GID = los del server (id netuser1 allá). Si ya existe con otros números: usermod -u y groupmod -g como en el video.", as: "root" },
        { cmd: "showmount -e 172.16.1.13", why: "Client. Si esto falla, no pelees con autofs: mirá export, firewall y nfs-server en el server.", as: "root" },
        { cmd: "printf '%s\\n' 'netuser1 -rw 172.16.1.13:/home/guests/netuser1' > /etc/auto.netdir", why: "Client · mapa. Clave = subcarpeta bajo /netdir. Valor = host:/export. -rw = lectura/escritura.", as: "root" },
        { cmd: "printf '%s\\n' '/netdir /etc/auto.netdir' > /etc/auto.master.d/netdir.autofs", why: "Client · master drop-in. Base /netdir → usa ese mapa. También se puede una línea en /etc/auto.master; el video prefiere auto.master.d.", as: "root" },
        { cmd: "systemctl enable --now autofs", why: "Client. Arranca automount y lo deja al boot.", as: "root" },
        { cmd: "ls /netdir/netuser1 && mount | grep netuser1", why: "Client. El ls dispara el mount. mount | grep tiene que mostrar el NFS del server.", as: "root" },
      ],
    },
  },
  {
    id: "lab-18",
    track: "pdf",
    title: "Operaciones pidió tuned en esta máquina",
    story: "Esta máquina quedó lenta para el trabajo que le toca. Desde operaciones nos dijeron que no la ajustemos a mano: que usemos tuned.\n\ntuned se ocupa de eso. Es un servicio que aplica un perfil: junta los ajustes de CPU, disco y kernel bajo un nombre, según para qué se usa la máquina. Los perfiles que trae el paquete están en /usr/lib/tuned.\n\nEn Rocky mínima / Vagrant a menudo el paquete no viene: si tuned-adm dice command not found, hay que instalarlo con dnf. Después: poner el perfil que recomienda y dejar el servicio activo. Si no queda activo, al reiniciar la máquina vuelve a trabajar sin ese ajuste.",
    objective: [
      "Instalar el paquete tuned si no está (dnf install tuned).",
      "Perfil que diga tuned-adm recommend.",
      "Servicio tuned activo y enable (sigue después de reboot).",
    ],
    where: "client",
    steps: [
      "Antes: en el client, repos DNF ok (lab Repositorios DNF).",
      "Si tuned-adm no está (command not found), instalar el paquete tuned.",
      "Activar el servicio: systemctl enable --now tuned.",
      "Aplicar el perfil que imprime tuned-adm recommend.",
      "Tiene que quedar elegido después de reboot.",
    ],
    note: "El punto es cambiar el profile y que quede permanente. tuned-adm profile lo escribe en /etc/tuned/active_profile. Al reiniciar, el servicio tuned tiene que estar enable para leer ese archivo y volver a aplicarlo. Sin enable, el archivo puede quedar y el perfil igual no vuelve.",
    help: {
      tip: "Primero el paquete: which tuned-adm o rpm -q tuned. En esta box suele faltar → dnf install -y tuned (con BaseOS/AppStream).\nPara ver el perfil activo ahora: tuned-adm active (también cat /etc/tuned/active_profile).\nrecommend solo imprime un nombre: no lo guarda. profile NOMBRE lo aplica y lo escribe. enable --now tuned deja el servicio para el boot. Después de reboot, tuned-adm active tiene que mostrar el mismo nombre.",
      videoHint: "Video de este lab: Q18.",
      videos: [{ title: "Q18: Perfil recomendado de tuned", url: YT.tuned }],
      commands: [
        { cmd: "which tuned-adm || dnf install -y tuned", why: "Si which imprime una ruta, el paquete ya está. Si falla o dice command not found, instalá tuned. En Rocky de Vagrant a menudo no viene. Hace falta BaseOS/AppStream (lab Repositorios DNF).", as: "root" },
        { cmd: "systemctl enable --now tuned", why: "Arranca el servicio ya y lo deja para el próximo boot. Sin enable, al reiniciar tuned no vuelve y el perfil no se reaplica.", as: "root" },
        { cmd: "systemctl status tuned", why: "Mirar si el demonio está arriba. active (running) = encendido ahora. También: systemctl is-active tuned y systemctl is-enabled tuned.", as: "root" },
        { cmd: "tuned-adm recommend", why: "Solo dice cuál conviene. No cambia nada y no lo guarda.", as: "root" },
        { cmd: "tuned-adm profile NOMBRE", why: "NOMBRE es el que imprimió recommend. Lo aplica ahora y lo guarda en /etc/tuned/active_profile.", as: "root" },
        { cmd: "tuned-adm active", why: "Muestra el perfil que tuned tiene activo ahora (Current active profile: …). Es la forma de comprobarlo. También: cat /etc/tuned/active_profile. Tiene que coincidir con lo que dijo recommend. Después de reboot, repetilo.", as: "root" },
      ],
    },
  },
  {
    id: "lab-journal",
    track: "pdf",
    title: "Roman reinició y se le perdieron los logs",
    story: "Roman miró journalctl, reinició el client y el historial de antes del boot ya no estaba.\n\nNecesitamos que journald guarde en disco, en /var/log/journal, y que al volver a prender sigan ahí.",
    objective: [
      "Storage=persistent.",
      "Existe /var/log/journal.",
      "Sigue después de reboot.",
    ],
    where: "client",
    steps: [
      "Después de tuned: mismo bloque, servicios del sistema en el client.",
      "Storage=persistent en journald.conf.",
      "Crear /var/log/journal si no está y reiniciar systemd-journald.",
      "Después de un reboot, journalctl -b -1 tiene que mostrar el boot anterior.",
    ],
    help: {
      tip: "En memoria (volatile) el journal vive en /run y el reboot lo borra. persistent lo baja a /var/log/journal. La línea tiene que estar sin # adelante.",
      videoHint: "Está en la playlist del otro repo, parte 3. Ahí deja el journal en disco para que sobreviva al reboot.",
      videos: [{ title: "Parte 3: journal persistente", url: YT.harunaSystems }],
      commands: [
        { cmd: "grep -E '^#?Storage=' /etc/systemd/journald.conf", why: "Ver si Storage está comentado. auto a veces persiste, pero el lab pide dejarlo escrito.", as: "root" },
        { cmd: "sed -i 's/^#\\?Storage=.*/Storage=persistent/' /etc/systemd/journald.conf", why: "Deja Storage=persistent. Si no había línea, agregala a mano en la sección [Journal].", as: "root" },
        { cmd: "mkdir -p /var/log/journal && systemd-tmpfiles --create --prefix /var/log/journal && systemctl restart systemd-journald", why: "Crea el directorio, le pone el dueño systemd-journal y recarga el demonio.", as: "root" },
        { cmd: "logger roman-journal-ok && journalctl -t root -n 5 --no-pager", why: "Deja una marca. Después del reboot, journalctl -b -1 tiene que poder mostrarla.", as: "root" },
      ],
    },
  },
  {
    id: "lab-19",
    track: "pdf",
    title: "Quien entra tiene que ver un mensaje",
    story: "Al iniciar sesión tiene que aparecer un saludo. Puede ser para una persona o para todos los que entran.\n\nLlega gente nueva a la empresa. Al entrar, cada uno tiene que ver un saludo.\n\nJoaquin acaba de sumarse al trabajo. A él le toca un saludo propio, porque es clave para el equipo. A los otros recién llegados les toca el saludo general por ser nuevos en la empresa.",
    objective: [
      "joaquin: \"Welcome to you, user Joaquin, you are amazing!\".",
      "Cualquier usuario: \"Welcome USUARIO, you are logged in!\".",
    ],
    where: "client",
    steps: [
      "Cuando entra joaquin, tiene que ver: Welcome to you, user Joaquin, you are amazing!",
      "Cualquier usuario que entre (por ejemplo felipe o erik) tiene que ver: Welcome USUARIO, you are logged in!",
      "USUARIO es el nombre de quien entró, no un texto fijo.",
    ],
    help: {
      tip: "El saludo de una sola persona va en su bashrc. El de todos va en profile.d. Si lo ponés solo en /etc/bashrc, un login no interactivo puede no verlo: probá con su - usuario.",
      videoHint: "Q19a es el mensaje de un usuario. Q19b es el de todos.",
      videos: [
        { title: "Q19a: Mensaje de login de un usuario", url: YT.loginUser },
        { title: "Q19b: Mensaje de login para todos", url: YT.loginAll },
      ],
      commands: [
        { cmd: "vi /home/joaquin/.bashrc", why: "Solo para Joaquin. Adentro agregá una línea:\necho \"Welcome to you, user Joaquin, you are amazing!\"\nDónde va la línea en el archivo no importa. El dueño del .bashrc tiene que ser joaquin.", as: "root" },
        { cmd: "echo 'echo \"Welcome $USER, you are logged in!\"' > /etc/profile.d/welcome.sh", why: "Para todos. $USER se expande al entrar (queda Welcome joaquin, … o Welcome felipe, …).", as: "root" },
        { cmd: "chmod 644 /etc/profile.d/welcome.sh", why: "Tiene que poder leerlo cualquier usuario.", as: "root" },
        { cmd: "su - joaquin", why: "Login de verdad. Vas a ver los dos mensajes; el orden no importa, algo así:\nWelcome to you, user Joaquin, you are amazing!\nWelcome joaquin, you are logged in!", as: "joaquin" },
        { cmd: "su - felipe", why: "Otro usuario: solo el saludo general (Welcome felipe, you are logged in!), no el de Joaquin.", as: "felipe" },
      ],
    },
  },
  {
    id: "lab-20",
    track: "pdf",
    title: "La imagen está en un registro privado",
    story: "El contenedor no está en el registro público. Hay que entrar al registro que nos pasan y traer la imagen.",
    objective: [
      "Clonar Text-To-PDF.",
      "Imagen localhost/text2pdf:latest.",
    ],
    where: "client",
    steps: [
      "Clonar https://github.com/sachinyadav3496/Text-To-PDF.git.",
      "Construir una imagen llamada text2pdf con el Dockerfile del repo.",
      "Etiquetarla localhost/text2pdf:latest.",
      "Verificar que la imagen existe en la máquina.",
    ],
    note: "En la edición con Flatpak este lab no es prioridad: el tema de contenedores es Flatpak. Si practicás la edición con Podman, este lab sí entra en la lista. Sin internet no se puede clonar.",
    help: {
      tip: "El nombre que pide el lab es el tag completo localhost/text2pdf:latest. podman images tiene que mostrar esa línea.",
      videoHint: "Q20a/b son registry privado. Q21 arma la imagen y el autostart. Para v10 priorizá Flatpak.",
      videos: [
        { title: "Q20a: Registry privado de Podman", url: YT.podmanRegistry },
        { title: "Q20b: Pull desde registry privado", url: YT.podmanPull },
        { title: "Q21: Imagen Podman y systemd", url: YT.podmanSystemd },
      ],
      commands: [
        { cmd: "dnf install -y podman git", why: "Herramientas de este lab.", as: "root" },
        { cmd: "git clone https://github.com/sachinyadav3496/Text-To-PDF.git", why: "El código y el Dockerfile.", as: "root" },
        { cmd: "podman build -t localhost/text2pdf:latest Text-To-PDF", why: "Construir y etiquetar en un paso. La ruta es la carpeta clonada.", as: "root" },
        { cmd: "podman images", why: "Tiene que listar localhost/text2pdf.", as: "root" },
      ],
    },
  },
  {
    id: "lab-21",
    track: "pdf",
    title: "Hay que poner el contenedor a correr",
    story: "La imagen ya está. Hay que levantar el contenedor con el nombre y los puertos que piden.",
    objective: [
      "Contenedor mycontainer, imagen localhost/text2pdf:latest.",
      "/opt/file → /data/input.",
      "/opt/processed → /data/output.",
    ],
    where: "client",
    steps: [
      "Contenedor llamado mycontainer, imagen localhost/text2pdf:latest.",
      "Montar /opt/file del host en /data/input.",
      "Montar /opt/processed del host en /data/output.",
    ],
    note: "Mismo aviso que el lab anterior: en v10 este tema no es el foco.",
    help: {
      tip: "Los directorios del host tienen que existir antes del -v. Si /opt/file es un archivo o no existe, el montaje falla.",
      videoHint: "Correr el contenedor con volúmenes está en Q21. Para v10, Flatpak.",
      videos: [{ title: "Q21: Imagen Podman y systemd", url: YT.podmanSystemd }],
      commands: [
        { cmd: "mkdir -p /opt/file /opt/processed", why: "Rutas del host. El enunciado las llama file y processed.", as: "root" },
        { cmd: "podman run -d --name mycontainer -v /opt/file:/data/input:Z -v /opt/processed:/data/output:Z localhost/text2pdf:latest", why: ":Z alcanza para SELinux en un lab. Sin -d el proceso se queda adelante.", as: "root" },
        { cmd: "podman ps", why: "mycontainer tiene que figurar.", as: "root" },
      ],
    },
  },
  {
    id: "lab-22",
    track: "pdf",
    title: "El contenedor tiene que volver cuando la máquina arranca",
    story: "Si se reinicia, el contenedor no puede quedar apagado. Tiene que levantarse con el usuario, sin que nadie abra sesión.",
    objective: [
      "Usuario student, contenedor mycontainer.",
      "Arranca al boot con linger, sin sesión abierta.",
    ],
    where: "client",
    steps: [
      "Correr el contenedor como el usuario student, nombre mycontainer.",
      "Mismos montajes: /opt/file → /data/input y /opt/processed → /data/output.",
      "Que arranque al boot con un servicio systemd de usuario.",
      "loginctl enable-linger student, para que el servicio viva sin una sesión activa.",
    ],
    note: "Si student no existe en la box, crealo para este lab. Es tema de contenedores con Podman, no de Flatpak.",
    help: {
      tip: "El servicio de usuario no es el de root. Hace falta systemctl --user, y linger para que arranque sin que student esté logueado.",
      videoHint: "Video de este lab: Q21 (systemd y linger).",
      videos: [{ title: "Q21: Imagen Podman y systemd", url: YT.podmanSystemd }],
      commands: [
        { cmd: "id student || useradd student", why: "El enunciado corre el contenedor como student.", as: "root" },
        { cmd: "loginctl enable-linger student", why: "El user manager queda activo sin sesión.", as: "root" },
        { cmd: "sudo -u student podman run -d --name mycontainer -v /opt/file:/data/input:Z -v /opt/processed:/data/output:Z localhost/text2pdf:latest", why: "El contenedor queda en el storage de student, no en el de root.", as: "student" },
        { cmd: "sudo -u student podman generate systemd --name mycontainer --files --new", why: "Crea la unidad. man podman-generate-systemd.", as: "student" },
        { cmd: "systemctl --user enable --now container-mycontainer", why: "Ejecutado como student, con linger ya puesto.", as: "root" },
      ],
    },
  },
  {
    id: "extra-01",
    track: "extra",
    title: "Hace falta un programa que liste los textos de tres carpetas",
    story: "En tres carpetas puede haber archivos de texto, o puede no haber carpeta. El programa tiene que decir qué encontró en cada una.",
    objective: [
      "Script /usr/local/bin/gap-txt.sh.",
      "Mira /opt/lab/dir1, dir2 y dir3.",
    ],
    where: "client",
    steps: [
      "Creá /usr/local/bin/gap-txt.sh y dejalo ejecutable.",
      "Tiene que mirar solo el primer nivel de /opt/lab/dir1, /opt/lab/dir2 y /opt/lab/dir3.",
      "Si el directorio no existe: Directory RUTA not found.",
      "Si existe y no hay *.txt: No text files found in RUTA.",
      "Si hay .txt: los nombres de archivo, ordenados, uno por línea. Sin la ruta.",
      "El entorno se arma con el script de preparación del lab de scripting del repo. No mires el archivo de respuestas.",
    ],
    help: {
      tip: "find con -maxdepth 1 no baja a subcarpetas. sort ordena los nombres. Probá los tres casos: directorio ausente, vacío de txt, y con txt.",
      videoHint: "Video de este lab: Bonus GAP Q01.",
      videos: [{ title: "Bonus: Scripting simple", url: YT.scripting }],
      commands: [
        { cmd: "man test", why: "-d para saber si el directorio existe.", as: "root" },
        { cmd: "find /opt/lab/dir1 -maxdepth 1 -name '*.txt' -printf '%f\\n' | sort", why: "%f imprime solo el nombre. Ajustalo dentro del if.", as: "root" },
        { cmd: "chmod 755 /usr/local/bin/gap-txt.sh", why: "Tiene que poder ejecutarse.", as: "root" },
        { cmd: "bash -n /usr/local/bin/gap-txt.sh", why: "Revisar sintaxis antes de correrlo.", as: "root" },
      ],
    },
  },
  {
    id: "extra-02",
    track: "extra",
    title: "Una limpieza tiene que correr sola a una hora",
    story: "No queremos acordarnos de borrar los archivos viejos. Un timer tiene que hacerlo en el horario pedido, también si la máquina estaba apagada a esa hora.",
    objective: [
      "Timer cleanup habilitado al boot.",
      "A :30 corre /usr/local/bin/clean.sh.",
    ],
    where: "client",
    steps: [
      "Hay un proceso que deja archivos en /tmp al segundo 00 de cada minuto. El prep está en el lab de timers del repo.",
      "Creá un servicio y un timer llamados cleanup.",
      "El servicio corre /usr/local/bin/clean.sh.",
      "La limpieza ocurre a los 30 segundos de cada minuto.",
      "El timer queda habilitado y arranca solo al boot.",
      "Comprobación: los archivos aparecen en :00 y desaparecen en :30.",
    ],
    help: {
      tip: "OnCalendar y el servicio son dos unidades. enable se lo das al timer, no solo al service. systemd-analyze calendar te dice la próxima corrida antes de esperar un minuto.",
      videoHint: "Video de este lab: Bonus GAP Q02. Es objetivo de v10.",
      videos: [{ title: "Bonus: Timers de systemd", url: YT.timers }],
      commands: [
        { cmd: "man systemd.timer", why: "OnCalendar y Persistent.", as: "root" },
        { cmd: "systemd-analyze calendar '*-*-* *:00:30'", why: "Ver que la expresión cae en el segundo 30.", as: "root" },
        { cmd: "systemctl cat cleanup.timer", why: "Leer la unidad que escribiste en /etc/systemd/system/.", as: "root" },
        { cmd: "systemctl enable --now cleanup.timer", why: "Queda al boot y arranca ahora.", as: "root" },
        { cmd: "systemctl list-timers cleanup.timer", why: "Próxima y última ejecución.", as: "root" },
      ],
    },
  },
  {
    id: "extra-03",
    track: "extra",
    title: "El FTP anónimo tiene que poder dejar y llevar archivos",
    story: "La gente entra sin cuenta. Tiene que poder bajar de una carpeta y subir a otra, con SELinux todavía activo.",
    objective: [
      "vsftpd en enforcing.",
      "Anónimo descarga de /srv/company-drop/pub.",
      "Anónimo sube a /srv/company-drop/incoming.",
    ],
    where: "server o client",
    steps: [
      "El servicio es vsftpd. El script de preparación del repo deja el escenario.",
      "Un anónimo tiene que poder descargar de /srv/company-drop/pub.",
      "Un anónimo tiene que poder subir a /srv/company-drop/incoming.",
      "SELinux sigue en enforcing. No vale setenforce 0, ni mover los archivos a /var/ftp, ni chmod 777.",
    ],
    help: {
      tip: "El AVC del audit log dice qué tipo de contexto falta. No adivines el boolean: leé el mensaje y después sealert o ausearch.",
      videoHint: "Video de este lab: Bonus GAP Q05. No es el de solo cambiar un puerto.",
      videos: [{ title: "Bonus: SELinux y VSFTP", url: YT.selinuxFtp }],
      commands: [
        { cmd: "getenforce", why: "Tiene que seguir en Enforcing.", as: "root" },
        { cmd: "ausearch -m avc -ts recent", why: "El rechazo concreto, no un resumen genérico.", as: "root" },
        { cmd: "ls -Zd /srv/company-drop /srv/company-drop/pub /srv/company-drop/incoming", why: "Comparar el contexto con el que vsftpd espera.", as: "root" },
        { cmd: "semanage fcontext -l | grep ftp", why: "Ver public_content_t y public_content_rw_t.", as: "root" },
        { cmd: "getsebool -a | grep ftp", why: "El booleano de escritura anónima, y dejarlo con -P.", as: "root" },
        { cmd: "man restorecon", why: "Aplicar el contexto que semanage fcontext declaró.", as: "root" },
      ],
    },
  },
  {
    id: "extra-04",
    track: "extra",
    title: "Thiago la calculadora, Felipe Gedit, Erik Firefox",
    story:
      "Thiago pide la Calculadora en este client para las cuentas del día. Operaciones quiere que quede para todos. El id es org.gnome.Calculator.\n\nFelipe también pide un editor de texto para todos: Gedit (org.gnome.gedit). Lo van a usar un tiempo; el lab siguiente es sacarlo.\n\nErik, en cambio, quiere Firefox solo en su cuenta: lo prefiere a los otros navegadores. El id es org.mozilla.firefox (tal cual flatpak search).\n\nEl depósito es Flathub: https://dl.flathub.org/repo/flathub.flatpakrepo. Registralo, instalá las tres, y que sigan después de cerrar sesión.",
    objective: [
      "Flatpak usable en la máquina.",
      "Remote flathub → https://dl.flathub.org/repo/flathub.flatpakrepo",
      "org.gnome.Calculator para todo el sistema.",
      "org.gnome.gedit para todo el sistema (la que se saca en el lab siguiente).",
      "org.mozilla.firefox solo para erik.",
      "Tras cerrar sesión, las tres siguen.",
    ],
    where: "client",
    steps: [
      "Si falta el comando flatpak, instalalo con dnf.",
      "Registrá flathub con https://dl.flathub.org/repo/flathub.flatpakrepo",
      "Instalá org.gnome.Calculator para toda la máquina.",
      "Instalá org.gnome.gedit para toda la máquina.",
      "Instalá org.mozilla.firefox solo para erik (como erik, no como root).",
      "Comprobá que, después de cerrar sesión, las tres siguen.",
    ],
    note: "En este lab: Flathub + Calculator + Gedit (sistema) + Firefox (erik). El próximo lab desinstala Gedit; Calculator y Firefox se quedan.",
    help: {
      tip: "Para todos: flatpak install --system. Solo para erik: su - erik -c 'flatpak install --user …' (no sudo -u erik flatpak --user). Si falta flatpak: dnf install -y flatpak. Remote de sistema ≠ remote --user de erik. APP_ID tal cual search: org.mozilla.firefox (f minúscula), org.gnome.gedit.\nSi instalaste mal (ej. Firefox con --system y era solo erik): flatpak list para ver Installation=system/user, después uninstall de ese ámbito y volvé a instalar bien. System: flatpak uninstall -y --system APP_ID. User de erik: su - erik -c 'flatpak uninstall -y --user APP_ID'.",
      videoHint: "Q23 guarda el remote con la URL de este lab e instala con --system. Si dice login required, entra con podman login. También baja de commit y usa mask: este lab no lo pide. El otro video muestra el remote que ya trae el escritorio, cómo borrarlo, run, update y uninstall. Arranca en el minuto 3:19.",
      videos: [
        { title: "Q23: Flatpak", url: YT.flatpak },
        { title: "Gestión de Flatpak · revisión", url: YT.flatpakReview },
      ],
      commands: [
        { cmd: "dnf install -y flatpak", why: "Primero: si flatpak no está (orden no encontrada), instalalo desde el repo DNF. Repos de esta máquina ya tienen que andar (lab Repositorios DNF). Si mezclan otros repos, podés acotar con --repo=BaseOS --repo=AppStream.", as: "root" },
        { cmd: "flatpak remotes", why: "Qué almacenes (remotes) ya hay. Si falta flathub, hay que agregarlo.", as: "root" },
        { cmd: "man flatpak-remote-add", why: "NAME = etiqueta corta del almacén (acá flathub). LOCATION = la URL (http:// o file:///). Si un file:/// se queja de GPG, en el man está --no-gpg-verify.\n\nman flatpak es la página general del comando. man flatpak-remote-add es solo el subcomando remote-add (detalle de flags).", as: "root" },
        { cmd: "flatpak remote-add --if-not-exists --system flathub https://dl.flathub.org/repo/flathub.flatpakrepo", why: "Depósito Flathub para este lab.\nSin internet: … --no-gpg-verify lab file:///mnt/flatpaks", as: "root" },
        { cmd: "flatpak search Calculator", why: "Para no adivinar el id. En Flathub suele salir org.gnome.Calculator. Copiá ese id con mayúsculas.", as: "root" },
        { cmd: "flatpak install -y --system flathub org.gnome.Calculator", why: "La de Thiago / el equipo: para toda la máquina.\nlogin required → podman login (abajo).\nSin pantalla (SSH): mejor la terminal del escritorio.", as: "root" },
        { cmd: "flatpak search gedit", why: "Debería salir org.gnome.gedit. Esa es la app de sistema que el lab siguiente va a desinstalar.", as: "root" },
        { cmd: "flatpak install -y --system flathub org.gnome.gedit", why: "Editor para todos (Felipe). Queda en flatpak list como system. No la borres acá: eso es el lab siguiente.", as: "root" },
        { cmd: "dnf install -y --repo=BaseOS --repo=AppStream podman && podman login REGISTRY", why: "Solo si el install pide login. Usuario/token = los que te pasen. Flathub no lo pide.", as: "root" },
        { cmd: "su - erik -c 'flatpak remote-add --user --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo'", why: "Mismo depósito, en la cuenta de erik. El remote de sistema no alcanza para --user. No uses sudo -u … flatpak --user: flatpak se niega (Negándose a operar bajo sudo con --user). su -c corre el comando como erik sin ese bloqueo.", as: "root" },
        { cmd: "flatpak search Firefox", why: "En Flathub el Application ID es org.mozilla.firefox (f minúscula). No org.mozilla.Firefox ni org.gnome.Firefox. Copiá el id tal cual sale.", as: "root" },
        { cmd: "su - erik -c 'flatpak install --user -y flathub org.mozilla.firefox'", why: "Solo para erik. Si lo instalás como root con --user, queda en root. Tampoco sudo -u erik flatpak --user: flatpak lo rechaza.", as: "root" },
        { cmd: "flatpak list && su - erik -c 'flatpak list --user'", why: "Sistema: Calculator + Gedit. Usuario erik: Firefox. Las tres tienen que seguir tras logout. En list mirá la columna Installation: system vs user.", as: "root" },
        { cmd: "flatpak uninstall -y --system org.mozilla.firefox", why: "Arreglo si instalaste Firefox para todos y era solo erik. Sacá la copia system. Después: su - erik -c 'flatpak install --user -y flathub org.mozilla.firefox'.\nSi el error fue al revés (user de más): su - erik -c 'flatpak uninstall -y --user org.mozilla.firefox'.\nNo borres Calculator ni Gedit acá salvo que también las hayas puesto mal.", as: "root" },
      ],
    },
  },
  {
    id: "extra-05",
    track: "extra",
    title: "Operaciones pide sacar Gedit",
    story:
      "Operaciones ya no quiere Gedit en el client: el editor de texto de sistema que instalamos para Felipe en el lab anterior (org.gnome.gedit).\n\nHay que desinstalarlo con sus datos, limpiar runtimes que nadie use, y comprobar que Calculator y el Firefox de erik siguen.",
    objective: [
      "org.gnome.gedit desinstalada (con datos).",
      "Runtimes/extensiones sin uso sacados (--unused).",
      "org.gnome.gedit ya no aparece en flatpak list.",
      "org.gnome.Calculator y el Firefox de erik siguen.",
    ],
    where: "client",
    steps: [
      "Confirmá en flatpak list que está org.gnome.gedit (viene del lab anterior).",
      "Desinstalá org.gnome.gedit con sus datos (--delete-data).",
      "Corré flatpak uninstall --unused para lo que nadie use.",
      "Comprobá: gedit fuera; Calculator (system) y Firefox (erik --user) siguen.",
    ],
    note: "Si Gedit no está (saltaste el lab anterior), instalalo antes: flatpak install -y --system flathub org.gnome.gedit. No borres Calculator ni el Firefox de erik.",
    help: {
      tip: "El APP_ID se copia de flatpak list tal cual (org.gnome.gedit). --delete-data limpia datos de la app. --unused no toca un runtime que Calculator o Firefox todavía usan.",
      videoHint: "La revisión muestra uninstall, --delete-data y --unused. Q23 no lo hace como tarea: saca Thunderbird de paso.",
      videos: [
        { title: "Gestión de Flatpak · revisión", url: YT.flatpakReview },
        { title: "Q23: Flatpak", url: YT.flatpak },
      ],
      commands: [
        { cmd: "flatpak list", why: "Tiene que verse org.gnome.gedit (system). También Calculator. Firefox de erik: su - erik -c 'flatpak list --user'.", as: "root" },
        { cmd: "flatpak install -y --system flathub org.gnome.gedit", why: "Solo si saltaste el lab anterior y gedit no está.", as: "root" },
        { cmd: "flatpak uninstall -y --delete-data org.gnome.gedit", why: "Saca Gedit y los datos bajo ~/.var. Sin --delete-data la app sale de la lista y esos archivos pueden quedar.", as: "root" },
        { cmd: "flatpak uninstall -y --unused", why: "Saca runtimes/extensiones que ninguna app usa. Si Calculator o Firefox todavía los necesitan, flatpak los deja.", as: "root" },
        { cmd: "flatpak list && su - erik -c 'flatpak list --user'", why: "gedit no tiene que aparecer. Calculator sí (system). Firefox sí (user de erik).", as: "root" },
      ],
    },
  },
];

for (const lab of LABS) {
  const copy = LAB_EN[lab.id];
  if (!copy) throw new Error(`Falta la traducción de ${lab.id}`);
  if (copy.steps.length !== lab.steps.length) {
    throw new Error(`${lab.id}: steps ${copy.steps.length} != ${lab.steps.length}`);
  }
  if (copy.objective.length !== lab.objective.length) {
    throw new Error(`${lab.id}: objective ${copy.objective.length} != ${lab.objective.length}`);
  }
  if (copy.why.length !== lab.help.commands.length) {
    throw new Error(`${lab.id}: why ${copy.why.length} != ${lab.help.commands.length}`);
  }
  if ((copy.videos?.length ?? 0) !== lab.help.videos.length) {
    throw new Error(`${lab.id}: videos ${(copy.videos?.length ?? 0)} != ${lab.help.videos.length}`);
  }
}

function localizeAs(as: string | undefined, locale: Locale): string | undefined {
  if (!as || locale === "es") return as;
  if (as === "consola VM") return "VM console";
  if (as === "info") return "note";
  return as;
}

export function labById(id: string, locale: Locale = "es"): Lab | undefined {
  return labsFor(locale).find((lab) => lab.id === id);
}

export function labsFor(locale: Locale): Lab[] {
  if (locale === "es") return LABS;
  return LABS.map((lab) => {
    const copy = LAB_EN[lab.id];
    if (!copy) return lab;
    return {
      ...lab,
      title: copy.title,
      story: copy.story,
      objective: copy.objective,
      where: copy.where,
      steps: copy.steps,
      note: copy.note ?? lab.note,
      help: {
        ...lab.help,
        tip: copy.tip,
        videoHint: copy.videoHint,
        videos: lab.help.videos.map((video, index) => ({
          ...video,
          title: copy.videos?.[index] ?? video.title,
        })),
        commands: lab.help.commands.map((command, index) => ({
          ...command,
          why: copy.why[index] ?? command.why,
          as: localizeAs(command.as, "en"),
          slip: copy.slip?.[index],
        })),
      },
    };
  });
}
