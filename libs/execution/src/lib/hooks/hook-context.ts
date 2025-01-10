// SPDX-FileCopyrightText: 2025 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import assert from 'assert';

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

async function executeTheseHooks(
  hooks: HookSpec<PreBlockHook>[],
  blocktype: string,
  input: IOTypeImplementation | null,
  context: ExecutionContext,
): Promise<void>;
async function executeTheseHooks(
  hooks: HookSpec<PostBlockHook>[],
  blocktype: string,
  input: IOTypeImplementation | null,
  context: ExecutionContext,
  output: Result<IOTypeImplementation | null>,
): Promise<void>;
async function executeTheseHooks(
  hooks: HookSpec<PreBlockHook>[] | HookSpec<PostBlockHook>[],
  blocktype: string,
  input: IOTypeImplementation | null,
  context: ExecutionContext,
  output?: Result<IOTypeImplementation | null>,
) {
  const position = output === undefined ? 'preBlock' : 'postBlock';
  return (
    Promise.all(
      hooks.map(async ({ blocking, hook }) => {
        if (blocking) {
          if (isPreBlockHook(hook, position)) {
            await hook(blocktype, input, context);
          } else {
            assert(output !== undefined, 'Guaranteed to be a postBlock hook');
            await hook(blocktype, input, output, context);
          }
        } else {
          if (isPreBlockHook(hook, position)) {
            hook(blocktype, input, context)
              // eslint-disable-next-line @typescript-eslint/no-empty-function
              .catch(() => {});
          } else {
            assert(output !== undefined, 'Guaranteed to be a postBlock hook');
            hook(blocktype, input, output, context)
              // eslint-disable-next-line @typescript-eslint/no-empty-function
              .catch(() => {});
          }
        }
      }),
    )
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .then(() => {})
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
    const blocktypes: string[] =
      typeof opts.blocktypes === 'string'
        ? [opts.blocktypes]
        : opts.blocktypes ?? [AllBlocks];

    blocktypes.forEach((blocktype) => {
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
    });
  }

  public async executeHooks(
    blocktype: string,
    input: IOTypeImplementation | null,
    context: ExecutionContext,
  ): Promise<void>;
  public async executeHooks(
    blocktype: string,
    input: IOTypeImplementation | null,
    context: ExecutionContext,
    output: Result<IOTypeImplementation | null>,
  ): Promise<void>;
  public async executeHooks(
    blocktype: string,
    input: IOTypeImplementation | null,
    context: ExecutionContext,
    output?: Result<IOTypeImplementation | null>,
  ): Promise<void>;
  public async executeHooks(
    blocktype: string,
    input: IOTypeImplementation | null,
    context: ExecutionContext,
    output?: Result<IOTypeImplementation | null>,
  ) {
    if (output === undefined) {
      const general = executeTheseHooks(
        this.hooks.pre[AllBlocks] ?? [],
        blocktype,
        input,
        context,
      );
      const blockSpecific = executeTheseHooks(
        this.hooks.pre[blocktype] ?? [],
        blocktype,
        input,
        context,
      );

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      return Promise.all([general, blockSpecific]).then(() => {});
    }
    const general = executeTheseHooks(
      this.hooks.post[AllBlocks] ?? [],
      blocktype,
      input,
      context,
      output,
    );
    const blockSpecific = executeTheseHooks(
      this.hooks.post[blocktype] ?? [],
      blocktype,
      input,
      context,
      output,
    );

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return Promise.all([general, blockSpecific]).then(() => {});
  }
}
