'use strict';

const plugin = require('../plugins/wm-wheres-my-code-running.js');

QUnit.module( '[wm-wheres-my-code-running]', () => {

  const places = verdicts => ({
    places: Object.keys(verdicts).map(place => ({
      place: place, verdict: verdicts[place]
    }))
  });

  // Enough of a document for the parts that build the row.  The plugin reads
  // these off the global at call time, so they only have to exist while a test
  // runs.
  const textOf = node => (node.children || [])
    .map(child => ('data' in child ? child.data : textOf(child)))
    .join('');

  const fakeDocument = () => ({
    createTextNode: data => ({ data: data }),
    createElement: tag => {
      const element = {
        tagName: tag.toUpperCase(),
        className: '',
        children: [],
        styles: {},
        firstChild: null
      };
      element.style = {
        setProperty: (name, value) => {
          element.styles[name] = value;
        }
      };
      element.appendChild = child => {
        element.children.push(child);
        element.firstChild = element.children[0];
        return child;
      };
      element.removeChild = child => {
        element.children = element.children.filter(node => node !== child);
        element.firstChild = element.children[0] || null;
        return child;
      };
      return element;
    }
  });

  const withDocument = hooks => {
    hooks.beforeEach(() => {
      global.document = fakeDocument();
      global.ShadowRoot = class ShadowRoot {};
    });
    hooks.afterEach(() => {
      delete global.document;
      delete global.ShadowRoot;
    });
  };

  QUnit.module('chipsFor()', () => {
    QUnit.test( 'one chip per place it runs on', assert => {
      const chips = plugin.chipsFor(places({
        testwikis: 'live', group0: 'live',
        group1: 'not live', group2: 'not deployed here'
      }));
      assert.deepEqual( chips.map(c => c.label), [ 'testwikis', 'group0' ] );
    });

    QUnit.test( 'every place when it runs everywhere', assert => {
      const chips = plugin.chipsFor(places({
        testwikis: 'live', group0: 'live', group1: 'live', group2: 'live'
      }));
      assert.deepEqual( chips.map(c => c.label),
        [ 'testwikis', 'group0', 'group1', 'group2' ] );
    });

    QUnit.test( 'an unchecked place is not an absent place', assert => {
      const chips = plugin.chipsFor(places({
        testwikis: 'live', group0: 'unknown',
        group1: 'not live', group2: 'not live'
      }));
      assert.deepEqual( chips.map(c => c.label), [ 'testwikis', 'group0?' ] );
    });

    QUnit.test( 'says so when it runs nowhere', assert => {
      const chips = plugin.chipsFor(places({
        testwikis: 'not live', group0: 'not live',
        group1: 'not live', group2: 'not live'
      }));
      assert.deepEqual( chips.map(c => c.label), [ 'Not deployed' ] );
    });

    QUnit.test( 'every place unknown claims nothing', assert => {
      const chips = plugin.chipsFor(places({
        testwikis: 'unknown', group0: 'unknown',
        group1: 'unknown', group2: 'unknown'
      }));
      assert.deepEqual( chips.map(c => c.label),
        [ 'testwikis?', 'group0?', 'group1?', 'group2?' ] );
    });

    QUnit.test( 'no places, no chips', assert => {
      assert.deepEqual( plugin.chipsFor({ places: [] }), [] );
      assert.deepEqual( plugin.chipsFor({}), [] );
      assert.deepEqual( plugin.chipsFor(undefined), [] );
    });

    QUnit.test( 'a chip carries the color of its place', assert => {
      const chips = plugin.chipsFor(places({
        testwikis: 'live', group2: 'live'
      }));
      assert.strictEqual( chips[0].style, plugin.PLACE_STYLE.testwikis );
      assert.strictEqual( chips[1].style, plugin.PLACE_STYLE.group2 );
    });

    QUnit.test( 'a place with no color of its own still gets a chip', assert => {
      // A place added to the service is worth showing before it is worth
      // coloring.
      const chips = plugin.chipsFor(places({ group7: 'live' }));
      assert.deepEqual( chips.map(c => c.label), [ 'group7' ] );
      assert.strictEqual( chips[0].style, plugin.UNKNOWN_STYLE );
    });

    QUnit.test( 'the unchecked and the absent are told apart', assert => {
      const unchecked = plugin.chipsFor(places({ group0: 'unknown' }));
      assert.strictEqual( unchecked[0].style, plugin.UNKNOWN_STYLE );
      const absent = plugin.chipsFor(places({ group0: 'not live' }));
      assert.strictEqual( absent[0].style, plugin.NOWHERE_STYLE );
    });
  });

  // A localStorage and a fetch, only for as long as a test runs.
  const fakeStorage = () => {
    const stored = {};
    return {
      stored: stored,
      getItem: key => (key in stored ? stored[key] : null),
      setItem: (key, value) => {
        stored[key] = String(value);
      }
    };
  };

  const withStorage = hooks => {
    hooks.beforeEach(() => {
      global.window.localStorage = fakeStorage();
    });
    hooks.afterEach(() => {
      delete global.window.localStorage;
      delete global.fetch;
    });
  };

  // Answers one /api/projects request.
  const answerWith = (body, ok = true) => {
    const calls = [];
    global.fetch = url => {
      calls.push(url);
      return Promise.resolve({
        ok: ok,
        json: () => Promise.resolve(body)
      });
    };
    return calls;
  };

  QUnit.module('the deployed project list', hooks => {
    withStorage(hooks);

    QUnit.test( 'a complete answer is used and kept', async assert => {
      const calls = answerWith({ projects: [ 'mediawiki/core' ], complete: true });
      const projects = await plugin.fetchProjects();
      assert.deepEqual( projects, [ 'mediawiki/core' ] );
      assert.strictEqual( calls.length, 1 );
      assert.deepEqual( plugin.storedProjects().projects, [ 'mediawiki/core' ] );
    });

    QUnit.test( 'an incomplete answer is refused, not kept', async assert => {
      // Short by however many places went unread, so trusting it would hide a
      // row that belongs.
      answerWith({ projects: [ 'mediawiki/core' ], complete: false });
      assert.strictEqual( await plugin.fetchProjects(), null );
      assert.strictEqual( plugin.storedProjects(), null );
    });

    QUnit.test( 'a refused request is not an answer', async assert => {
      answerWith({}, false);
      assert.strictEqual( await plugin.fetchProjects(), null );
    });

    QUnit.test( 'a request that never arrives is not an answer', async assert => {
      global.fetch = () => Promise.reject(new Error('offline'));
      assert.strictEqual( await plugin.fetchProjects(), null );
    });

    QUnit.test( 'rubbish in storage is ignored', assert => {
      global.window.localStorage.setItem(plugin.PROJECTS_KEY, 'not json');
      assert.strictEqual( plugin.storedProjects(), null );
      global.window.localStorage.setItem(plugin.PROJECTS_KEY, '{"projects":7}');
      assert.strictEqual( plugin.storedProjects(), null );
      // Without a usable timestamp the age cannot be judged, and comparing
      // against undefined would say the list is never old.
      global.window.localStorage.setItem(plugin.PROJECTS_KEY,
        '{"projects":["mediawiki/core"]}');
      assert.strictEqual( plugin.storedProjects(), null );
    });

    QUnit.test( 'a stored list answers without asking', async assert => {
      plugin.storeProjects([ 'mediawiki/core' ]);
      const calls = answerWith({ projects: [ 'other' ], complete: true });
      assert.deepEqual( await plugin.deployedProjects(), [ 'mediawiki/core' ] );
      assert.strictEqual( calls.length, 0, 'asked when it did not need to' );
    });

    QUnit.test( 'an old list still answers, and is renewed behind it', async assert => {
      global.window.localStorage.setItem(plugin.PROJECTS_KEY, JSON.stringify({
        fetched: Date.now() - (plugin.PROJECTS_MAX_AGE * 1000) - 1,
        projects: [ 'stale/project' ]
      }));
      const calls = answerWith({ projects: [ 'fresh/project' ], complete: true });
      assert.deepEqual( await plugin.deployedProjects(), [ 'stale/project' ],
        'waited for the new list' );
      assert.strictEqual( calls.length, 1, 'did not renew the old list' );
    });

    QUnit.test( 'no list means the service is asked and waited for', async assert => {
      const calls = answerWith({ projects: [ 'mediawiki/core' ], complete: true });
      assert.deepEqual( await plugin.deployedProjects(), [ 'mediawiki/core' ] );
      assert.strictEqual( calls.length, 1 );
    });

    QUnit.test( 'nothing known is not the same as nothing deployed', async assert => {
      // The row is drawn as before rather than withheld, so a service that
      // cannot answer does not silently remove it everywhere.
      global.fetch = () => Promise.reject(new Error('offline'));
      assert.strictEqual( await plugin.deployedProjects(), null );
    });
  });

  QUnit.module('chipsForStatus()', () => {
    QUnit.test( 'a refused repository is not deployed', assert => {
      const chips = plugin.chipsForStatus(404);
      assert.deepEqual( chips.map(c => c.label), [ 'Not deployed' ] );
      assert.strictEqual( chips[0].style, plugin.NOWHERE_STYLE );
    });

    QUnit.test( 'anything else leaves the question open', assert => {
      [ 500, 502, 503, 0 ].forEach(status => {
        const chips = plugin.chipsForStatus(status);
        assert.deepEqual( chips.map(c => c.label), [ 'unknown' ],
          'status ' + status );
        assert.strictEqual( chips[0].style, plugin.UNKNOWN_STYLE );
      });
    });

    QUnit.test( 'there is always something to say', assert => {
      // The row is never taken away once drawn, so no ending may be silent.
      [ 200, 404, 500, 0 ].forEach(status => {
        assert.strictEqual( plugin.chipsForStatus(status).length, 1,
          'status ' + status );
      });
    });
  });

  QUnit.module('drawAsRow()', hooks => {
    withDocument(hooks);

    const draw = width => {
      const block = global.document.createElement('div');
      plugin.drawAsRow(block, [ global.document.createTextNode('chips') ], width);
      return block.children[0];
    };

    QUnit.test( 'is a section labeled like the panel own rows', assert => {
      const section = draw(0);
      assert.strictEqual( section.tagName, 'SECTION' );
      const title = section.children[0];
      const value = section.children[1];
      assert.strictEqual( title.className, 'title heading-3' );
      assert.strictEqual( textOf(title), 'Deployment' );
      assert.strictEqual( value.className, 'value' );
      assert.strictEqual( textOf(value), 'chips' );
    });

    QUnit.test( 'a measured width is a floor, not a size', assert => {
      // A fixed width leaves the larger label nothing to sit in, and `title`
      // carries word-break, so it splits mid-word.
      const title = draw(120).children[0];
      assert.strictEqual( title.styles['min-width'], '120px' );
      assert.strictEqual( title.styles.width, undefined );
      assert.strictEqual( title.styles['box-sizing'], 'border-box' );
      assert.strictEqual( title.styles['white-space'], 'nowrap' );
    });

    QUnit.test( 'nothing to measure leaves the column to the content', assert => {
      const title = draw(0).children[0];
      assert.strictEqual( title.styles['min-width'], undefined );
    });

    QUnit.test( 'the cells center against each other', assert => {
      // They arrive aligned to their tops, and this label is the taller.
      const section = draw(0);
      assert.strictEqual( section.children[0].styles['vertical-align'], 'middle' );
      assert.strictEqual( section.children[1].styles['vertical-align'], 'middle' );
    });
  });

  QUnit.module('chipElements()', hooks => {
    withDocument(hooks);

    QUnit.test( 'each chip carries its own colors and label', assert => {
      const elements = plugin.chipElements([
        { label: 'group0', style: { background: '#900', color: '#fefefe' } }
      ]);
      assert.strictEqual( elements.length, 1 );
      assert.strictEqual( textOf(elements[0]), 'group0' );
      assert.strictEqual( elements[0].styles.background, '#900' );
      assert.strictEqual( elements[0].styles.color, '#fefefe' );
      // Inline, because a document rule cannot reach into a shadow root.
      assert.strictEqual( elements[0].styles['border-radius'], '1em' );
    });
  });

  QUnit.module('waiting()', hooks => {
    withDocument(hooks);

    QUnit.test( 'is a chip that cannot be seen', assert => {
      // The same box as a real chip, so swapping them cannot move the panel.
      const placeholder = plugin.waiting();
      const chip = plugin.chipElements([
        { label: 'group0', style: { background: '#900', color: '#fff' } }
      ])[0];
      [ 'padding', 'font-size', 'line-height', 'border', 'border-radius',
        'display' ].forEach(property => {
        assert.strictEqual( placeholder.styles[property], chip.styles[property],
          property + ' differs from a chip' );
      });
      assert.strictEqual( placeholder.styles['border-color'], 'transparent' );
    });

    QUnit.test( 'stands in until the report arrives', assert => {
      const placeholder = plugin.waiting();
      assert.strictEqual( textOf(placeholder), 'checking...' );
      assert.strictEqual( placeholder.styles.color,
        'var(--deemphasized-text-color)' );
    });
  });

  QUnit.module('columnWidth()', hooks => {
    withDocument(hooks);

    QUnit.test( 'measures a real row of the panel', assert => {
      const root = new global.ShadowRoot();
      root.querySelector = () => ({
        getBoundingClientRect: () => ({ width: 137 })
      });
      assert.strictEqual(
        plugin.columnWidth({ getRootNode: () => root }), 137 );
    });

    QUnit.test( 'no row to measure is not an error', assert => {
      const root = new global.ShadowRoot();
      root.querySelector = () => null;
      assert.strictEqual(
        plugin.columnWidth({ getRootNode: () => root }), 0 );
    });

    QUnit.test( 'outside a shadow root it measures nothing', assert => {
      // Guards against matching some unrelated section of the whole document.
      assert.strictEqual(
        plugin.columnWidth({ getRootNode: () => ({ querySelector: () => {
          throw new Error('must not be asked');
        } }) }), 0 );
    });
  });
});
