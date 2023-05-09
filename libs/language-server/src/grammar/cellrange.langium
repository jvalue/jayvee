// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import './terminal'

CellRangeLiteral:
  RangeLiteral
  | ColumnLiteral
  | RowLiteral
  | CellLiteral;

RangeLiteral:
  'range' cellFrom=(CELL_REFERENCE | CellReference) ':' cellTo=(CELL_REFERENCE | CellReference);

ColumnLiteral:
  'column' columnId=ColumnId;

RowLiteral:
  'row' rowId=RowId;

CellLiteral:
  'cell' cellId=(CELL_REFERENCE | CellReference);

CellReference:
  columnId=ColumnId rowId=RowId;

ColumnId:
  value=(ID | '*');

RowId:
  value=(INTEGER | '*');