// SPDX-FileCopyrightText: 2024 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only
import path from 'node:path';

import { type BlockTypeWrapper } from '@jvalue/jayvee-language-server';

/**
 * Returns the domain of a block type or undefined if it does not come from a domain extension in the stdlib.
 */
export function getBlockTypeDomain(
  blockType: BlockTypeWrapper,
): string | undefined {
  const filePath = blockType.astNode.$container?.$document?.uri.path;

  if (filePath === undefined) {
    return undefined;
  }

  const pathElements = filePath.split(path.sep);

  // pathElements[0] is an empty string since the path starts with /
  // pathElements[1] is the stdlib directory
  if (pathElements[2] === 'domain') {
    return pathElements[3] ?? undefined;
  }
}
