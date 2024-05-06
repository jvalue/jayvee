// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

export class Registry<C> {
  protected readonly registry = new Map<string, C>();

  protected register(key: string, classToRegister: C) {
    assert(
      !this.registry.has(key),
      `Multiple keys "${key}" were registered, expected at most one register call per key`,
    );
    this.registry.set(key, classToRegister);
  }

  protected getAll(): C[] {
    return [...this.registry.values()];
  }

  protected getAllEntries(): { key: string; value: C }[] {
    return [...this.registry.entries()].map(([k, v]) => {
      return { key: k, value: v };
    });
  }

  protected get(key: string): C | undefined {
    return this.registry.get(key);
  }

  protected clear() {
    this.registry.clear();
  }
}
