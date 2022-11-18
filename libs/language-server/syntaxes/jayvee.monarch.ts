// Monarch syntax highlighting for the jayvee language.
export default {
    keywords: [
        'block','boolean','column','CSVFileExtractor','database','decimal','from','header','host','integer','layout','LayoutValidator','oftype','password','pipe','pipeline','port','PostgresLoader','requires','row','table','text','to','url','username'
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
