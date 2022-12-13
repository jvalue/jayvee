import styles from './monaco-editor.module.scss';

/* eslint-disable-next-line */
export interface MonacoEditorProps {}

export function MonacoEditor(props: MonacoEditorProps) {
  return (
    <div className={styles['container']}>
      <h1>Welcome to MonacoEditor!</h1>
    </div>
  );
}

export default MonacoEditor;
