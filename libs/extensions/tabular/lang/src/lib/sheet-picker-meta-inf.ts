// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockMetaInformation,
  IOType,
  PrimitiveValuetypes,
} from '@jvalue/jayvee-language-server';

export class SheetPickerMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      // How the block type should be called:
      'SheetPicker',

      // Property definitions:
      {
        sheetName: {
          type: PrimitiveValuetypes.Text,
          docs: {
            description: 'The name of the sheet to select.',
          },
        },
        sheetNumber: {
          type: PrimitiveValuetypes.Integer,
          docs: {
            description: 'The number of the sheet to select.',
          },
        },
      },
      // Input type:
      IOType.WORKBOOK,

      // Output type:
      IOType.SHEET,
    );

    this.docs.description =
      'Selects one `Sheet` from a `xlsx-File` based on its `name`. If no sheet matches the relative path, no output is created and the execution of the pipeline is aborted.';
    this.docs.examples = [
      {
        code: `block AgencySheetPicker oftype SheetPicker {
  sheetName: "AgencyNames";
}`,
        description:
          'Tries to pick the sheet `AgencyNames` from the provided `Workbook`. If `AgencyNames` exists it is passed on as `Sheet`, if it does not exist the execution of the pipeline is aborted.',
      },
    ];
  }
}
