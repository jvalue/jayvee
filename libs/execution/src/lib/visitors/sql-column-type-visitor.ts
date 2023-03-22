import { ValuetypeVisitor } from '../types/valuetypes/visitors/valuetype-visitor';

export class SQLColumnTypeVisitor extends ValuetypeVisitor<string> {
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
