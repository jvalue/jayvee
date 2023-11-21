import {
  DefaultScopeProvider,
  EMPTY_SCOPE,
  LangiumDocuments,
  LangiumServices,
  ReferenceInfo,
  Scope,
  StreamScope,
  equalURI,
  getContainerOfType,
  getDocument,
  stream,
} from 'langium';
import {
  AbstractType,
  Interface,
  Type,
} from 'langium/lib/grammar/generated/ast';
import { URI, Utils } from 'vscode-uri';

import { ImportDefinition, JayveeModel, isJayveeModel } from '../ast';

export class JayveeScopeProvider extends DefaultScopeProvider {
  constructor(services: LangiumServices) {
    super(services);
  }

  protected override getGlobalScope(
    referenceType: string,
    context: ReferenceInfo,
  ): Scope {
    const model = getContainerOfType(context.container, isJayveeModel);
    if (!model) {
      return EMPTY_SCOPE;
    }

    const importedUris = stream(model.imports)
      .map(resolveImportUri)
      .nonNullable();

    const importedElements = this.indexManager
      .allElements(referenceType)
      .filter((destination) => {
        const isBuiltinElement = destination.documentUri.scheme === 'builtin';
        const isInCorrectFile = importedUris.some((importedUri) =>
          equalURI(destination.documentUri, importedUri),
        );

        return isBuiltinElement || isInCorrectFile;
      });

    if (referenceType !== AbstractType) {
      return new StreamScope(importedElements);
    }

    return new StreamScope( // TODO: do we need this?
      importedElements.filter(
        (destination) =>
          destination.type === Interface || destination.type === Type,
      ),
    );
  }
}

export function resolveImportUri(imp: ImportDefinition): URI | undefined {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const importPath = imp?.location;
  if (
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    importPath === undefined ||
    importPath.length === 0 ||
    !importPath.endsWith('.jv') // TODO: get from somewhere else
  ) {
    return undefined;
  }
  const dirURI = Utils.dirname(getDocument(imp).uri);
  return Utils.resolvePath(dirURI, importPath);
}

export function resolveImport(
  documents: LangiumDocuments,
  imp: ImportDefinition,
): JayveeModel | undefined {
  const resolvedURI = resolveImportUri(imp);
  try {
    if (resolvedURI) {
      const resolvedDocument = documents.getOrCreateDocument(resolvedURI);
      const node = resolvedDocument.parseResult.value;
      if (isJayveeModel(node)) {
        return node;
      }
    }
  } catch {
    return undefined;
  }
  return undefined;
}
