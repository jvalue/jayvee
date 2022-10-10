import fs from 'fs';
import path from 'path';

import { CompositeGeneratorNode, processGeneratorNode } from 'langium';

import { Model } from '../language-server/generated/ast';

import { extractDestinationAndName } from './cli-util';

export function generateJavaScript(
  model: Model,
  filePath: string,
  destination: string | undefined,
): string {
  const data = extractDestinationAndName(filePath, destination);
  const generatedFilePath = `${path.join(data.destination, data.name)}.js`;

  const fileNode = new CompositeGeneratorNode();

  if (!fs.existsSync(data.destination)) {
    fs.mkdirSync(data.destination, { recursive: true });
  }
  fs.writeFileSync(generatedFilePath, processGeneratorNode(fileNode));
  return generatedFilePath;
}
