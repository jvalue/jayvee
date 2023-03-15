import 'attributes'
import 'terminals'
import 'primitives'

Constraint:
  'constraint' name=ID 'oftype' type=ConstraintType body=AttributeBody;

ConstraintType:
  name=ID;
