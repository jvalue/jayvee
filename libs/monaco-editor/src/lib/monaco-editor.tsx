import React from 'react';

import styles from './monaco-editor.module.scss';

/* eslint-disable-next-line */
export interface MonacoEditorProps {}

export const MonacoEditor: React.FC = (props: MonacoEditorProps) => {
  return (
    <div className={styles.container}>
      <h1>Welcome to MonacoEditor!</h1>
    </div>
  );
};
