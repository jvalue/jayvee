import { BlockMetaInformation } from '../meta-information/block-meta-inf';

export interface JayveeBlockTypeDocGenerator {
  generateBlockTypeDoc(metaInf: BlockMetaInformation): string;
}

export interface JayveeBlockAttributeDocGenerator {
  generateBlockAttributeDoc(
    metaInf: BlockMetaInformation,
    attributeName: string,
  ): string | undefined;
}
