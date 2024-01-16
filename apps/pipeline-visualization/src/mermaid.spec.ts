import * as fs from 'fs';
import * as path from 'path';

import { MermaidOptions } from './mermaid_utils';
import { doProcessOptions } from './run';

describe('test mermaid code generation', () => {
  const baseDir = path.resolve(__dirname, '../../../example/');
  let fileNameJv = path.resolve(baseDir, 'cars.jv');
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
  it('example nested runs through', async () => {
    fileNameJv = path.resolve(baseDir, 'cars-composite.jv');
    const mermaidOptions: MermaidOptions = {
      mermaidFile: fileNameMermaidCode,
      styleFile: fileNameMermaidStyle,
      compositeBlocks: false,
      properties: false,
    };
    await doProcessOptions(fileNameJv, mermaidOptions);
  });
  it('nested file content as expected', async () => {
    fileNameJv = path.resolve(baseDir, 'cars-composite.jv');
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
  it('nested file content with properties as expected', async () => {
    fileNameJv = path.resolve(baseDir, 'cars-composite.jv');
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

const gtCarsProperties = `flowchart LR
subgraph CarsPipeline
direction TB
CarsExtractor-->CarsTextFileInterpreter-->CarsCSVInterpreter-->NameHeaderWriter-->CarsTableInterpreter-->CarsLoader
end 

CarsExtractor[CarsExtractor<br><i>HttpExtractor</i><br>]
CarsTextFileInterpreter[CarsTextFileInterpreter<br><i>TextFileInterpreter</i><br>]
CarsCSVInterpreter[CarsCSVInterpreter<br><i>CSVInterpreter</i><br>enclosing: &quot;
]
NameHeaderWriter[NameHeaderWriter<br><i>CellWriter</i><br>]
CarsTableInterpreter[CarsTableInterpreter<br><i>TableInterpreter</i><br>]
CarsLoader[CarsLoader<br><i>SQLiteLoader</i><br>table: Cars
file: ./cars.sqlite
]

class CarsExtractor source;
class CarsLoader sink;
classDef source fill:#FF9999,stroke:#333,stroke-width:2px;
classDef sink fill:#BDFFA4,stroke:#333,stroke-width:2px;`;

const gtNested = `flowchart LR
subgraph CarsPipeline
direction TB
CarsExtractor-->CarsTableInterpreter-->CarsLoader
end 

CarsExtractor[CarsExtractor<br><i>CSVExtractor</i><br>]
CarsTableInterpreter[CarsTableInterpreter<br><i>TableInterpreter</i><br>]
CarsLoader[CarsLoader<br><i>SQLiteLoader</i><br>]

class CarsExtractor source;
class CarsLoader sink;
classDef source fill:#FF9999,stroke:#333,stroke-width:2px;
classDef sink fill:#BDFFA4,stroke:#333,stroke-width:2px;`;

const gtNestedComposite = `flowchart LR
subgraph CarsPipeline
direction TB
CarsExtractor-->CarsTableInterpreter-->CarsLoader
end 
subgraph CarsExtractor
direction TB
FileExtractor-->FileTextInterpreter-->FileCSVInterpreter
end 

CarsExtractor[CarsExtractor<br><i>CSVExtractor</i><br>]
CarsTableInterpreter[CarsTableInterpreter<br><i>TableInterpreter</i><br>]
CarsLoader[CarsLoader<br><i>SQLiteLoader</i><br>]

class CarsExtractor source;
class CarsLoader sink;
classDef source fill:#FF9999,stroke:#333,stroke-width:2px;
classDef sink fill:#BDFFA4,stroke:#333,stroke-width:2px;`;
