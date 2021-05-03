#!/bin/bash
#
# List submodules that do not have a relative URL, which is what upstream uses
# to bundle jgit and plugins.

exec git config -f .gitmodules --get-regexp 'submodule\.plugins/.*.url'|grep -v 'url \.\.'|cut -d.  -f2|sort
