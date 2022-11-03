// Copyright (C) 2021 The Android Open Source Project
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
