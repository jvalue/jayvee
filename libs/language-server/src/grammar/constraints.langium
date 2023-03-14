import 'attributes'
import 'terminals'

Constraint:
  'constraint' name=ID 'oftype' type=ConstraintType AttributesFragment;

ConstraintType:
  name=ID;
