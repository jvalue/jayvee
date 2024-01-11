import * as fs from 'fs';
import * as path from 'path';

// import { expect, jest, test } from '@jest/globals';

import { MermaidOptions } from './mermaid_utils';
import { processOptions } from './run';

const fileNameMermaidCode = 'mermaid-code-test.txt';
const fileNameMermaidStyle = 'mermaid-style-test.txt';
const composite = false;
const properties = false;

class TestOptions implements MermaidOptions {
  mermaidFile: string = fileNameMermaidCode;
  styleFile: string = fileNameMermaidStyle;
  compositeBlocks: boolean = composite;
  properties: boolean = properties;
}
const mermaidOptions = new TestOptions();

describe('mermaid code generation', () => {
  const baseDir = path.resolve(__dirname, '../../../example/');

  it('processing runs through', () => {
    const fileNameJv = path.resolve(baseDir, 'cars.jv');
    processOptions(fileNameJv, mermaidOptions);
  });
  it('file content as expected', () => {
    const fileContent = fs.readFileSync(fileNameMermaidCode, 'utf-8');
    expect(fileContent).toMatch(groundtruth);
  });
});

const groundtruth: string = `flowchart LR
subgraph CarsPipeline
direction TB
CarsExtractor-->CarsTextFileInterpreter-->CarsCSVInterpreter-->NameHeaderWriter-->CarsTableInterpreter-->CarsLoader
end

CarsExtractor[CarsExtractor<br><i>HttpExtractor</i><br>]
CarsTextFileInterpreter[CarsTextFileInterpreter<br><i>TextFileInterpreter</i><br>]
CarsCSVInterpreter[CarsCSVInterpreter<br><i>CSVInterpreter</i><br>]
NameHeaderWriter[NameHeaderWriter<br><i>CellWriter</i><br>]
CarsTableInterpreter[CarsTableInterpreter<br><i>TableInterpreter</i><br>]
CarsLoader[CarsLoader<br><i>SQLiteLoader</i><br>]

class CarsExtractor source;
class CarsLoader sink;
classDef source fill:#FF9999,stroke:#333,stroke-width:2px;
classDef sink fill:#BDFFA4,stroke:#333,stroke-width:2px;`;
