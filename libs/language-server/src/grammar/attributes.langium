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

StringValue returns string:
  STRING;

fragment IntAttributeFragment:
  ':' value=IntAttributeValue ';';

IntAttributeValue: 
  IntValue | RuntimeParameter;

IntValue returns number:
  INT;

fragment LayoutAttributeFragment:
  ':' value=[Layout] ';';

RuntimeParameter:
  'requires' name=ID;
