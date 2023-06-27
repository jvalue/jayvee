import { internalValueToString } from '@jvalue/jayvee-language-server';

import { FileSystem } from '../filesystem';
import { TextFile } from '../filesystem-node-file-text';
import { IoTypeVisitor } from '../io-type-implementation';
import { Sheet } from '../sheet';
import { Table } from '../table';

type DebugGranularity = 'peek' | 'exhaustive' | 'skip';

export class DebugStringVisitor implements IoTypeVisitor<string | undefined> {
  constructor(private debugGranularity: DebugGranularity) {}

  visitTable(table: Table): string | undefined {
    if (this.debugGranularity === 'skip') {
      return;
    }

    const PEEK_NUMBER_OF_ROWS = 10;
    const numberOfRows = table.getNumberOfRows();
    const metaData =
      `rows: ${numberOfRows}\n` + `columns: ${table.getNumberOfColumns()}\n`;
    let data = '';
    for (let i = 0; i < numberOfRows; ++i) {
      if (this.debugGranularity === 'peek' && i >= PEEK_NUMBER_OF_ROWS) {
        break;
      }

      const row = table.getRow(i);
      data += [...row.values()]
        .map((cell) => internalValueToString(cell))
        .join(' | ');
    }
    data += this.getPeekComment();

    const dataHeader = [...table.getColumns().entries()]
      .map(([columnName, column]) => {
        return `${columnName} (${column.valuetype.getName()})`;
      })
      .join(' | ');
    return (
      '====================\n' +
      'Data (Table)\n' +
      '====================\n' +
      dataHeader +
      '\n' +
      data +
      '\n\n' +
      '====================\n' +
      'Meta Data (Table)\n' +
      '====================\n' +
      metaData
    );
  }

  visitSheet(sheet: Sheet): string | undefined {
    if (this.debugGranularity === 'skip') {
      return;
    }

    const PEEK_NUMBER_OF_ROWS = 10;
    const metaData =
      `rows: ${sheet.getNumberOfRows()}\n` +
      `columns: ${sheet.getNumberOfColumns()}\n`;
    let tableData = sheet
      .getData()
      .filter((_, rowIndex) => {
        if (this.debugGranularity === 'peek') {
          return rowIndex < PEEK_NUMBER_OF_ROWS;
        }
        return true;
      })
      .map((row) => `${row.map((cell) => `"${cell}"`).join(', ')}`)
      .join(`\n`);
    tableData += this.getPeekComment();

    return (
      '====================\n' +
      'Data (Sheet)\n' +
      '====================\n' +
      tableData +
      '\n\n' +
      '====================\n' +
      'Meta Data (Sheet)\n' +
      '====================\n' +
      metaData
    );
  }

  visitNone(): string | undefined {
    if (this.debugGranularity === 'skip') {
      return;
    }

    return '<None>';
  }

  visitFileSystem(fileSystem: FileSystem): string | undefined {
    if (this.debugGranularity === 'skip') {
      return;
    }

    return fileSystem.getFile('/')?.toString() ?? '<found no root file>';
  }

  visitBinaryFile(): string | undefined {
    if (this.debugGranularity === 'skip') {
      return;
    }

    return '<binary>';
  }

  visitTextFile(binaryFile: TextFile): string | undefined {
    if (this.debugGranularity === 'skip') {
      return;
    }

    return binaryFile.content.join('\n');
  }

  private getPeekComment(): string | undefined {
    if (this.debugGranularity === 'skip') {
      return;
    }

    if (this.debugGranularity !== 'peek') {
      return '';
    }

    return '\n' + '... (omitted in peek mode)';
  }
}