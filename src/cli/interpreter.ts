import { NodeFileSystem } from 'langium/node';

import { Model } from '../language-server/generated/ast';
import { createOpenDataLanguageServices } from '../language-server/open-data-language-module';

import { extractAstNode } from './cli-util';

export async function runAction(fileName: string): Promise<void> {
  const services =
    createOpenDataLanguageServices(NodeFileSystem).OpenDataLanguage;
  const model = await extractAstNode<Model>(fileName, services);
  interpretPipelineModel(model);
}

function interpretPipelineModel(model: Model): void {
  console.log(
    `Model contains ${model.blocks.length} block(s), ${model.layouts.length} layout(s) and ${model.pipes.length} pipe(s)`,
  );
}
