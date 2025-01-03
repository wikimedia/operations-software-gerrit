'use strict';
/* eslint no-unused-vars: 0, no-undef: 0 */

/**
 * This file is to please TypeScript tsc when it encounters Gerrit
 * Polymer.Element class or Polymer.html.
 */

class PolymerElement {
}

const Polymer = {
  Element: PolymerElement,
  // https://github.com/gajus/eslint-plugin-jsdoc/issues/533
  /* global TemplateStringsArray */
  html: ( /** @type {TemplateStringsArray} */ x) => {},
};
