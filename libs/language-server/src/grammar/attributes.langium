import 'terminals';
import 'primitives';
import 'value-type';
import 'cell-range';
import 'constraints';

AttributeBody:
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
  RegexValue |
  ValuetypeAssignmentValue |
  ConstraintReferenceValue;

Collection:
  '[' (values+=(AtomicValue) (',' values+=(AtomicValue))*)? ']';

TextValue:
  value=STRING;

IntegerValue:
  value=SignedInteger;

DecimalValue:
  value=SignedDecimal;

BooleanValue:
  value=Boolean;

CellRangeValue:
  value=CellRange;

RegexValue:
  value=REGEX_LITERAL;

ValuetypeAssignmentValue:
  value=ValuetypeAssignment;

ConstraintReferenceValue:
  value=[Constraint];
