// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { IOType } from '@jvalue/jayvee-language-server';

import {
  type IOTypeImplementation,
  type IoTypeVisitor,
} from './io-type-implementation';
import { Sheet } from './sheet';

export class Workbook implements IOTypeImplementation<IOType.WORKBOOK> {
  public readonly ioType = IOType.WORKBOOK;
  private sheets: Map<string, Sheet> = new Map<string, Sheet>();

  getSheets(): Map<string, Sheet> {
    return this.sheets;
  }

  getSheetByName(sheetName: string): Sheet | undefined {
    return this.sheets.get(sheetName);
  }

  getUniqueDefaultNameForNewSheet(): string {
    let defaultSheetNumber = this.sheets.size;
    let defaultName = `Sheet${++defaultSheetNumber}`;

    while (this.getSheetByName(defaultName) !== undefined) {
      defaultName = `Sheet${++defaultSheetNumber}`;
    }
    return defaultName;
  }

  addSheet(data: string[][], sheetName?: string): Workbook {
    const sheetNameOrDefault =
      sheetName ?? this.getUniqueDefaultNameForNewSheet();
    if (this.sheets.get(sheetNameOrDefault) !== undefined) {
      throw new Error(
        `Sheet with name ${sheetNameOrDefault} already exists in Workbook.`,
      );
    }
    this.sheets.set(sheetNameOrDefault, new Sheet(data));
    return this;
  }

  acceptVisitor<R>(visitor: IoTypeVisitor<R>): R {
    return visitor.visitWorkbook(this);
  }
}
