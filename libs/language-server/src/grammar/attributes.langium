import 'terminals';
import 'layout';

interface StringAttribute {
  value: StringAttributeValue
}

interface IntAttribute {
  value: IntAttributeValue
}

fragment StringAttributeFragment:
  ':' value=StringAttributeValue ';';

StringAttributeValue:
  StringValue | RuntimeParameter;

StringValue:
  value=STRING;

fragment IntAttributeFragment:
  ':' value=IntAttributeValue ';';

IntAttributeValue:
  IntValue | RuntimeParameter;

IntValue:
  value=INT;

fragment LayoutAttributeFragment:
  ':' value=[Layout] ';';

RuntimeParameter:
  'requires' name=ID;