import { DataTypeVisitor } from '@jayvee/execution';

export class SQLColumnTypeVisitor extends DataTypeVisitor<string> {
  override visitBoolean(): string {
    return 'boolean';
  }
  override visitDecimal(): string {
    return 'real';
  }
  override visitInteger(): string {
    return 'integer';
  }
  override visitText(): string {
    return 'text';
  }
}
