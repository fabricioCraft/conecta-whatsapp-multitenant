declare module 'next/navigation' {
  export function redirect(url: string): never;
}

declare module 'next/headers' {
  export function cookies(): any;
}
