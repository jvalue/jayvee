import { BlockMetaInformation } from '../meta-information/block-meta-inf';

export interface JayveeBlockTypeDocGenerator {
  generateBlockTypeDoc(metaInf: BlockMetaInformation): string;
}

export interface JayveeAttributeDocGenerator {
  generateAttributeDoc(
    metaInf: BlockMetaInformation,
    attributeName: string,
  ): string | undefined;
}
