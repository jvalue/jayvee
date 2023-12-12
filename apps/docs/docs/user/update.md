# How to update Jayvee

Jayvee is constently getting **updates** as a dedicated team of developers diligently addresses **performance issues** and incorporates **new features** to meet the evolving needs of its user base.

### Update Jayvee the right way.

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

- Finally, open your Command Prompt(terminal), and paste the code below:

```bash
code --install-extension jayvee.vsix
```

For manual installation, follow this [link](https://code.visualstudio.com/docs/editor/extension-marketplace#_install-from-a-vsix) for the official VSCode documentation.

### Version Checks.

To verify wether the wanted version of Jayvee and VSCode extension where installed successfully, you can run in your Command Prompt(terminal):

For **Jayvee**:

```bash
jv -V
```

For the **VSCode extension**:

In VSCode: Go to the extensions menu, and look for `Jayvee`. The version is then displayed on the information page of the extension.
