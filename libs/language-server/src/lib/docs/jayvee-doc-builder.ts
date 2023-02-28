import { BlockMetaInformation } from '../meta-information/block-meta-inf';

export interface JayveeBlockTypeDocBuilder {
  buildBlockTypeDoc(metaInf: BlockMetaInformation): string;
}

export interface JayveeBlockAttributeDocBuilder {
  buildBlockAttributeDoc(
    metaInf: BlockMetaInformation,
    attributeName: string,
  ): string | undefined;
}
