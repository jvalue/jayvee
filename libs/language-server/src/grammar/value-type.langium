import 'terminals'

TypeAssignment:
  name=STRING 'typed' type=PrimitiveValueType;

PrimitiveValueType returns string:
  'text' | 'decimal' | 'integer' | 'boolean';
