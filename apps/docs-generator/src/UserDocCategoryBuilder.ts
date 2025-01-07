// SPDX-FileCopyrightText: 2024 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import fs from 'node:fs';
import path from 'node:path';

export class UserDocCategoryBuilder {
  generateDocsCategory(
    rootPath: string,
    dirName: string,
    label: string,
    position: number,
    description: string,
  ): string {
    const categoryPath = path.join(rootPath, dirName);

    fs.mkdirSync(categoryPath, { recursive: true });

    fs.writeFileSync(
      path.join(categoryPath, '_category_.json'),
      this.getCategoryJSONString(label, position, description),
    );

    fs.writeFileSync(
      path.join(categoryPath, '_category_.json.license'),
      this.getCategoryLicenseString(new Date().getFullYear()),
    );

    fs.writeFileSync(
      path.join(categoryPath, '.gitignore'),
      this.getCategoryGitignoreString(new Date().getFullYear()),
    );

    return categoryPath;
  }

  private getCategoryJSONString(
    label: string,
    position: number,
    description: string,
  ): string {
    return `{
  "label": "${label}",
  "position": ${position},
  "link": {
    "type": "generated-index",
    "description": "${description}"
  }
}`;
  }

  private getCategoryLicenseString(year: number): string {
    // REUSE-IgnoreStart
    return `SPDX-FileCopyrightText: ${year} Friedrich-Alexander-Universitat Erlangen-Nurnberg

SPDX-License-Identifier: AGPL-3.0-only`;
    // REUSE-IgnoreEnd
  }

  private getCategoryGitignoreString(year: number): string {
    // REUSE-IgnoreStart
    return `# SPDX-FileCopyrightText: ${year} Friedrich-Alexander-Universitat Erlangen-Nurnberg
#
# SPDX-License-Identifier: AGPL-3.0-only

*.md`;
    // REUSE-IgnoreEnd
  }
}
