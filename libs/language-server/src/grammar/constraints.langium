import 'attributes'
import 'terminals'

Constraint:
  'constraint' name=ID 'oftype' type=ConstraintType body=AttributeBody;

ConstraintType:
  name=ID;
