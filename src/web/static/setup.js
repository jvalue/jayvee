import { MonacoEditorLanguageClientWrapper } from './monaco-editor-wrapper/index.js';
import { buildWorkerDefinition } from "./monaco-editor-workers/index.js";

buildWorkerDefinition('./monaco-editor-workers/workers', new URL('', window.location.href).href, false);

MonacoEditorLanguageClientWrapper.addMonacoStyles('monaco-editor-styles');
MonacoEditorLanguageClientWrapper.addCodiconTtf();

const client = new MonacoEditorLanguageClientWrapper('42');
const editorConfig = client.getEditorConfig();
editorConfig.setMainLanguageId('jayvee');

editorConfig.setMonarchTokensProvider({
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
});

editorConfig.setMainCode(
`block CarsExtractor oftype CSVFileExtractor {
\turl: "https://gist.githubusercontent.com/noamross/e5d3e859aa0c794be10b/raw/b999fb4425b54c63cab088c0ce2c0d6ce961a563/cars.csv";
}

layout CarsLayout {
\theader row 1: text;
\t
\tcolumn A: text;
\tcolumn B: decimal;
\tcolumn C: integer;
\tcolumn D: decimal;
\tcolumn E: integer;
\tcolumn F: decimal;
\tcolumn G: decimal;
\tcolumn H: decimal;
\tcolumn I: integer;
\tcolumn J: integer;
\tcolumn K: integer;
\tcolumn L: integer;
}

block CarsValidator oftype LayoutValidator {
\tlayout: CarsLayout;
}

block CarsLoader oftype PostgresLoader {
}

pipe {
\tfrom: CarsExtractor;
\tto: CarsValidator;
}

pipe {
\tfrom: CarsValidator;
\tto: CarsLoader;
}
`);

editorConfig.theme = 'vs-dark';
editorConfig.useLanguageClient = true;
editorConfig.useWebSocket = false;

const workerURL = new URL('./jayvee-server-worker.js', import.meta.url);
console.log(workerURL.href);

const lsWorker = new Worker(workerURL.href, {
  type: 'classic',
  name: 'LS'
});
client.setWorker(lsWorker);

client.startEditor(document.getElementById("monaco-editor-root"));

window.addEventListener("resize", () => client.updateLayout());