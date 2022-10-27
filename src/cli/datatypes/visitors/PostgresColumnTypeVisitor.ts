import { DataTypeVisitor } from './DataTypeVisitor';

export class PostgresColumnTypeVisitor extends DataTypeVisitor<string> {
  override visitBoolean(): string {
    return 'boolean';
  }
  override visitDecimal(): string {
    return 'numeric';
  }
  override visitInteger(): string {
    return 'integer';
  }
  override visitText(): string {
    return 'text';
  }
}
