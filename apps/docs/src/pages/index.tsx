// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';

import MascotImageUrl from '@site/static/img/mascots/mascot1.png';

import styles from './index.module.css';

function HomepageHeader() {
  return (
    <div>
      <TitleBanner />
    </div>
  );
}

function TitleBanner(): JSX.Element {
  return (
    <header className={clsx('hero hero--primary', styles.titleBanner)}>
      <div className="container">
        <div className={styles.titleBannerTitle}>
          🥳
          <span className={styles.titleBannerTitleText}>
            <b>Jayvee's</b> Alpha is now available!
          </span>
          🎉
        </div>

        <div className={styles.titleBannerTagline}>
          A <b>domain-specific language</b> for everyone to <b>participate</b>{' '}
          in building <b>data pipelines</b>!
        </div>

        <div className={styles.titleBannerButtons}>
          <span className="mascot-container">
            <img src={MascotImageUrl} width="120px" />
          </span>
          <Link className="button button--primary" to="/docs/user/intro">
            Get Started
          </Link>
          <Link className="button button--info" to="/docs/user/examples/cars">
            Example
          </Link>
          <span className={styles.titleBannerButtonsGitHubButtonWrapper}>
            <iframe
              className={styles.titleBannerButtonsGitHubButton}
              src="https://ghbtns.com/github-btn.html?user=jvalue&amp;repo=jayvee&amp;type=star&amp;count=true&amp;size=large"
              width={160}
              height={30}
              title="GitHub Stars"
            />
          </span>
        </div>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Jayvee - Data Engineering made easy!"
    >
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
