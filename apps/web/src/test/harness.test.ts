import { describe, it, expect, beforeEach } from "vitest";
import { createLocalStorageMock, installLocalStorageMock } from "./local-storage-mock";

describe("harness smoke test", () => {
  it("1 + 1 === 2", () => {
    expect(1 + 1).toBe(2);
  });

  it("window and document are available (happy-dom)", () => {
    expect(typeof window).toBe("object");
    expect(typeof document).toBe("object");
  });
});

describe("createLocalStorageMock", () => {
  let storage: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    storage = createLocalStorageMock();
  });

  it("getItem returns null for missing key", () => {
    expect(storage.getItem("missing")).toBeNull();
  });

  it("setItem + getItem round-trips a value", () => {
    storage.setItem("key", "value");
    expect(storage.getItem("key")).toBe("value");
  });

  it("clear removes all entries", () => {
    storage.setItem("a", "1");
    storage.setItem("b", "2");
    storage.clear();
    expect(storage.getItem("a")).toBeNull();
    expect(storage.getItem("b")).toBeNull();
    expect(storage.length).toBe(0);
  });

  it("removeItem deletes one key", () => {
    storage.setItem("a", "1");
    storage.setItem("b", "2");
    storage.removeItem("a");
    expect(storage.getItem("a")).toBeNull();
    expect(storage.getItem("b")).toBe("2");
  });
});

describe("installLocalStorageMock", () => {
  it("replaces globalThis.localStorage", () => {
    const mock = installLocalStorageMock();
    globalThis.localStorage.setItem("x", "42");
    expect(mock.setItem).toHaveBeenCalledWith("x", "42");
    expect(globalThis.localStorage.getItem("x")).toBe("42");
  });
});
