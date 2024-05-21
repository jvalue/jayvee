// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import {
  type AstNodeDescription,
  type AstReflection,
  DocumentValidator,
  type IndexManager,
  type LangiumDocument,
  type LinkingErrorData,
  type MaybePromise,
  type Reference,
  type ReferenceInfo,
  type URI,
  UriUtils,
} from 'langium';
import { type CodeActionProvider } from 'langium/lsp';
import {
  type CodeAction,
  CodeActionKind,
  type CodeActionParams,
  type Command,
  type Diagnostic,
  type Position,
} from 'vscode-languageserver-protocol';

import { type JayveeModel } from '../ast';
import { type JayveeServices } from '../jayvee-module';

export class JayveeCodeActionProvider implements CodeActionProvider {
  protected readonly reflection: AstReflection;
  protected readonly indexManager: IndexManager;

  constructor(services: JayveeServices) {
    this.reflection = services.shared.AstReflection;
    this.indexManager = services.shared.workspace.IndexManager;
  }

  getCodeActions(
    document: LangiumDocument,
    params: CodeActionParams,
  ): MaybePromise<Array<Command | CodeAction>> {
    const actions: CodeAction[] = [];

    for (const diagnostic of params.context.diagnostics) {
      const diagnosticActions = this.getCodeActionsForDiagnostic(
        diagnostic,
        document,
      );
      actions.push(...diagnosticActions);
    }
    return actions;
  }

  protected getCodeActionsForDiagnostic(
    diagnostic: Diagnostic,
    document: LangiumDocument,
  ): CodeAction[] {
    const actions: CodeAction[] = [];

    const diagnosticData = diagnostic.data as unknown;
    const diagnosticCode = (diagnosticData as { code?: string } | undefined)
      ?.code;
    if (diagnosticData === undefined || diagnosticCode === undefined) {
      return actions;
    }

    switch (diagnosticCode) {
      case DocumentValidator.LinkingError: {
        const linkingData = diagnosticData as LinkingErrorData;
        actions.push(
          ...this.getCodeActionsForLinkingError(
            diagnostic,
            linkingData,
            document,
          ),
        );
      }
    }

    return actions;
  }

  protected getCodeActionsForLinkingError(
    diagnostic: Diagnostic,
    linkingData: LinkingErrorData,
    document: LangiumDocument,
  ): CodeAction[] {
    const refInfo: ReferenceInfo = {
      container: {
        $type: linkingData.containerType,
      },
      property: linkingData.property,
      reference: {
        $refText: linkingData.refText,
      } as Reference,
    };
    const refType = this.reflection.getReferenceType(refInfo);
    const importCandidates = this.indexManager
      .allElements(refType)
      .filter((e) => e.name === linkingData.refText);

    return [
      ...(importCandidates
        .map((c) => this.getActionForImportCandidate(c, diagnostic, document))
        .filter((a) => a !== undefined) as unknown as CodeAction[]),
    ];
  }

  protected getActionForImportCandidate(
    importCandidate: AstNodeDescription,
    diagnostic: Diagnostic,
    document: LangiumDocument,
  ): CodeAction | undefined {
    const isInCurrentFile = UriUtils.equals(
      importCandidate.documentUri,
      document.uri,
    );
    if (isInCurrentFile) {
      return;
    }

    const importPath = this.getRelativeImportPath(
      document.uri,
      importCandidate.documentUri,
    );

    const importPosition = this.getImportLinePosition(
      document.parseResult.value as JayveeModel,
    );
    if (importPosition === undefined) {
      return;
    }

    return {
      title: `Use from '${importPath}'`,
      kind: CodeActionKind.QuickFix,
      diagnostics: [diagnostic],
      isPreferred: false,
      edit: {
        changes: {
          [document.textDocument.uri]: [
            {
              range: {
                start: importPosition,
                end: importPosition,
              },
              newText: `use * from "${importPath}";\n`,
            },
          ],
        },
      },
    };
  }

  protected getImportLinePosition(
    javeeModel: JayveeModel,
  ): Position | undefined {
    const currentModelImports = javeeModel.imports;

    // Put the new import after the last import
    if (currentModelImports.length > 0) {
      const lastImportEnd =
        currentModelImports[currentModelImports.length - 1]?.$cstNode?.range
          .end;
      assert(
        lastImportEnd !== undefined,
        'Could not find end of last import statement.',
      );
      return { line: lastImportEnd.line + 1, character: 0 };
    }

    // For now, we just add it in the first row if there is no import yet
    return { line: 0, character: 0 };
  }

  private getRelativeImportPath(source: URI, target: URI): string {
    const sourceDir = UriUtils.dirname(source);
    const relativePath = UriUtils.relative(sourceDir, target);

    if (!relativePath.startsWith('./') && !relativePath.startsWith('../')) {
      return `./${relativePath}`;
    }

    return relativePath;
  }
}
