/*!
 * Link eligible changes to https://schedule-deployment.toolforge.org
 * Copyright (c) 2024 Wikimedia Foundation and contributors.
 * License: GPL-3.0-or-later
 */
'use strict';

/**
 * @typedef { import("@gerritcodereview/typescript-api/hook").PluginElement } PluginElement
 * @typedef { import("@gerritcodereview/typescript-api/hook").HookApi<PluginElement> } ElementHook
 */
window.Gerrit.install(plugin => {
  const divId = 'wm-schedule-deployment';
  /** @type {ElementHook} */
  const domHook = plugin.hook('commit-container');
  const repoApi = plugin.restApi();
  domHook.onAttached(async element => {
    if (element.change.status !== 'NEW') {
      // Nothing to do for a merged or abandoned change
      return;
    }
    const loggedIn = await repoApi.getLoggedIn();
    if (!loggedIn) {
      // Nothing for anons to do
      return;
    }
    const project = element.change.project;
    const branch = element.change.branch;
    if (
      (
        project === 'operations/mediawiki-config' &&
          branch === 'master'
      ) || (
        (
          project.startsWith('mediawiki/core') ||
            project.startsWith('mediawiki/extensions/') ||
            project.startsWith('mediawiki/skins/')
        ) &&
          branch.startsWith('wmf/')
      )
    ) {
      const fragment = document.createDocumentFragment();
      const div = document.createElement('div');
      div.setAttribute('id', divId);
      const a = document.createElement('a');
      const url = 'https://schedule-deployment.toolforge.org/backport/';
      const label = 'Schedule backport of this change';
      a.href = url + element.change._number;
      a.appendChild(document.createTextNode(label));
      div.appendChild(a);
      fragment.appendChild(div);
      element.appendChild(fragment);
    }
  });
  domHook.onDetached(element => {
    const div = document.getElementById(divId);
    if (div) {
      element.removeChild(div);
    }
  });
});
