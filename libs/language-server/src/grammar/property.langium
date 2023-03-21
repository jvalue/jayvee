import 'terminal';
import 'valuetype';
import 'cellrange';
import 'constraint';

PropertyBody:
  '{' (properties+=PropertyAssignment)* '}';

PropertyAssignment:
  name=ID ':' value=(PropertyValueLiteral | RuntimeParameterLiteral) ';';

RuntimeParameterLiteral:
  'requires' name=ID;

PropertyValueLiteral:
  AtomicLiteral | CollectionLiteral;

AtomicLiteral:
  TextLiteral
  | NumericLiteral
  | BooleanLiteral
  | CellRangeLiteral
  | RegexLiteral
  | ValuetypeAssignmentLiteral
  | ConstraintReferenceLiteral;

CollectionLiteral:
  '[' (values+=(AtomicLiteral) (',' values+=(AtomicLiteral))*)? ','? ']';

TextLiteral:
  value=STRING;

NumericLiteral:
  value=(INTEGER | NUMBER);

BooleanLiteral:
  value=(TRUE | FALSE);

RegexLiteral:
  value=REGEX;
