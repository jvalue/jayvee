import '../attributes'

CSVFileExtractor:
  name='CSVFileExtractor' '{'
    url=UrlAttribute
    delimiter=DelimiterAttribute
  '}';

UrlAttribute returns StringAttribute:
  'url' StringAttributeFragment;

DelimiterAttribute returns StringAttribute:
  'delimiter' StringAttributeFragment;
