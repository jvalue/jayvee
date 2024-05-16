// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type ImportDefinition } from '../../ast/generated/ast';
import { type JayveeValidationProps } from '../validation-registry';

export function validateImportDefinition(
  importDefinition: ImportDefinition,
  props: JayveeValidationProps,
): void {
  checkPathExists(importDefinition, props);
}

function checkPathExists(
  importDefinition: ImportDefinition,
  props: JayveeValidationProps,
): void {
  const resolvedImport = props.importResolver.resolveImport(importDefinition);
  if (resolvedImport === undefined) {
    props.validationContext.accept('error', 'Import cannot be resolved.', {
      node: importDefinition,
      property: 'path',
    });
  }
}
