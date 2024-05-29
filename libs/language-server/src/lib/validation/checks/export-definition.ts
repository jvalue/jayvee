/* eslint-disable @typescript-eslint/no-unnecessary-condition */
// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import { AstUtils } from 'langium';

import { getExportedElements } from '../../ast';
import {
  type ExportDefinition,
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
  const allExports = getExportedElements(model);

  const elementsWithSameName = allExports.filter(
    (e) => e.exportName === exportDefinition.alias,
  );
  assert(
    elementsWithSameName.length > 0,
    'Could not find the export definition itself in exports',
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
