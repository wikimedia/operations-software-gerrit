#!/usr/bin/env -S python3 -u
#
# Build script for Wikimedia Gerrit installation.
#
# This script detects bazelisk or bazel, clone Gerrit from our forked
# repositories and initialize the bundled submodules from Google upstream
# repositories. Some plugins list external dependencies (from npm or maven),
# the script takes care of injecting the dependency files in the Gerrit
# ./plugins dir before the build.
#
# Build artifacts will be copied to `./plugins-wmf` which can be overriden by
# setting the `LOG_DIR` environment variable.
#
# List of build requirements can be found at:
# https://gerrit.wikimedia.org/r/Documentation/dev-bazel.html
#
# For details about our upgrade process:
# https://wikitech.wikimedia.org/wiki/Gerrit/Upgrade

from functools import lru_cache
from os import environ
import os.path
import shlex
import shutil
import subprocess
import sys

# Base URL to Google upstream repositories, used to clone the plugins bundled
# if Gerrit core has submodules having a relative URL.
UPSTREAM_GERRIT_URL = 'https://gerrit.googlesource.com/gerrit'

# Plugins that lack tests and would thus always fail `bazel test`
PLUGINS_WITHOUT_TESTS = [
    'image-diff',
    'metrics-reporter-prometheus',
    'metrics-reporter-jmx',
    ]

# Dependencies definitions which might be present in a plugin repository. In
# order to build the plugin from the Gerrit source tree, those files have to be
# copied from the plugin directory to Gerrit ./plugins/.
PLUGIN_DEP_FILES = [
    'external_plugin_deps.bzl',
    ]

# Bazel target for build Gerrit core
# `gerrit` only builds core without doc or bundled plugins
# `withdocs` has the Documentation generated
# `release` is Gerrit core + plugins + doc
# We do need core plugins to be build in order to build some of our plugins.
GERRIT_TARGETS = ['release']


def phase(name):
    '''Helper to output some progress report'''
    print(f'\n========= [ {name.upper()} ] =========')


def print_bold(msg):
    if sys.stdout.isatty() or environ.get('FORCE_COLOR'):
        print('\033[1m%s\033[0m' % msg)
    else:
        print(msg)


@lru_cache(maxsize=1)
def bazel():
    '''Memoized lookup of bazelisk or bazel executable'''
    bazel_bin = shutil.which('bazelisk') or shutil.which('bazel')
    if bazel_bin is None:
        raise Exception('Could not find `bazelisk` or `bazel')
    return bazel_bin

# Extract submodules and their URLs from .gitmodules
#
# Upstream bundled plugins have a relative URL while our extra plugins
# have an absolute URL with a scheme.
#
# Return dict_items:
#   {
#     '<plugin path>':
#       {
#         'url': '<submodule url>'
#         'is_relative': (true, false)
#       }
#   }
@lru_cache(maxsize=1)
def submodules():
    completed = subprocess.run(shlex.split(
      'git config -f .gitmodules --null '
      '--get-regexp submodule\\..*\\.url'
      ),
      capture_output=True,
      check=True,
      text=True)
    submodules = {}
    for x in completed.stdout.strip('\0').split('\0'):
        k, url = x.split("\n")
        path = k[len('submodule.'):][:-len('.url')]
        submodules[path] = {
            'url': url,
            'is_relative': url.startswith('../')
        }

    return submodules.items()


def submodule_update(paths, options=[]):
    '''Submodule update against given paths'''
    subprocess.run(
        ['git']
        + options
        + ['submodule', 'update', '--init', '--recursive', '--']
        + paths,
        check=True
        )


phase('git updates')

print("Updating jgit and upstream plugins")
submodule_update(
    [path for path, module in submodules() if module['is_relative']],
    options=['-c', 'remote.origin.url=%s' % UPSTREAM_GERRIT_URL]
)

print("Updating WMF extra plugins")
submodule_update(
    [path for path, module in submodules() if not module['is_relative']],
    # Our plugins use absolute URL in .gitmodules. No need to rewrite URLs
)

phase('log directory')

# Ensure log directory exists and is empty
log_dir = environ.get('LOG_DIR', 'plugins-wmf')
os.makedirs(log_dir, exist_ok=True)
# Wipe its content
for f in os.scandir(log_dir):
    if os.path.isdir(f.path):
        shutil.rmtree(f.path)
    else:
        os.remove(f.path)

# Keep track of interesting build artifacts which would be copied to the log
# directory at the end of execution.
artifacts = []

phase('build gerrit')

subprocess.run(
    [bazel(), 'build'] + GERRIT_TARGETS,
    check=True)

# We are solely interested in the targets .war file(s)
artifacts.extend([
    os.path.join(log_dir, war)
    for target in GERRIT_TARGETS
    for war in [target + '.war']
    if shutil.copy(
        os.path.join('bazel-bin', war),
        log_dir)
])


def build_plugin(path):
    '''bazel build a plugin after injecting the dependencies files'''
    name = os.path.basename(path)
    print_bold(f'\nBuilding {path}')
    for dep_file in PLUGIN_DEP_FILES:
        f_path = os.path.join(path, dep_file)
        if os.path.exists(f_path):
            print(f'Injecting {dep_file} in ./plugins')
            shutil.copy(f_path, 'plugins')

    result = subprocess.run([bazel(), 'build', path], check=False)

    if result.returncode != 0:
        print_bold(f'{name} failed to build')
    elif name in PLUGINS_WITHOUT_TESTS:
        print_bold(f'SKipping tests for {name}: marked as having no tests.')
    else:
        print_bold(f'\nTesting {path}')
        result = subprocess.run([bazel(), 'test', '%s:all' % path],
                                check=False)
        if result.returncode != 0:
            print_bold(f'{name} tests failed')

    # restore Gerrit ./plugins state
    for dep_file in PLUGIN_DEP_FILES:
        path = os.path.join('plugins', dep_file)
        try:
            os.unlink(path)
        except FileNotFoundError:
            pass
        subprocess.run(
            ['git', 'checkout', '--', path],
            check=False)

    return result


phase('build and test extra plugins')

failed = [path for path, module in submodules()
          if not module['is_relative']
          and build_plugin(path).returncode != 0
          ]

if failed:
    print_bold("Some plugin(s) failed to build or test:")
    print("\n".join(failed), "\n")
    sys.exit(2)

# Capture plugins .jar or .js
artifacts = []
errors = []
for path, module in submodules():
    if module['is_relative']:
        # Skip modules bundled by upstream
        continue

    jar_file = os.path.basename(path) + '.jar'
    js_file = os.path.basename(path) + '.js'
    try:
        shutil.copy(os.path.join('bazel-bin', path, jar_file), log_dir)
        artifacts.append(jar_file)
    except FileNotFoundError:
        try:
            shutil.copy(os.path.join('bazel-bin', path, js_file), log_dir)
            artifacts.append(js_file)
        except FileNotFoundError:
            errors.append(path)

if errors:
    print('Could not find .jar or .js artifact for:')
    print('\n'.join(errors))
    print('\nAborting...')
    sys.exit(1)

print("Done building extra plugins")

phase('Artifacts')

print('\n'.join(artifacts))

print('\nThose should be copied to the wmf/deploy_branch\n')
print('Build complete.')
