import 'terminals';
import 'layout';
import 'data-type';
import 'cell-range';

fragment AttributesFragment:
  '{' (attributes+=Attribute)* '}';

Attribute:
  name=ID ':' value=(AttributeValue | RuntimeParameter) ';';

RuntimeParameter:
  'requires' name=ID;

AttributeValue:
  StringValue | IntValue | CellRangeValue | DataTypeAssignmentCollection | CellRangeCollection | LayoutReferenceValue;

StringValue:
  value=STRING;

IntValue:
  value=INT;

DataTypeAssignmentCollection:
  '[' (value+=DataTypeAssignment (',' value+=DataTypeAssignment)*)? ']';

CellRangeCollection:
  '[' (value+=CellRange (',' value+=CellRange)*)? ']';

CellRangeValue:
  value=CellRange;

LayoutReferenceValue:
  value=[Layout];
