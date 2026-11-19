import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { checkDuplicate } from "./checker";

function exactQuery(data: unknown) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    limit: vi.fn(),
    single: vi.fn().mockResolvedValue({ data }),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  return query;
}

function similarQuery(data: unknown[]) {
  const query = {
    select: vi.fn(),
    textSearch: vi.fn(),
    limit: vi.fn().mockResolvedValue({ data }),
  };
  query.select.mockReturnValue(query);
  query.textSearch.mockReturnValue(query);
  return query;
}

describe("checkDuplicate", () => {
  it("returns the linked article for an exact content hash match", async () => {
    const exact = exactQuery({
      id: "document-1",
      knowledge_articles: [{ id: "article-1", title: "Reset password" }],
    });
    const from = vi.fn().mockReturnValue(exact);

    const result = await checkDuplicate(
      { from } as unknown as SupabaseClient,
      "hash-1",
      "Reset password",
    );

    expect(result).toEqual({
      isDuplicate: true,
      matchType: "exact",
      matchedArticleId: "article-1",
      matchedTitle: "Reset password",
    });
    expect(from).toHaveBeenCalledTimes(1);
  });

  it("falls back to a title similarity search using meaningful words", async () => {
    const exact = exactQuery(null);
    const similar = similarQuery([{ id: "article-2", title: "Reset account" }]);
    const from = vi
      .fn()
      .mockReturnValueOnce(exact)
      .mockReturnValueOnce(similar);

    const result = await checkDuplicate(
      { from } as unknown as SupabaseClient,
      "hash-2",
      "Reset an account password now",
    );

    expect(similar.textSearch).toHaveBeenCalledWith(
      "title",
      "reset & account & password",
      { type: "websearch" },
    );
    expect(result.matchType).toBe("similar");
  });

  it("skips title search when no word is at least four characters", async () => {
    const exact = exactQuery(null);
    const from = vi.fn().mockReturnValue(exact);

    const result = await checkDuplicate(
      { from } as unknown as SupabaseClient,
      "hash-3",
      "a to the",
    );

    expect(from).toHaveBeenCalledTimes(1);
    expect(result.isDuplicate).toBe(false);
  });

  it("returns a non-match when both lookups are empty", async () => {
    const from = vi
      .fn()
      .mockReturnValueOnce(exactQuery(null))
      .mockReturnValueOnce(similarQuery([]));

    await expect(
      checkDuplicate(
        { from } as unknown as SupabaseClient,
        "hash-4",
        "Customs clearance process",
      ),
    ).resolves.toEqual({
      isDuplicate: false,
      matchType: null,
      matchedArticleId: null,
      matchedTitle: null,
    });
  });
});
