import { 
    JayveeModel, 
    JayveeServices, 
    createJayveeServices, 
    PipelineDefinition, 
    getBlocksInTopologicalSorting 
  } from '@jvalue/jayvee-language-server';
import { integer } from 'vscode-languageserver-protocol';

import { 
  diagramType,
  diagramDirection, 
  subgraphDirection,
  subgraphColor,
  font,
  fontSize
  } from './mermaid_params';

export function createMermaidPipeline(pipeline: PipelineDefinition, index: integer){
    let name: string = "subgraph " + pipeline.name;
    let blockNames = [];
    let blockList = getBlocksInTopologicalSorting(pipeline);
    for (const block of blockList){
        blockNames.push(block.name)
    }
    return name + "\n" + "direction " + subgraphDirection + "\n" + blockNames.join('-->') + "\n" + "end" + "\n";
  }

export function createMermaidStyling(pipeline: PipelineDefinition) {
  let classAssign = []
  for (const block of pipeline.blocks){
    if (block.name.includes("Extractor")){
      classAssign.push(`class ${block.name} source;`)
    }
    if (block.name.includes("Loader")){
      classAssign.push(`class ${block.name} sink;`)
    }
  }
  return classAssign.join("\n")
}

export function createMermaidRepresentation(model: JayveeModel){
    let diagramSetup: string = diagramType + " " + diagramDirection;
    let subgraph: string[] = [];
    let stylings: string[] = [];
    model.pipelines.forEach((pipeline, index) => {
        let pipelineCode = createMermaidPipeline(pipeline, index);
        let styling = createMermaidStyling(pipeline)
        subgraph.push(pipelineCode)
        stylings.push(styling)
    })
    let styles = setMermaidStyling()
    return diagramSetup + "\n" + subgraph.join("\n") + "\n" + stylings.join("\n") + "\n" + styles;
}

export function setMermaidTheme(){
  let theme = `{
    "theme": "base",
    "themeVariables": {
        "fontFamily": "${font}",
        "fontSize": "${fontSize}",
        "clusterBkg": "${subgraphColor}"
        }
    }`
  return theme
  } 

export function setMermaidStyling(){
  let styleDefs = ["classDef source fill:#FF9999,stroke:#333,stroke-width:2px;", 
                   "classDef sink fill:#BDFFA4,stroke:#333,stroke-width:2px;"]
  return styleDefs.join("\n")
}