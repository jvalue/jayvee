import { BlockMetaInformation } from '../meta-information/block-meta-inf';

export interface JayveeBlockTypeDocGenerator {
  generateBlockTypeDoc(metaInf: BlockMetaInformation): string;
}

export interface JayveePropertyDocGenerator {
  generatePropertyDoc(
    metaInf: BlockMetaInformation,
    propertyName: string,
  ): string | undefined;
}
