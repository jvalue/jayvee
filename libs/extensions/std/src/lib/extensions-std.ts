import { CSVFileExtractorMetaInformation } from '@jayvee/extensions/csv';
import {
  PostgresLoaderMetaInformation,
  SQLiteLoaderMetaInformation,
} from '@jayvee/extensions/rdbms';
import { BlockMetaInformation } from '@jayvee/language-server';

export function getStandardBlockMetaInformationExtensions(): BlockMetaInformation[] {
  return [
    new SQLiteLoaderMetaInformation(),
    new PostgresLoaderMetaInformation(),
    new CSVFileExtractorMetaInformation(),
  ];
}
