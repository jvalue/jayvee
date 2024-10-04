import tmGrammar from './generated/jayvee.tmLanguage.json';
import config from './generated/language-configuration.json';

export function getTextMateGrammar(): string {
  return JSON.stringify(tmGrammar);
}

export function getLanguageConfiguration(): string {
  return JSON.stringify(config);
}
