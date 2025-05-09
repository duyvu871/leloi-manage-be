export async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function delayFn<T extends (...args: any[]) => any>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>) => {
    await delay(ms);
    return fn(...args);
  };
}
