import 'terminals';
import 'layout';
import 'cell-range';

fragment AttributesFragment:
  '{' (attributes+=Attribute)* '}';

Attribute:
  name=ID ':' value=(AttributeValue | RuntimeParameter) ';';

RuntimeParameter:
  'requires' name=ID;

AttributeValue:
  StringValue | IntValue | CellRangeValue | CellRangeCollection | LayoutReferenceValue;

StringValue:
  value=STRING;

IntValue:
  value=INT;

CellRangeCollection:
  '[' (value+=CellRange (',' value+=CellRange)*)? ']';

CellRangeValue:
  value=CellRange;

LayoutReferenceValue:
  value=[Layout];
