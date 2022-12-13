'use strict';

// Mock plugin invocation of `window.Gerrit.install()
class MockChecksPluginApi {
  register( /** provider, config */ ) { }
}
class MockPluginApi {
  checks() { return new MockChecksPluginApi(); }
}
class MockGerrit {
  install(plugin) { plugin( new MockPluginApi() ); }
}
global.window = {
  Gerrit: new MockGerrit()
};

const wmChecksApi = require('../plugins/wm-checks-api.js');

QUnit.module( '[wm-checks-api]', () => {

  QUnit.module('BotProcessor', hooks => {
    let iBotProcessor;
    hooks.before( () => {
      iBotProcessor = new wmChecksApi.BotProcessor();
    });

    QUnit.test( 'accept() interface throws', assert => {
      assert.throws( () => {
        iBotProcessor.accept();
      } );
    } );
    QUnit.test( 'parse() interface throws', assert => {
      assert.throws( () => {
        iBotProcessor.parse();
      } );
    } );

    QUnit.test( 'unimplemented methods report class name', assert => {
      class DummyBotProcessor extends wmChecksApi.BotProcessor {}
      const dummy = new DummyBotProcessor();
      assert.throws(
        () => {
          dummy.accept();
        },
        new Error('DummyBotProcessor.accept() not implemented')
      );
      assert.throws(
        () => {
          dummy.parse();
        },
        new Error('DummyBotProcessor.parse() not implemented')
      );

    } );

    const resultCategoryMap = [
      // result, voting, expected
      [ 'SUCCESS', undefined, 'SUCCESS' ],
      [ 'SUCCESS', true, 'SUCCESS' ],
      [ 'SUCCESS', false, 'INFO' ],

      [ 'ERROR', undefined, 'ERROR' ],
      [ 'ERROR', true, 'ERROR' ],
      [ 'ERROR', false, 'WARNING' ],

      // Anything not a SUCCESS is the same as an ERROR
      [ 'foo', undefined, 'ERROR' ],
      [ 'foo', true, 'ERROR' ],
      [ 'foo', false, 'WARNING' ],
    ];

    QUnit.test.each( 'resultToCategory()', resultCategoryMap,
      ( assert, [ result, voting, expected ] ) => {
        assert.equal(
          iBotProcessor.resultToCategory(result, voting),
          expected
        );
      }
    );

  } );

  QUnit.module('CindyTheBrowserBot', hooks => {
    let cindy;
    hooks.before( () => {
      cindy = new wmChecksApi.CindyTheBrowserBot();
    });

    QUnit.test( 'accept() from user cindythebrowsertestbot', assert => {
      assert.true(
        cindy.accept( { // ChangeMessage
          real_author: { // eslint-disable-line camelcase
            username: 'cindythebrowsertestbot',
          }
        })
      );
    } );

    QUnit.test( 'accept() rejects an other author', assert => {
      assert.false(
        cindy.accept( { // ChangeMessage
          real_author: { // eslint-disable-line camelcase
            username: 'jenkins-bot',
          }
        })
      );
    } );

    QUnit.test( 'Good job is a success', assert => {
      assert.deepEqual(
        cindy.parse( 'Patchset 1:\n\nCindy says good job, \\o/' ),
        [ {
          category: 'SUCCESS',
          summary: 'Cindy says good job, \\o/',
        } ]
      );
    } );

    QUnit.test( 'Other messages are errors', assert => {
      assert.deepEqual(
        cindy.parse('hello\n\nCindy says hello\n'),
        [ {
          category: 'ERROR',
          summary: 'Cindy says hello\n',
        } ]
      );
    } );
  } );

  QUnit.module('PipelineBot', hooks => {
    let pipelineBot;
    hooks.before( () => {
      pipelineBot = new wmChecksApi.PipelineBotProcessor();
    });

    QUnit.test( 'accept() from user pipelinebot', assert => {
      assert.true(
        pipelineBot.accept( { // ChangeMessage
          real_author: { // eslint-disable-line camelcase
            username: 'pipelinebot',
          }
        })
      );
    });

    QUnit.test( 'accept() rejects an other author', assert => {
      assert.false(
        pipelineBot.accept( { // ChangeMessage
          real_author: { // eslint-disable-line camelcase
            username: 'jenkins-bot',
          }
        })
      );
    } );

    QUnit.test( 'parse() a success', assert => {
      assert.deepEqual(
        pipelineBot.parse('Patch Set 3:\n\npipeline-dashboard: wikimedia-toolhub-pipeline-publish\npipeline-build-result: SUCCESS (job: wikimedia-toolhub-pipeline-publish, build: 346)\n\nIMAGE:\n docker-registry.wikimedia.org/wikimedia/wikimedia-toolhub:2022-12-12-185614-production\n\nTAGS:\n 2022-12-12-185614-production, latest'),
        [
          {
            category: 'SUCCESS',
            summary: 'wikimedia-toolhub-pipeline-publish #346',
            links: [
              {
                url: 'https://integration.wikimedia.org/ci/blue/organizations/jenkins/wikimedia-toolhub-pipeline-publish/detail/service-pipeline-test-and-publish/346/pipeline',
                primary: true,
                icon: 'external',
                tooltip: 'Go to build',
              },
              {
                url: 'https://integration.wikimedia.org/ci/blue/organizations/jenkins/wikimedia-toolhub-pipeline-publish/activity',
                primary: true,
                icon: 'external',
                tooltip: 'Pipeline dashboard',
              }
            ]
          }
        ]
      );
    } );

    QUnit.test( 'parse() recognizes a failure as error', assert => {
      const result = pipelineBot.parse('Patch Set 7:\n\npipeline-dashboard: service-pipeline-test\npipeline-build-result: FAILURE (job: service-pipeline-test, build: 12284)');
      assert.strictEqual(result[0].category, 'ERROR');
    } );

  } );

  QUnit.module('SonarQube', hooks => {
    let sonarQube;
    hooks.before( () => {
      sonarQube = new wmChecksApi.SonarQubeProcessor();
    });

    QUnit.test( 'accept() from user sonarqubebot', assert => {
      assert.true(
        sonarQube.accept( { // ChangeMessage
          real_author: { // eslint-disable-line camelcase
            username: 'sonarqubebot',
          }
        })
      );
    });

    QUnit.test( 'accept() rejects an other author', assert => {
      assert.false(
        sonarQube.accept( { // ChangeMessage
          real_author: { // eslint-disable-line camelcase
            username: 'jenkins-bot',
          }
        })
      );
    } );

    QUnit.test( 'no report yields empty result', assert => {
      const results = sonarQube.parse( '' );
      assert.deepEqual(results, []);
    } );

    QUnit.test( 'finds successful report and url', assert => {
      const input = [
        '✔ Quality gate passed!\n',
        'Report: https://example.org/repo/foo',
      ].join('\n');
      const results = sonarQube.parse( input );

      assert.strictEqual(results.length, 1);
      assert.propContains(results[0],
        {
          category: 'SUCCESS',
          summary: 'SonarQube report Quality gate',
        }
      );
      assert.propContains(results[0],
        {
          links: [
            {
              url: 'https://example.org/repo/foo',
              primary: true,
              icon: 'external',
            }
          ]
        }
      );
    } );

    QUnit.test( 'finds checks from long report', assert => {
      const input = [
        // long form
        '* ✔ Quality gate passed!\n',
        '* ❌ Quality gate failed\n',
      ].join('\n');
      const results = sonarQube.parse( input );
      assert.propContains(results[0], { category: 'SUCCESS' });
      assert.propContains(results[1], { category: 'ERROR' });
      assert.strictEqual(results.length, 2);
    } );

    // Unclear whether this form is ever expected but the regex matches it
    QUnit.test( 'finds checks from short report', assert => {
      const input = [
        // shortest recognizable form
        '✔ Quality gate\n',
        '❌ Quality gate\n',
      ].join('\n');
      const results = sonarQube.parse( input );
      assert.propContains(results[0], { category: 'SUCCESS' });
      assert.propContains(results[1], { category: 'ERROR' });
      assert.strictEqual(results.length, 2);
    } );
  } );

  // ZuulProcessor
  QUnit.module('Zuul', hooks => {
    let zuul;
    hooks.before( () => {
      zuul = new wmChecksApi.ZuulProcessor();
    });

    QUnit.test( 'accept() autogenerated:ci', assert => {
      assert.true(
        zuul.accept( { // ChangeMessage
          tag: 'autogenerated:ci',
          real_author: { // eslint-disable-line camelcase
            tags: [ 'SERVICE_USER' ],
          },
        })
      );
    } );

    QUnit.test( 'accept() autogenerated:ci-<pipeline>', assert => {
      assert.true(
        zuul.accept( { // ChangeMessage
          tag: 'autogenerated:ci-gate-and-submit',
          real_author: { // eslint-disable-line camelcase
            tags: [ 'SERVICE_USER' ],
          },
        })
      );
    } );

    QUnit.test( 'accept() rejects ci tag from non service user', assert => {
      assert.false(
        zuul.accept( { // ChangeMessage
          tag: 'autogenerated:ci-gate-and-submit',
          real_author: { // eslint-disable-line camelcase
            username: 'hashar',
          },
        })
      );
    } );

    QUnit.module( 'parse', parseHooks => {
      let zuulResults;
      parseHooks.before( () => {
        zuulResults = zuul.parse( [
          'Patch Set 2: Verified-1',
          '',
          'Main test build failed.',
          '',
          '- https://example.org/job/php74-docker/0/console : SUCCESS in 10s',
          '- https://example.org/job/node14-docker/1/console : FAILURE in 11s',
          '- https://example.org/job/quibble-mysql-docker/2/console : SUCCESS in 12s (non-voting)',
          '- https://example.org/job/tox-py39-sqlite-docker/3/console : FAILURE in 13s (non-voting)',
          '- https://example.org/job/diffConfig/7/console : SUCCESS Please carefully review. in 47s (non-voting)',
          '- https://example.org/job/diffConfig/7/console : FAILURE No change detected. in 52s (non-voting)',
        ].join('\n') );
      } );

      QUnit.test( 'a basic job result', assert => {
        assert.propContains(zuulResults[0], {
          category: 'SUCCESS',
          summary: 'php74-docker | Main test build failed. | 10s',
        });
        assert.propContains(zuulResults[0], {
          links: [ {
            url: 'https://example.org/job/php74-docker/0/console',
            primary: true,
            icon: 'external',
          } ],
        } );

      } );

      QUnit.test( 'a failed job', assert => {
        assert.propContains(zuulResults[1], {
          category: 'ERROR',
          summary: 'node14-docker | Main test build failed. | 11s',
        } );
      } );

      QUnit.test( 'sets UI tags', assert => {
        assert.propContains(zuulResults[0], {
          tags: [ {
            name: 'PHP 7.4',
            color: 'gray',
          } ]
        } );

        assert.propContains(zuulResults[2], {
          tags: [ { name: 'MySQL' } ]
        } );

        assert.propContains(zuulResults[3], {
          tags: [
            {
              name: 'Python 3.9'
            },
            {
              name: 'Sqlite'
            },
          ]
        } );
      } );
      QUnit.test( 'non-voting successful job is INFO', assert => {
        assert.propContains(zuulResults[2], {
          category: 'INFO',
        } );
      } );
      QUnit.test( 'non-voting failing job is WARNING', assert => {
        assert.propContains(zuulResults[3], {
          category: 'WARNING',
        } );
      } );
      QUnit.test( 'non-voting successful job with message', assert => {
        assert.propContains(zuulResults[4], {
          category: 'INFO',
          summary: 'diffConfig |  Please carefully review. | 47s',
        } );
      } );
      QUnit.test( 'non-voting failing job with message', assert => {
        assert.propContains(zuulResults[5], {
          category: 'WARNING',
          summary: 'diffConfig |  No change detected. | 52s',
        } );
      } );

    } );

  } );

  QUnit.module('WikimediaChecksAnalyzer', () => {

    QUnit.test( 'catches duplicate registration', assert => {
      const analyzer = new wmChecksApi.WikimediaChecksAnalyzer();

      assert.strictEqual(analyzer.processors.length, 0);
      analyzer.register( new wmChecksApi.ZuulProcessor() );
      analyzer.register( new wmChecksApi.ZuulProcessor() );

      assert.true(
        analyzer.processors[0] instanceof wmChecksApi.ZuulProcessor,
        'Registered the expected ZuulProcessor'
      );
      assert.strictEqual(
        analyzer.processors.length, 1,
        'Registered a single instance'
      );
    } );

    QUnit.module('fetch', hooks => {
      let analyzer;
      hooks.before( () => {
        analyzer = new wmChecksApi.WikimediaChecksAnalyzer();
        analyzer.register( new wmChecksApi.CindyTheBrowserBot() );
      });

      QUnit.test('emptyResponse when there are no bot messages', async assert => {
        const response = await analyzer.fetch(
          { // ChangeData
            changeInfo: {
              messages: []
            }
          }
        );
        assert.deepEqual(response, {
          responseCode: 'OK',
          runs: []
        });
      } );

      QUnit.test('responds', async assert => {
        const response = await analyzer.fetch(
          { // ChangeData
            changeInfo: {
              messages: [
                { // ChangeMessage
                  real_author: { // eslint-disable-line camelcase
                    username: 'cindythebrowsertestbot',
                  },
                  message: '\n\nCindy says good job'
                }
              ]
            }
          }
        );
        assert.propContains(response, { responseCode: 'OK' });

        const run = response.runs[0];
        // Todo should use a deepEqual and check the run finishedTimestamp
        assert.propContains(run, {
          statusDescription: 'Cindy says good job',
          status: 'COMPLETED',
          attempt: 1,
          labelName: 'Verified',
        });
        assert.propContains(run.results, [
          {
            category: 'SUCCESS',
            summary: 'Cindy says good job',
          }
        ]);

      } );

      QUnit.test('processes only requested patchset', async assert => {
        const baseChangeData = { // ChangeData
          changeInfo: {
            messages: [
              // Passed on patchset 2
              { // ChangeMessage
                _revision_number: 2, // eslint-disable-line camelcase
                real_author: { // eslint-disable-line camelcase
                  username: 'cindythebrowsertestbot',
                },
                message: '\n\nCindy says good job'
              },
              // Failure reported from patchset 1 reported later!
              { // ChangeMessage
                _revision_number: 1, // eslint-disable-line camelcase
                real_author: { // eslint-disable-line camelcase
                  username: 'cindythebrowsertestbot',
                },
                message: '\n\nCindy is not happy'
              },
            ],
          },
        };

        const responsePS2 = await analyzer.fetch(
          { ...baseChangeData, patchsetNumber: 2 }
        );
        assert.propContains(responsePS2, { responseCode: 'OK' });
        assert.strictEqual(responsePS2.runs[0].results[0].category, 'SUCCESS');

        // Request for a previous patchset
        const responsePS1 = await analyzer.fetch(
          { ...baseChangeData, patchsetNumber: 1 }
        );
        assert.propContains(responsePS1, { responseCode: 'OK' });
        assert.strictEqual(responsePS1.runs[0].results[0].category, 'ERROR');
      } );

    } );

    QUnit.module('createCheckRun', () => {

      QUnit.test( 'tracks attempts', assert => {
        const analyzer = new wmChecksApi.WikimediaChecksAnalyzer();
        // Dummy analyzer to mute the unimplemented error
        analyzer.register( {
          accept: () => true,
          parse: () => { return true; }
        } );

        const changeMessage = {
          tag: 'autogenerated:ci-testor',
          message: ''
        };
        analyzer.createCheckRun(changeMessage);
        assert.deepEqual(analyzer.attempt, { testor: 1 });

        analyzer.createCheckRun(changeMessage);
        assert.deepEqual(
          analyzer.attempt, { testor: 2 },
          'Second run of same check increases attempts to 2'
        );

        analyzer.createCheckRun(
          { tag: 'autogenerated:ci-anotherpipeline', message: '' } );
        assert.deepEqual(
          analyzer.attempt, { testor: 2, anotherpipeline: 1 },
          'Run for another check is tracked independently'
        );
      } );

      // Some checks are never voting, see CHECK_NOT_VOTING array
      QUnit.test( 'non-voting successful check is INFO', assert => {
        const analyzer = new wmChecksApi.WikimediaChecksAnalyzer();
        analyzer.register( new wmChecksApi.SonarQubeProcessor() );

        const changeMessageSuccess = {
          tag: 'autogenerated:codehealth',
          real_author: { // eslint-disable-line camelcase
            username: 'sonarqubebot',
          },
          message: 'SUCCESS Quality gate'
        };
        const checkRunSuccess = analyzer.createCheckRun(changeMessageSuccess);
        assert.strictEqual(checkRunSuccess.results[0].category, 'INFO');
      } );

      QUnit.test( 'non-voting failed check is WARNING', assert => {
        const analyzer = new wmChecksApi.WikimediaChecksAnalyzer();
        analyzer.register( new wmChecksApi.SonarQubeProcessor() );

        const changeMessageFailure = {
          tag: 'autogenerated:codehealth',
          real_author: { // eslint-disable-line camelcase
            username: 'sonarqubebot',
          },
          message: 'FAILURE Quality gate'
        };
        const checkRunFailure = analyzer.createCheckRun(changeMessageFailure);
        assert.strictEqual(checkRunFailure.results[0].category, 'WARNING');
      } );
    } );

    QUnit.module( 'getCheckName', hooks => {
      let analyzer;
      hooks.before( () => {
        analyzer = new wmChecksApi.WikimediaChecksAnalyzer();
      } );

      // FIXME we should probably not need to copy paste from the
      // implementation to cover all code branches
      const legacyZuulPipelineMessages = [
        // Message, expected check name
        [ 'Main test build succeeded.', 'test' ],
        [ 'Main test build failed.', 'test' ],
        [ 'Gate pipeline build succeeded.', 'gate-and-submit' ],
        [ 'Gate pipeline build failed.', 'gate-and-submit' ],
        [ 'Post-merge build succeeded.', 'post-merge' ],
        [ 'Post-merge build failed.', 'post-merge' ],
        [ 'PHP test coverage increased (or stayed the same) :-)', 'coverage' ],
        [ 'PHP test coverage decreased', 'coverage' ],
        [ 'Performance checks OK! (same or better)', 'patch-performance' ],
        [ 'This patch might be adding a page load cost.', 'patch-performance' ],
        [ 'Experimental build succeeded.', 'experimental' ],
        [ 'Experimental build failed.', 'experimental' ],
        [ 'PHP build succeeded.', 'php' ],
        [ 'PHP build failed.', 'php' ],

        // Fallback is to reuse the given message
        [ 'Unrecognized message.', 'Unrecognized message.' ],
      ];

      QUnit.test.each(
        'Legacy Zuul pipeline check names',
        legacyZuulPipelineMessages,
        ( assert, [ pipelineMessage, expectedCheckName ] ) => {
          const changeMessage = {
            tag: 'autogenerated:ci',
            message: `\n\n${pipelineMessage}`,
          };
          assert.equal(
            analyzer.getCheckName(changeMessage),
            expectedCheckName
          );
        } );

      QUnit.test('PipelineBot without tag', assert => {
        assert.strictEqual(
          analyzer.getCheckName( {
            real_author: { // eslint-disable-line camelcase
              username: 'pipelinebot'
            }
          } ),
          'PipelineLib'
        );
      } );

      // Tagged since 2022-12-08
      QUnit.test('PipelineBot with tag', assert => {
        assert.strictEqual(
          analyzer.getCheckName( {
            real_author: { // eslint-disable-line camelcase
              username: 'WonderFullyIgnored'
            },
            tag: 'autogenerated:pipelinelib'
          } ),
          'PipelineLib'
        );
      } );

    } );

  } );

} );
