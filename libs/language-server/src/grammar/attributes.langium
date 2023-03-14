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
  RestrictionReferenceValue |
  RegexValue |
  WhitelistValue |
  ValueRangeValue;

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

RegexValue:
  value=REGEX_LITERAL;

RestrictionReferenceValue:
  value=[Constraint];

SignedInteger returns number:
  ('+'|'-')? INTEGER;

SignedDecimal returns number:
  ('+'|'-')? DECIMAL;

SignedNumber returns number:
  SignedInteger | SignedDecimal;

WhitelistValue:
  value+=(STRING | SignedNumber) ('|' value+=(STRING | SignedNumber))*;

ValueRangeValue:
  value=ValueRangeExpression;

ValueRangeExpression:
  (lowerBound=SignedNumber ('<' | lowerBoundInclusive?='<='))? 'value' (('<' | upperBoundInclusive?='<=') upperBound=SignedNumber)?;