/*!
 * Show where a merged change is running, as one chip per place.
 * Copyright (c) 2026 Wikimedia Foundation and contributors.
 * License: GPL-3.0-or-later
 */
'use strict';

/**
 * @typedef { import("@gerritcodereview/typescript-api/hook").PluginElement } PluginElement
 * @typedef { import("@gerritcodereview/typescript-api/hook").HookApi<PluginElement> } ElementHook
 */

/**
 * @typedef {Object} PlaceVerdict
 * @property {string} place - Name of the place, such as group0
 * @property {string} verdict - live, not live, not deployed here, or unknown
 *
 * @typedef {Object} Report
 * @property {Array<PlaceVerdict>} [places] - Empty for a change that is not merged
 *
 * @typedef {Object} ChipStyle
 * @property {string} background
 * @property {string} color
 *
 * @typedef {Object} Chip
 * @property {string} label
 * @property {ChipStyle} style
 */

const SERVICE_URL = 'https://wheres-my-code-running.toolforge.org/api/';

const PROJECTS_KEY = 'wm-wheres-my-code-running.projects';

// How old a stored list may be, in seconds, before it is fetched again behind
// the answer.
const PROJECTS_MAX_AGE = 60 * 60; // One hour

/**
 * Chip colors per place, taken from the group headings on
 * https://versions.toolforge.org/ so that the two agree.  Beta is not in that
 * palette, so it gets one outside the train range.
 *
 * @type {Object<string,ChipStyle>}
 */
const PLACE_STYLE = {
  beta: { background: '#636', color: '#fefefe' },
  testwikis: { background: '#ccc', color: '#333' },
  group0: { background: '#900', color: '#fefefe' },
  group1: { background: '#069', color: '#fefefe' },
  group2: { background: '#396', color: '#fefefe' }
};

/** @type {ChipStyle} */
const NOWHERE_STYLE = {
  background: 'transparent',
  color: 'var(--deemphasized-text-color)'
};

/** @type {ChipStyle} */
const UNKNOWN_STYLE = {
  background: 'var(--gray-background)',
  color: 'var(--gray-foreground)'
};

/**
 * Layout of one chip, and of the label before them.
 *
 * Set on the elements rather than through styleApi().insertCSSRule(), whose
 * rules go in the document and so never match inside a shadow root.  A custom
 * property does cross that boundary, which is why the colors above resolve.
 *
 * @type {Object<string,string>}
 */
const CHIP_LAYOUT = {
  display: 'inline-block',
  padding: '0 var(--spacing-m)',
  'margin-right': 'var(--spacing-s)',
  border: '1px solid var(--border-color)',
  // Max rounded, as Gerrit rounds the vote chips beside a reviewer.
  'border-radius': '1em',
  'font-size': 'var(--font-size-small)',
  'line-height': '1.7',
  'white-space': 'nowrap'
};

/**
 * @param {HTMLElement} element
 * @param {Object<string,string>} rules
 * @return {void}
 */
const applyStyle = (element, rules) => {
  Object.keys(rules).forEach(name => {
    element.style.setProperty(name, rules[name]);
  });
};

/**
 * Turn a report into the chips to show.
 *
 * One chip per place the change runs.  A place that could not be read gets its
 * own chip, because that is not the same as the change being absent there.
 *
 * A change that reaches every place is shown as every place, for now, rather
 * than folded into one chip that would hide which places were checked.
 *
 * @param {Report|undefined} report - What the service answered
 * @return {Array<Chip>}
 */
const chipsFor = report => {
  const places = report && Array.isArray(report.places) ? report.places : [];
  if (!places.length) {
    return [];
  }
  const live = places.filter(place => place.verdict === 'live');
  const unknown = places.filter(place => place.verdict === 'unknown');

  const chips = [];
  live.forEach(place => {
    chips.push({
      label: place.place,
      style: PLACE_STYLE[place.place] || UNKNOWN_STYLE
    });
  });
  unknown.forEach(place => {
    chips.push({ label: place.place + '?', style: UNKNOWN_STYLE });
  });
  if (!live.length && !unknown.length) {
    chips.push({ label: 'Not deployed', style: NOWHERE_STYLE });
  }
  return chips;
};

/**
 * The list of deployed projects as it was last stored, if it is usable.
 *
 * @return {{fetched: number, projects: Array<string>}|null}
 */
const storedProjects = () => {
  try {
    const stored = window.localStorage.getItem(PROJECTS_KEY);
    const parsed = stored ? JSON.parse(stored) : null;
    return parsed && Array.isArray(parsed.projects) &&
      typeof parsed.fetched === 'number' ? parsed : null;
  } catch (e) {
    return null;
  }
};

/**
 * @param {Array<string>} projects
 * @return {void}
 */
const storeProjects = projects => {
  try {
    window.localStorage.setItem(PROJECTS_KEY,
      JSON.stringify({ fetched: Date.now(), projects: projects }));
  } catch (e) {
    // The list will just not outlive this page.
  }
};

/**
 * Ask the service which projects the places deploy.
 *
 * An incomplete list is refused rather than stored.
 *
 * @return {Promise<Array<string>|null>} null if there was no usable answer
 */
const fetchProjects = async () => {
  try {
    const response = await fetch(SERVICE_URL + 'projects',
      { cache: 'no-store' });
    if (!response.ok) {
      return null;
    }
    const body = await response.json();
    if (!body.complete || !Array.isArray(body.projects)) {
      return null;
    }
    storeProjects(body.projects);
    return body.projects;
  } catch (e) {
    return null;
  }
};

/**
 * The list of projects that we'll show deployment information for, or null if that is not known.
 *
 * A stored list is used immediately and is fetched again behind the answer when it is old.
 * If no list is stored, the service is queried and the result is stored (if good).
 *
 * @return {Promise<Array<string>|null>}
 */
const deployedProjects = async () => {
  const stored = storedProjects();
  if (!stored) {
    return fetchProjects();
  }
  if (Date.now() - stored.fetched > PROJECTS_MAX_AGE * 1000) {
    // Nothing waits for this; the page after this one gets the newer list.
    fetchProjects();
  }
  return stored.projects;
};

/**
 * Returns the width of the first column of the Change Info table.
 *
 * We want the first column of the Deployment information to have the same width
 * for best appearance.
 *
 * @param {Element} element
 * @return {number} pixels, or 0 if there was no row to measure
 */
const columnWidth = element => {
  const root = element.getRootNode();
  const cell = root instanceof ShadowRoot ?
    root.querySelector('section > .title') :
    null;
  return cell ? cell.getBoundingClientRect().width : 0;
};

/**
 * Stands in until the report arrives.
 *
 * Shaped as a chip and then made invisible, so that replacing it with real
 * chips cannot alter the height of the row.
 *
 * @return {HTMLElement}
 */
const waiting = () => {
  const span = document.createElement('span');
  applyStyle(span, CHIP_LAYOUT);
  span.style.setProperty('border-color', 'transparent');
  span.style.setProperty('color', 'var(--deemphasized-text-color)');
  span.appendChild(document.createTextNode('checking...'));
  return span;
};

/**
 * What to show when there is no report to show.
 *
 * The deployment information is never taken away once drawn, because removing
 * it moves everything below, so every ending needs something to say.  A 404 is
 * a repository no place deploys, which is the same answer as a change none of
 * them runs.  Anything else leaves the question open.
 *
 * @param {number} status of the response, or 0 if there was none
 * @return {Array<Chip>}
 */
const chipsForStatus = status => (status === 404 ?
  [ { label: 'Not deployed', style: NOWHERE_STYLE } ] :
  [ { label: 'unknown', style: UNKNOWN_STYLE } ]);

/**
 * @param {Array<Chip>} chips
 * @return {Array<HTMLElement>}
 */
const chipElements = chips => chips.map(chip => {
  const span = document.createElement('span');
  applyStyle(span, CHIP_LAYOUT);
  span.style.setProperty('background', chip.style.background);
  span.style.setProperty('color', chip.style.color);
  span.appendChild(document.createTextNode(chip.label));
  return span;
});

/**
 * The deployment information, laid out as a row of the panel like "Submitted"
 * and "Owner", and labeled like the "Change Info" heading.
 *
 * `heading-3` gives the heading type.  Its companion `metadata-title` is left
 * off: one component defines it as `display: none`.
 *
 * The width is a floor, not a fixed size.  The label is in larger type than the
 * cells it was measured from, and `title` carries `word-break: break-word`, so
 * a fixed width splits it mid-word.
 *
 * @param {HTMLElement} block
 * @param {Array<HTMLElement>} content
 * @param {number} width of the title column, 0 to leave it to the content
 * @return {void}
 */
const drawAsRow = (block, content, width) => {
  const section = document.createElement('section');
  const title = document.createElement('span');
  title.className = 'title heading-3';
  title.style.setProperty('white-space', 'nowrap');
  // The cells arrive aligned to their tops, and this label's type is taller
  // than the chips, which would leave them sitting high against it.
  title.style.setProperty('vertical-align', 'middle');
  if (width) {
    title.style.setProperty('box-sizing', 'border-box');
    title.style.setProperty('min-width', width + 'px');
  }
  title.appendChild(document.createTextNode('Deployment'));
  const value = document.createElement('span');
  value.className = 'value';
  value.style.setProperty('vertical-align', 'middle');
  content.forEach(node => value.appendChild(node));
  section.appendChild(title);
  section.appendChild(value);
  block.appendChild(section);
};

window.Gerrit.install(plugin => {
  const blockId = 'wm-wheres-my-code-running';

  /** @type {ElementHook} */
  const domHook = plugin.hook('change-metadata-item');

  domHook.onAttached(async element => {
    // First, before anything can return early.  Gerrit may attach the same
    // element to another change without detaching it in between, and a row
    // left behind would report the previous change.
    const previous = element.querySelector('#' + blockId);
    if (previous) {
      previous.remove();
    }

    if (element.change.status !== 'MERGED') {
      // An unmerged change runs nowhere, so there is nothing to draw.
      return;
    }

    const projects = await deployedProjects();
    if (projects && !projects.includes(element.change.project)) {
      // No place deploys this repository, so there is no deployment
      // information to draw.  Drawing it and taking it away again would move
      // the panel, and saying "Not deployed" for a repository that was never
      // meant to be is noise.
      return;
    }

    const width = columnWidth(element);

    const block = document.createElement('div');
    block.setAttribute('id', blockId);
    element.appendChild(block);

    /**
     * Drawn before the service is asked, so that the panel does not shift when
     * the report lands.  The placeholder is replaced where it stands.
     *
     * @param {Array<HTMLElement>} content
     * @return {void}
     */
    const draw = content => {
      while (block.firstChild) {
        block.removeChild(block.firstChild);
      }
      drawAsRow(block, content, width);
    };

    draw([ waiting() ]);

    /** @type {Array<Chip>} */
    let chips;
    try {
      const response = await fetch(SERVICE_URL + element.change._number,
        { cache: 'no-store' });
      chips = response.ok ?
        chipsFor(await response.json()) :
        chipsForStatus(response.status);
    } catch (e) {
      chips = chipsForStatus(0);
    }
    if (!chips.length) {
      chips = chipsForStatus(0);
    }
    draw(chipElements(chips));
  });

  domHook.onDetached(element => {
    // Look inside the element rather than the document: this block lives in a
    // shadow root, where getElementById cannot reach it.
    const block = element.querySelector('#' + blockId);
    if (block) {
      block.remove();
    }
  });
});

if (typeof module !== 'undefined') {
  // eslint-disable-next-line no-undef
  module.exports = {
    chipsFor: chipsFor,
    chipsForStatus: chipsForStatus,
    storedProjects: storedProjects,
    storeProjects: storeProjects,
    fetchProjects: fetchProjects,
    deployedProjects: deployedProjects,
    PROJECTS_KEY: PROJECTS_KEY,
    PROJECTS_MAX_AGE: PROJECTS_MAX_AGE,
    chipElements: chipElements,
    columnWidth: columnWidth,
    drawAsRow: drawAsRow,
    waiting: waiting,
    PLACE_STYLE: PLACE_STYLE,
    UNKNOWN_STYLE: UNKNOWN_STYLE,
    NOWHERE_STYLE: NOWHERE_STYLE
  };
}
