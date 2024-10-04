import tmGrammar from './jayvee.tmLanguage.json';
import config from './language-configuration.json';

export function getTextMateGrammar(): unknown {
  return tmGrammar;
}

export function getLanguageConfiguration(): unknown {
  return config;
}
