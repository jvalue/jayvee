/* eslint-disable @typescript-eslint/no-unnecessary-condition */
// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import { AstUtils } from 'langium';

import {
  type ExportDefinition,
  type ExportableElement,
  type JayveeModel,
  isExportableElement,
  isExportableElementDefinition,
  isJayveeModel,
} from '../../ast/generated/ast';
import { type JayveeValidationProps } from '../validation-registry';

export function validateExportDefinition(
  exportDefinition: ExportDefinition,
  props: JayveeValidationProps,
): void {
  checkIsAlreadyPublished(exportDefinition, props);
  checkUniqueAlias(exportDefinition, props);
}

function checkIsAlreadyPublished(
  exportDefinition: ExportDefinition,
  props: JayveeValidationProps,
): void {
  const originalDefinition = exportDefinition.element?.ref;
  if (originalDefinition === undefined) {
    return;
  }

  const exportableElementDefinition = AstUtils.getContainerOfType(
    originalDefinition,
    isExportableElementDefinition,
  );
  if (exportableElementDefinition === undefined) {
    return;
  }

  const isAlreadyPublished = exportableElementDefinition.isPublished;
  if (isAlreadyPublished) {
    props.validationContext.accept(
      'error',
      `Element ${originalDefinition.name} is already published at its definition.`,
      {
        node: exportDefinition,
      },
    );
  }
}

function checkUniqueAlias(
  exportDefinition: ExportDefinition,
  props: JayveeValidationProps,
): void {
  if (exportDefinition.alias === undefined) {
    return;
  }

  const model = AstUtils.getContainerOfType(exportDefinition, isJayveeModel);
  assert(model !== undefined);
  const allExports = collectAllExportsWithinSameFile(model);

  const elementsWithSameName = allExports.filter(
    (e) => e.alias === exportDefinition.alias,
  );
  assert(
    elementsWithSameName.length > 0,
    'Could not the export definition itself in exports',
  );

  const isAliasUnique = elementsWithSameName.length === 1;
  if (!isAliasUnique) {
    props.validationContext.accept(
      'error',
      `This alias is ambiguous. There is another element published element with the same name "${exportDefinition.alias}".`,
      {
        node: exportDefinition,
        property: 'alias',
      },
    );
  }
}

function collectAllExportsWithinSameFile(model: JayveeModel): {
  alias: string;
  element: ExportDefinition | ExportableElement;
}[] {
  const exportedElementNames: {
    alias: string;
    element: ExportDefinition | ExportableElement;
  }[] = [];

  for (const node of model.exportableElements) {
    if (node.isPublished) {
      assert(
        isExportableElement(node),
        'Exported node is not an ExportableElement',
      );
      exportedElementNames.push({
        alias: node.name,
        element: node,
      });
    }
  }

  for (const node of model.exports) {
    if (node.alias !== undefined) {
      exportedElementNames.push({
        alias: node.alias,
        element: node,
      });
      continue;
    }

    const originalDefinition = node.element?.ref;
    if (
      originalDefinition !== undefined &&
      originalDefinition.name !== undefined
    ) {
      exportedElementNames.push({
        alias: originalDefinition.name,
        element: originalDefinition,
      });
    }
  }
  return exportedElementNames;
}
