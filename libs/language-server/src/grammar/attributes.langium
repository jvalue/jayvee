import 'terminals';
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
  NumericValue |
  BooleanValue |
  CellRangeValue |
  RegexValue |
  ValuetypeAssignmentValue |
  ConstraintReferenceValue;

Collection:
  '[' (values+=(AtomicValue) (',' values+=(AtomicValue))*)? ']';

TextValue:
  value=STRING;

NumericValue:
  value=(INTEGER | NUMBER);

BooleanValue:
  value=(TRUE | FALSE);

CellRangeValue:
  value=CellRange;

RegexValue:
  value=REGEX_LITERAL;

ValuetypeAssignmentValue:
  value=ValuetypeAssignment;

ConstraintReferenceValue:
  value=[Constraint];
