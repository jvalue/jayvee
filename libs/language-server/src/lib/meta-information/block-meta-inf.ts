import { IOType, UNDEFINED_TYPE } from '../types/io-types/io-types';

export enum AttributeType {
  STRING = 'string',
  INT = 'integer',
  LAYOUT = 'layout',
}

export interface AttributeSpecification {
  type: AttributeType;
  defaultValue?: unknown;
}

export abstract class BlockMetaInformation {
  protected constructor(
    readonly blockType: string,
    private readonly inputType: IOType,
    private readonly outputType: IOType,
    private readonly attributes: Record<string, AttributeSpecification>,
  ) {}

  getAttributeSpecification(name: string): AttributeSpecification | undefined {
    return this.attributes[name];
  }

  hasAttributeSpecification(name: string): boolean {
    return this.getAttributeSpecification(name) !== undefined;
  }

  getAttributeNames(
    kind: 'optional' | 'required' | undefined = undefined,
    excludeNames: string[] = [],
  ): string[] {
    const resultingAttributeNames: string[] = [];
    for (const [name, spec] of Object.entries(this.attributes)) {
      if (kind === 'optional' && spec.defaultValue === undefined) {
        continue;
      }
      if (kind === 'required' && spec.defaultValue !== undefined) {
        continue;
      }
      if (excludeNames.includes(name)) {
        continue;
      }
      resultingAttributeNames.push(name);
    }
    return resultingAttributeNames;
  }

  canBeConnectedTo(blockAfter: BlockMetaInformation): boolean {
    return this.outputType === blockAfter.inputType;
  }

  hasInput(): boolean {
    return this.inputType !== UNDEFINED_TYPE;
  }

  hasOutput(): boolean {
    return this.outputType !== UNDEFINED_TYPE;
  }
}
