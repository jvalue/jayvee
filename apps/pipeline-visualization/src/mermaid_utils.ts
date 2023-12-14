import { 
    JayveeModel, 
    JayveeServices, 
    createJayveeServices, 
    PipelineDefinition, 
    getBlocksInTopologicalSorting,
    collectStartingBlocks,
    collectChildren, 
    BlockDefinition
  } from '@jvalue/jayvee-language-server';
import { integer } from 'vscode-languageserver-protocol';

import { 
  diagramType,
  diagramDirection, 
  subgraphDirection,
  subgraphColor,
  //showComposite,
  //showProperties,
  properties,
  font,
  fontSize
  } from './mermaid_params';


  export interface MermaidOptions {
    composite: boolean;
    properties: boolean;
  }

function processPipeline(pipeline: PipelineDefinition): string{
  let listofPipes: Array<string[]> = []
  const process_pipe = (pipe: string[], block:BlockDefinition) => {
    pipe.push(block.name)
    let children = collectChildren(block);
    if (children.length == 1) {
      process_pipe(pipe, children[0]!);
    } else if (children.length > 1){
      listofPipes.push(pipe);
      children.forEach((child) => {process_pipe([block.name], child)})
    } else {
      listofPipes.push(pipe)
    }
  }
  let startingBlocks = collectStartingBlocks(pipeline);
  startingBlocks.forEach((startingBlock) => process_pipe([], startingBlock))
  let result = listofPipes
  .map((pipeline) => pipeline.join("-->"))
  .join("\n")
  return result;
}

export function createMermaidPipeline(pipeline: PipelineDefinition, mermaidOptions: MermaidOptions){
  /* const myToString = (block: BlockDefinition, index = 0): string => {
    const blockTypeName = block.type.ref?.name;
    const blockString = `${index}["\`${block.name} \n (${blockTypeName})\`"]`;
    const childString = collectChildren(block)
      .map((child) => myToString(child, index + 1))
      .join('-->');
    return blockString + '-->' + childString;
  };
 */
  let name: string = "subgraph " + pipeline.name;
  let direction: string = "direction " + subgraphDirection
  let listofPipes: Array<string[]> = [];
  let listofBocks: Array<string> = [];
  let composites: string = "";
  const process_pipe = (pipe: string[], block:BlockDefinition) => {
    if (block.type.ref?.$type == "CompositeBlocktypeDefinition" && mermaidOptions.composite){
      let compositePipe: string[] = []
      for (let subblock of block.type.ref?.blocks){
        compositePipe.push(subblock.name)
      }
      let compositeName = "subgraph " + block.name;
      composites += compositeName + "\n" + direction + "\n" + compositePipe.join("-->") + "\n" + "end \n";
    }
    pipe.push(block.name)
    let propertyString = ""
    if (mermaidOptions.properties){
      for (let property of block.body.properties) {
        if (properties.includes(property.name)){
          let pv: any = property.value // Is there a better way of doing this?
          propertyString += `${property.name}: ${pv.value}\n`
        }
      }
    }
    //let propertyString = block.body.properties.map((property) => `${property.name}: ${property.value.value}`).join("\n")
    //Markdown styling
    //listofBocks.push(`${block.name}["\` ${block.name}\n(${block.type.ref?.name})\n${propertyString}\`" ]`)
    //HTML styling
    listofBocks.push(`${block.name}[${block.name}<br><i>${block.type.ref?.name}</i><br>${propertyString}]`)
    let children = collectChildren(block);
    if (children.length == 1) {
      process_pipe(pipe, children[0]!);
    } else if (children.length > 1){
      listofPipes.push(pipe);
      children.forEach((child) => {process_pipe([block.name], child)})
    } else {
      listofPipes.push(pipe)
    }
  }
  let startingBlocks = collectStartingBlocks(pipeline);
  startingBlocks.forEach((startingBlock) => process_pipe([], startingBlock))
  let pipelineSet = listofPipes
  .map((pipeline) => pipeline.join("-->"))
  .join("\n")
  let blockSet = listofBocks.join("\n")
   
  return name + "\n" + direction + "\n" + pipelineSet + "\n" + "end \n" + composites + "\n" + blockSet + "\n";
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

export function createMermaidRepresentation(model: JayveeModel, mermaidOptions: MermaidOptions){
    let diagramSetup: string = diagramType + " " + diagramDirection;
    let pipelineCodes: string[] = [];
    let stylings: string[] = [];
    model.pipelines.forEach((pipeline, index) => {
        //let pipelineCode = processPipeline(pipeline);
        let pipelineCode = createMermaidPipeline(pipeline, mermaidOptions);
        let styling = createMermaidStyling(pipeline)
        pipelineCodes.push(pipelineCode)
        stylings.push(styling)
    })
    let styles = setMermaidStyling()
    return diagramSetup + "\n" + pipelineCodes.join("\n") + "\n" + stylings.join("\n") + "\n" + styles;
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