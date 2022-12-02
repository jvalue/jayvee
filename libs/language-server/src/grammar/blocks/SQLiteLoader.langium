import '../attributes'

SQLiteLoader:
  name='SQLiteLoader' '{'
    table=TableAttribute
    file=FileAttribute
  '}';

FileAttribute returns StringAttribute:
  'file' StringAttributeFragment;