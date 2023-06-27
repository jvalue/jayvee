import { internalValueToString } from '@jvalue/jayvee-language-server';

import { Logger } from '../../../logger';
import { FileSystem } from '../filesystem';
import { TextFile } from '../filesystem-node-file-text';
import { IoTypeVisitor } from '../io-type-implementation';
import { Sheet } from '../sheet';
import { Table } from '../table';

export type DebugGranularity = 'peek' | 'exhaustive' | 'skip';
export function isDebugGranularity(obj: unknown): obj is DebugGranularity {
  return obj === 'exhaustive' || obj === 'peek' || obj === 'skip';
}

export class DebugLogVisitor implements IoTypeVisitor<void> {
  constructor(
    private debugGranularity: DebugGranularity,
    private logger: Logger,
  ) {}

  visitTable(table: Table): void {
    if (this.debugGranularity === 'skip') {
      return;
    }

    const PEEK_NUMBER_OF_ROWS = 10;
    const numberOfRows = table.getNumberOfRows();
    this.log(
      `Table with ${numberOfRows} rows and ${table.getNumberOfColumns()} columns.`,
    );

    const headers = [...table.getColumns().entries()]
      .map(([columnName, column]) => {
        return `${columnName} (${column.valuetype.getName()})`;
      })
      .join(' | ');
    this.log(`[Header] ${headers}`);

    for (let i = 0; i < numberOfRows; ++i) {
      if (this.debugGranularity === 'peek' && i >= PEEK_NUMBER_OF_ROWS) {
        break;
      }

      const row = table.getRow(i);
      const rowData = [...row.values()]
        .map((cell) => internalValueToString(cell))
        .join(' | ');
      this.log(`[Row ${i}] ${rowData}`);
    }
    this.logPeekComment();
  }

  visitSheet(sheet: Sheet): void {
    if (this.debugGranularity === 'skip') {
      return;
    }

    const PEEK_NUMBER_OF_ROWS = 10;
    this.log(
      `Sheet with ${sheet.getNumberOfRows()} rows and ${sheet.getNumberOfColumns()} columns.`,
    );
    const rowsAsString = sheet
      .getData()
      .filter((_, rowIndex) => {
        if (this.debugGranularity === 'peek') {
          return rowIndex < PEEK_NUMBER_OF_ROWS;
        }
        return true;
      })
      .map((row) => `${row.map((cell) => `"${cell}"`).join(', ')}`);
    rowsAsString.forEach((row, i) => {
      this.log(`[Row ${i}] ${row}`);
    });

    this.logPeekComment();
  }

  visitNone(): void {
    if (this.debugGranularity === 'skip') {
      return;
    }

    this.log('<None>');
  }

  visitFileSystem(fileSystem: FileSystem): void {
    if (this.debugGranularity === 'skip') {
      return;
    }

    this.log(fileSystem.getFile('/')?.toString() ?? '<found no root file>');
  }

  visitBinaryFile(): void {
    if (this.debugGranularity === 'skip') {
      return;
    }

    this.log('<binary>');
  }

  visitTextFile(binaryFile: TextFile): void {
    if (this.debugGranularity === 'skip') {
      return;
    }

    this.log(binaryFile.content.join('\n'));
  }

  private logPeekComment(): void {
    if (this.debugGranularity === 'skip') {
      return;
    }

    if (this.debugGranularity !== 'peek') {
      return;
    }

    this.log('... (omitted in peek mode)');
  }

  private log(text: string): void {
    this.logger.logDebug(`[Result] ${text}`);
  }
}
