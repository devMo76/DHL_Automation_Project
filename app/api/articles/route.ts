import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const tag = searchParams.get("tag") || "";

    let query = supabase
      .from("knowledge_articles")
      .select("*, article_tags(tag_name), profiles!knowledge_articles_creator_id_fkey(full_name)")
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    const { data: articles, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let filtered = articles || [];
    if (tag) {
      filtered = filtered.filter((a: Record<string, unknown>) => {
        const tags = a.article_tags as Array<{ tag_name: string }>;
        return tags?.some((t) => t.tag_name.toLowerCase() === tag.toLowerCase());
      });
    }

    return NextResponse.json(filtered);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
