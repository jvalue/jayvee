export function getColumn<T, D>(
  data: T[][],
  index: number,
  defaultValue: D,
): Array<T | D> {
  return data.map((x) => {
    return x[index] !== undefined ? (x[index] as T) : defaultValue;
  });
}

export function getColumnIndexFromSelector(selector: string): number {
  if (!selector.match(/[A-Z,a-z]{1}/)) {
    throw Error(`Invalid column selector: ${selector}`);
  }
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
  return alphabet.indexOf(selector.toLowerCase());
}
