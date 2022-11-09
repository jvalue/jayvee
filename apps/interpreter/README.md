# Interpreter

## Run the interpreter locally

Build the interpreter:

```console
npx nx run interpreter:build
```

See [Usage](#usage) for how to use the interpreter. Replace `jv` with `node dist/apps/interpreter/main.js` when running the commands.

## Global installation

The interpreter is published as a private npm package with scope `@jvalue` and registry `https://npm.pkg.github.com`.
In order to install the package, you need to set up your authentication first.

### Authentication

Choose one of the following two ways for setting up the authentication. Both require a personal access token with the permission `read:packages`. Such a token can be generated on the [personal access token page of your GitHub developer settings](https://github.com/settings/tokens). Make sure to replace `PERSONAL-ACCESS-TOKEN` with your token in the following commands.

#### Modify the local npm config

```console
npm config set //npm.pkg.github.com/:_authToken=PERSONAL-ACCESS-TOKEN
npm config set @jvalue:registry=https://npm.pkg.github.com
```

#### Log in to the GitHub package registry

```console
npm login --scope=@jvalue --registry=https://npm.pkg.github.com

> Username: GITHUB-USERNAME
> Password: PERSONAL-ACCESS-TOKEN
> Email: GITHUB-PUBLIC-EMAIL-ADDRESS
```

See [here](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-with-a-personal-access-token) for more details.

### Actual installation

```console
npm i -g @jvalue/interpreter
```

See [Usage](#usage) for how to use the interpreter.

## Usage

### Run a `.jv` file

```console
jv <file>
```

### Show help

```console
jv -h
```

## Important project files

- `package.json` - used for publishing the interpreter as npm package.
- `src/index.ts` - the entry point of the command line interface (CLI).
