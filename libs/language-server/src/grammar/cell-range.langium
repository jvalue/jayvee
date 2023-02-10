import 'terminals'

CellRange:
  RangeExpression | ColumnExpression | RowExpression | CellExpression;

RangeExpression:
  'range' cellFrom=CELL_ID ':' cellTo=CELL_ID;

ColumnExpression:
  'column' columnId=(ID | '*');

RowExpression:
  'row' rowId=(INT | '*');

CellExpression:
  'cell' cellId=CELL_ID;
