import 'terminals';
import 'layout';
import 'data-type';
import 'cell-range';

fragment AttributesFragment:
  '{' (attributes+=Attribute)* '}';

Attribute:
  name=(ID | 'header') ':' value=(AttributeValue | RuntimeParameter) ';';

RuntimeParameter:
  'requires' name=ID;

AttributeValue:
  AtomicValue | Collection;

AtomicValue:
  StringValue | IntValue | BooleanValue | CellRangeValue | DataTypeAssignmentValue | LayoutReferenceValue;

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

LayoutReferenceValue:
  value=[Layout];
