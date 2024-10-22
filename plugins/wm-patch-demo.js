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
   * @param {Array<PatchDemoWiki>} instances JSON received from the API
   * @param {ChangeData} change
   * @return {FetchResponse}
   */
  parse(instances, change) {
    let isLegacyInstance = false;
    const checkResults = instances.map( instance => {
      isLegacyInstance = instance.url.includes('legacy');
      let patchset;
      for (const patch of instance.patches) {
        if (change.changeNumber.toString() === patch.split(',')[0]) {
          patchset = patch.split(',')[1];
          break;
        }
      }
      const deleteUrl = isLegacyInstance ? `https://patchdemo-legacy.wmcloud.org/delete.php?wiki=${instance.wiki}` : `https://patchdemo.wmcloud.org/delete.php?wiki=${instance.wiki}`;
      const patchesList = '* ' + instance.patches.map( patch => {
        const [ changeNumber, patchNumber ] = patch.split(',');
        if ( changeNumber === change.changeNumber.toString() ) {
          return `This change ${changeNumber}`;
        } else {
          return `https://gerrit.wikimedia.org/r/c/${changeNumber}/${patchNumber}`;
        }
      } ).join('\n* ') + '\n';

      /** @type {CheckResult} */
      const checkResult = {
        category: /** @type {CheckResult["category"]} */ ('WARNING'),
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
    const legacyResults = checkResults.filter(
      res => res.links.some(
        (/** @type {{ url: string | string[]; }} */ link) => link.url.includes('legacy')
      )
    );
    const newResults = checkResults.filter( result => !legacyResults.includes( result ) );
    const checkRuns = [];
    if (legacyResults.length) {
      checkRuns.push({
        attempt: 1,
        checkName: 'Legacy Patch demo',
        checkDescription: 'MediaWiki instances spinned up with this change applied',
        status: /** @type {RunStatus} */ ('COMPLETED'),
        statusLink: 'https://patchdemo-legacy.wmcloud.org/',
        statusDescription: `Found ${legacyResults.length} wikis for change ${change.changeNumber}`,
        results: legacyResults
      });
    }
    if (newResults.length) {
      checkRuns.push({
        attempt: 1,
        checkName: 'Patch demo',
        checkDescription: 'MediaWiki instances spinned up with this change applied',
        status: /** @type {RunStatus} */ ('COMPLETED'),
        statusLink: 'https://patchdemo.wmcloud.org/',
        statusDescription: `Found ${newResults.length} wikis for change ${change.changeNumber}`,
        results: newResults
      });
    }
    return {
      responseCode: /** @type {ResponseCode} */ ('OK'),
      runs: checkRuns,
    };
  }

  /**
   * @param {ChangeData} change
   * @return {Promise<FetchResponse>}
   */
  async fetch(change) {
    const legacyPatchDemoUrl = `https://patchdemo-legacy.wmcloud.org/api.php?action=findwikis&change=${change.changeNumber}`;
    const newPatchDemoUrl = `https://patchdemo.wmcloud.org/api.php?action=findwikis&change=${change.changeNumber}`;

    return Promise.all([
      fetch(legacyPatchDemoUrl, { cache: 'no-store' }).then(resp => resp.ok ? resp.json() : ''),
      fetch(newPatchDemoUrl, { cache: 'no-store' }).then(resp => resp.ok ? resp.json() : '')
    ])
      .then(([ legacyResponse, newResponse ]) => {
        const wikis = legacyResponse.concat(newResponse);
        try {
          return this.parse(wikis, change);
        } catch (parseError) {
          console.error('[wm-patch-demo] Failed to parse response: %s. Wikis: %s', parseError, wikis);
          return {
            responseCode: /** @type {ResponseCode} */ ('OK'),
          };
        }
      })
      .catch( fetchError => {
        console.error('[wm-patch-demo] Failed to fetch: %s', fetchError);
        return {
          responseCode: /** @type {ResponseCode} */ ('OK'),
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
