import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const articleIdSchema = z.string().uuid();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const idResult = articleIdSchema.safeParse(rawId);
    if (!idResult.success) {
      return NextResponse.json({ error: "Invalid article id" }, { status: 400 });
    }
    const id = idResult.data;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [{ data: versions }, { data: statusHistory }] = await Promise.all([
      supabase
        .from("article_versions")
        .select("*, profiles!article_versions_edited_by_fkey(full_name)")
        .eq("article_id", id)
        .order("version_number", { ascending: false }),
      supabase
        .from("status_history")
        .select("*, profiles!status_history_changed_by_fkey(full_name)")
        .eq("article_id", id)
        .order("changed_at", { ascending: false }),
    ]);

    return NextResponse.json({ versions: versions || [], statusHistory: statusHistory || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
