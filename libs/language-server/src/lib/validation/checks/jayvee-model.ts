// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import {
  type ExportableElement,
  type JayveeModel,
  isExportableElement,
} from '../../ast/generated/ast';
import { type JayveeValidationProps } from '../validation-registry';
import { checkUniqueNames } from '../validation-util';

export function validateJayveeModel(
  model: JayveeModel,
  props: JayveeValidationProps,
): void {
  // Ignoring built-in elements. Models may define elements with the same name (makes built-in element with name collision unavailable within model)

  const exportableElements: ExportableElement[] = [];
  // TypeScript does wrong type inference when using .filter function, so using for loop instead
  for (const exportableElementDefinition of model.exportableElements) {
    assert(
      isExportableElement(exportableElementDefinition),
      'Exportable element definition in model is not an ExportableElement',
    );
    exportableElements.push(exportableElementDefinition);
  }

  const allElementsRootLevel = [
    ...model.pipelines,
    ...exportableElements,
    ...props.importResolver.getImportedElements(model),
  ];
  checkUniqueNames(allElementsRootLevel, props.validationContext);

  // Pipelines may define elements with the same name (makes element on root level with name collision unavailable within pipeline)
  for (const pipeline of model.pipelines) {
    const elementsInPipeline = [
      ...pipeline.blocks,
      ...pipeline.constraints,
      ...pipeline.transforms,
      ...pipeline.valueTypes,
    ];
    checkUniqueNames(elementsInPipeline, props.validationContext);
  }
}
