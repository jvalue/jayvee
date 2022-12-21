import {
  BlockMetaInformation,
  registerBlockMetaInformation,
} from './meta-information';

export interface JayveeLangExtension {
  getBlockMetaInf(): BlockMetaInformation[];
}

export function useExtension(extension: JayveeLangExtension) {
  extension.getBlockMetaInf().forEach(registerBlockMetaInformation);
}
