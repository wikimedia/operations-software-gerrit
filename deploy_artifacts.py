#!/usr/bin/env python3
"""
Simple wrapper for deploying our artifacts to maven
"""

import argparse
import os
import subprocess

ARCHIVA_URL = 'https://archiva.wikimedia.org/repository/releases/'


def parse_args():
    """Parse command line arguments and return options."""
    parser = argparse.ArgumentParser(
        description="Deploy some gerrit binary files to Archiva",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    parser.add_argument('files', nargs='+', help='File(s) we want to deploy')
    parser.add_argument('-n', '--dry-run', action='store_true',
                        help='Print command instead of executing it')
    parser.add_argument('--version', required=True, help='Version number')

    return parser.parse_args()


def main():
    """Parse args, determine values, call the deployer"""
    cwd = os.getcwd()
    os.chdir(os.path.dirname(__file__))
    opts = parse_args()

    base_group_id = 'com.googlesource'
    for file in opts.files:
        if file == 'gerrit.war':
            group_id = base_group_id
            artifact_id = 'gerrit'
            packaging = 'war'
        elif ((file.startswith('plugins/') or file.startswith('lib/')) and
              file.endswith('.jar')):
            group_id = '%s.gerrit.plugins' % base_group_id
            artifact_id = os.path.splitext(os.path.basename(file))[0]
            packaging = 'jar'
        else:
            raise ValueError('Only gerrit.war or plugins/*.jar are allowed')

        deploy(group_id, artifact_id, opts.version, packaging,
               file, opts.dry_run)

    os.chdir(cwd)


def deploy(group_id, artifact_id, version, packaging, file, dry_run=False):
    """Actually deploy a file"""
    args = ['mvn',
            'deploy:deploy-file',
            '-DrepositoryId=wikimedia.releases',
            '-DgroupId={}'.format(group_id),
            '-DartifactId={}'.format(artifact_id),
            '-Dversion={}'.format(version),
            '-Dpackaging={}'.format(packaging),
            '-Dfile={}'.format(file),
            '-Durl={}'.format(ARCHIVA_URL),
            '-DgeneratePom=false']
    if dry_run:
        print(
            ' '.join(args[:1]),
            ' \\\n\t'.join(args[1:])
            )
        return
    subprocess.check_call(args)


if __name__ == '__main__':
    main()
