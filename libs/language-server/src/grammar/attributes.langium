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
  AtomicValue | Collection;

AtomicValue:
  StringValue | IntValue | BooleanValue | CellRangeValue | DataTypeAssignmentValue;

Collection:
  '[' (values+=(AtomicValue) (',' values+=(AtomicValue))*)? ']';

StringValue:
  value=STRING;

IntValue:
  value=INT;

BooleanValue:
  value=(TRUE | FALSE);

CellRangeValue:
  value=CellRange;

DataTypeAssignmentValue:
  value=DataTypeAssignment;
