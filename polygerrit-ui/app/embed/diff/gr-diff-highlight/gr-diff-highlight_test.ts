/**
 * @license
 * Copyright 2016 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import '../../../test/common-test-setup-karma';
import './gr-diff-highlight';
import {_getTextOffset} from './gr-range-normalizer';
import {html} from '@polymer/polymer/lib/utils/html-tag';
import {
  GrDiffHighlight,
  DiffBuilderInterface,
  CreateRangeCommentEventDetail,
} from './gr-diff-highlight';
import {Side} from '../../../api/diff';
import {SinonStubbedMember} from 'sinon';
import {queryAndAssert} from '../../../utils/common-util';
import {GrDiffThreadElement} from '../gr-diff/gr-diff-utils';

// Splitting long lines in html into shorter rows breaks tests:
// zero-length text nodes and new lines are not expected in some places
/* eslint-disable max-len, lit/prefer-static-styles */
/* prettier-ignore */
const basicFixture = fixtureFromTemplate(html`
  <style>
    .tab-indicator:before {
      color: #c62828;
      /* >> character */
      content: '\\00BB';
    }
  </style>
  <gr-diff-highlight>
    <table id="diffTable">
      <tbody class="section both">
        <tr class="diff-row side-by-side" left-type="both" right-type="both">
          <td class="left lineNum" data-value="1"></td>
          <td class="content both"><div class="contentText">[1] Nam cum ad me in Cumanum salutandi causa uterque venisset,</div></td>
          <td class="right lineNum" data-value="1"></td>
          <td class="content both"><div class="contentText">[1] Nam cum ad me in Cumanum salutandi causa uterque</div></td>
        </tr>
      </tbody>

      <tbody class="section delta">
        <tr class="diff-row side-by-side" left-type="remove" right-type="add">
          <td class="left lineNum" data-value="2"></td>
          <!-- Next tag is formatted to eliminate zero-length text nodes. -->
          <td class="content remove"><div class="contentText">na💢ti <hl class="foo range id314">te, inquit</hl>, sumus<hl class="bar">aliquando</hl> otiosum, <hl>certe</hl> a<hl><span class="tab-indicator" style="tab-size:8;"> </span></hl>udiam, <hl>quid</hl> sit,<span class="tab-indicator" style="tab-size:8;"> </span>quod<hl>Epicurum</hl></div></td>
          <td class="right lineNum" data-value="2"></td>
          <!-- Next tag is formatted to eliminate zero-length text nodes. -->
          <td class="content add"><div class="contentText">nacti , <hl>,</hl> sumus<hl><span class="tab-indicator" style="tab-size:8;"> </span></hl>otiosum,<span class="tab-indicator" style="tab-size:8;"> </span> audiam,sit, quod</div></td>
        </tr>
      </tbody>

      <tbody class="section both">
        <tr class="diff-row side-by-side" left-type="both" right-type="both">
          <td class="left lineNum" data-value="138"></td>
          <td class="content both"><div class="contentText">[14] Nam cum ad me in Cumanum salutandi causa uterque venisset,</div></td>
          <td class="right lineNum" data-value="119"></td>
          <td class="content both"><div class="contentText">[14] Nam cum ad me in Cumanum salutandi causa uterque venisset,</div></td>
        </tr>
      </tbody>

      <tbody class="section delta">
        <tr class="diff-row side-by-side" left-type="remove" right-type="add">
          <td class="left lineNum" data-value="140"></td>
          <!-- Next tag is formatted to eliminate zero-length text nodes. -->
          <td class="content remove"><div class="contentText">na💢ti <hl class="foo">te, inquit</hl>, sumus <hl class="bar">aliquando</hl> otiosum, <hl>certe</hl> a <hl><span class="tab-indicator" style="tab-size:8;">\u0009</span></hl>udiam, <hl>quid</hl> sit, <span class="tab-indicator" style="tab-size:8;">\u0009</span>quod <hl>Epicurum</hl></div><div class="comment-thread">
            [Yet another random diff thread content here]
          </div></td>
          <td class="right lineNum" data-value="120"></td>
          <!-- Next tag is formatted to eliminate zero-length text nodes. -->
          <td class="content add"><div class="contentText">nacti , <hl>,</hl> sumus <hl><span class="tab-indicator" style="tab-size:8;">\u0009</span></hl> otiosum,  <span class="tab-indicator" style="tab-size:8;">\u0009</span> audiam,  sit, quod</div></td>
        </tr>
      </tbody>

      <tbody class="section both">
        <tr class="diff-row side-by-side" left-type="both" right-type="both">
          <td class="left lineNum" data-value="141"></td>
          <td class="content both"><div class="contentText">nam et<hl><span class="tab-indicator" style="tab-size:8;"> </span></hl>complectitur<span class="tab-indicator" style="tab-size:8;"></span>verbis, quod vult, et dicit plane, quod intellegam;</div></td>
          <td class="right lineNum" data-value="130"></td>
          <td class="content both"><div class="contentText">nam et complectitur verbis, quod vult, et dicit plane, quodintellegam;</div></td>
        </tr>
      </tbody>

      <tbody class="section contextControl">
        <tr
          class="diff-row side-by-side"
          left-type="contextControl"
          right-type="contextControl"
        >
          <td class="left contextLineNum"></td>
          <td>
            <gr-button>+10↑</gr-button>
            -
            <gr-button>Show 21 common lines</gr-button>
            -
            <gr-button>+10↓</gr-button>
          </td>
          <td class="right contextLineNum"></td>
          <td>
            <gr-button>+10↑</gr-button>
            -
            <gr-button>Show 21 common lines</gr-button>
            -
            <gr-button>+10↓</gr-button>
          </td>
        </tr>
      </tbody>

      <tbody class="section delta total">
        <tr class="diff-row side-by-side" left-type="blank" right-type="add">
          <td class="left"></td>
          <td class="blank"></td>
          <td class="right lineNum" data-value="146"></td>
          <td class="content add"><div class="contentText">[17] Quid igitur est? inquit; audire enim cupio, quid non probes. Principio, inquam,</div></td>
        </tr>
      </tbody>

      <tbody class="section both">
        <tr class="diff-row side-by-side" left-type="both" right-type="both">
          <td class="left lineNum" data-value="165"></td>
          <td class="content both"><div class="contentText"></div></td>
          <td class="right lineNum" data-value="147"></td>
          <td class="content both"><div class="contentText">in physicis, <hl><span class="tab-indicator" style="tab-size:8;"> </span></hl>quibus maxime gloriatur, primum totus est alienus. Democritea dicit</div></td>
        </tr>
      </tbody>
    </table>
  </gr-diff-highlight>
`);
/* eslint-enable max-len */

suite('gr-diff-highlight', () => {
  let element: GrDiffHighlight;

  setup(() => {
    element = (
      basicFixture.instantiate() as HTMLElement[]
    )[1] as GrDiffHighlight;
  });

  suite('comment events', () => {
    let builder;
    let threadEl: GrDiffThreadElement;
    let hlRange: HTMLElement;

    setup(() => {
      builder = {
        getContentTdByLineEl: () => null,
      };
      element._cachedDiffBuilder = builder;

      const diff = queryAndAssert(element, '#diffTable');
      hlRange = queryAndAssert(diff, 'hl.range.id314');

      threadEl = document.createElement(
        'div'
      ) as unknown as GrDiffThreadElement;
      threadEl.className = 'comment-thread';
      threadEl.rootId = 'id314';
      document.body.appendChild(threadEl);
    });

    teardown(() => {
      threadEl.remove();
    });

    test('comment-thread-mouseenter toggles rangeHoverHighlight class', () => {
      assert.isFalse(hlRange.classList.contains('rangeHoverHighlight'));
      threadEl.dispatchEvent(
        new CustomEvent('comment-thread-mouseenter', {
          bubbles: true,
          composed: true,
        })
      );
      // TODO: Enable this test when we don't need `assignedSlot` anymore.
      // This will be done in a direct follow-up change.
      // assert.isTrue(hlRange.classList.contains('rangeHoverHighlight'));
    });

    test('comment-thread-mouseleave toggles rangeHoverHighlight class', () => {
      hlRange.classList.add('rangeHoverHighlight');
      threadEl.dispatchEvent(
        new CustomEvent('comment-thread-mouseleave', {
          bubbles: true,
          composed: true,
        })
      );
      // TODO: Enable this test when we don't need `assignedSlot` anymore.
      // This will be done in a direct follow-up change.
      // assert.isFalse(hlRange.classList.contains('rangeHoverHighlight'));
    });

    test(`create-range-comment for range when create-comment-requested
          is fired`, () => {
      const removeActionBoxStub = sinon.stub(element, '_removeActionBox');
      element.selectedRange = {
        side: Side.LEFT,
        range: {
          start_line: 7,
          start_character: 11,
          end_line: 24,
          end_character: 42,
        },
      };
      const requestEvent = new CustomEvent('create-comment-requested');
      let createRangeEvent: CustomEvent<CreateRangeCommentEventDetail>;
      element.addEventListener('create-range-comment', e => {
        createRangeEvent = e;
      });
      element.dispatchEvent(requestEvent);
      if (!createRangeEvent!) assert.fail('event not set');
      assert.deepEqual(element.selectedRange, createRangeEvent.detail);
      assert.isTrue(removeActionBoxStub.called);
    });
  });

  suite('selection', () => {
    let diff: HTMLElement;
    let builder: {
      getContentTdByLineEl: SinonStubbedMember<
        DiffBuilderInterface['getContentTdByLineEl']
      >;
    };
    let contentStubs;

    const stubContent = (line: number, side: Side) => {
      const contentTd = diff.querySelector(
        `.${side}.lineNum[data-value="${line}"] ~ .content`
      );
      if (!contentTd) assert.fail('content td not found');
      const contentText = contentTd.querySelector('.contentText');
      const lineEl =
        diff.querySelector(`.${side}.lineNum[data-value="${line}"]`) ??
        undefined;
      contentStubs.push({
        lineEl,
        contentTd,
        contentText,
      });
      builder.getContentTdByLineEl.withArgs(lineEl).returns(contentTd);
      return contentText;
    };

    const emulateSelection = (
      startNode: Node,
      startOffset: number,
      endNode: Node,
      endOffset: number
    ) => {
      const selection = document.getSelection()!;
      const range = document.createRange();
      range.setStart(startNode, startOffset);
      range.setEnd(endNode, endOffset);
      selection.addRange(range);
      element._handleSelection(selection, false);
    };

    setup(() => {
      contentStubs = [];
      stub('gr-selection-action-box', 'placeAbove');
      stub('gr-selection-action-box', 'placeBelow');
      diff = queryAndAssert(element, '#diffTable');
      builder = {
        getContentTdByLineEl: sinon.stub(),
      };
      element._cachedDiffBuilder = builder;
    });

    teardown(() => {
      contentStubs = null;
      document.getSelection()!.removeAllRanges();
    });

    test('single first line', () => {
      const content = stubContent(1, Side.RIGHT);
      sinon.spy(element, '_positionActionBox');
      if (!content?.firstChild) assert.fail('content first child not found');
      emulateSelection(content.firstChild, 5, content.firstChild, 12);
      const actionBox = element.shadowRoot?.querySelector(
        'gr-selection-action-box'
      );
      if (!actionBox) assert.fail('action box not found');
      assert.isTrue(actionBox.positionBelow);
    });

    test('multiline starting on first line', () => {
      const startContent = stubContent(1, Side.RIGHT);
      const endContent = stubContent(2, Side.RIGHT);
      sinon.spy(element, '_positionActionBox');
      if (!startContent?.firstChild) {
        assert.fail('first child of start content not found');
      }
      if (!endContent?.lastChild) {
        assert.fail('last child of end content not found');
      }
      emulateSelection(startContent.firstChild, 10, endContent.lastChild, 7);
      const actionBox = element.shadowRoot?.querySelector(
        'gr-selection-action-box'
      );
      if (!actionBox) assert.fail('action box not found');
      assert.isTrue(actionBox.positionBelow);
    });

    test('single line', () => {
      const content = stubContent(138, Side.LEFT);
      sinon.spy(element, '_positionActionBox');
      if (!content?.firstChild) assert.fail('content first child not found');
      emulateSelection(content.firstChild, 5, content.firstChild, 12);
      const actionBox = element.shadowRoot?.querySelector(
        'gr-selection-action-box'
      );
      if (!actionBox) assert.fail('action box not found');
      if (!element.selectedRange) assert.fail('no range selected');
      const {range, side} = element.selectedRange;
      assert.deepEqual(range, {
        start_line: 138,
        start_character: 5,
        end_line: 138,
        end_character: 12,
      });
      assert.equal(side, Side.LEFT);
      assert.notOk(actionBox.positionBelow);
    });

    test('multiline', () => {
      const startContent = stubContent(119, Side.RIGHT);
      const endContent = stubContent(120, Side.RIGHT);
      sinon.spy(element, '_positionActionBox');
      if (!startContent?.firstChild) {
        assert.fail('first child of start content not found');
      }
      if (!endContent?.lastChild) {
        assert.fail('last child of end content');
      }
      emulateSelection(startContent.firstChild, 10, endContent.lastChild, 7);
      const actionBox = element.shadowRoot?.querySelector(
        'gr-selection-action-box'
      );
      if (!actionBox) assert.fail('action box not found');
      if (!element.selectedRange) assert.fail('no range selected');
      const {range, side} = element.selectedRange;
      assert.deepEqual(range, {
        start_line: 119,
        start_character: 10,
        end_line: 120,
        end_character: 36,
      });
      assert.equal(side, Side.RIGHT);
      assert.notOk(actionBox.positionBelow);
    });

    test('multiple ranges aka firefox implementation', () => {
      const startContent = stubContent(119, Side.RIGHT);
      const endContent = stubContent(120, Side.RIGHT);
      if (!startContent?.firstChild) {
        assert.fail('first child of start content not found');
      }
      if (!endContent?.lastChild) {
        assert.fail('last child of end content');
      }

      const startRange = document.createRange();
      startRange.setStart(startContent.firstChild, 10);
      startRange.setEnd(startContent.firstChild, 11);

      const endRange = document.createRange();
      endRange.setStart(endContent.lastChild, 6);
      endRange.setEnd(endContent.lastChild, 7);

      const getRangeAtStub = sinon.stub();
      getRangeAtStub
        .onFirstCall()
        .returns(startRange)
        .onSecondCall()
        .returns(endRange);
      const selection = {
        rangeCount: 2,
        getRangeAt: getRangeAtStub,
        removeAllRanges: sinon.stub(),
      } as unknown as Selection;
      element._handleSelection(selection, false);
      if (!element.selectedRange) assert.fail('no range selected');
      const {range} = element.selectedRange;
      assert.deepEqual(range, {
        start_line: 119,
        start_character: 10,
        end_line: 120,
        end_character: 36,
      });
    });

    test('multiline grow end highlight over tabs', () => {
      const startContent = stubContent(119, Side.RIGHT);
      const endContent = stubContent(120, Side.RIGHT);
      if (!startContent?.firstChild) {
        assert.fail('first child of start content not found');
      }
      if (!endContent?.firstChild) {
        assert.fail('first child of end content not found');
      }
      emulateSelection(startContent.firstChild, 10, endContent.firstChild, 2);
      if (!element.selectedRange) assert.fail('no range selected');
      const {range, side} = element.selectedRange;
      assert.deepEqual(range, {
        start_line: 119,
        start_character: 10,
        end_line: 120,
        end_character: 2,
      });
      assert.equal(side, Side.RIGHT);
    });

    test('collapsed', () => {
      const content = stubContent(138, Side.LEFT);
      if (!content?.firstChild) {
        assert.fail('first child of content not found');
      }
      emulateSelection(content.firstChild, 5, content.firstChild, 5);
      const sel = document.getSelection();
      if (!sel) assert.fail('no selection');
      assert.isOk(sel.getRangeAt(0).startContainer);
      assert.isFalse(!!element.selectedRange);
    });

    test('starts inside hl', () => {
      const content = stubContent(140, Side.LEFT);
      if (!content) {
        assert.fail('content not found');
      }
      const hl = content.querySelector('.foo');
      if (!hl?.firstChild) {
        assert.fail('first child of hl element not found');
      }
      if (!hl?.nextSibling) {
        assert.fail('next sibling of hl element not found');
      }
      emulateSelection(hl.firstChild, 2, hl.nextSibling, 7);
      if (!element.selectedRange) assert.fail('no range selected');
      const {range, side} = element.selectedRange;
      assert.deepEqual(range, {
        start_line: 140,
        start_character: 8,
        end_line: 140,
        end_character: 23,
      });
      assert.equal(side, Side.LEFT);
    });

    test('ends inside hl', () => {
      const content = stubContent(140, Side.LEFT);
      if (!content) assert.fail('content not found');
      const hl = content.querySelector('.bar');
      if (!hl) assert.fail('hl inside content not found');
      if (!hl.previousSibling) assert.fail('previous sibling not found');
      if (!hl.firstChild) assert.fail('first child not found');
      emulateSelection(hl.previousSibling, 2, hl.firstChild, 3);
      if (!element.selectedRange) assert.fail('no range selected');
      const {range} = element.selectedRange;
      assert.deepEqual(range, {
        start_line: 140,
        start_character: 18,
        end_line: 140,
        end_character: 27,
      });
    });

    test('multiple hl', () => {
      const content = stubContent(140, Side.LEFT);
      if (!content) assert.fail('content not found');
      if (!content.firstChild) assert.fail('first child not found');
      const hl = content.querySelectorAll('hl')[4];
      if (!hl) assert.fail('hl not found');
      if (!hl.firstChild) assert.fail('first child of hl not found');
      emulateSelection(content.firstChild, 2, hl.firstChild, 2);
      if (!element.selectedRange) assert.fail('no range selected');
      const {range, side} = element.selectedRange;
      assert.deepEqual(range, {
        start_line: 140,
        start_character: 2,
        end_line: 140,
        end_character: 61,
      });
      assert.equal(side, Side.LEFT);
    });

    test('starts outside of diff', () => {
      const contentText = stubContent(140, Side.LEFT);
      if (!contentText) assert.fail('content not found');
      if (!contentText.firstChild) assert.fail('child not found');
      const contentTd = contentText.parentElement;
      if (!contentTd) assert.fail('content td not found');
      if (!contentTd.parentElement) assert.fail('parent of td not found');

      emulateSelection(contentTd.parentElement, 0, contentText.firstChild, 2);
      assert.isFalse(!!element.selectedRange);
    });

    test('ends outside of diff', () => {
      const content = stubContent(140, Side.LEFT);
      if (!content) assert.fail('content not found');
      if (!content.firstChild) assert.fail('child not found');
      if (!content.nextElementSibling) assert.fail('sibling not found');
      if (!content.nextElementSibling.firstChild) {
        assert.fail('sibling child not found');
      }
      emulateSelection(
        content.nextElementSibling.firstChild,
        2,
        content.firstChild,
        2
      );
      assert.isFalse(!!element.selectedRange);
    });

    test('starts and ends on different sides', () => {
      const startContent = stubContent(140, Side.LEFT);
      const endContent = stubContent(130, Side.RIGHT);
      if (!startContent?.firstChild) {
        assert.fail('first child of start content not found');
      }
      if (!endContent?.firstChild) {
        assert.fail('first child of end content not found');
      }
      emulateSelection(startContent.firstChild, 2, endContent.firstChild, 2);
      assert.isFalse(!!element.selectedRange);
    });

    test('starts in comment thread element', () => {
      const startContent = stubContent(140, Side.LEFT);
      if (!startContent?.parentElement) {
        assert.fail('parent el of start content not found');
      }
      const comment =
        startContent.parentElement.querySelector('.comment-thread');
      if (!comment?.firstChild) {
        assert.fail('first child of comment not found');
      }
      const endContent = stubContent(141, Side.LEFT);
      if (!endContent?.firstChild) {
        assert.fail('first child of end content not found');
      }
      emulateSelection(comment.firstChild, 2, endContent.firstChild, 4);
      if (!element.selectedRange) assert.fail('no range selected');
      const {range, side} = element.selectedRange;
      assert.deepEqual(range, {
        start_line: 140,
        start_character: 83,
        end_line: 141,
        end_character: 4,
      });
      assert.equal(side, Side.LEFT);
    });

    test('ends in comment thread element', () => {
      const content = stubContent(140, Side.LEFT);
      if (!content?.firstChild) {
        assert.fail('first child of content not found');
      }
      if (!content?.parentElement) {
        assert.fail('parent element of content not found');
      }
      const comment = content.parentElement.querySelector('.comment-thread');
      if (!comment?.firstChild) {
        assert.fail('first child of comment element not found');
      }
      emulateSelection(content.firstChild, 4, comment.firstChild, 1);
      if (!element.selectedRange) assert.fail('no range selected');
      const {range, side} = element.selectedRange;
      assert.deepEqual(range, {
        start_line: 140,
        start_character: 4,
        end_line: 140,
        end_character: 83,
      });
      assert.equal(side, Side.LEFT);
    });

    test('starts in context element', () => {
      const contextControl = diff
        .querySelector('.contextControl')!
        .querySelector('gr-button');
      if (!contextControl) assert.fail('context control not found');
      const content = stubContent(146, Side.RIGHT);
      if (!content) assert.fail('content not found');
      if (!content.firstChild) assert.fail('content child not found');
      emulateSelection(contextControl, 0, content.firstChild, 7);
      // TODO (viktard): Select nearest line.
      assert.isFalse(!!element.selectedRange);
    });

    test('ends in context element', () => {
      const contextControl = diff
        .querySelector('.contextControl')!
        .querySelector('gr-button');
      if (!contextControl) {
        assert.fail('context control element not found');
      }
      const content = stubContent(141, Side.LEFT);
      if (!content?.firstChild) {
        assert.fail('first child of content element not found');
      }
      emulateSelection(content.firstChild, 2, contextControl, 1);
      // TODO (viktard): Select nearest line.
      assert.isFalse(!!element.selectedRange);
    });

    test('selection containing context element', () => {
      const startContent = stubContent(130, Side.RIGHT);
      const endContent = stubContent(146, Side.RIGHT);
      if (!startContent?.firstChild) {
        assert.fail('first child of start content not found');
      }
      if (!endContent?.firstChild) {
        assert.fail('first child of end content not found');
      }
      emulateSelection(startContent.firstChild, 3, endContent.firstChild, 14);
      if (!element.selectedRange) assert.fail('no range selected');
      const {range, side} = element.selectedRange;
      assert.deepEqual(range, {
        start_line: 130,
        start_character: 3,
        end_line: 146,
        end_character: 14,
      });
      assert.equal(side, Side.RIGHT);
    });

    test('ends at a tab', () => {
      const content = stubContent(140, Side.LEFT);
      if (!content?.firstChild) {
        assert.fail('first child of content element not found');
      }
      const span = content.querySelector('span');
      if (!span) assert.fail('span element not found');
      emulateSelection(content.firstChild, 1, span, 0);
      if (!element.selectedRange) assert.fail('no range selected');
      const {range, side} = element.selectedRange;
      assert.deepEqual(range, {
        start_line: 140,
        start_character: 1,
        end_line: 140,
        end_character: 51,
      });
      assert.equal(side, Side.LEFT);
    });

    test('starts at a tab', () => {
      const content = stubContent(140, Side.LEFT);
      if (!content) assert.fail('content element not found');
      emulateSelection(
        content.querySelectorAll('hl')[3],
        0,
        content.querySelectorAll('span')[1].nextSibling!,
        1
      );
      if (!element.selectedRange) assert.fail('no range selected');
      const {range, side} = element.selectedRange;
      assert.deepEqual(range, {
        start_line: 140,
        start_character: 51,
        end_line: 140,
        end_character: 71,
      });
      assert.equal(side, Side.LEFT);
    });

    test('properly accounts for syntax highlighting', () => {
      const content = stubContent(140, Side.LEFT);
      if (!content) assert.fail('content element not found');
      emulateSelection(
        content.querySelectorAll('hl')[3],
        0,
        content.querySelectorAll('span')[1],
        0
      );
      if (!element.selectedRange) assert.fail('no range selected');
      const {range, side} = element.selectedRange;
      assert.deepEqual(range, {
        start_line: 140,
        start_character: 51,
        end_line: 140,
        end_character: 69,
      });
      assert.equal(side, Side.LEFT);
    });

    test('GrRangeNormalizer._getTextOffset computes text offset', () => {
      let content = stubContent(140, Side.LEFT);
      if (!content) assert.fail('content element not found');
      if (!content.lastChild) assert.fail('last child of content not found');
      let child = content.lastChild.lastChild;
      if (!child) assert.fail('last child of last child of content not found');
      let result = _getTextOffset(content, child);
      assert.equal(result, 75);
      content = stubContent(146, Side.RIGHT);
      if (!content) assert.fail('content element not found');
      child = content.lastChild;
      if (!child) assert.fail('child element not found');
      result = _getTextOffset(content, child);
      assert.equal(result, 0);
    });

    test('_fixTripleClickSelection', () => {
      const startContent = stubContent(119, Side.RIGHT);
      const endContent = stubContent(120, Side.RIGHT);
      if (!startContent?.firstChild) {
        assert.fail('first child of start content not found');
      }
      if (!endContent) assert.fail('end content not found');
      if (!endContent.firstChild) assert.fail('first child not found');
      emulateSelection(startContent.firstChild, 0, endContent.firstChild, 0);
      if (!element.selectedRange) assert.fail('no range selected');
      const {range, side} = element.selectedRange;
      assert.deepEqual(range, {
        start_line: 119,
        start_character: 0,
        end_line: 119,
        end_character: element._getLength(startContent),
      });
      assert.equal(side, Side.RIGHT);
    });
  });
});
