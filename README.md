The whole process is documented on the wiki:

https://wikitech.wikimedia.org/wiki/Gerrit/Upgrade

Get the Gerrit upstream war by:
- editing the version of com.google.gerrit:gerrit-war in /pom.xml
- mvn package
- git add pom.xml gerrit.war
- git commit -m 'Gerrit vX.Y.Z'
- ./deploy_artifacts.py --version=X.Y.Z gerrit.war
