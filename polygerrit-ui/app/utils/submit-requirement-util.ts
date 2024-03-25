/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {SubmitRequirementExpressionInfo} from '../api/rest-api';

export enum SubmitRequirementExpressionAtomStatus {
  UNKNOWN = 'UNKNOWN',
  PASSING = 'PASSING',
  FAILING = 'FAILING',
}

export interface SubmitRequirementExpressionPart {
  value: string;
  isAtom: boolean;
  // Defined iff isAtom is true.
  atomStatus?: SubmitRequirementExpressionAtomStatus;
}

interface AtomMatch {
  start: number;
  end: number;
  isPassing: boolean;
}

function appendAllOccurrences(
  text: string,
  match: string,
  isPassing: boolean,
  matchedAtoms: AtomMatch[]
) {
  for (let searchStartIndex = 0; ; ) {
    let index = text.indexOf(match, searchStartIndex);
    if (index === -1) {
      break;
    }
    searchStartIndex = index + match.length;
    // Include unary minus.
    if (index !== 0 && text[index - 1] === '-') {
      --index;
      isPassing = !isPassing;
    }
    matchedAtoms.push({start: index, end: searchStartIndex, isPassing});
  }
}

function splitExpressionIntoParts(
  expression: string,
  matchedAtoms: AtomMatch[]
): SubmitRequirementExpressionPart[] {
  const result: SubmitRequirementExpressionPart[] = [];
  let currentIndex = 0;
  for (const {start, end, isPassing} of matchedAtoms) {
    // We don't handle overlapping matches, but this can happen.
    if (start < currentIndex) continue;
    if (start > currentIndex) {
      result.push({
        value: expression.slice(currentIndex, start),
        isAtom: false,
      });
    }
    result.push({
      value: expression.slice(start, end),
      isAtom: true,
      atomStatus: isPassing
        ? SubmitRequirementExpressionAtomStatus.PASSING
        : SubmitRequirementExpressionAtomStatus.FAILING,
    });
    currentIndex = end;
  }
  if (currentIndex < expression.length) {
    result.push({
      value: expression.slice(currentIndex),
      isAtom: false,
    });
  }
  return result;
}

/**
 * Returns expression string split into ExpressionPart.
 *
 * Concatenation result of all parts is equal to original expression string.
 *
 * Unary minus is included in the atom and is accounted in the status.
 */
export function atomizeExpression(
  expression: SubmitRequirementExpressionInfo
): SubmitRequirementExpressionPart[] {
  const matchedAtoms: AtomMatch[] = [];
  expression.passing_atoms?.forEach(atom =>
    appendAllOccurrences(
      expression.expression,
      atom,
      /* isPassing=*/ true,
      matchedAtoms
    )
  );
  expression.failing_atoms?.forEach(atom =>
    appendAllOccurrences(
      expression.expression,
      atom,
      /* isPassing=*/ false,
      matchedAtoms
    )
  );
  matchedAtoms.sort((a, b) => a.start - b.start);

  return splitExpressionIntoParts(expression.expression, matchedAtoms);
}
