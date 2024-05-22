// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type AstNode,
  type AstNodeDescription,
  DefaultScopeComputation,
  type LangiumCoreServices,
  type LangiumDocument,
} from 'langium';

import { isExportDefinition, isExportableElement } from '../ast';

export class JayveeScopeComputation extends DefaultScopeComputation {
  constructor(services: LangiumCoreServices) {
    super(services);
  }

  protected override exportNode(
    node: AstNode,
    exports: AstNodeDescription[],
    document: LangiumDocument,
  ): void {
    const isExportingElementDefinition =
      isExportableElement(node) && node.isPublished;

    if (isExportingElementDefinition) {
      return super.exportNode(node, exports, document);
    }

    const isDelayedExportDefinition = isExportDefinition(node);
    if (isDelayedExportDefinition) {
      const exportedNode = node.element.ref;
      if (exportedNode === undefined) {
        return;
      }

      return super.exportNode(exportedNode, exports, document);
    }

    // We only export elements that are explicitly published!
  }
}
