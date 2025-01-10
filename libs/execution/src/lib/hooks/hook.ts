// SPDX-FileCopyrightText: 2025 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type ExecutionContext } from '../execution-context';
import { type IOTypeImplementation } from '../types';

/** A hook can be executed `before` or `after` a block*/
export type HookPosition = 'before' | 'after';

const AllBlocks = '*';

async function executeTheseHooks(
  hooks: HookSpec[],
  blocktype: string,
  input: IOTypeImplementation,
  context: ExecutionContext,
) {
  await Promise.all(
    hooks.map(async ({ blocking, hook }) => {
      if (blocking) {
        await hook(blocktype, input, context);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        hook(blocktype, input, context).catch(() => {});
      }
    }),
  );
}

export class HookContext {
  private hooks: {
    before: Record<string, HookSpec[]>;
    after: Record<string, HookSpec[]>;
  } = { before: {}, after: {} };

  public addHook(hook: Hook, opts: HookOptions) {
    const blocktypes: string[] =
      typeof opts.blocktypes === 'string'
        ? [opts.blocktypes]
        : opts.blocktypes ?? [AllBlocks];

    blocktypes.forEach((blocktype) => {
      if (this.hooks[opts.position][blocktype] === undefined) {
        this.hooks[opts.position][blocktype] = [];
      }
      this.hooks[opts.position][blocktype]?.push({
        blocking: opts.blocking ?? true,
        hook,
      });
    });
  }

  public async executeHooks(
    position: HookPosition,
    blocktype: string,
    input: IOTypeImplementation,
    context: ExecutionContext,
  ) {
    const general = executeTheseHooks(
      this.hooks[position][AllBlocks] ?? [],
      blocktype,
      input,
      context,
    );
    const blockSpecific = executeTheseHooks(
      this.hooks[position][blocktype] ?? [],
      blocktype,
      input,
      context,
    );

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return Promise.all([general, blockSpecific]).then(() => {});
  }
}

export interface HookOptions {
  /** Whether the hook is executed `before` or `after` a block.*/
  // FIXME: find a better name than `position`
  position: HookPosition;
  /** Whether the pipeline should await the hooks completion. `true` if omitted.*/
  blocking?: boolean;
  /** Optionally specify one or more blocks to limit this hook to. If omitted, the hook will be executed on all blocks*/
  // FIXME #634: Add `BlockExecutor` type
  blocktypes?: string | string[];
}

export type Hook = (
  blocktype: string,
  input: IOTypeImplementation,
  context: ExecutionContext,
) => Promise<void>;

interface HookSpec {
  blocking: boolean;
  hook: Hook;
}
