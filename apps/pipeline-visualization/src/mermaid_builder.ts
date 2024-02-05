// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only
import { strict as assert } from 'assert';

import {
  BlockDefinition,
  PipelineDefinition,
} from '@jvalue/jayvee-language-server';
import { MermaidOptions } from './mermaid_utils';

export class MermaidBuilder {
  protected linkLines: string[] = [];
  protected nodeLines: string[] = [];
  protected styleLines: string[] = [];
  protected indent: number = 0;

  constructor(protected options: MermaidOptions) {}

  escapeHtml(unsafe: string) {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  diagram(diagramType: string, diagramDirection: string) {
    this.linkLines.push(diagramType + ' ' + diagramDirection);
  }

  pipelineHead(pipelinee: PipelineDefinition): MermaidBuilder {
    this.linkLines.push('subgraph ' + pipelinee.name);
    return this;
  }

  blockType(
    block: BlockDefinition,
    blockProperties: Map<string, string>,
  ): MermaidBuilder {
    assert(block.type.ref !== undefined);
    let propertyString = '';
    if (this.options.properties) {
      blockProperties.forEach((value, key) => {
        propertyString += `${key}: ${this.escapeHtml(value)}\n`;
      });
    }
    this.nodeLines.push(
      `${block.name}[${block.name}<br><i>${block.type.ref?.name}</i><br>${propertyString}]`,
    );
    return this;
  }

  branching(block: BlockDefinition, child: BlockDefinition): MermaidBuilder {
    this.linkLines.push(`${block.name}-->${child.name}`);
    return this;
  }

  chain(chain: string[]): MermaidBuilder {
    this.linkLines.push(chain.join('-->'));
    return this;
  }

  compositeHeader(
    block: BlockDefinition,
    subgraphDirection: string,
  ): MermaidBuilder {
    this.indent = this.indent + 1;
    this.linkLines.push(
      `${'\t'.repeat(this.indent)}subgraph ${block.name}\n ${'\t'.repeat(
        this.indent,
      )}direction ${subgraphDirection}`,
    );
    return this;
  }

  compositeBody(subblocks: string[]): MermaidBuilder {
    this.linkLines.push(`${'\t'.repeat(this.indent)}` + subblocks.join('-->'));
    return this;
  }

  compositeTail(): MermaidBuilder {
    this.linkLines.push(`${'\t'.repeat(this.indent)}end`);
    this.indent = this.indent - 1;
    return this;
  }

  classAssign(block: BlockDefinition, className: string): MermaidBuilder {
    this.styleLines.push(`class ${block.name} ${className};`);
    return this;
  }

  section(section: string): MermaidBuilder {
    this.linkLines.push(section);
    return this;
  }

  styles(style: string): MermaidBuilder {
    this.styleLines.push(style);
    return this;
  }

  end(): MermaidBuilder {
    this.linkLines.push('end');
    return this;
  }

  /* newLine(): MermaidBuilder {
    this.mermaidLines.push('');
    return this;
  } */

  build(): string {
    return (
      this.linkLines.join('\n') +
      '\n\n' +
      this.nodeLines.join('\n') +
      '\n\n' +
      this.styleLines.join('\n')
    );
  }
}
