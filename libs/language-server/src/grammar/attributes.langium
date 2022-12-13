import 'terminals';
import 'layout';

fragment AttributesFragment:
  '{' (attributes+=Attribute)* '}';

Attribute:
  name=(ID | 'layout') ':' value=(AttributeValue | RuntimeParameter) ';';

AttributeValue:
  StringValue | IntValue | LayoutReferenceValue;

StringValue:
  value=STRING;

IntValue:
  value=INT;

LayoutReferenceValue:
  value=[Layout];

RuntimeParameter:
  'requires' name=ID;
