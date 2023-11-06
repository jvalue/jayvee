// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line import/no-cycle
import { CompositeBlocktypeDefinition } from '../ast';

import { BlockMetaInformation } from './block-meta-inf';

export class CompositeBlocktypeMetaInformation extends BlockMetaInformation {
  constructor(private blockTypeDefinition: CompositeBlocktypeDefinition) {
    super(blockTypeDefinition);
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
