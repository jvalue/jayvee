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
