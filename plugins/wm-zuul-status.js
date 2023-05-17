/**
 * Type alias declarations.
 *
 * @see https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html#import-types
 *
 * @typedef { import("@gerritcodereview/typescript-api/checks").Category } Category
 * @typedef { import("@gerritcodereview/typescript-api/checks").CheckResult } CheckResult
 * @typedef { import("@gerritcodereview/typescript-api/checks").CheckRun } CheckRun
 * @typedef { import("@gerritcodereview/typescript-api/checks").ChecksProvider } ChecksProvider
 * @typedef { import("@gerritcodereview/typescript-api/checks").FetchResponse } FetchResponse
 * @typedef { import("@gerritcodereview/typescript-api/checks").Link } Link
 * @typedef { import("@gerritcodereview/typescript-api/checks").RunStatus } RunStatus
 * @typedef { import("@gerritcodereview/typescript-api/checks").ResponseCode } ResponseCode
 * @typedef { import("@gerritcodereview/typescript-api/checks").Tag } Tag
 * @typedef { import("@gerritcodereview/typescript-api/checks").TagColor } TagColor
 * @typedef { import("@gerritcodereview/typescript-api/checks").ChecksPluginApi } ChecksPluginApi
 * @typedef { import("@gerritcodereview/typescript-api/checks").ChangeData } ChangeData
 */
/**
 * Type based upon the Zuul status JSON for a change
 *
 * The definition is NOT EXHAUSTIVE
 *
 * @typedef {Object} ZuulJob
 * @property {string | null} result - Result of the job
 * @property {string} pipeline
 * @property {number} elapsed_time - (Milliseconds) how long since the build has started.
 * @property {number} estimated_time - (Seconds) how long the job would take in total.
 * @property {number} remaining_time - (Milliseconds) how long left
 * (estimated_time * 1000 - elapsed_time)
 * @property {string} url - Jenkins buid URL
 * @property {string} report_url - Zuul job report URL (Zuul success-pattern).
 * Default is the build console.
 * @property {boolean} voting - Whether the job is voting
 * @property {string} name - Name of the Zuul function (a Jenkins job)
 *
 */
'use strict';

/**
 * Retrieve the change status in CI from Zuul
 *
 * The data is retrieved from https://integration.wikimedia.org/zuul/status/change/XX,Y
 * where XX is the change number (int) and Y the patchset number (int).
 *
 * For development purpose, a dummy status can be provided running "composer
 * start:integration" from * integration/docroot.git
 *
 * Zuul provides a list (the change can be enqueued in multiple pipelines):
 *
 *   [change, ...]
 *
 * Each `change` has metadata and a list of jobs:
 *
 * change.enqueue_time (EPOCH MILLISECONDS): when change got added by Zuul
 * change.remaining_time (MILLISECONDS): estimated time of accomplishment
 * change.jobs (LIST): jobs processed
 *
 * A `job` has:
 *
 * job.pipeline (STRING): name of the Zuul pipeline (ex: 'test'). This is only
 * set after the build has started running.
 * job.url (STRING): full URL to the Jenkins job
 *
 * Dates:
 * job.launch_time (EPOCH SECONDS): when Zuul created the build
 * job.start_time (EPOCH SECONDS): when build started in Jenkins
 * job.end_time (EPOCH SECONDS): when build ended in Jenkins
 *
 * Durations for an in progress job:
 * job.elapsed_time (MILLISECONDS): how long since the build has started.
 * job.estimated_time (SECONDS): how long the job would take in total
 * job.remaining_time (MILLISECONDS): how long left (estimated_time * 1000 - elapsed_time)
 *
 * Durations for a completed job:
 * job.elapsed_time (MILLISECONDS): how long it took to complete (end - start).
 * job.estimated_time: ???
 * job.remaining_time (MILLISECONDS): 0
 *
 * @implements {ChecksProvider}
 */
class ZuulStatusChecksProvider {

  constructor() {
    // Used by hasCompletedCheck() to track a check that has completed and thus
    // vanished from the Zuul status.
    this.prevChecks = new Set();
    this.curChecks = new Set();
  }

  /**
   * Whether this plugin has been injected by Gerrit FE dev helper Chrome extension.
   *
   * The result is cached.
   *
   * @return {boolean}
   */
  isInjectedPlugin() {
    if ( typeof this._isInjected !== 'undefined' ) {
      return this._isInjected;
    }

    this._isInjected = false;

    // Gerrit runs locally
    if ([ '127.0.0.1', 'localhost' ].includes(window.location.hostname)) {
      this._isInjected = true;
    }

    for (const script of document.scripts) {
      if ( [
        'http://127.0.0.1:8081/wm-zuul-status.js',
        'http://localhost:8081/wm-zuul-status.js',
      ].includes(script.src) ) {
        this._isInjected = true;
        break;
      }
    }

    return this._isInjected;
  }

  /**
   *
   * @param {number} changeNumber
   * @param {number} patchsetNumber
   * @return {Promise<Array<Object>>} Zuul status
   */
  getZuulStatus(changeNumber, patchsetNumber) {
    // Status exposed by Wikimedia Zuul daemon
    const prodStatusUrl = `https://integration.wikimedia.org/zuul/status/change/${changeNumber},${patchsetNumber}`;
    // For development purpose, one would use a fixture made available by
    // "composer serve:plugins"
    const devStatusUrl = `http://127.0.0.1:8081/zuul/status/change/${changeNumber},${patchsetNumber}`;

    let changeStatusUrl = prodStatusUrl;
    if ( this.isInjectedPlugin() ) {
      changeStatusUrl = devStatusUrl;
    }

    return fetch(changeStatusUrl, { cache: 'no-store' })
      .then(resp => {
        if (!resp.ok) {
          throw new Error('HTTP ' + resp.status);
        }
        return resp.text();
      })
      .then(rawStatus => {
        return JSON.parse(rawStatus);
      });
  }

  /**
   * Whether some previous check vanished from CI
   *
   * Note: this reset the internal state and must be called only once.
   *
   * @return {boolean}
   */
  hasCompletedCheck() {
    let completed = false;
    for (const prev of this.prevChecks) {
      if ( !this.curChecks.has(prev) ) {
        // A check name is no more being processed
        completed = true;
        break;
      }
    }

    // Keep a copy and reset current state
    this.prevChecks = new Set(this.curChecks);
    this.curChecks = new Set();

    return completed;
  }

  /**
   * Display a popup to offer reloading the change
   *
   * This is used when a check is no more in the Zuul status. Zuul would have
   * posted a message which is then processed by the wm-checks-api plugin.
   */
  showAlertToReloadChange() {
    document.dispatchEvent( new CustomEvent('show-alert', {
      detail: {
        message: 'CI has completed checks. Reload the change view?',
        dismissOnNavigation: true,
        showDismiss: true,
        action: 'Reload',
        callback: () => document.querySelector('gr-app')
          .shadowRoot.querySelector('gr-app-element')
          .shadowRoot.querySelector('gr-change-view')
          .dispatchEvent(new Event('reload')),
      },
    }));
  }

  /**
   * @param {string} jobResult
   * @return {Tag}
   */
  resultTags(jobResult) {
    /** @type {Tag} */
    const tag = {
      name: jobResult || 'Pending',
    };

    switch (jobResult) {
    case null:
      tag.color = /** @type {TagColor} */ ('gray');
      break;
    case 'FAILURE':
      tag.color = /** @type {TagColor} */ ('brown');
      break;
    }
    return tag;
  }

  /**
   *
   * @param {string} result
   * @param {boolean} voting
   * @return {CheckResult["category"]}
   */
  resultToCategory(result, voting = true) {
    let category;
    switch (result) {
    case null:
      // Gerrit doesn't provide a pending category for a CheckResult, it is
      // considered immutable by design but we abuse them to represent a
      // Jenkins job which can be in progress.
      // categoriesSummary() adds a `Pending` tag to disambiguate.
      category = 'INFO';
      break;
    case 'SUCCESS':
      category = voting ? 'SUCCESS' : 'INFO';
      break;
    default:
      category = voting ? 'ERROR' : 'WARNING';
    }
    return /** @type {Category} */ (category);
  }

  /**
   *
   * @param {ZuulJob} job
   * @return {string} Summary for the check
   */
  jobSummary(job) {
    let summary = job.name;
    if (job.result === null) {
      const progress = Math.floor(
        100 * (job.elapsed_time / (job.elapsed_time + job.remaining_time)));
      summary += ` | ${this.asciiProgress(progress)} ${progress}% | ETA: ${Math.floor(job.remaining_time / 1000)}s`;
    } else {
      summary += ` | ${job.result} in ${Math.floor(job.elapsed_time / 1000)}s`;
    }
    return summary;
  }

  /**
   * Convert a percentage to an ASCII based progress bar.
   *
   * @param {number} progressPercent Between 0 and 100.
   * @return {string} 1990's progress bar
   */
  asciiProgress(progressPercent) {
    const steps = 10;
    progressPercent = Math.max(0, Math.min(100, progressPercent));

    const done = Math.floor(progressPercent / steps);
    return '█'.repeat(done) + '▒'.repeat(steps - done);
  }

  /**
   * Generate a status description for a checkRun
   *
   * Count the number of checks in each categories (success, error..).
   *
   * Checks with a tag named 'Pending' are handled independently.
   *
   * @param {CheckResult[]} checkResults List of ongoing check results
   * @return {string} The summary line
   */
  categoriesSummary(checkResults) {
    /** @type {Object.<Category, number>} */
    const kinds = {};
    checkResults.forEach(result => {
      // Gerrit Checks doesn't differentiate in progress results,
      // check whether we previously have set a 'Pending' tag and accumulate those independently.
      const hasTagPending = result.tags.filter(tag => {
        return tag.name === 'Pending';
      });
      let key;
      if (hasTagPending.length !== 0) {
        key = 'PENDING';
      } else {
        key = result.category;
      }

      if (kinds[key]) {
        kinds[key]++;
      } else {
        kinds[key] = 1;
      }
    });
    return Object.entries(kinds)
      .map( ([ cat, count ]) => {
        return `${cat}: ${count}`;
      } )
      .join(', ');
  }

  /**
   *
   * @param {Array<any>} statusJson
   * @return {CheckRun[]}
   */
  parse(statusJson) {

    // Our given change might be a dependency of another change in which case
    // it is represented but is not being processed by Zuul.
    statusJson = statusJson.filter(status => status.live !== false);

    return statusJson.map(status => {
      // TODO the statusJson should be a TypeDef. Meanwhile explicitly cast the type
      const statusJobs = /** @type {ZuulJob[]} */ (status.jobs);

      // Jobs that are not running yet have no pipeline attached

      // Set the check name from the first started build, if none use a
      // placeholder until a job has started.
      const runningJob = statusJobs.find(job => job.pipeline !== null);
      let checkName;
      if (runningJob === undefined) {
        checkName = 'Waiting for jobs';
      } else {
        checkName = runningJob.pipeline;
        this.curChecks.add(checkName);
      }

      /** @type {CheckResult[]} */
      const checkResults = statusJobs.map( job => {
        /** @type {CheckResult} */
        const checkResult = {
          category: this.resultToCategory(job.result, job.voting),
          summary: this.jobSummary(job),
          tags: [
            this.resultTags(job.result)
          ],
          links:
          /** @type {Link[]} */ ([
            {
              url: job.report_url,
              primary: true,
              icon: 'external',
            }
          ]),
        };
        return checkResult;
      });

      // status.enqueue_time;
      // status.remaining_time;

      /** @type {CheckRun} */
      const checkRun = {
        attempt: 1, // FIXME conflicts with previous runs found by wm-checks-api
        checkName: checkName,
        // RUNNABLE / RUNNING / COMPLETED  check active?
        status: /** @type {RunStatus} */ ('RUNNING'),
        statusLink: `https://integration.wikimedia.org/zuul/#q=${status.id}`,
        // labelName: 'Verified',
        scheduledTimestamp: new Date(status.enqueue_time),
        statusDescription: this.categoriesSummary(checkResults),
        results: checkResults,
      };

      return checkRun;
    });
  }

  /**
   *
   * @param {ChangeData} change
   * @return {Promise<FetchResponse>}
   */
  async fetch(change) {
    return this.getZuulStatus(change.changeNumber, change.patchsetNumber)
      .then( statusJson => {
        if ( this.hasCompletedCheck() ) {
          this.showAlertToReloadChange();
        }

        return {
          responseCode: /** @type {ResponseCode} */ ('OK'),
          runs: this.parse(statusJson),
        };
      } )
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
    new ZuulStatusChecksProvider(),
    {
      fetchPollingIntervalSeconds: 10,
    }
  );
} );

if ( typeof module !== 'undefined' ) {
  // eslint-disable-next-line no-undef
  module.exports = {
    ZuulStatusChecksProvider: ZuulStatusChecksProvider,
  };
}
