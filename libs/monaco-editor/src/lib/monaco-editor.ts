import tmGrammar from './generated/jayvee.tmLanguage.json';

export function textMateGrammar(): string {
  return JSON.stringify(tmGrammar);
}
