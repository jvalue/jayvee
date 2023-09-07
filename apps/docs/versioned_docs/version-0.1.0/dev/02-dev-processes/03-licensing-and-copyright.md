---
title: Licensing and copyright
sidebar_position: 3
---

The [Jayvee repository](https://github.com/jvalue/jayvee) is REUSE compliant, meaning that it fulfills the 
[REUSE Specification](https://reuse.software/spec/) by the [Free Software Foundation Europe](https://fsfe.org/) (FSFE).
This makes clear under which license each project file is licensed under and who owns the copyright, not only for 
humans but also for machines.

This is done by explicitly adding copyright and licensing information to each file of the project. This is achieved 
by either using a comment header or a separate `*.license` file in case comments are not possible.

See <https://reuse.software/> more information.

## What license is used in this project and who is the copyright holder?

The entire project is licensed under [AGPL-3.0-only](https://spdx.org/licenses/AGPL-3.0-only.html), the
license file can be found [here](https://github.com/jvalue/jayvee/blob/main/LICENSES/AGPL-3.0-only.txt).
The copyright holder is the [Friedrich-Alexander-Universität Erlangen-Nürnberg](https://www.fau.eu/).

## How to submit a REUSE compliant contribution?

In case you want to contribute to the project, you will need to ensure that all of your contributed files are REUSE 
compliant. In order to achieve this, you need to add a key-value pair for both copyright and licensing information 
following this schema:

```
SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg

SPDX-License-Identifier: AGPL-3.0-only
```

In case a file allows comments, use single-line comments to add the copyright and licensing information at the top 
of the file. Otherwise, create a corresponding `*.license` file with the text above as its content. You can have a 
look at some existing project files to get an impression on it is done in practice.

For files with common file extensions, you can use the [reuse CLI tool](https://github.com/fsfe/reuse-tool) to add 
licensing and copyright information automatically.

For more details, you can have a look at the [Getting Started tutorial](https://reuse.software/tutorial/) on the REUSE 
website.

## How to validate REUSE compliance?

When you make a contribution and open a new pull request, the CI checks whether your contribution is REUSE compliant 
using the [reuse CLI tool](https://github.com/fsfe/reuse-tool).

In order to validate REUSE compliance in your local development environment, you have to install the
[reuse CLI tool](https://github.com/fsfe/reuse-tool) and run the following command in the projects' root folder:

```bash
reuse lint
```

You can also set up a pre-commit hook, so the above command is run before each commit.
See [here](https://reuse.readthedocs.io/en/latest/readme.html#run-as-pre-commit-hook) for details on how to set it up.

## How to hide `*.license` files in IDEs

During development, the file explorer of your IDE may be cluttered due to the numerous `*.license` files in the 
project. Luckily, most IDEs allow hiding certain files, e.g. by specifying a pattern to exclude them from the 
explorer.

Below, you can find instructions on how to hide `*.license` files in commonly used IDEs:
- **Visual Studio Code**: Add `**/*.license` to the
[`files.exclude` setting](https://code.visualstudio.com/docs/getstarted/userinterface#_explorer) 
- **WebStorm**: Add `*.license` to the
[excluded files setting](https://www.jetbrains.com/help/webstorm/configuring-project-structure.html#exclude-by-pattern)
