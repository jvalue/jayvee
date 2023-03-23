// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

export class Registry<C> {
  private readonly registry = new Map<string, C>();

  register(key: string, classToRegister: C) {
    assert(
      !this.registry.has(key),
      `Multiple keys "${key}" were registered, expected at most one register call per key`,
    );
    this.registry.set(key, classToRegister);
  }

  getAll(): C[] {
    return [...this.registry.values()];
  }

  get(key: string): C | undefined {
    return this.registry.get(key);
  }
}
