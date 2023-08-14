// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { IOType } from '@jvalue/jayvee-language-server';

import { IOTypeImplementation, IoTypeVisitor } from './io-type-implementation';
import { Sheet } from './sheet';

export class Workbook implements IOTypeImplementation<IOType.WORKBOOK> {
  public readonly ioType = IOType.WORKBOOK;
  private sheets: Sheet[];
  constructor() {
    this.sheets = [];
  }

  getSheets(): ReadonlyArray<Sheet> {
    return this.sheets;
  }

  getSheetByName(sheetName: string): Sheet {
    const sheet = this.sheets.filter(
      (sheet) => sheet.getSheetName() === sheetName,
    )[0];
    assert(sheet instanceof Sheet);
    return sheet;
  }

  addSheet(sheet: Sheet) {
    this.sheets.push(sheet);
  }

  addNewSheet(data: string[][], sheetName?: string) {
    const sheetNameOrDefault = sheetName ?? `Sheet${this.sheets.length + 1}`;
    if (
      this.sheets.some((sheet) => sheet.getSheetName() === sheetNameOrDefault)
    )
      return;
    this.addSheet(new Sheet(data, sheetNameOrDefault));
  }

  acceptVisitor<R>(visitor: IoTypeVisitor<R>): R {
    return visitor.visitWorkbook(this);
  }
}
