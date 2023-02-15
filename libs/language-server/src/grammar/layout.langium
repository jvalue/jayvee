import 'data-type'
import 'terminals'

Layout:
  'layout' name=ID '{'
    (sections+=Section)*
  '}';

Section:
  ColumnSection | HeaderRowSection;

ColumnSection:
  // Uses ID as terminal for columnId because an additional terminal would conflict with ID
  'column' columnId=ID TypeFragment;

HeaderRowSection:
  'header' 'row' rowId=INT TypeFragment;

fragment TypeFragment:
  ':' type=DataType ';';
