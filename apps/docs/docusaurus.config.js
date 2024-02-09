// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
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
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
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
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
