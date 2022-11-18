import '../attributes'

CSVFileExtractor:
  'CSVFileExtractor' '{'
    url=UrlAttribute
  '}';

UrlAttribute returns StringAttribute:
  'url' StringAttributeFragment;
