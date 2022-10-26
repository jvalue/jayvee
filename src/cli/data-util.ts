export function getColumn<T, D>(
  data: T[][],
  index: number,
  defaultValue: D,
): Array<T | D> {
  return data.map((x) => {
    return x[index] !== undefined ? (x[index] as T) : defaultValue;
  });
}
