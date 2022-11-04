Gerrit.install(plugin => {
  const customLinks = document.createElement('dom-module');
  customLinks.innerHTML = `
<template>
  <style>
    a {
      color: #2a66d9;
    }
  </style>
  |
  <a href="https://www.mediawiki.org/wiki/Special:MyLanguage/Code_of_Conduct">Code of Conduct</a>
  |
  <a href="https://wikimediafoundation.org/wiki/Special:MyLanguage/Privacy_policy">Privacy policy</a>
</template>`;
  customLinks.register('wm-custom-links');

  plugin.registerCustomComponent(
    'footer-left', 'wm-custom-links');

  plugin.admin()
    .addMenuLink('Code Search', 'https://codesearch.wmcloud.org/search/');

});
