import { ValueTypeVisitor } from '../types/value-types/visitors/value-type-visitor';

export class SQLColumnTypeVisitor extends ValueTypeVisitor<string> {
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
