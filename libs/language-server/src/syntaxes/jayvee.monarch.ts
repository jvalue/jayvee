// Monarch syntax highlighting for the jayvee language.
export default {
  keywords: [
    'block',
    'boolean',
    'cell',
    'column',
    'decimal',
    'from',
    'header',
    'integer',
    'layout',
    'oftype',
    'pipe',
    'pipeline',
    'range',
    'requires',
    'row',
    'text',
    'to',
  ],
  operators: [',', ';', ':', '*'],
  symbols: /,|;|:|\[|\]|\{|\}|\*/,

  tokenizer: {
    initial: [
      { regex: /([A-Z]+|\*)([0-9]+|\*)/, action: { token: 'CELL_ID' } },
      {
        regex: /[_a-zA-Z][\w_]*/,
        action: {
          cases: {
            '@keywords': { token: 'keyword' },
            '@default': { token: 'ID' },
          },
        },
      },
      { regex: /[0-9]+/, action: { token: 'number' } },
      { regex: /"[^"]*"|'[^']*'/, action: { token: 'string' } },
      { include: '@whitespace' },
      {
        regex: /@symbols/,
        action: {
          cases: {
            '@operators': { token: 'operator' },
            '@default': { token: '' },
          },
        },
      },
    ],
    whitespace: [
      { regex: /\s+/, action: { token: 'white' } },
      { regex: /\/\/[^\n\r]*/, action: { token: 'comment' } },
    ],
    comment: [],
  },
};
