import { DataTypeVisitor } from './DataTypeVisitor';

export class PostgresValueRepresentationVisitor extends DataTypeVisitor<
  (value: unknown) => string
> {
  visitBoolean(): (value: unknown) => string {
    return (value: unknown) => {
      if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
      }
      if (typeof value === 'string') {
        switch (value) {
          case 'True':
          case 'true':
            return String.raw`'true'`;
          default:
            return String.raw`'false'`;
        }
      }

      return String.raw`'false'`;
    };
  }
  visitDecimal(): (value: unknown) => string {
    return (value: unknown) => {
      return Number.parseFloat(value as string).toString();
    };
  }
  visitInteger(): (value: unknown) => string {
    return (value: unknown) => {
      return Number.parseInt(value as string, 10).toString();
    };
  }
  visitText(): (value: unknown) => string {
    return (value: unknown) => {
      return `'${(value as string).toString()}'`;
    };
  }
}
