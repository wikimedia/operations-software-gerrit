// Copyright (C) 2019 Thomas "Paladox" Mulhall
// Copyright (C) 2020 Christian "Qchris" Aistleitner
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

  const lightStyle = document.createElement('dom-module');
  lightStyle.innerHTML = `
<template>
  <style>
    html {
      --header-background: white;
      --header-text-color: #001133;
    }
  </style>
</template>`;
  lightStyle.register('wm-light-style');

  const darkStyle = document.createElement('dom-module');
  darkStyle.innerHTML = `
<template>
  <style>
    html {
      --header-background: #3b3d3f;
      --header-text-color: #e8eaed;
    }
  </style>
</template>`;
  darkStyle.register('wm-dark-style');

  const commonStyle = document.createElement('dom-module');
  commonStyle.innerHTML = `
<template>
  <style>
    html {
      --header-title-content: "Wikimedia Code Review";
      --header-icon: url("/r/static/wikimedia-codereview-logo.cache.svg");
      --header-icon-size: 1.2em;

      --border-width: 0 0 3px 0;
      --border-style: solid;
      --box-shadow: 0 3px 3px 2px rgba(0,0,0,0.075), 0 0 2px rgba(0,0,0,0.2);
      --header-border-bottom: 4px solid;
      --header-border-image: linear-gradient(to right, #990000 15%, #006699 15%, #006699 85%, #339966 85%) 1;
    }
  </style>
</template>`;
  commonStyle.register('wm-common-style');

  if (window.localStorage.getItem('dark-theme')) {
    plugin.registerStyleModule('app-theme', 'wm-dark-style');
  } else {
    plugin.registerStyleModule('app-theme', 'wm-light-style');
  }
  plugin.registerStyleModule('app-theme', 'wm-common-style');

});
