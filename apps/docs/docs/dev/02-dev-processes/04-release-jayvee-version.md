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
2. Generate the docs by `npx nx run docs:generate`.
3. Create a docs version with `npx docusaurus docs:version <version-number>`.
4. Delete all `.gitignore` files in the created versioned docs under `apps/docs/versioned_docs/version-0.0.<version>` to check-in the generated files.
5. If you are on a feature or dev branch, merge into main.
6. Create a GitHub release on the main branch. Attach a changelog.
7. The CI/CD will deal with the rest.
