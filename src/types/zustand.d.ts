declare module 'zustand' {
  export function create<T>(
    createState: (set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void) => T
  ): (selector?: (state: T) => any) => T;
} 