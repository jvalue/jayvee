---
title: Language Design Process (RFCs)
---

We use RFCs to discuss changes to the language before implementing them. You can have a look at all closed (accepted / rejected) RFCs [here](https://github.com/jvalue/jayvee/pulls?q=is%3Apr+is%3Aclosed+RFC+), and all RFCs under discussion [here](https://github.com/jvalue/jayvee/pulls?q=is%3Apr+is%3Aopen+RFC).

If you want to contribute an RFC please follow these steps:
1. Make a copy of the **template** at `rfc/0000-rfc-template.md` and place it into the `rfc` folder.
2. Create a draft for the RFC on a new branch. Follow the `TODOs` in template to do so.
3. Open a pull request with prefix `RFC <number>` in the title.
4. Address the reviews. Consider opening a new PR if major things need to be addressed and the discussion log becomes too confusing.
5. Once accepted, create an issue with the necessary steps to implement the RFC.