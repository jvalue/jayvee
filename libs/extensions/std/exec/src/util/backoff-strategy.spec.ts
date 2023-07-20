// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BackoffStrategy,
  ExponentialBackoffStrategy,
  LinearBackoffStrategy,
} from './backoff-strategy';

describe('BackoffStrategy', () => {
  describe('ExponentialBackoffStrategy', () => {
    describe('getBackoffMilliseconds', () => {
      it('should calculate exponential backoff correctly with 5 retries', () => {
        const backoffStrategy: BackoffStrategy = new ExponentialBackoffStrategy(
          2,
        );

        expect(backoffStrategy.getBackoffMilliseconds(1)).toEqual(2);
        expect(backoffStrategy.getBackoffMilliseconds(2)).toEqual(4);
        expect(backoffStrategy.getBackoffMilliseconds(3)).toEqual(8);
        expect(backoffStrategy.getBackoffMilliseconds(4)).toEqual(16);
        expect(backoffStrategy.getBackoffMilliseconds(5)).toEqual(32);
      });
    });
  });

  describe('LinearBackoffStrategy', () => {
    describe('getNextBackoffMilliseconds', () => {
      it('should calculate exponential backoff correctly with 5 retries', () => {
        const backoffStrategy: BackoffStrategy = new LinearBackoffStrategy(2);

        expect(backoffStrategy.getBackoffMilliseconds(1)).toEqual(2);
        expect(backoffStrategy.getBackoffMilliseconds(2)).toEqual(2);
        expect(backoffStrategy.getBackoffMilliseconds(3)).toEqual(2);
        expect(backoffStrategy.getBackoffMilliseconds(4)).toEqual(2);
        expect(backoffStrategy.getBackoffMilliseconds(5)).toEqual(2);
      });
    });
  });
});
