// SPDX-FileCopyrightText: 2025 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import type { Options, ThemeConfig } from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import { themes as prismThemes } from 'prism-react-renderer';

const config: Config = {
  title: 'Jayvee',
  url: 'https://jvalue.github.io',
  baseUrl: '/jayvee',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: '/img/jayvee.png',
  organizationName: 'jvalue', // Usually your GitHub org/user name.
  projectName: 'jayvee', // Usually your repo name.
  themes: ['@docusaurus/theme-mermaid'],
  markdown: {
    mermaid: true,
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Options,
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'Jayvee',
      items: [
        {
          type: 'doc',
          docId: 'user/intro/intro',
          position: 'left',
          label: 'User Docs',
        },
        {
          type: 'doc',
          docId: 'dev/intro',
          position: 'left',
          label: 'Developer Docs',
        },
        {
          type: 'docsVersionDropdown',
          position: 'right',
          dropdownActiveClassDisabled: true,
        },
        {
          href: 'https://github.com/jvalue/jayvee',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub repository',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Learn',
          items: [
            {
              label: 'Installation',
              to: '/docs/user/intro',
            },
            {
              label: 'Core Concepts',
              to: '/docs/user/core-concepts',
            },
            {
              label: 'Examples',
              to: '/docs/user/examples/cars',
            },
            {
              label: 'Start contributing',
              to: '/docs/dev/intro',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/jvalue/jayvee',
            },
            {
              label: 'JValue',
              href: 'https://jvalue.org/',
            },
          ],
        },
        {
          title: 'Legal',
          items: [
            {
              label: 'Imprint',
              href: 'https://jvalue.org/notices/imprint/',
            },
            {
              label: 'Privacy Policy',
              href: 'https://jvalue.org/notices/privacy-policy/',
            },
            {
              label: 'Open Source Notices',
              href: 'https://github.com/jvalue/jayvee/blob/main/NOTICES.md',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Friedrich-Alexander Universität Erlangen-Nürnberg.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies ThemeConfig,

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
};

export default config;
