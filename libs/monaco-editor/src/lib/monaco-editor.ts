// SPDX-FileCopyrightText: 2024 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import tmGrammar from './jayvee.tmLanguage.json';
import config from './language-configuration.json';

export function getTextMateGrammar(): unknown {
  return tmGrammar;
}

export function getLanguageConfiguration(): unknown {
  return config;
}
