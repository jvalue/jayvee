// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type AstNode } from 'langium';

export interface AstNodeWrapper<N extends AstNode> {
  readonly astNode: N;
}
