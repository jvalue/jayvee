// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import {
  type ImportDefinition,
  isExportableElement,
} from '../../ast/generated/ast';
import { type JayveeValidationProps } from '../validation-registry';

export function validateImportDefinition(
  importDefinition: ImportDefinition,
  props: JayveeValidationProps,
): void {
  checkPathExists(importDefinition, props);
  if (props.validationContext.hasErrorOccurred()) {
    return;
  }

  checkImportedElementsExist(importDefinition, props);
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

function checkImportedElementsExist(
  importDefinition: ImportDefinition,
  props: JayveeValidationProps,
): void {
  const resolvedImport = props.importResolver.resolveImport(importDefinition);
  if (resolvedImport === undefined) {
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const exportedViaElementDefinition = (resolvedImport.exportableElements ?? [])
    .filter((x) => x.isPublished)
    .map((x) => {
      assert(
        isExportableElement(x),
        'Exported an element that is not an ExportableElement',
      );
      return x.name;
    });
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const exportedViaExportDefinition = (resolvedImport.exports ?? [])
    .map((x) => {
      if (x.alias !== undefined) {
        return x.alias;
      }

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      return x.element?.ref?.name;
    })
    .filter((x) => x !== undefined);

  const allExports = [
    ...exportedViaElementDefinition,
    ...exportedViaExportDefinition,
  ];

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  for (const [i, importedElement] of importDefinition.usedElements?.entries() ??
    []) {
    if (!allExports.includes(importedElement)) {
      props.validationContext.accept(
        'error',
        `Could not find published element ${importedElement} in file "${importDefinition.path}". Check if the element exists and has been correctly published.`,
        {
          node: importDefinition,
          property: 'usedElements',
          index: i,
        },
      );
    }
  }
}

function checkCyclicImportChain(
  importDefinition: ImportDefinition,
  props: JayveeValidationProps,
): void {
  const cycleAnalysisTraces = analyzeImportChain(
    importDefinition,
    new Set(),
    props,
  );

  const cycles = cycleAnalysisTraces.filter((x) => x.isCyclic);

  if (cycles.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const shownImportChain = cycles[0]!.path
      .map((x) => `"${x.path}"`)
      .join(' -> ');
    props.validationContext.accept(
      'error',
      `Import from "${importDefinition.path}" leads to import cycle: ${shownImportChain}`,
      {
        node: importDefinition,
      },
    );
  }
}

interface ImportChainTrace {
  isCyclic: boolean;
  path: ImportDefinition[];
}

function analyzeImportChain(
  importDefinition: ImportDefinition,
  visitedDocumentUris: Set<string>,
  props: JayveeValidationProps,
): ImportChainTrace[] {
  const importedModel = props.importResolver.resolveImport(importDefinition);
  if (importedModel === undefined) {
    return [
      {
        isCyclic: false,
        path: [importDefinition],
      },
    ];
  }

  const currentVisitedUri = importedModel.$document?.uri.toString();
  assert(
    currentVisitedUri !== undefined,
    'Could not resolve URI of imported document',
  );

  if (visitedDocumentUris.has(currentVisitedUri)) {
    // cycle detected
    return [
      {
        isCyclic: true,
        path: [importDefinition],
      },
    ];
  }
  visitedDocumentUris.add(currentVisitedUri);

  const cycledAnalysisResult: ImportChainTrace[] = [];
  for (const furtherImport of importedModel.imports) {
    const downwardAnalysisResult = analyzeImportChain(
      furtherImport,
      visitedDocumentUris,
      props,
    );
    const addedThisNodeToPath = downwardAnalysisResult.map((r) => {
      return {
        isCyclic: r.isCyclic,
        path: [importDefinition, ...r.path],
      };
    });
    cycledAnalysisResult.push(...addedThisNodeToPath);
  }
  return cycledAnalysisResult;
}
