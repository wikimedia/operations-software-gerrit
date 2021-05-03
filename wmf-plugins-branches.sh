#!/bin/bash
#
# List the branch pointed at by each of our submodules

set -eu

(
for x in $(./wmf-plugins-list.sh)
do
  printf "%s\t%s\n" "$x" "$(git -C "$x" branch --points-at=HEAD)"
done
) |column -t
