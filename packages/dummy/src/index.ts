/**
 * @todo/dummy - Minimal dummy package for development and testing
 */

export const DUMMY_PACKAGE_NAME = '@todo/dummy' as const;

export function greet(name: string): string {
  return `Hello, ${name}!`;
}
