'use strict';
require('./gerrit-mocks.js');

const wmZuulStatus = require('../plugins/wm-zuul-status.js');

QUnit.module( '[wm-zuul-status]', () => {

  QUnit.module('ZuulStatusChecksProvider', hooks => {
    let zuul;
    hooks.before( () => {
      zuul = new wmZuulStatus.ZuulStatusChecksProvider();
    });

    QUnit.module( 'isInjectedPlugin()', subhooks => {
      subhooks.beforeEach( () => {
        zuul._isInjected = undefined;
      });

      QUnit.test( 'defaults to false', assert => {
        global.window = { location: { hostname: 'foo' } };
        global.document = { scripts: [] };

        assert.false(zuul.isInjectedPlugin());
      });

      const hostnamesTestCases = {
        '127.0.0.1': [ '127.0.0.1' ],
        localhost: [ 'localhost' ],
      };

      QUnit.test.each( 'recognizes Gerrit hostname', hostnamesTestCases,
        ( assert, [ hostname ] ) => {
          global.window = { location: { hostname: hostname } };
          assert.true(zuul.isInjectedPlugin());
        } );

      QUnit.test.each( 'recognizes script src', hostnamesTestCases,
        ( assert, [ hostname ] ) => {
          global.window = { location: { hostname: 'foo' } };
          global.document = { scripts: [
            { src: 'jquery.js' },
            { src: `http://${hostname}:8081/wm-zuul-status.js` },
          ] };
          assert.true(zuul.isInjectedPlugin());
        } );

      QUnit.test( 'memoizes result', assert => {
        // Memoize
        global.window = { location: { hostname: '127.0.0.1' } };
        assert.true(zuul.isInjectedPlugin());
        // The code would throw if it used window
        global.window = undefined;
        assert.true(zuul.isInjectedPlugin());
      });
    });

    const asciiProgressTestCases = [
      // Percent, expected
      [ 0, '▒'.repeat(10) ],
      [ 9, '▒'.repeat(10) ],
      [ 10, '█' + '▒'.repeat(9) ],
      [ 99, '█'.repeat(9) + '▒' ],
      [ 100, '█'.repeat(10) ],
      // Bound to 0 - 100
      [ -15, '▒'.repeat(10) ],
      [ 121, '█'.repeat(10) ],
    ];
    QUnit.test.each( 'asciiProgress', asciiProgressTestCases,
      ( assert, [ percent, expected ] ) => {
        assert.equal( zuul.asciiProgress(percent), expected );
      } );

    const jobSummaryTestCases = [
      // Job, expected
      [
        // eslint-disable-next-line camelcase
        { name: 'job', result: 'SUCCESS', elapsed_time: 13900 },
        'job | SUCCESS in 13s'
      ],
      [
        // eslint-disable-next-line camelcase
        { name: 'job', result: null, elapsed_time: 10000, remaining_time: 40000 },
        'job | ██▒▒▒▒▒▒▒▒ 20% | ETA: 40s'
      ],
    ];
    QUnit.test.each( 'jobSummary()', jobSummaryTestCases,
      ( assert, [ job, expected ] ) => {
        assert.equal(
          zuul.jobSummary( job ),
          expected
        );
      } );

    QUnit.test( 'parse() empty status', assert => {
      assert.deepEqual(
        [],
        zuul.parse([])
      );
    } );

    QUnit.test( 'parse() change in multiple pipelines', assert => {
      const checkRun = zuul.parse(
        [
          {
            jobs: [
              { result: 'SUCCESS',
                pipeline: 'test' },
              { result: 'CANCELED' }
            ]
          },
          {
            jobs: [
              { result: 'SUCCESS',
                pipeline: 'gate-and-submit' },
              { result: 'SUCCESS' },
              { result: 'FAILURE' }
            ]
          }
        ]
      );
      assert.deepEqual(checkRun.length, 2);
      assert.deepEqual(checkRun[0].checkName, 'test');
      assert.deepEqual(checkRun[0].results.length, 2);

      assert.deepEqual(checkRun[1].checkName, 'gate-and-submit');
      assert.deepEqual(checkRun[1].results.length, 3);
    } );

    QUnit.test( 'parse() skips non-live items', assert => {
      const checkRun = zuul.parse(
        [
          {
            jobs: [],
            live: false
          }
        ]
      );
      assert.deepEqual(checkRun, []);
    } );

    QUnit.test( 'parse() skips non building items', assert => {
      const checkRun = zuul.parse(
        [
          // We can't determinate the pipeline for a job that has no builds yet
          {
            live: true,
            jobs: [
              {
                name: 'mwext-codehealth-master-non-voting',
                pipeline: null,
              }
            ]
          },
          // Another pipeline did process the change
          {
            live: true,
            jobs: [
              { result: 'SUCCESS',
                pipeline: 'test' },
            ]
          },
        ]
      );
      assert.strictEqual(checkRun.length, 2);

      assert.propContains(checkRun[0], {
        checkName: 'Waiting for jobs',
      });

      assert.propContains(checkRun[1], {
        checkName: 'test',
      });
      assert.deepEqual(checkRun[1].results.length, 1);
    } );

    QUnit.test( 'parse() finds CheckName from running build', assert => {
      const checkRun = zuul.parse(
        [
          {
            live: true,
            jobs: [
              // First job hasn't started yet
              {
                name: 'mwext-codehealth-master-non-voting',
                pipeline: null,
              },
              {
                name: 'mwext-phpunit-coverage-docker-publish',
                pipeline: 'postmerge',
              }
            ]
          }
        ]
      );
      assert.strictEqual(checkRun.length, 1);
      assert.propContains(checkRun[0], {
        checkName: 'postmerge',
        status: 'RUNNING',
        statusDescription: 'PENDING: 2',
      });
    } );

    const resultTagsTestCases = [
      // jobResult, expected
      [ null, { name: 'Pending', color: 'gray' } ],
      [ 'SUCCESS', { name: 'SUCCESS' } ],
      [ 'CANCELED', { name: 'CANCELED' } ],
      [ 'SKIPPED', { name: 'SKIPPED' } ],
      [ 'FAILURE', { name: 'FAILURE', color: 'brown' } ],
    ];
    QUnit.test.each( 'resultTags()()', resultTagsTestCases,
      ( assert, [ jobResult, expected ] ) => {
        assert.deepEqual(
          zuul.resultTags(jobResult),
          expected,
        );
      }
    );

    const resultToCategoryTestCases = [
      // result, voting, expected
      [ null, undefined, 'INFO' ],
      [ null, true, 'INFO' ],
      [ null, false, 'INFO' ],
      [ 'SUCCESS', undefined, 'SUCCESS' ],
      [ 'SUCCESS', true, 'SUCCESS' ],
      [ 'SUCCESS', false, 'INFO' ],
      [ 'FAILURE', undefined, 'ERROR' ],
      [ 'FAILURE', true, 'ERROR' ],
      [ 'FAILURE', false, 'WARNING' ],
      // Anything else such as 'CANCELED' is an error
      [ 'CANCELED', undefined, 'ERROR' ],
      [ 'CANCELED', true, 'ERROR' ],
      [ 'CANCELED', false, 'WARNING' ],
    ];
    QUnit.test.each( 'resultToCategory()', resultToCategoryTestCases,
      ( assert, [ result, voting, expected ] ) => {
        assert.equal(
          zuul.resultToCategory(result, voting),
          expected,
        );
      }
    );

    const categoriesSummaryTestCases = [
      // checkResults, expected
      [
        [
          { category: 'SUCCESS', tags: [] },
        ],
        'SUCCESS: 1'
      ],
      [
        [
          { category: 'ERROR', tags: [] },
        ],
        'ERROR: 1'
      ],
      [
        [
          { category: 'SUCCESS', tags: [] },
          { category: 'INFO', tags: [] },
          { category: 'WARNING', tags: [] },
          { category: 'ERROR', tags: [] },
        ],
        'SUCCESS: 1, INFO: 1, WARNING: 1, ERROR: 1'
      ],
      [
        [
          { category: 'SUCCESS', tags: [ { name: 'Pending' } ] },
          { category: 'INFO', tags: [ { name: 'Pending' } ] },
          { category: 'WARNING', tags: [ { name: 'Pending' } ] },
          { category: 'ERROR', tags: [ { name: 'Pending' } ] },
          { category: 'SUCCESS', tags: [] },
        ],
        'PENDING: 4, SUCCESS: 1'
      ],
    ];
    QUnit.test.each( 'resultToCategory()', categoriesSummaryTestCases,
      ( assert, [ checkResult, expected ] ) => {
        assert.equal(
          zuul.categoriesSummary(checkResult),
          expected,
        );
      }
    );

  } );
} );
