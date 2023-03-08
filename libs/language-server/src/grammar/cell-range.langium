import 'terminals'

CellRange:
  RangeExpression | ColumnExpression | RowExpression | CellExpression;

RangeExpression:
  'range' cellFrom=CELL_REFERENCE ':' cellTo=CELL_REFERENCE;

ColumnExpression:
  'column' columnId=(ID | '*');

RowExpression:
  'row' rowId=(INTEGER | '*');

CellExpression:
  'cell' cellId=CELL_REFERENCE;
