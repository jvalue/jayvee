import 'attributes'
import 'terminals'
import 'numbers'

Constraint:
  'constraint' name=ID 'oftype' type=ConstraintType AttributesFragment;

ConstraintType:
  name=ID;

ConstraintReference:
  reference=[Constraint];

InlineConstraint:
  InlineRegexConstraint | InlineWhitelistConstraint | InlineRangeConstraint;

InlineRegexConstraint:
  regex=REGEX_LITERAL;

InlineWhitelistConstraint:
  value+=(STRING | SignedNumber) ('|' value+=(STRING | SignedNumber))*;

InlineRangeConstraint:
  (lowerBound=SignedNumber ('<' | lowerBoundInclusive?='<='))? 'value' (('<' | upperBoundInclusive?='<=') upperBound=SignedNumber)?;