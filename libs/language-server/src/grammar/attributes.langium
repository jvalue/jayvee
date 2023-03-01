import 'terminals';
import 'value-type';
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
  TextValue | IntegerValue | BooleanValue | CellRangeValue | TypeAssignmentValue;

Collection:
  '[' (values+=(AtomicValue) (',' values+=(AtomicValue))*)? ']';

TextValue:
  value=STRING;

IntegerValue:
  value=INT;

BooleanValue:
  value=(TRUE | FALSE);

CellRangeValue:
  value=CellRange;

TypeAssignmentValue:
  value=TypeAssignment;
