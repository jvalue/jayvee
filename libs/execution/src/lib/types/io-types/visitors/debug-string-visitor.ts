import { internalValueToString } from '@jvalue/jayvee-language-server';

import { FileSystem } from '../filesystem';
import { TextFile } from '../filesystem-node-file-text';
import { IoTypeVisitor } from '../io-type-implementation';
import { Sheet } from '../sheet';
import { Table } from '../table';

export class DebugStringVisitor implements IoTypeVisitor {
  visitTable(table: Table): unknown {
    const numberOfRows = table.getNumberOfRows();
    const metaData =
      `rows: ${numberOfRows}\n` + `columns: ${table.getNumberOfColumns()}\n`;
    let data = '';
    for (let i = 0; i < numberOfRows; ++i) {
      const row = table.getRow(i);
      data += [...row.values()]
        .map((cell) => internalValueToString(cell))
        .join(' | ');
    }
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

  visitSheet(sheet: Sheet): unknown {
    const metaData =
      `rows: ${sheet.getNumberOfRows()}\n` +
      `columns: ${sheet.getNumberOfColumns()}\n`;
    const tableData = sheet
      .getData()
      .map((row) => `${row.map((cell) => `"${cell}"`).join(', ')}`)
      .join(`\n`);
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

  visitNone(): unknown {
    return '<None>';
  }

  visitFileSystem(fileSystem: FileSystem): unknown {
    return fileSystem.getFile('/')?.toString() ?? '<found no root file>';
  }

  visitBinaryFile(): unknown {
    return '<binary>';
  }

  visitTextFile(binaryFile: TextFile): unknown {
    return binaryFile.content.join('\n');
  }
}
