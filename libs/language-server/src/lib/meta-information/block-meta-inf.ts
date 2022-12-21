import { IOType, UNDEFINED_TYPE } from '../types/io-types';

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

  getRequiredAttributeNames(): string[] {
    const requiredAttributeNames = Object.entries(this.attributes)
      .filter(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ([_, attributeSpec]) => attributeSpec.defaultValue === undefined,
      )
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(([name, _]) => name);
    return requiredAttributeNames;
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
