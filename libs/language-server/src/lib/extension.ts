import {
  BlockMetaInformation,
  registerBlockMetaInformation,
} from './meta-information';

export interface BlockMetaInformationClass<
  T extends BlockMetaInformation = BlockMetaInformation,
> extends Function {
  new (): T;
}

export interface JayveeLangExtension {
  getBlockMetaInf(): BlockMetaInformationClass[];
}

export function useExtension(extension: JayveeLangExtension) {
  extension
    .getBlockMetaInf()
    .forEach((blockMetaInformation) =>
      registerBlockMetaInformation(new blockMetaInformation()),
    );
}
