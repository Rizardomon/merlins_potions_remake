import { vi } from "vitest";

export function createLocalStorageMock() {
  let store: Record<string, string> = {};

  const mock = {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };

  return mock;
}

export function installLocalStorageMock() {
  const mock = createLocalStorageMock();
  Object.defineProperty(globalThis, "localStorage", {
    value: mock,
    writable: true,
  });
  return mock;
}
