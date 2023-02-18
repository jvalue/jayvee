// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Jayvee',
  tagline: 'Data engineering made easy',
  url: 'https://jvalue.github.io',
  baseUrl: '/jayvee/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'jvalue', // Usually your GitHub org/user name.
  projectName: 'jayvee', // Usually your repo name.

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
        logo: {
          alt: 'Jayvee logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'doc',
            docId: 'intro',
            position: 'left',
            label: 'User Docs',
          },
          {
            href: 'https://github.com/jvalue/jayvee',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'User Docs',
            items: [
              {
                label: 'Introduction to Jayvee',
                to: '/docs/intro',
              },
            ],
          },
          {
            title: 'Developer Docs',
            items: [
              
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/jvalue/jayvee',
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
