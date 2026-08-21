Upgrading production
====================

The whole process is documented on the wiki:

https://wikitech.wikimedia.org/wiki/Gerrit/Upgrade

You need `git-lfs` installed then `git lfs install`.

Get the Gerrit upstream war by:
- editing the version of com.google.gerrit:gerrit-war in /pom.xml
- mvn package
- git add pom.xml gerrit.war
- git commit -m 'Gerrit vX.Y.Z'
- git push origin HEAD:refs/for/deploy/wmf/stable-3.6

Testing javascript plugins locally
==================================

When developing a Gerrit javascript plugin, one would want to test it locally
first. This is done by serving this checkout and having production Gerrit load a
plugin from it in place of the deployed copy.

* In Chrome/Chromium, install the [gerrit-fe-dev-helper extension](https://chrome.google.com/webstore/detail/gerrit-fe-dev-helper/jimgomcnodkialnpmienbomamgomglkd).

* Boot a web server to serve the plugins directory and add
  `Access-Control-Allow-Origin` headers:

  `composer serve:plugins`

* In Chrome/Chromium:

  * Head to [https://gerrit.wikimedia.org/]()
  * Click _Gerrit FE dev helper_ in the toolbar. The page reloads and a red
    "Gerrit dev helper is enabled" badge appears in the corner.
  * Click it again. The rules popup appears.
  * Turn off the two rules it ships with that redirect to port 8081,
    `.*/gr-app.js` and `.*/styles/`. That is the port `composer serve:plugins`
    listens on, and it has neither of those files, so leaving them on serves
    Gerrit a 404 page in place of its own application bundle, which gives a
    blank page, and in place of its own icon stylesheet, which renders icon
    names as words.
  * Add a rule redirecting a plugin Gerrit already loads to the local file:

    * Target: `.*/wm-schedule-deployment.js`
    * Operator: `redirect`
    * Destination: `http://127.0.0.1:8081/r/plugins/plugin-to-test.js`

  * Click SAVE. The page reloads and your plugin is loaded in place of the one
    named in the target.

Gerrit loads a frontend plugin from `/r/plugins/<name>/static/<name>.js` and
lists every path it will load in the page it serves, under
`plugin.js_resource_paths`. Any of those can be the target, so pick one whose
absence does not get in the way: `wm-schedule-deployment` acts only on a `NEW`
change, which makes it a good one to borrow when testing something that acts on
a merged change. The name Gerrit gives the plugin comes from the URL it asked
for rather than from the file it receives.

`composer serve:plugins` logs each request, so a plugin that fails to appear can
be told apart from one that was never fetched.

A rule added with `styleApi().insertCSSRule()` will not style a plugin's own
elements. They sit in a shadow root, and an ordinary selector does not cross
that boundary, although a CSS custom property does, which is how `wm-app-theme`
themes the page. Style such elements directly instead.
