import { type AstNode, AstUtils, type LangiumDocument } from 'langium';
import { expect } from 'vitest';

import { isJayveeModel } from './generated/ast';

/**
 * Extract all elements that comply with the given filter function.
 * Assures that the document contains a JayveeModel and that there is at least one extracted element.
 */
export function extractTestElements<E extends AstNode>(
  document: LangiumDocument,
  filterFn: (node: AstNode) => node is E,
): E[] {
  const model = document.parseResult.value;
  expect(isJayveeModel(model)).toBe(true);

  const allElements = AstUtils.streamAllContents(model);
  const allSelected = [...allElements.filter(filterFn)];
  expect(allSelected.length).toBeGreaterThan(0);
  return allSelected;
}
