---
sidebar_position: 1
---

# Introduction to Jayvee

Jayvee is a domain-specific language (DSL) for data engineering - the cleaning and preprocessing of data for later activities like data science or machine learning. You can use Jayvee to **model an ETL pipeline** and the command-line interpreter to **run the ETL pipeline** on your local machine. 

## Installation

Install the interpreter via `npm`. You will need a **nodejs version >= 17.0.0**.

```bash
npm install -g @jvalue/jayvee-interpreter
```

You can install a specific version using the `@`-syntax, e.g., version `0.0.16`:
```bash
npm install -g @jvalue/jayvee-interpreter@0.0.16
```

## Update

Updating the interpreter is done by reinstalling it using `npm`. Make sure to also update the [VSCode plugin](#vscode-plugin) to match the installed interpreter if you use it.

```bash
npm install -g @jvalue/jayvee-interpreter
```

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

With runtime parameters:

```console
jv -e <param>=<value> -e <param>=<value> ... <file>
```

## Examples

You can find multiple examples [here](https://github.com/jvalue/jayvee/tree/main/example). Copy them to your local file system and execute them with the `jv` command on your command line (see [usage](#usage)).


## VSCode Plugin

To set up Jayvee locally in VS Code, you need to install the latest Jayvee VS Code extension.
To install the most recent extension, go to our [latest release](https://github.com/jvalue/jayvee/releases/latest) 
and download the `jayvee.vsix` file from the release assets.
Next, go to [this page](https://code.visualstudio.com/docs/editor/extension-marketplace#_install-from-a-vsix) and 
follow the instructions for installing the downloaded extension.

## Troubleshooting

1. Error `structuredClone is not defined`
    * Please make sure you use node version 17+.
