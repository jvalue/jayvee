import 'property'
import 'terminal'

ConstraintDefinition:
  'constraint' name=ID 'oftype' type=ConstraintTypeLiteral body=PropertyBody;

ConstraintTypeLiteral:
  name=ID;

ConstraintReferenceLiteral:
  value=[ConstraintDefinition];
