/**
 * Decorator for classes, so they need to implement a given interface using static members / functions.
 *
 * @example
 * interface SampleInterface {
 *     a: string
 *     foo(): void;
 * }
 * @implementsStatic<SampleInterface>()
 * class SampleClass {
 *     static a: string = 'A';
 *     static foo(): void {
 *         return;
 *     }
 * }
 */
export function implementsStatic<T>() {
  return <U extends T>(constructor: U) => {
    constructor;
  };
}
