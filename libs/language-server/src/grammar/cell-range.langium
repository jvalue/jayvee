import 'terminals'

CellRange:
  CellRangeSelection | ColumnSelection | RowSelection | CellSelection;

CellRangeSelection:
  'range' cellFrom=CELL_ID ':' cellTo=CELL_ID;

ColumnSelection:
  'column' columnId=(ID | '*');

RowSelection:
  'row' rowId=(INT | '*');

CellSelection:
  'cell' cellId=CELL_ID;
