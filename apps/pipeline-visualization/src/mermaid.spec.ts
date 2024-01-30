// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as fs from 'fs';
import * as path from 'path';

import { MermaidOptions } from './mermaid_utils';
import { doProcessOptions } from './run';

describe('test mermaid code generation for cars.jv', () => {
  const baseDir = path.resolve(__dirname, '../../../example/');
  const fileNameJv = path.resolve(baseDir, 'cars.jv');
  const fileNameMermaidCode = 'mermaid-code-test.txt';
  const fileNameMermaidStyle = 'mermaid-style-test.txt';

  it('example cars.jv runs through', async () => {
    const mermaidOptions: MermaidOptions = {
      mermaidFile: fileNameMermaidCode,
      styleFile: fileNameMermaidStyle,
      compositeBlocks: false,
      properties: false,
    };
    await doProcessOptions(fileNameJv, mermaidOptions);
  });
  it('cars file content as expected', async () => {
    const mermaidOptions: MermaidOptions = {
      mermaidFile: fileNameMermaidCode,
      styleFile: fileNameMermaidStyle,
      compositeBlocks: false,
      properties: false,
    };
    await doProcessOptions(fileNameJv, mermaidOptions);
    const fileContent = fs.readFileSync(fileNameMermaidCode, 'utf-8');
    expect(fileContent).toMatch(gtCars);
  });
  it('cars file content with properties as expected', async () => {
    const mermaidOptions: MermaidOptions = {
      mermaidFile: fileNameMermaidCode,
      styleFile: fileNameMermaidStyle,
      compositeBlocks: false,
      properties: true,
    };
    await doProcessOptions(fileNameJv, mermaidOptions);
    const fileContent = fs.readFileSync(fileNameMermaidCode, 'utf-8');
    expect(fileContent).toMatch(gtCarsProperties);
  });
});
describe('test mermaid code generation for nested-composite-blocks.jv', () => {
  const baseDir = path.resolve(__dirname, '../test/assets/');
  const fileNameJv = path.resolve(baseDir, 'nested-composite-blocks.jv');
  const fileNameMermaidCode = 'mermaid-code-test.txt';
  const fileNameMermaidStyle = 'mermaid-style-test.txt';

  it('example nested runs through', async () => {
    const mermaidOptions: MermaidOptions = {
      mermaidFile: fileNameMermaidCode,
      styleFile: fileNameMermaidStyle,
      compositeBlocks: false,
      properties: false,
    };
    await doProcessOptions(fileNameJv, mermaidOptions);
  });
  it('nested file content as expected', async () => {
    const mermaidOptions: MermaidOptions = {
      mermaidFile: fileNameMermaidCode,
      styleFile: fileNameMermaidStyle,
      compositeBlocks: false,
      properties: false,
    };
    await doProcessOptions(fileNameJv, mermaidOptions);
    const fileContent = fs.readFileSync(fileNameMermaidCode, 'utf-8');
    expect(fileContent).toMatch(gtNested);
  });
  it('nested file content with composite as expected', async () => {
    const mermaidOptions: MermaidOptions = {
      mermaidFile: fileNameMermaidCode,
      styleFile: fileNameMermaidStyle,
      compositeBlocks: true,
      properties: false,
    };
    await doProcessOptions(fileNameJv, mermaidOptions);
    const fileContent = fs.readFileSync(fileNameMermaidCode, 'utf-8');
    expect(fileContent).toMatch(gtNestedComposite);
  });
});

const gtCars = `flowchart LR
subgraph CarsPipeline
CarsExtractor-->CarsTextFileInterpreter-->CarsCSVInterpreter-->NameHeaderWriter-->CarsTableInterpreter-->CarsLoader
end

CarsExtractor[CarsExtractor<br><i>HttpExtractor</i>]
class CarsExtractor source;
CarsTextFileInterpreter[CarsTextFileInterpreter<br><i>TextFileInterpreter</i>]
CarsCSVInterpreter[CarsCSVInterpreter<br><i>CSVInterpreter</i>]
NameHeaderWriter[NameHeaderWriter<br><i>CellWriter</i>]
CarsTableInterpreter[CarsTableInterpreter<br><i>TableInterpreter</i>]
CarsLoader[CarsLoader<br><i>SQLiteLoader</i>]
class CarsLoader sink;

classDef source fill:#FF9999,stroke:#333,stroke-width:2px;
classDef sink fill:#BDFFA4,stroke:#333,stroke-width:2px;`;

const gtCarsProperties = `flowchart LR
subgraph CarsPipeline
CarsExtractor-->CarsTextFileInterpreter-->CarsCSVInterpreter-->NameHeaderWriter-->CarsTableInterpreter-->CarsLoader
end

CarsExtractor[CarsExtractor<br><i>HttpExtractor</i><br>]
class CarsExtractor source;
CarsTextFileInterpreter[CarsTextFileInterpreter<br><i>TextFileInterpreter</i><br>]
CarsCSVInterpreter[CarsCSVInterpreter<br><i>CSVInterpreter</i><br>enclosing: &quot;
]
NameHeaderWriter[NameHeaderWriter<br><i>CellWriter</i><br>]
CarsTableInterpreter[CarsTableInterpreter<br><i>TableInterpreter</i><br>]
CarsLoader[CarsLoader<br><i>SQLiteLoader</i><br>table: Cars
file: ./cars.sqlite
]
class CarsLoader sink;

classDef source fill:#FF9999,stroke:#333,stroke-width:2px;
classDef sink fill:#BDFFA4,stroke:#333,stroke-width:2px;`;

const gtNested = `flowchart LR
subgraph CarsPipeline
CarsExtractor-->CarsTableInterpreter-->CarsLoader
end

CarsExtractor[CarsExtractor<br><i>CSVExtractor</i>]
class CarsExtractor source;
CarsLoader[CarsLoader<br><i>SQLiteLoader</i>]
class CarsLoader sink;
CarsTableInterpreter[CarsTableInterpreter<br><i>TableInterpreter</i>]

classDef source fill:#FF9999,stroke:#333,stroke-width:2px;
classDef sink fill:#BDFFA4,stroke:#333,stroke-width:2px;`;

const gtNestedComposite = `flowchart LR
subgraph CarsPipeline
CarsExtractor-->CarsTableInterpreter-->CarsLoader
	subgraph CarsExtractor
 	direction TB
	FileExtractor-->FileTextInterpreter-->FileCSVInterpreter
	end
end

CarsExtractor[CarsExtractor<br><i>CSVExtractor</i>]
class CarsExtractor source;
FileExtractor[FileExtractor<br><i>HttpExtractor</i>]
class FileExtractor source;
FileTextInterpreter[FileTextInterpreter<br><i>TextFileInterpreter</i>]
FileCSVInterpreter[FileCSVInterpreter<br><i>CSVInterpreter</i>]
CarsLoader[CarsLoader<br><i>SQLiteLoader</i>]
class CarsLoader sink;
CarsTableInterpreter[CarsTableInterpreter<br><i>TableInterpreter</i>]

classDef source fill:#FF9999,stroke:#333,stroke-width:2px;
classDef sink fill:#BDFFA4,stroke:#333,stroke-width:2px;`;
