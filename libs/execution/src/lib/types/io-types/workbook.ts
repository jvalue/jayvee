// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { IOType } from '@jvalue/jayvee-language-server';

import { IOTypeImplementation, IoTypeVisitor } from './io-type-implementation';
import { Sheet } from './sheet';

export class Workbook implements IOTypeImplementation<IOType.WORKBOOK> {
  public readonly ioType = IOType.WORKBOOK;
  private numberOfWorksheets: number;
  constructor(private sheets: Sheet[]) {
    this.numberOfWorksheets = sheets.length;
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
    /* return Array.prototype.filter.call(this.sheets, sheet => {
      if(sheet.getSheetName() ==sheetName) return sheetName;
      else return null;
    })[0];*/
  }

  getNumberOfWorkbooks(): number {
    return this.numberOfWorksheets;
  }

  clone(): Workbook {
    return new Workbook(structuredClone(this.sheets));
  }

  acceptVisitor<R>(visitor: IoTypeVisitor<R>): R {
    return visitor.visitWorkbook(this);
  }
}
