/*
 * SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

export interface FeatureItem {
  title: string;
  image: {
    src: string;
    height: number;
    width: number;
  };
  description: JSX.Element;
}

export const Features: FeatureItem[] = [
  {
    title: 'Focused',
    description: (
      <p>
        Jayvee is a <b>DSL</b> (domain-specific language){' '}
        <b>tailored for data engineering</b>.
      </p>
    ),
    image: {
      src: '/img/features/focus.svg',
      width: 100,
      height: 100,
    },
  },
  {
    title: 'Text-based',
    description: (
      <p>
        Jayvee's text-based syntax allows <b>reuse</b> of existing{' '}
        <b>collaboration infrastructure</b> from open source software
        development.
      </p>
    ),
    image: {
      src: '/img/features/text.svg',
      width: 100,
      height: 100,
    },
  },
  {
    title: 'Open',
    description: (
      <p>
        Jayvee is open for extension (<b>no vendor lock-in</b>) with a{' '}
        <b>fast innovation in tools</b>.
      </p>
    ),
    image: {
      src: '/img/features/open.svg',
      width: 100,
      height: 100,
    },
  },
  {
    title: 'Accessible',
    description: (
      <p>
        Jayvee enables <b>collaboration with subject matter experts</b> that
        might not be professional programmers.
      </p>
    ),
    image: {
      src: '/img/features/accessible.svg',
      width: 100,
      height: 100,
    },
  },
  {
    title: 'Maintainable',
    description: (
      <p>
        Jayvee passes on hidden magic to make the{' '}
        <b>code more self-explaining</b>.
      </p>
    ),
    image: {
      src: '/img/features/maintainable.svg',
      width: 100,
      height: 100,
    },
  },
  {
    title: 'Empirical Design',
    description: (
      <p>
        The design of Jayvee is <b>validated with scientific methods</b> like
        surveys and controlled experiments instead of relying on gut feeling.
      </p>
    ),
    image: {
      src: '/img/features/research.svg',
      width: 100,
      height: 100,
    },
  },
];
