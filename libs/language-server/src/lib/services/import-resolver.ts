import { AstUtils, type LangiumDocuments, type URI, UriUtils } from 'langium';

import {
  type ImportDefinition,
  type JayveeModel,
  isJayveeModel,
} from '../ast/generated/ast';

export class JayveeImportResolver {
  constructor(protected documents: LangiumDocuments) {}

  resolveImport(importDefinition: ImportDefinition): JayveeModel | undefined {
    const resolvedUri = this.resolveImportUri(importDefinition);
    if (!resolvedUri) {
      return undefined;
    }

    const resolvedDocument = this.documents.getDocument(resolvedUri);
    if (!resolvedDocument) {
      return undefined;
    }

    const parsedModel = resolvedDocument.parseResult.value;
    if (!isJayveeModel(parsedModel)) {
      return undefined;
    }

    return parsedModel;
  }

  resolveImportUri(importDefinition: ImportDefinition): URI | undefined {
    if (
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      importDefinition.path === undefined ||
      importDefinition.path.length === 0
    ) {
      return undefined;
    }

    const dirUri = UriUtils.dirname(AstUtils.getDocument(importDefinition).uri);
    const modelPath = importDefinition.path;

    return UriUtils.resolvePath(dirUri, modelPath);
  }
}
