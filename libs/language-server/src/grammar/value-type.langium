import 'attributes'
import 'terminals'

Valuetype:
  'valuetype' name=ID 'oftype' type=PrimitiveValuetype '{'
    'constraints' ':' constraints=Collection ';'
  '}';

ValuetypeAssignment:
  name=STRING 'oftype' type=(PrimitiveValuetype | ValuetypeReference);

// Workaround as cross-references cannot be mixed with other types
ValuetypeReference:
  reference=[Valuetype];

PrimitiveValuetype returns string:
  'text' | 'decimal' | 'integer' | 'boolean';
