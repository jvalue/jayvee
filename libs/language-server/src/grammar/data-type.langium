import 'terminals'

DataTypeAssignment:
  name=STRING 'typed' type=DataType;

DataType returns string:
  'text' | 'decimal' | 'integer' | 'boolean';