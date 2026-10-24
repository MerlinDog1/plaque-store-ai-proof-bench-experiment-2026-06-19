#!/bin/bash
# Record the coding account's memory every 5 s while a command runs, then print the peak.
# Usage: memwatch.sh LOG COMMAND [ARGS...]
log="$1"; shift
cg=/sys/fs/cgroup/user.slice/user-1002.slice
: > "$log"
(
  while true; do
    echo "$(date -u +%T) $(( $(cat $cg/memory.current) / 1048576 ))" >> "$log"
    sleep 5
  done
) &
watcher=$!
"$@"
status=$?
kill "$watcher" 2>/dev/null
echo "peak account memory: $(sort -k2 -n "$log" | tail -1 | cut -d' ' -f2) MiB"
exit $status
