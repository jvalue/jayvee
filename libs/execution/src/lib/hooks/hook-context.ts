// SPDX-FileCopyrightText: 2025 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type HookOptions,
  type HookPosition,
  type PostBlockHook,
  type PostBlockHookArgs,
  type PreBlockHook,
  type PreBlockHookArgs,
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
  args: PreBlockHookArgs,
) {
  await Promise.all(
    hooks.map(async ({ blocking, hook }) => {
      if (blocking) {
        await hook(args);
      } else {
        hook(args).catch(noop);
      }
    }),
  );
}

async function executePostBlockHooks(
  hooks: HookSpec<PostBlockHook>[],
  args: PostBlockHookArgs,
) {
  await Promise.all(
    hooks.map(async ({ blocking, hook }) => {
      if (blocking) {
        await hook(args);
      } else {
        hook(args).catch(noop);
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

  public async executePreBlockHooks(args: PreBlockHookArgs) {
    args.context.logger.logDebug(`Executing general pre-block-hooks`);
    const general = executePreBlockHooks(this.hooks.pre[AllBlocks] ?? [], args);
    args.context.logger.logDebug(
      `Executing pre-block-hooks for blocktype ${args.blocktype}`,
    );
    const blockSpecific = executePreBlockHooks(
      this.hooks.pre[args.blocktype] ?? [],
      args,
    );

    await Promise.all([general, blockSpecific]);
  }

  public async executePostBlockHooks(args: PostBlockHookArgs) {
    args.context.logger.logDebug(`Executing general post-block-hooks`);
    const general = executePostBlockHooks(
      this.hooks.post[AllBlocks] ?? [],
      args,
    );
    args.context.logger.logDebug(
      `Executing post-block-hooks for blocktype ${args.blocktype}`,
    );
    const blockSpecific = executePostBlockHooks(
      this.hooks.post[args.blocktype] ?? [],
      args,
    );

    await Promise.all([general, blockSpecific]);
  }
}
