// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import 'terminal'

CellRangeLiteral:
  RangeLiteral
  | ColumnLiteral
  | RowLiteral
  | CellLiteral;

RangeLiteral:
  'range' cellFrom=CELL_REFERENCE ':' cellTo=CELL_REFERENCE;

ColumnLiteral:
  'column' columnId=(ID | '*');

RowLiteral:
  'row' rowId=(INTEGER | '*');

CellLiteral:
  'cell' cellId=CELL_REFERENCE;
