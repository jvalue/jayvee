import 'terminals';
import 'data-type';
import 'cell-range';

fragment AttributesFragment:
  '{' (attributes+=Attribute)* '}';

Attribute:
  name=ID ':' value=(AttributeValue | RuntimeParameter) ';';

RuntimeParameter:
  'requires' name=ID;

AttributeValue:
  StringValue | IntValue | BooleanValue | CellRangeValue | DataTypeAssignmentCollection | CellRangeCollection;

StringValue:
  value=STRING;

IntValue:
  value=INT;

BooleanValue:
  value=(TRUE | FALSE);

DataTypeAssignmentCollection:
  '[' (value+=DataTypeAssignment (',' value+=DataTypeAssignment)*)? ']';

CellRangeCollection:
  '[' (value+=CellRange (',' value+=CellRange)*)? ']';

CellRangeValue:
  value=CellRange;
