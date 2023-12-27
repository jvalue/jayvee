---
sidebar_position: 2
title: Update Jayvee
---

# How to update Jayvee

Jayvee is consistently getting updates. To ensure you use the most recent version, please regularly update the interpreter and VSCode extension.

### Update Jayvee + Extension

To update Jayvee, you need to:

1. Update the interpreter by reinstalling it using npm:

```bash
npm install -g @jvalue/jayvee-interpreter
```

Note: Updating to a specific version works using the `@`-syntax, e.g., version `0.0.17`:

```bash
npm install -g @jvalue/jayvee-interpreter@0.0.17
```

2. Update your VSCode Extension:

- Go [here](https://github.com/jvalue/jayvee/releases/latest) to find the latest(or a specific) version of the VSCode Extenstion.

- Then, download the latest `jayvee.vsix` file.

- Finally, to install the extension using the CLI, paste the code below into your command line:

```bash
code --install-extension jayvee.vsix
```

If you'd rather use the manual installation, follow this [link](https://code.visualstudio.com/docs/editor/extension-marketplace#_install-from-a-vsix) for the official VSCode documentation.

### Version Check

To verify wether the wanted version of Jayvee and VSCode extension where installed successfully, you can run in your command line:

For **Jayvee**:

```bash
jv -V
```

For the **VSCode extension**:

Go to the extensions menu, and look for `Jayvee`. The version is then displayed on the information page of the extension.
