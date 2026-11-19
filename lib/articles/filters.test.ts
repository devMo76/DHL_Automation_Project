import { describe, expect, it } from "vitest";
import { articleFiltersSchema } from "./filters";

describe("articleFiltersSchema", () => {
  it("applies empty defaults and trims text filters", () => {
    const result = articleFiltersSchema.parse({ search: "  customs  " });

    expect(result).toEqual({
      search: "customs",
      status: "",
      tag: "",
      creatorId: "",
      from: "",
      to: "",
    });
  });

  it("accepts supported statuses, UUIDs, and dates", () => {
    const result = articleFiltersSchema.safeParse({
      status: "published",
      creatorId: "8d70d82f-dac3-4b9c-96aa-3d3daac07b1a",
      from: "2026-01-01",
      to: "2026-01-31",
    });

    expect(result.success).toBe(true);
  });

  it("rejects unsupported statuses and malformed UUIDs", () => {
    expect(
      articleFiltersSchema.safeParse({
        status: "archived",
        creatorId: "not-a-uuid",
      }).success,
    ).toBe(false);
  });

  it("rejects oversized text and invalid dates", () => {
    expect(
      articleFiltersSchema.safeParse({
        search: "x".repeat(101),
        tag: "x".repeat(51),
        from: "not-a-date",
      }).success,
    ).toBe(false);
  });
});
