#!/bin/bash
set -eu

echo "Updating Wikimedia specific plugins"

mapfile -t plugins < <(./wmf-plugins-list.sh)

echo "${plugins[@]}"

git submodule update --init --checkout --remote "${plugins[@]}"
echo "Done"
