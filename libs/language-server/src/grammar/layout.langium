import 'terminals'

Layout:
  'layout' name=ID '{'
    (sections+=Section)*
  '}';

Section:
  ColumnSection | RowSection;

ColumnSection:
  // Uses ID as terminal for columnId because an additional terminal would conflict with ID
  'column' columnId=ID ':' type=Type ';';

RowSection:
  (header?='header')? 'row' rowId=INT ':' type=Type ';';

Type returns string:
  'text' | 'decimal' | 'integer' | 'boolean';
