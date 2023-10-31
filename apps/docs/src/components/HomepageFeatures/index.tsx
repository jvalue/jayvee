// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';
import { useBaseUrlUtils } from '@docusaurus/useBaseUrl';

import { type FeatureItem, Features } from '../../data/features';

function Feature(feature: FeatureItem) {
  const {withBaseUrl} = useBaseUrlUtils();

  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
      <img
        className={styles.featureImage}
        alt={feature.title}
        src={withBaseUrl(feature.image.src)}
        width={Math.floor(feature.image.width)}
        height={Math.floor(feature.image.height)}
        loading="lazy"
      />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{feature.title}</h3>
        <div>{feature.description}</div>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <h2 className='text--center'>Main Features</h2>
        <div className="row">
          {Features.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
