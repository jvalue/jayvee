// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import { type ImportDefinition } from '../../ast/generated/ast';
import { type JayveeValidationProps } from '../validation-registry';

export function validateImportDefinition(
  importDefinition: ImportDefinition,
  props: JayveeValidationProps,
): void {
  checkPathExists(importDefinition, props);
  if (props.validationContext.hasErrorOccurred()) {
    return;
  }

  checkCyclicImportChain(importDefinition, props);
}

function checkPathExists(
  importDefinition: ImportDefinition,
  props: JayveeValidationProps,
): void {
  const resolvedImport = props.importResolver.resolveImport(importDefinition);
  if (resolvedImport === undefined) {
    props.validationContext.accept(
      'error',
      `Import from "${importDefinition.path}" could be resolved. Check if the file exists in the given location.`,
      {
        node: importDefinition,
        property: 'path',
      },
    );
  }
}

function checkCyclicImportChain(
  importDefinition: ImportDefinition,
  props: JayveeValidationProps,
): void {
  const isImportCycle = isCyclicImportChain(importDefinition, new Set(), props);
  if (isImportCycle) {
    props.validationContext.accept(
      'error',
      `Import from "${importDefinition.path}" leads to import cycle.`,
      {
        node: importDefinition,
      },
    );
  }
}

function isCyclicImportChain(
  importDefinition: ImportDefinition,
  visitedDocumentUris: Set<string>,
  props: JayveeValidationProps,
): boolean {
  const importedModel = props.importResolver.resolveImport(importDefinition);
  if (importedModel === undefined) {
    return false;
  }

  const currentVisitedUri = importedModel.$document?.uri.toString();
  assert(
    currentVisitedUri !== undefined,
    'Could not resolve URI of imported document',
  );

  if (visitedDocumentUris.has(currentVisitedUri)) {
    // cycle detected
    return true;
  }
  visitedDocumentUris.add(currentVisitedUri);

  return importedModel.imports.some((furtherImport) =>
    isCyclicImportChain(furtherImport, visitedDocumentUris, props),
  );
}
