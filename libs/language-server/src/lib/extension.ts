import {
  BlockMetaInformation,
  registerBlockMetaInformation,
} from './meta-information';

export interface BlockMetaInformationType<
  T extends BlockMetaInformation = BlockMetaInformation,
> extends Function {
  new (): T;
}

export interface JayveeLangExtension {
  getBlockMetaInf(): BlockMetaInformationType[];
}

export function useExtension(extension: JayveeLangExtension) {
  extension
    .getBlockMetaInf()
    .forEach((BlockMetaInfType) =>
      registerBlockMetaInformation(new BlockMetaInfType()),
    );
}
