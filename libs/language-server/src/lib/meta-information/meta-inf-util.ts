import { assertUnreachable } from 'langium/lib/utils/errors';

import {
  BlockType,
  isCSVFileExtractor,
  isLayoutValidator,
  isPostgresLoader,
  isSQLiteLoader,
} from '../ast/generated/ast';

import type { BlockMetaInformation } from './block-meta-inf';
import { CSVFileExtractorMetaInformation } from './csv-file-extractor-meta-inf';
import { LayoutValidatorMetaInformation } from './layout-validator-meta-inf';
import { PostgresLoaderMetaInformation } from './postgres-loader-meta-inf';
import { SQLiteLoaderMetaInformation } from './sqlite-loader-meta-inf';

export function getMetaInformation(
  blockType: BlockType,
): BlockMetaInformation<BlockType> {
  if (isCSVFileExtractor(blockType)) {
    return new CSVFileExtractorMetaInformation(blockType);
  }
  if (isLayoutValidator(blockType)) {
    return new LayoutValidatorMetaInformation(blockType);
  }
  if (isPostgresLoader(blockType)) {
    return new PostgresLoaderMetaInformation(blockType);
  }
  if (isSQLiteLoader(blockType)) {
    return new SQLiteLoaderMetaInformation(blockType);
  }
  assertUnreachable(blockType);
}
