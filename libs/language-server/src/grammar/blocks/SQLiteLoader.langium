import '../attributes'

SQLiteLoader:
  name='SQLiteLoader' '{'
    file=FileAttribute
  '}';

FileAttribute returns StringAttribute:
  'file' StringAttributeFragment;