/**
 * Type alias declarations.
 *
 * @see https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html#import-types
 *
 * @typedef { import("@gerritcodereview/typescript-api/checks").Category } Category
 * @typedef { import("@gerritcodereview/typescript-api/checks").CheckResult } CheckResult
 * @typedef { import("@gerritcodereview/typescript-api/checks").CheckRun } CheckRun
 * @typedef { import("@gerritcodereview/typescript-api/checks").ChangeData } ChangeData
 * @typedef { import("@gerritcodereview/typescript-api/checks").ChecksPluginApi } ChecksPluginApi
 * @typedef { import("@gerritcodereview/typescript-api/checks").FetchResponse } FetchResponse
 * @typedef { import("@gerritcodereview/typescript-api/checks").Link } Link
 * @typedef { import("@gerritcodereview/typescript-api/checks").RunStatus } RunStatus
 * @typedef { import("@gerritcodereview/typescript-api/checks").ResponseCode } ResponseCode
 * @typedef { import("@gerritcodereview/typescript-api/checks").Tag } Tag
 * @typedef { import("@gerritcodereview/typescript-api/checks").TagColor } TagColor
 */
/**
 * Patch demo API action 'findwikis'
 * https://github.com/MatmaRex/patchdemo/pull/537
 *
 * @typedef {Object} PatchDemoWiki
 * @property {string} wiki
 * @property {string} creator
 * @property {string} created Creation of wiki ex: '2022-08-10 22:08:38'
 * @property {Array<string>} patches Array of 'change,patchset'
 * @property {string} url URL to the wiki.
 *
 * @typedef {Array<PatchDemoWiki>} PatchDemoFindWikis
 */

'use strict';

class PatchDemoProvider {

  /**
   * @param {string} response Raw text received from the API
   * @param {ChangeData} change
   * @return {FetchResponse}
   */
  parse(response, change) {
    /** @type {PatchDemoFindWikis} */
    const instances = JSON.parse(response);

    const checkResults = instances.map( instance => {
      let patchset;
      for (const patch of instance.patches) {
        if (change.changeNumber.toString() === patch.split(',')[0]) {
          patchset = patch.split(',')[1];
          break;
        }
      }
      const deleteUrl = `https://patchdemo.wmflabs.org/delete.php?wiki=${instance.wiki}`;
      const patchesList = '* ' + instance.patches.join('\n* ') + '\n';
      /** @type {CheckResult} */
      const checkResult = {
        category: /** @type {CheckResult["category"]} */ ('INFO'),
        summary: `${instance.wiki} | PS${patchset} | ${instance.created}`,
        message: `Wiki \`${instance.wiki}\` created on ${instance.created} by ${instance.creator}
Patches applied:
${patchesList}
`,
        tags: [],
        links:
        /** @type {Link[]} */ ([
          {
            url: instance.url,
            tooltip: 'Go to the wiki',
            primary: true,
            icon: 'external',
          },
          {
            url: deleteUrl,
            tooltip: 'Admin: delete the wiki',
            icon: 'history',
          },
        ]),
      };
      return checkResult;
    });

    return {
      responseCode: /** @type {ResponseCode} */ ('OK'),
      runs: [ {
        attempt: 1,
        checkName: 'Patch demo',
        checkDescription: 'MediaWiki instances spinned up with this change applied',
        status: /** @type {RunStatus} */ ('COMPLETED'),
        statusLink: 'https://patchdemo.wmflabs.org/',
        statusDescription: `Found ${instances.length} wikis for change ${change.changeNumber}`,
        results: checkResults,
      } ],
    };
  }

  /**
   *
   * @param {ChangeData} change
   * @return {Promise<FetchResponse>}
   */
  async fetch(change) {
    const url = `https://patchdemo.wmflabs.org/api.php?action=findwikis&change=${change.changeNumber}`;
    return fetch(url, { cache: 'no-store' })
      .then(resp => {
        if (!resp.ok) {
          throw new Error('HTTP ' + resp.status);
        }
        return resp.text();
      })
      .then(resp => {
        return this.parse(resp, change);
      })
      .catch( fetchError => {
        return {
          responseCode: /** @type {ResponseCode} */ ('ERROR'),
          errorMessage: fetchError,
        };
      });
  }
}

window.Gerrit.install(plugin => {
  /** @type {ChecksPluginApi} */
  plugin.checks().register(
    new PatchDemoProvider(),
    {
      fetchPollingIntervalSeconds: 300,
    }
  );
} );

if ( typeof module !== 'undefined' ) {
  // eslint-disable-next-line no-undef
  module.exports = {
    PatchDemoProvider: PatchDemoProvider,
  };
}
