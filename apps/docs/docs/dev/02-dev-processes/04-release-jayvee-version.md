---
title: Releasing a new Jayvee version
sidebar_position: 4
---

## Version Numbers

In this early stage of the project we do not yet follow [semantic versioning](https://semver.org/) since we expect the introduction of breaking changes frequently.
To indicate that, we only release alpha versions where the `version` is incremented with every release.
- For the npm packages, we use the version `0.0.<version>`.
- For the GitHub releases, we use the git tag `v0.0.<version>-alpha`.

## Jayvee Release Procedure

For releasing a new version of Jayvee, you need to complete the following steps:

1. Increment the version in the `package.json` file.
2. Run `npm i` to update the `package-lock.json`.
3. Run `npx nx run docs:version-snapshot` to generate a snapshot of the docs for the previous version.
4. If you are on a feature or dev branch, merge into main.
5. Create a GitHub release on the main branch. Attach a changelog.
6. The CI/CD will deal with the rest.
