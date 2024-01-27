// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { BlockDefinition } from '@jvalue/jayvee-language-server';

export class MermaidBuilder {
  protected mermaidLines: string[] = [];

  pipelineHead(pipelineName: string): MermaidBuilder {
    this.mermaidLines.push('subgraph ' + pipelineName);
    return this;
  }

  blockType(block: BlockDefinition): MermaidBuilder {
    this.mermaidLines.push(
      `${block.name}[${block.name}<br><i>${block.type.ref?.name}</i>]`,
    );
    return this;
  }

  blockTypeWithProperties(
    block: BlockDefinition,
    propertyString: string,
  ): MermaidBuilder {
    this.mermaidLines.push(
      `${block.name}[${block.name}<br><i>${block.type.ref?.name}</i><br>${propertyString}]`,
    );
    return this;
  }

  branching(block: BlockDefinition, child: BlockDefinition): MermaidBuilder {
    this.mermaidLines.push(`${block.name}-->${child.name}`);
    return this;
  }

  chain(chain: string[]): MermaidBuilder {
    this.mermaidLines.push(chain.join('-->'));
    return this;
  }

  compositeHeader(
    block: BlockDefinition,
    depth: number,
    subgraphDirection: string,
  ): MermaidBuilder {
    this.mermaidLines.push(
      `${'\t'.repeat(depth)}subgraph ${block.name}\n ${'\t'.repeat(
        depth,
      )}direction ${subgraphDirection}`,
    );
    return this;
  }

  compositeBody(subblocks: string[], depth: number): MermaidBuilder {
    this.mermaidLines.push(`${'\t'.repeat(depth)}` + subblocks.join('-->'));
    return this;
  }

  compositeTail(depth: number): MermaidBuilder {
    this.mermaidLines.push(`${'\t'.repeat(depth)}end`);
    return this;
  }

  classAssign(block: BlockDefinition, className: string): MermaidBuilder {
    this.mermaidLines.push(`class ${block.name} ${className};`);
    return this;
  }

  section(section: string): MermaidBuilder {
    this.mermaidLines.push(section);
    return this;
  }

  end(): MermaidBuilder {
    this.mermaidLines.push('end');
    return this;
  }

  newLine(): MermaidBuilder {
    this.mermaidLines.push('');
    return this;
  }

  build(): string {
    return this.mermaidLines.join('\n');
  }
}
