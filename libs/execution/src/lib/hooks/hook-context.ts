// SPDX-FileCopyrightText: 2025 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type Result } from '../blocks';
import { type ExecutionContext } from '../execution-context';
import { type IOTypeImplementation } from '../types';

import {
  type HookOptions,
  type HookPosition,
  type PostBlockHook,
  type PreBlockHook,
  isPreBlockHook,
} from './hook';

const AllBlocks = '*';

interface HookSpec<H extends PreBlockHook | PostBlockHook> {
  blocking: boolean;
  hook: H;
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
function noop() {}

async function executePreBlockHooks(
  hooks: HookSpec<PreBlockHook>[],
  blocktype: string,
  input: IOTypeImplementation | null,
  context: ExecutionContext,
) {
  await Promise.all(
    hooks.map(async ({ blocking, hook }) => {
      if (blocking) {
        await hook(blocktype, input, context);
      } else {
        hook(blocktype, input, context).catch(noop);
      }
    }),
  );
}

async function executePostBlockHooks(
  hooks: HookSpec<PostBlockHook>[],
  blocktype: string,
  input: IOTypeImplementation | null,
  context: ExecutionContext,
  output: Result<IOTypeImplementation | null>,
) {
  await Promise.all(
    hooks.map(async ({ blocking, hook }) => {
      if (blocking) {
        await hook(blocktype, input, output, context);
      } else {
        hook(blocktype, input, output, context).catch(noop);
      }
    }),
  );
}

export class HookContext {
  private hooks: {
    pre: Record<string, HookSpec<PreBlockHook>[]>;
    post: Record<string, HookSpec<PostBlockHook>[]>;
  } = { pre: {}, post: {} };

  public addHook(
    position: 'preBlock',
    hook: PreBlockHook,
    opts: HookOptions,
  ): void;
  public addHook(
    position: 'postBlock',
    hook: PostBlockHook,
    opts: HookOptions,
  ): void;
  public addHook(
    position: HookPosition,
    hook: PreBlockHook | PostBlockHook,
    opts: HookOptions,
  ): void;
  public addHook(
    position: HookPosition,
    hook: PreBlockHook | PostBlockHook,
    opts: HookOptions,
  ) {
    for (const blocktype of opts.blocktypes ?? [AllBlocks]) {
      if (isPreBlockHook(hook, position)) {
        if (this.hooks.pre[blocktype] === undefined) {
          this.hooks.pre[blocktype] = [];
        }
        this.hooks.pre[blocktype].push({
          blocking: opts.blocking ?? false,
          hook,
        });
      } else {
        if (this.hooks.post[blocktype] === undefined) {
          this.hooks.post[blocktype] = [];
        }
        this.hooks.post[blocktype].push({
          blocking: opts.blocking ?? false,
          hook,
        });
      }
    }
  }

  public async executePreBlockHooks(
    blocktype: string,
    input: IOTypeImplementation | null,
    context: ExecutionContext,
  ) {
    context.logger.logInfo(`Executing general pre-block-hooks`);
    const general = executePreBlockHooks(
      this.hooks.pre[AllBlocks] ?? [],
      blocktype,
      input,
      context,
    );
    context.logger.logInfo(
      `Executing pre-block-hooks for blocktype ${blocktype}`,
    );
    const blockSpecific = executePreBlockHooks(
      this.hooks.pre[blocktype] ?? [],
      blocktype,
      input,
      context,
    );

    await Promise.all([general, blockSpecific]);
  }

  public async executePostBlockHooks(
    blocktype: string,
    input: IOTypeImplementation | null,
    context: ExecutionContext,
    output: Result<IOTypeImplementation | null>,
  ) {
    context.logger.logInfo(`Executing general post-block-hooks`);
    const general = executePostBlockHooks(
      this.hooks.post[AllBlocks] ?? [],
      blocktype,
      input,
      context,
      output,
    );
    context.logger.logInfo(
      `Executing post-block-hooks for blocktype ${blocktype}`,
    );
    const blockSpecific = executePostBlockHooks(
      this.hooks.post[blocktype] ?? [],
      blocktype,
      input,
      context,
      output,
    );

    await Promise.all([general, blockSpecific]);
  }
}
