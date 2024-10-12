'use strict';

const wmPatchDemo = require('../plugins/wm-patch-demo.js');

QUnit.module( '[wm-patch-demo]', () => {

  QUnit.module('PatchDemoProvider', hooks => {
    let patchdemo;
    hooks.before( () => {
      patchdemo = new wmPatchDemo.PatchDemoProvider();
    });

    QUnit.module('parse()', () => {
      QUnit.test( 'processes findwikis API response', assert => {
        const change = { changeNumber: 822099 };
        const response = ([
          {
            wiki: 'a442d4db80',
            creator: 'ESanders (WMF)',
            created: '2022-08-10 22:08:38',
            patches: [
              '822099,3',
              '820233,6'
            ],
            url: 'https://patchdemo.wmflabs.org/wikis/a442d4db80/w'
          },
          {
            wiki: '32b0abf56d',
            creator: 'ESanders (WMF)',
            created: '2022-08-11 13:15:46',
            patches: [
              '822099,4',
              '820233,6'
            ],
            url: 'https://patchdemo.wmflabs.org/wikis/32b0abf56d/w'
          },
          {
            wiki: '82a75f9bb2',
            creator: 'ESanders (WMF)',
            created: '2023-03-02 18:41:54',
            patches: [
              '822099,6',
              '820233,12'
            ],
            url: 'https://patchdemo.wmflabs.org/wikis/82a75f9bb2/wiki/Talk:DiscussionTools'
          },
          {
            wiki: 'fa7e2263a2',
            creator: 'Matma Rex',
            created: '2023-03-16 18:13:59',
            patches: [
              '820233,14',
              '822099,7'
            ],
            url: 'https://patchdemo.wmflabs.org/wikis/fa7e2263a2/w'
          }
        ]);

        const actual = patchdemo.parse(response, change);
        assert.propContains(actual, {
          responseCode: 'OK',
        });
        assert.strictEqual(actual.runs.length, 1);
        assert.strictEqual(
          actual.runs[0].statusDescription,
          'Found 4 wikis for change 822099',
        );
        const results = actual.runs[0].results;
        assert.strictEqual(results.length, 4);

        results.forEach(result => {
          assert.true(
            result.message.includes('This change 822099'),
            'Wiki instance has the change applied',
          );
          assert.true(
            result.message.includes('* https://gerrit.wikimedia.org/r/c/820233/'),
            'Lists other patch applied to the wiki',
          );
        });

      });

      QUnit.test( 'process empty findiwikis API response', assert => {
        const change = { changeNumber: 12345 };
        const response = ( [] );
        const actual = patchdemo.parse(response, change);

        assert.propContains(actual, { responseCode: 'OK' });
        assert.propContains(actual, { runs: [] }, 'No wikis for change results in no runs');
      });

      QUnit.test( 'processes findwikis API response when one instance is in legacy Patchdemo and the other is in new Patchdemo', assert => {
        const change = { changeNumber: 1050046 };
        const response = ([
          {
            wiki: 'a6f18f963b',
            creator: 'WilliamMimura',
            created: '2024-06-26 21:00:13',
            patches: [
              '1050046,2'
            ],
            url: 'https://patchdemo-legacy.wmcloud.org/wikis/a6f18f963b/w'
          },
        ],
        [
          {
            wiki: '4fd2a6cca5',
            creator: 'Jdlrobson',
            created: '2024-09-03 22:10:14',
            patches: [
              '1050046,3'
            ],
            url: 'http://patchdemo.wmcloud.org/wikis/4fd2a6cca5/w/'
          }
        ]);

        const actual = patchdemo.parse(response, change);
        assert.propContains(actual, {
          responseCode: 'OK',
        });
        assert.strictEqual(actual.runs.length, 1);
        assert.strictEqual(
          actual.runs[0].statusDescription,
          'Found 1 wikis for change 1050046',
        );
        const results = actual.runs[0].results;
        assert.strictEqual(results.length, 1);

        results.forEach(result => {
          assert.true(
            result.message.includes('This change 1050046'),
            'Wiki instance has the change applied',
          );
        });

      });

    });

  } );

} );
