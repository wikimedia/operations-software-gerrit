// This module converts Zuul 2.5 Gerrit comments to the Gerrit Checks API
//
// It has been adapted from https://github.com/dburm/pg-test-result-plugin
//
// MIT License
//
// Copyright (c) 2019 Dmitry
// Copyright (c) 2020 Christian Aistleitner
// Copyright (c) 2022 Antoine "hashar" Musso
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

/* eslint-disable max-len */
/**
 * Type alias declarations.
 *
 * @see https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html#import-types
 * @typedef { import("@gerritcodereview/typescript-api/checks").Category } Category
 * @typedef { import("@gerritcodereview/typescript-api/checks").ChangeData } ChangeData
 * @typedef { import("@gerritcodereview/typescript-api/checks").CheckResult } CheckResult
 * @typedef { import("@gerritcodereview/typescript-api/checks").CheckRun } CheckRun
 * @typedef { import("@gerritcodereview/typescript-api/checks").ChecksApiConfig } ChecksApiConfig
 * @typedef { import("@gerritcodereview/typescript-api/checks").ChecksPluginApi } ChecksPluginApi
 * @typedef { import("@gerritcodereview/typescript-api/checks").ChecksProvider } ChecksProvider
 * @typedef { import("@gerritcodereview/typescript-api/checks").FetchResponse } FetchResponse
 * @typedef { import("@gerritcodereview/typescript-api/checks").Link } Link
 * @typedef { import("@gerritcodereview/typescript-api/checks").ResponseCode } ResponseCode
 * @typedef { import("@gerritcodereview/typescript-api/checks").RunStatus } RunStatus
 * @typedef { import("@gerritcodereview/typescript-api/checks").Tag } Tag
 * @typedef { import("@gerritcodereview/typescript-api/checks").TagColor } TagColor
 * @typedef { import("@gerritcodereview/typescript-api/gerrit").Gerrit } Gerrit
 * @typedef { import("@gerritcodereview/typescript-api/rest-api").ChangeMessageInfo } ChangeMessageInfo
 */
/* eslint-enable max-len */

const CHECK_NOT_VOTING = [
  // Sonarqube Bot
  'Quality Gate',
  // Zuul pipelines not voting Verified
  'codehealth',
  'coverage',
  'experimental',
  'patch-performance',
  'php',
  'postmerge',
];

/**
 * Base abstract class to interpret messages received from bots
 *
 * To implement processing for a new bot, the accept and parse methods must be
 * implemented.
 */
class BotProcessor {

  // eslint-disable-next-line jsdoc/require-returns-check
  /**
   * Check a given message can be handled by this processor
   *
   * @param {ChangeMessageInfo} changeMessage
   * @return {boolean} Whether the message can be parsed
   */
  accept(changeMessage) { // eslint-disable-line no-unused-vars
    throw new Error(`${this.constructor.name}.accept() not implemented`);
  }

  // eslint-disable-next-line jsdoc/require-returns-check
  /**
   * Process the bot raw message (ChangeMessage.message)
   *
   * @param {string} rawMessage The text message posted by the bot.
   * @return {CheckResult[]} A list of results found in the received message
   */
  parse(rawMessage) { // eslint-disable-line no-unused-vars
    throw new Error(`${this.constructor.name}.parse() not implemented`);
  }

  /**
   * CheckResult categories:
   * - SUCCESS: build passes
   * - INFO: optional builds
   * - WARNING: not blocking submit
   * - ERROR: must be solved before submit
   *
   * @param {string} result - Job result from Jenkins+Zuul
   * @param {boolean} voting - True for non voting jobs
   * @return {CheckResult["category"]}
   */
  resultToCategory(result, voting = true) {
    let newResult;
    switch (result) {
    case 'SUCCESS':
      newResult = voting ? 'SUCCESS' : 'INFO';
      break;
    default:
      newResult = voting ? 'ERROR' : 'WARNING';
    }
    return /** @type {Category} */ (newResult);
  }
}

class CindyTheBrowserBot extends BotProcessor {

  accept(changeMessage) {
    return changeMessage.real_author.username === 'cindythebrowsertestbot';
  }

  parse(message) {
    const lines = message.split('\n');

    /** @type {CheckResult} */
    const checkResult = {
      category:
        /** @type {Category} */
        (lines[2].startsWith('Cindy says good job') ? 'SUCCESS' : 'ERROR'),
      summary: lines.slice(2).join('\n'),
    };

    return [
      checkResult
    ];
  }
}

/**
 * Process PipelineLib reported messages.
 *
 * The bot is a Jenkins library implemented in Groovy.
 *
 * Code: https://gerrit.wikimedia.org/r/integration/pipelinelib.git
 */
class PipelineBotProcessor extends BotProcessor {
  accept(changeMessage) {
    return (
      typeof changeMessage.real_author.username !== 'undefined' &&
      changeMessage.real_author.username === 'pipelinebot'
    );
  }

  parse(message) {
    // This used to be commentlink sections in Gerrit config

    const m = /pipeline-dashboard: (?<dashboard>[a-z-]+)/gm.exec(message);
    const dashboardUrl = `https://integration.wikimedia.org/ci/blue/organizations/jenkins/${m.groups.dashboard}/activity`;

    const pipelineResult = /pipeline-build-result: (?<result>SUCCESS|FAILURE) \(job: (?<jobname>[a-z-]+), build: (?<buildnum>\d+)\)/gm.exec(message);
    const buildUrl = `https://integration.wikimedia.org/ci/blue/organizations/jenkins/${pipelineResult.groups.jobname}/detail/service-pipeline-test-and-publish/${pipelineResult.groups.buildnum}/pipeline`;

    /** @type {CheckResult} */
    const checkResult = {
      category: this.resultToCategory(pipelineResult.groups.result),
      summary: `${pipelineResult.groups.jobname} #${pipelineResult.groups.buildnum}`,
      links: [
        /** @type {Link} */
        ({
          url: buildUrl,
          primary: true,
          icon: 'external',
          tooltip: 'Go to build'
        }),
        /** @type {Link} */
        ({
          url: dashboardUrl,
          primary: true,
          icon: 'external',
          tooltip: 'Pipeline dashboard',
        })
      ]
    };

    return [ checkResult ];
  }
}

/**
 * Process messages from our Puppet Catalog Compiler
 *
 * Users can trigger the build via `operations/puppet.git` script
 * `utils/pcc.py` which reports back as their own user rather than a service
 * user.
 *
 * Since 2022-12-14, the comments are tagged autogenerated:pcc-py
 * I587381f3910a56441805c2544e8b09d936cdd868
 */
class PuppetCatalogCompilerProcessor extends BotProcessor {

  static isLegacyMessage(changeMessage) {
    const message = changeMessage.message.split('\n')[2];
    if (typeof message === 'undefined') {
      return false;
    }
    return (
      message.startsWith('PCC SUCCESS (') ||
      message.startsWith('PCC FAIL (') ||
      message.startsWith('PCC Check manually: ')
    );
  }

  accept(changeMessage) {
    return (
      typeof changeMessage.tag !== 'undefined' && // for tests not defining tag
      changeMessage.tag.startsWith('autogenerated:pcc-py')
    ) || (
      PuppetCatalogCompilerProcessor.isLegacyMessage(changeMessage)
    );
  }

  parse(message) {
    /** @type {CheckResult} */
    let checkResult;
    const pccMessage = message.split('\n')[2];

    const manual = /PCC Check manually: (?<buildUrl>.+)/.exec(pccMessage);
    if (manual) {
      checkResult = {
        category: /** @type {Category} */ ('WARNING'),
        summary: 'Check PCC manually',
        links: [
          /** @type {Link} */
          ({
            url: manual.groups.buildUrl,
            primary: true,
            icon: 'external',
            tooltip: 'Go to PCC build',
          })
        ]
      };
      return [
        checkResult
      ];
    }

    const compiled = /PCC (?<result>SUCCESS|FAIL) \((?<nodeStatus>.*?)\): (?<consoleUrl>.+)/
      .exec(pccMessage);
    const result = compiled.groups.result;
    checkResult = {
      category: /** @type {Category} */ (
        result === 'SUCCESS' ? 'INFO' : 'ERROR'
      ),
      summary: `Puppet compiler ${result} | ${compiled.groups.nodeStatus}`,
      links: [
        /** @type {Link} */
        ({
          url: compiled.groups.consoleUrl,
          primary: true,
          icon: 'external',
          tooltip: 'Go to PCC console',
        })
      ]
    };

    return [
      checkResult
    ];
  }

}

/**
 * Process SonarQube reports
 *
 * https://github.com/kostajh/sonarqubebot/
 */
class SonarQubeProcessor extends BotProcessor {

  accept(changeMessage) {
    return changeMessage.real_author.username === 'sonarqubebot';
  }

  parse(message) {
    /** @type {CheckResult[]} */
    const checkResults = [];
    let check;

    let re = /(SUCCESS|FAILURE) Quality gate/;
    message = message.replace(/✔/g, 'SUCCESS'); // check mark
    message = message.replace(/❌/g, 'FAILURE'); // red cross

    if (re.test(message)) {
      // Extracting the report url
      let url = '';
      re = /^Report: (https:\S+)/m;
      if (check = re.exec(message)) {
        url = check[1];
      }

      // Extracting the checks themselves
      re = /^(?:[*] )?(SUCCESS|FAILURE) (Quality gate)(?: (?:failed|passed!))?$/gm;
      while (check = re.exec(message)) {
        checkResults.push(
          /** @type {CheckResult} */
          ({
            category: this.resultToCategory(check[1]),
            summary: `SonarQube report ${check[2]}`,
            links: [
              /** @type {Link} */
              ({
                url: url,
                primary: true,
                icon: 'external',
              }),
            ],
          })
        );
      }
    }

    return checkResults;
  }
}

/**
 * Process messages reported by Zuul 2.5
 */
class ZuulProcessor extends BotProcessor {

  accept(changeMessage) {
    return (
      typeof changeMessage.real_author.tags !== 'undefined' &&
      changeMessage.real_author.tags.includes('SERVICE_USER') &&
      typeof changeMessage.tag !== 'undefined' &&
      changeMessage.tag.startsWith('autogenerated:ci')
    );
  }

  parse(message) {
    /** @type {CheckResult[]} */
    const checkResults = [];
    const re = /(?:Build (Started) )?(?<joburl>http[^ ]+\/job\/(?<jobname>[^\/ ]+)\/[^ ]+)(?: : (?<result>[A-Z_]+)(?<jobmessage>.*?)(?: in (?<spent>.*?))?(?<nonvoting> \(non-voting\))?$)?/gm;
    let check;
    const pipelineMessage = message.split('\n')[2];

    while (check = re.exec(message)) {
      /** @type {Category} */
      const category = this.resultToCategory(
        check[1] || check.groups.result,
        typeof check.groups.nonvoting === 'undefined'
      );

      // Add tags based on the Jenkins job name
      const tags = check.groups.jobname.split('-').map(p => {
        let m;
        if (m = p.match(/^(node|php|py)(\d)(\d)$/)) {
          switch (m[1]) {
          case 'node': return `NodeJS ${m[2]}${m[3]}`;
          case 'php': return `PHP ${m[2]}.${m[3]}`;
          case 'py': return `Python ${m[2]}.${m[3]}`;
          }
        }
        switch (p) {
        case 'mysql':
          return 'MySQL';
        case 'sqlite':
          return 'Sqlite';
        }
        return false;
      }).filter(tagNotFalse => tagNotFalse);

      checkResults.push( /** @type {CheckResult} */ ({
        category: category,
        summary: `${check.groups.jobname} | ${check.groups.jobmessage || pipelineMessage} | ${check.groups.spent}`,
        links: [
          /** @type {Link} */
          ({
            url: check.groups.joburl,
            primary: true,
            icon: 'external',
          }),
        ],
        tags: tags.map(t => {
          return /** @type {Tag} */ ({
            name: t,
            color: /** @type {TagColor} */ ('gray')
          });
        }),
        // And actions: {name: 'Report ci-test-error', callback: ...}
      }));
    }
    return checkResults;
  }
}

/**
 * @implements {ChecksProvider}
 */
class WikimediaChecksAnalyzer {

  constructor() {
    /** @type {BotProcessor[]} */
    this.processors = [];
    this.attempt = {};
    this.resetAttempt();
  }

  /**
   * @param {BotProcessor} botProcessor
   */
  register(botProcessor) {
    const proto = Object.getPrototypeOf(botProcessor);

    if (
      this.processors.some( registered => {
        return Object.getPrototypeOf(registered) === proto;
      } )
    ) {
      // already registered
      return;
    } else {
      this.processors.push(botProcessor);
    }

  }

  /**
   *
   * @param {ChangeData} change
   * @return {Promise<FetchResponse>}
   */
  async fetch(change) {
    // UI focuses on the latest patchset by default and a drowpdown lets one
    // browse runs from previous patchset which will invoke fetch() again with
    // a different ChangeData.patchsetNumber.
    const patchsetMessages = change.changeInfo.messages.filter(
      m => m._revision_number === change.patchsetNumber
    );
    const botMessages = this.filterMessages(patchsetMessages);

    if (botMessages.length === 0) {
      return this.emptyFetchResponse();
    }

    // Since we will (poorly) reprocess all messages
    this.resetAttempt();

    /** @type {CheckRun[]} */
    const checkRuns = botMessages
      .map(ChangeMessage => {
        return this.createCheckRun(ChangeMessage);
      })
      .filter(checkRun => checkRun); // filters undefined (aka returned nothing)

    /** @type {FetchResponse} */
    const response = {
      responseCode: /** @type {ResponseCode} */ ('OK'),
      runs: checkRuns,
    };
    return response;
  }

  /**
   * Pass all messages through the processors
   *
   * Additionally filters out Gerrit built-in messages
   *
   * @param {ChangeMessageInfo[]} messages List of ChangeMessage to filter
   * @return {ChangeMessageInfo[]} Accepted messages
   */
  filterMessages(messages) {
    return messages.filter(m => {
      // Filter out Gerrit builtin messages
      if ( typeof m.tag !== 'undefined' && m.tag.startsWith('autogenerated:gerrit:') ) {
        return false;
      }
      for (const processor of this.processors) {
        if ( processor.accept(m) ) {
          return true;
        }
      }
      return false;
    });
  }

  resetAttempt() {
    this.attempt = {};
  }

  /** @return {FetchResponse} OK response with no runs */
  emptyFetchResponse() {
    return {
      responseCode: /** @type {ResponseCode} */ ('OK'),
      runs: []
    };
  }

  /**
   * @param {ChangeMessageInfo} changeMessage
   * @return {CheckRun} The CheckRun found, null when no BotProcessor accept it
   */
  createCheckRun(changeMessage) {
    let checkResults;

    // Text message reported by the bot
    const message = changeMessage.message;
    // When it got posted
    const messageDate = changeMessage.date;

    // Name of the check, multiple runs are aggregated as attempts
    const checkName = this.getCheckName(changeMessage);

    if ( typeof this.attempt[checkName] === 'undefined' ) {
      this.attempt[checkName] = 1;
    } else {
      this.attempt[checkName] += 1;
    }

    for (const processor of this.processors) {
      if ( processor.accept(changeMessage) ) {
        checkResults = processor.parse(changeMessage.message);
        break;
      }
    }

    // TODO process Zuul merge failures
    //  if ( ChangeMessage.tag.match(/^autogenerated:ci/) ) {
    //    checkResults = this._findZuulMergeFailure(message) ||
    //        this._findZuulCheckRun(message);
    if ( !checkResults ) {
      console.error(`Unimplemented CheckResult finder: tag: ${changeMessage.tag} message: ${changeMessage.message}`);
      return null;
    }

    let labelName;
    // A more robust alternative would be to parse the message for the labels
    // that got voted.
    if ( !CHECK_NOT_VOTING.includes(checkName) ) {
      labelName = 'Verified';
    } else {
      // The check results have not contributed, demote them
      checkResults.map(/** @type {CheckResult} */ check => {
        switch (check.category) {
        case 'SUCCESS':
          check.category = /** @type {Category} */ ('INFO');
          break;
        case 'ERROR':
          check.category = /** @type {Category} */ ('WARNING');
          break;
        }
        return check;
      });
    }

    /** @type {CheckRun} */
    const checkRun = {
      checkName: checkName,
      statusDescription: this.getPipelineMessage(message),
      status: /** @type {RunStatus} */ ('COMPLETED'),
      results: checkResults,
      attempt: this.attempt[checkName],
      // scheduledTimestamp:
      // startedTimestamp:
      /* The message date is a string such as '2022-11-18 11:00:44.000000'
       * the Checks API expects a Date object */
      finishedTimestamp: new Date(Date.parse(messageDate)),
    };
    if ( labelName ) {
      checkRun.labelName = labelName;
    }
    return checkRun;
  }

  /**
   * Used to track attempts which should be grouped together.
   *
   * For Zuul reports, that is a pipeline.
   *
   * XXX Logic should be moved to BotProcessor instances.
   *
   * @param {ChangeMessageInfo} changeMessage
   * @return {CheckRun["checkName"]} Name of this check
   */
  getCheckName(changeMessage) {
    let checkName;
    let m;

    if ( typeof changeMessage.tag === 'undefined' ) {
      // Messages were not tagged until 2022-12-08
      if ( typeof changeMessage.real_author !== 'undefined' && // due to tests
        changeMessage.real_author.username === 'pipelinebot') {
        return 'PipelineLib';
      }
      if ( PuppetCatalogCompilerProcessor.isLegacyMessage(changeMessage) ) {
        return 'PuppetCatalogCompiler';
      }

      console.warn(`Robot ${changeMessage.real_author.name} should tag with 'autogenerated:'`);
      return changeMessage.real_author.name;
    }

    if ( changeMessage.tag === 'autogenerated:codehealth' ) {
      checkName = 'Quality Gate';
    }

    if ( changeMessage.tag === 'autogenerated:pipelinelib' ) {
      return 'PipelineLib';
    }

    if ( changeMessage.tag === 'autogenerated:pcc-py' ) {
      return 'PuppetCatalogCompiler';
    }

    // Since Nov 25 2022, Zuul suffixes the message tag with the pipeline name
    if ( m = changeMessage.tag.match(/autogenerated:ci-(.+)/) ) {
      checkName = m[1];
    } else if ( changeMessage.tag.startsWith('autogenerated:ci') ) {

      // Pre Nov 25 2022 legacy names
      // Lookup the Zuul pipeline success-message / failure-message
      // There are lot more in the history of zuul/layout.yaml
      switch ( this.getPipelineMessage(changeMessage.message) ) {

      case 'Main test build succeeded.':
      case 'Main test build failed.':
        checkName = 'test';
        break;

      case 'Gate pipeline build succeeded.':
      case 'Gate pipeline build failed.':
        checkName = 'gate-and-submit';
        break;

      case 'Post-merge build succeeded.':
      case 'Post-merge build failed.':
        checkName = 'post-merge';
        break;

      case 'PHP test coverage increased (or stayed the same) :-)':
      case 'PHP test coverage decreased':
        checkName = 'coverage';
        break;

      case 'Performance checks OK! (same or better)':
      case 'This patch might be adding a page load cost.':
        checkName = 'patch-performance';
        break;

      case 'Experimental build succeeded.':
      case 'Experimental build failed.':
        checkName = 'experimental';
        break;

      case 'PHP build succeeded.':
      case 'PHP build failed.':
        checkName = 'php';
        break;
      }

    }

    if ( !checkName ) {
      // Wrongfully assumes the bot message defines the pipeline
      // First line of message reported by the bot
      checkName = this.getPipelineMessage(changeMessage.message);
    }
    return checkName;
  }

  /**
   * @param {ChangeMessageInfo["message"]} message
   */
  getPipelineMessage(message) {
    return message.split('\n')[2];
  }

  /**
   * @param {ChangeMessageInfo["message"]} message
   */
  _findZuulMergeFailure(message) {
    const m = message.match(/Merge Failed\.\n\n(?<failure_message>.*)/);
    if ( !m || !m.groups ) {
      return false;
    }
    return [
      { // CheckResult
        category: 'ERROR',
        summary: 'CI could not merge change or one of its dependencies',
        message: m.groups.failure_message,
      }
    ];
  }

}

window.Gerrit.install(plugin => {
  const checkAnalyzer = new WikimediaChecksAnalyzer();
  checkAnalyzer.register( new ZuulProcessor() );
  checkAnalyzer.register( new SonarQubeProcessor() );
  checkAnalyzer.register( new PipelineBotProcessor() );
  checkAnalyzer.register( new PuppetCatalogCompilerProcessor() );
  checkAnalyzer.register( new CindyTheBrowserBot() );

  /** @type {ChecksProvider} */
  const provider = {
    fetch: change => checkAnalyzer.fetch(change)
      .catch( err => {
        console.error('[wm-checks-api] error', err);
        /** @type {FetchResponse} */
        const errResponse = {
          responseCode: /** @type {ResponseCode} */ ('ERROR'),
          errorMessage: err,
        };
        return errResponse;
      } )
  };
  /** @type {ChecksApiConfig} */
  const config = {
    // We probably don't need to poll but setting poll interval to 0 causes
    // rjx.timer to poll infinitely with out any delay
    fetchPollingIntervalSeconds: 600,
  };

  /** @type {ChecksPluginApi} */
  plugin.checks().register(provider, config);
});

if ( typeof module !== 'undefined' ) {
  // eslint-disable-next-line no-undef
  module.exports = {
    BotProcessor: BotProcessor,
    CindyTheBrowserBot: CindyTheBrowserBot,
    PipelineBotProcessor: PipelineBotProcessor,
    PuppetCatalogCompilerProcessor: PuppetCatalogCompilerProcessor,
    SonarQubeProcessor: SonarQubeProcessor,
    ZuulProcessor: ZuulProcessor,
    WikimediaChecksAnalyzer: WikimediaChecksAnalyzer,
  };
}
