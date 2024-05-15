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

import {
  isBuiltinConstrainttypeDefinition,
  isConstraintDefinition,
  isIotypeDefinition,
  isReferenceableBlockTypeDefinition,
  isTransformDefinition,
  isValuetypeDefinition,
} from '../ast';

export class JayveeScopeComputation extends DefaultScopeComputation {
  constructor(services: LangiumCoreServices) {
    super(services);
  }

  protected override exportNode(
    node: AstNode,
    exports: AstNodeDescription[],
    document: LangiumDocument,
  ): void {
    // export the exportable top-level elements
    if (!this.isExportable(node)) {
      return;
    }

    super.exportNode(node, exports, document);
  }

  isExportable(node: AstNode) {
    // pipelines are not exported

    return (
      isValuetypeDefinition(node) ||
      isConstraintDefinition(node) ||
      isTransformDefinition(node) ||
      isReferenceableBlockTypeDefinition(node) ||
      isBuiltinConstrainttypeDefinition(node) ||
      isIotypeDefinition(node)
    );
  }
}
