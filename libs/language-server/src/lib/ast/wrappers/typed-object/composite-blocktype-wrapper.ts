// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type ExpressionEvaluatorRegistry } from '../../expressions/operator-registry';
import { CompositeBlocktypeDefinition } from '../../generated/ast';

// eslint-disable-next-line import/no-cycle
import { BlockTypeWrapper } from './blocktype-wrapper';

export class CompositeBlocktypeWrapper extends BlockTypeWrapper {
  constructor(
    private blockTypeDefinition: CompositeBlocktypeDefinition,
    operatorEvaluatiorRegistry: ExpressionEvaluatorRegistry,
  ) {
    super(blockTypeDefinition, operatorEvaluatiorRegistry);
  }

  override getMissingRequiredPropertyNames(
    presentPropertyNames: string[] = [],
  ): string[] {
    const missingRequiredPropertyNames = super.getMissingRequiredPropertyNames(
      presentPropertyNames,
    );

    // We assume blocktype properties that have an expression as default value can be evaluated during runtime
    return missingRequiredPropertyNames.filter((propertyName) => {
      const blocktypeProperty = this.blockTypeDefinition.properties.find(
        (blocktypeProperty) => blocktypeProperty.name === propertyName,
      );

      return blocktypeProperty?.defaultValue === undefined;
    });
  }
}
