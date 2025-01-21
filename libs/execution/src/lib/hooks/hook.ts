// SPDX-FileCopyrightText: 2025 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type Result } from '../blocks';
import { type ExecutionContext } from '../execution-context';
import { type IOTypeImplementation } from '../types';

/** When to execute the hook.*/
export type HookPosition = 'preBlock' | 'postBlock';

export interface HookOptions {
  /** Whether the pipeline should await the hooks completion. `false` if omitted.*/
  blocking?: boolean;
  /** Optionally specify one or more blocks to limit this hook to. If omitted, the hook will be executed on all blocks*/
  blocktypes?: string[];
}

export interface PreBlockHookArgs {
  blocktype: string;
  input: IOTypeImplementation | null;
  context: ExecutionContext;
}

/** This function will be executed before a block.*/
export type PreBlockHook = (args: PreBlockHookArgs) => Promise<void>;

export function isPreBlockHook(
  hook: PreBlockHook | PostBlockHook,
  position: HookPosition,
): hook is PreBlockHook {
  return position === 'preBlock';
}

export interface PostBlockHookArgs extends PreBlockHookArgs {
  output: Result<IOTypeImplementation | null>;
}

/** This function will be executed before a block.*/
export type PostBlockHook = (args: PostBlockHookArgs) => Promise<void>;

export function isPostBlockHook(
  hook: PreBlockHook | PostBlockHook,
  position: HookPosition,
): hook is PostBlockHook {
  return position === 'postBlock';
}
