import 'terminals'

TypeAssignment:
  name=STRING 'oftype' type=PrimitiveValueType;

PrimitiveValueType returns string:
  'text' | 'decimal' | 'integer' | 'boolean';
