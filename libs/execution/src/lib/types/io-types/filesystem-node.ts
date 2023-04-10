// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

export abstract class FileSystemNode {
  constructor(public name: string) {}

  abstract getNodeSize(): number;
}
