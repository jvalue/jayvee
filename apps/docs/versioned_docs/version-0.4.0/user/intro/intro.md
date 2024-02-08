---
sidebar_position: 1
title: Getting Started
---

# Introduction to Jayvee

Jayvee is a domain-specific language (DSL) for automated processing of data pipelines.
The Jayvee interpreter allows executing such data pipelines on local machines.
Data engineers can use Jayvee and its interpreter to clean and preprocess data for later activities like data science or machine learning.

## Installation

Install the interpreter via `npm`. You will need a **nodejs version >= 17.0.0**.

```bash
npm install -g @jvalue/jayvee-interpreter
```

You can install a specific version using the `@`-syntax, e.g., version `0.0.17`:

```bash
npm install -g @jvalue/jayvee-interpreter@0.0.17
```

## Update

Details about how to update Jayvee and the VSCode extension can be found [here](./update.md).

## Usage

### Show help

```console
jv -h
```

### Run a `.jv` file

```console
jv <file>
```

Run with **additional debug output**:

```console
jv <file> -d
```

With **runtime parameters**:

```console
jv -e <param>=<value> -e <param>=<value> ... <file>
```

### Debug a `.jv` file

Print debugging is further configured by the parameters `--debug-granularity` and `--debug-target`.

```console
jv <file> -d -dg peek
```

The value of the parameter `--debug-granularity` (short `-dg`) can have the following values:

- `peek` to log a short summary, including a small subset of data
- `exhaustive` to log a summary, including the full data
- `minimal` to log a summary, including no additional data (default).
  To see logs, debugging has to be enabled using the `-d` flag.

```console
jv <file> -d --debug-granularity peek
```

The parameter `--debug-target` (short `-dt`) allows to specify which blocks should be logged for debugging. Separate block names by comma if multiple blocks are targeted. All blocks are logged if the parameter is omitted.

```console
jv <file> -d --debug-granularity peek --debug-target MyExtractorBlock,MySinkBlock
```

## Examples

You can find multiple examples with inline explanations [here](../examples/README.mdx). You can copy them to your local file system and execute them with the `jv` command on your command line (see [usage](#usage)).

## VSCode Plugin

To set up Jayvee locally in VS Code, you need to install the latest Jayvee VS Code extension.
To install the most recent extension, go to our [latest release](https://github.com/jvalue/jayvee/releases/latest)
and download the `jayvee.vsix` file from the release assets.
Next, go to [this page](https://code.visualstudio.com/docs/editor/extension-marketplace#_install-from-a-vsix) and
follow the instructions for installing the downloaded extension.

## Troubleshooting

1. Error `structuredClone is not defined`
   - Please make sure you use node version 17+.
