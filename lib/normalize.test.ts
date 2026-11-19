import { describe, expect, it } from "vitest";
import { hashText, normalizeText } from "./normalize";

describe("normalizeText", () => {
  it("normalizes line endings and repeated blank lines", () => {
    expect(normalizeText("one\r\n\r\n\r\ntwo\rthree")).toBe(
      "one\n\ntwo\nthree",
    );
  });

  it("collapses horizontal whitespace and trims each line", () => {
    expect(normalizeText("  one\t  two  \n  three ")).toBe("one two\nthree");
  });
});

describe("hashText", () => {
  it("is insensitive to text casing", () => {
    expect(hashText("DHL Process")).toBe(hashText("dhl process"));
  });

  it("changes when normalized content changes", () => {
    expect(hashText("first")).not.toBe(hashText("second"));
  });
});
