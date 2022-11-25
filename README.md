Upgrading production
====================

The whole process is documented on the wiki:

https://wikitech.wikimedia.org/wiki/Gerrit/Upgrade

Get the Gerrit upstream war by:
- editing the version of com.google.gerrit:gerrit-war in /pom.xml
- mvn package
- git add pom.xml gerrit.war
- git commit -m 'Gerrit vX.Y.Z'
- ./deploy_artifacts.py --version=X.Y.Z gerrit.war

Testing javascript plugins locally
==================================

When developing a Gerrit javascript plugin, one would want to test it locally
first. This can be done by injecting your work in progress plugin while
browsing our Gerrit web page:

* In Chrome/Chromium, install the [gerrit-fe-dev-helper extension](https://chrome.google.com/webstore/detail/gerrit-fe-dev-helper/jimgomcnodkialnpmienbomamgomglkd).

* Boot a web server to serve the plugins directory and add
  `Access-Control-Allow-Origin` headers:

  `composer serve:plugins`

* In Chrome/Chromium:
  * Head to [https://gerrit.wikimedia.org/]()
  * In the browser extension menu, enable the extension by clicking
    _Gerrit FE dev helper_, the page will reload.
  * Click again the extension and a configuration popup will appear
  * Add an entry with:

	  * Operator: `injectJSPlugin`
	  * Destination: `http://127.0.0.1:8081/plugin-to-test.js`

  * Click SAVE, the page reloads and your plugin should have been injected.
