#!/usr/bin/env bash
# Runs a read-only command as root on a lab VM through vagrant ssh.
# Usage: vm.sh client|server 'command'
# The Vagrantfile folder comes from $LAB_VAGRANT_DIR (default ~/rhsca-lab-client-server).
# Never use this to run vagrant up/halt/destroy: the user starts the VMs.
set -euo pipefail
vm="${1:?client o server}"; shift
cmd="${1:?comando}"
dir="${LAB_VAGRANT_DIR:-$HOME/rhsca-lab-client-server}"
cd "$dir"
# base64 avoids quoting problems with $, quotes and pipes inside the command.
# The script goes in as an argument (bash -c), not on stdin, and stdin is /dev/null:
# that way ssh, su or anything else that reads stdin cannot swallow the rest of the script.
b64=$(printf '%s' "$cmd" | base64 -w0)
vagrant ssh "$vm" -c "sudo bash -c \"\$(echo $b64 | base64 -d)\" </dev/null" 2>&1
