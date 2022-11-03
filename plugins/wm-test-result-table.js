// This module for formating CI comments is mostly from
//
//    https://github.com/dburm/pg-test-result-plugin
//
// which comes under the MIT License
//
// MIT License
//
// Copyright (c) 2019 Dmitry
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

class GrTestResultTableModule extends Polymer.Element {
  static get is() {
    return 'gr-test-result-table-module';
  }

  static get template() {
    return Polymer.html`
<style include="shared-styles"></style>
<style include="gr-voting-styles"></style>
<style>
  .check_result_chip {
    padding-left: var(--spacing-m);
    padding-right: var(--spacing-m);
    background: #c1c124;
    @apply --vote-chip-styles;
  }
  .check_result_chip_FAILURE {
    background: var(--vote-color-rejected);
  }
  .check_result_chip_SUCCESS {
    background: var(--vote-color-approved);
  }

  td.check_cell.check_result {
    padding-left: 0px;
  }

  td.check_cell {
    padding: 0px var(--spacing-s);
  }

  span.no-tests {
    color: var(--deemphasized-text-color);
    padding-left: var(--spacing-xl);
  }

  div.container {
    margin-left: var(--metadata-horizontal-padding);
    margin-bottom: var(--spacing-m);
  }
</style>
<div class="container">
  <div class="test-header">
    Test results for Patchset [[_getPatchSetNum()]] (Only main test build and SonarQube)
  </div>
  <table>
    <template is="dom-repeat" items="{{checkers}}" as="checker">
      <template is="dom-repeat" items="{{checker.checks}}" as="check">
        <tr class="check_row">
          <td class="check_cell check_result">
            <span class$="voteChip check_result_chip check_result_chip_[[check.result]]">
              [[check.result]]
            </span>
          </td>
          <td class="check_cell check_name">
            <a href="[[check.url]]" target="_blank">
              [[check.name]]
            </a>
          </td>
        </tr>
      </template>
    </template>
    <template is="dom-if" if="[[!hasChecks]]">
      <tr>
        <td colspan="2">
          <span class="no-tests">(No test results found)</span>
        </td>
      </tr>
    </template>
  </table>
</div>`;
  }

  static get properties() {
    return {
      plugin: Object,
      change: Object,
      checkers: Array,
      hasChecks: {
        type: Boolean,
        value: false,
      },
    };
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('change-changed', this._handleReloadChange.bind(this));
    this._showTable();
  }

  _handleReloadChange(e) {
    this._showTable();
  }

  _showTable() {
    this.hasChecks = false;
    if (!this.change || !this.change.messages) { return; }

    // Get current patchset num
    var current_patchset = this._getPatchSetNum();
    // Get all messages to current patchset
    var verifiedMessages = this.change.messages.filter(it =>
        it._revision_number == current_patchset);

    var _checkers = {};
    verifiedMessages.forEach(it => {
      if (!it) return;

      const _checks = this.parseChecksFromMessage(it.message);

      if (_checks && Object.keys(_checks).length > 0) {
        // Fill checker
        let checker = _checkers[it.author._account_id];
        if (checker === undefined) {
          checker = _checkers[it.author._account_id] = {
            checker: it.author,
            checks: _checks,
            date: it.date
          };
        } else {
          checker.date = it.date;
          Object.assign(checker.checks, _checks);
        }
      };
    });
    this.checkers = Object.values(_checkers).map(checker => {
      checker.checks = Object.values(checker.checks);
      return checker;
    });
    this.hasChecks = !!this.checkers.length;
  }

  _getPatchSetNum() {
    if (!this.change || !this.change.revisions) return '';

    const current = this.change.current_revision;
    return this.change.revisions[current]._number;
  }

  parseChecksFromMessage(message) {
    if (!message) return {};

    let check;
    let checks = {};

    message = message.replace(/✔/g,'SUCCESS'); // check mark
    message = message.replace(/❌/g,'FAILURE'); // red cross

    // Reports from Zuul
    var re = /(?:Build (Started) )?(http[^ ]+\/job\/([^\/ ]+)\/[^ ]+)(?: : ([A-Z_]+)( .*)?$)?/gm;
    if (message.includes('Main test build')) {
      while (check = re.exec(message)) {
        checks[check[3]] = {
          name: check[3],
          url: check[2],
          result: check[1] || check[4],
          spent: check[5],
        }
      }
    }

    // Reports from SonarQube
    // https://github.com/kostajh/sonarqubebot/
    re = /(SUCCESS|FAILURE) Quality gate/;
    if (re.test(message)) {
      // Extracting the report url
      var url = '';
      re = /^Report: (https:\S+)/m;
      if (check = re.exec(message)) {
        url = check[1];
      }

      // Extracting the checks themselves
      re = /^(?:[*] )?(SUCCESS|FAILURE) (Quality gate)(?: (?:failed|passed!))?$/gm;
      while (check = re.exec(message)) {
        checks[check[2]] = {
          name: 'Sonar cloud',
          url: url,
          result: check[1],
        };
      }
    }

    return checks;
  }
}
customElements.define(GrTestResultTableModule.is, GrTestResultTableModule);

Gerrit.install(plugin => {
  plugin.registerCustomComponent(
      'commit-container',
      'gr-test-result-table-module');
});

