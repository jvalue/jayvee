// Monarch syntax highlighting for the open-data-language language.
export default {
    keywords: [
        'block','boolean','column','CSVFileExtractor','decimal','from','header','integer','layout','LayoutValidator','oftype','pipe','PostgresLoader','row','text','to','url'
    ],
    operators: [
        ';',':'
    ],
    symbols:  /;|:|\{|\}/,

    tokenizer: {
        initial: [
            { regex: /[_a-zA-Z][\w_]*/, action: { cases: { '@keywords': {"token":"keyword"}, '@default': {"token":"ID"} }} },
            { regex: /[0-9]+/, action: {"token":"number"} },
            { regex: /"[^"]*"|'[^']*'/, action: {"token":"string"} },
            { include: '@whitespace' },
            { regex: /@symbols/, action: { cases: { '@operators': {"token":"operator"}, '@default': {"token":""} }} },
        ],
        whitespace: [
            { regex: /\s+/, action: {"token":"white"} },
            { regex: /\/\/[^\n\r]*/, action: {"token":"comment"} },
        ],
        comment: [
        ],
    }
};
