import 'CSVFileExtractor'
import 'LayoutValidator'
import 'PostgresLoader'
import 'SQLiteLoader'

BlockType:
  CSVFileExtractor |
  LayoutValidator |
  SQLiteLoader |
  PostgresLoader;
