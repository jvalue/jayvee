import 'terminals';
import 'value-type';
import 'cell-range';
import 'constraints';

fragment AttributesFragment:
  '{' (attributes+=Attribute)* '}';

Attribute:
  name=ID ':' value=(AttributeValue | RuntimeParameter) ';';

RuntimeParameter:
  'requires' name=ID;

AttributeValue:
  AtomicValue | Collection;

AtomicValue:
  TextValue |
  IntegerValue |
  DecimalValue |
  BooleanValue |
  CellRangeValue |
  ValuetypeAssignmentValue |
  ConstraintValue;

Collection:
  '[' (values+=(AtomicValue) (',' values+=(AtomicValue))*)? ']';

TextValue:
  value=STRING;

IntegerValue:
  value=INTEGER;

DecimalValue:
  value=DECIMAL;

BooleanValue:
  value=(TRUE | FALSE);

CellRangeValue:
  value=CellRange;

ValuetypeAssignmentValue:
  value=ValuetypeAssignment;

ConstraintValue:
  value=(ConstraintReference | InlineConstraint);
