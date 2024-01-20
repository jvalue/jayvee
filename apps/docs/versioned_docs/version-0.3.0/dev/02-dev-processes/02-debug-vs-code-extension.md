---
title: Debugging via the VS Code extension
sidebar_position: 2
---

The VS Code extension of Jayvee can be used to interactively debug the language server.
During development, when using VS Code as IDE, another instance of VS Code can be opened which has the most recent, locally built VS Code extension loaded.
This can be achieved using the launch configuration `Run extension` the `Run and Debug` side-menu of VS Code or by pressing the `F5` key if that launch configuration is already selected there.

Note that there is no file watching mechanism involved.
So in order to reflect changes to the source code, the additional VS Code instance has to be **closed and reopened** as described above.

## How to attach a debugger

1. Use the launch configuration `Run extension` to open the additional VS Code instance with the extension loaded
2. Use the launch configuration `Attach to Language Server` to attach the debugger

Any set breakpoints should now be marked as active and pause the execution once they are reached.

## How to view logs of the language server

In the additional VS Code instance, it is possible to view the logs of the language server.
They might also be helpful for debugging since any uncaught errors are logged with their stack trace by the Langium framework.

To view the logs, open the bottom panel called `Output` and select `Jayvee` in the dropdown menu.
