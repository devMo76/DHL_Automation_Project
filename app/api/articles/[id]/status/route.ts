import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["reviewed"],
  reviewed: ["published", "draft"],
  published: ["draft"],
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check user role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const body = await request.json();
    const { newStatus, note } = body;

    const { data: article } = await supabase
      .from("knowledge_articles")
      .select("status")
      .eq("id", id)
      .single();

    if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Only reviewer/admin can publish
    if (newStatus === "published" && profile?.role === "editor") {
      return NextResponse.json(
        { error: "Only reviewers and admins can publish articles" },
        { status: 403 }
      );
    }

    // Only reviewer/admin can mark as reviewed
    if (newStatus === "reviewed" && profile?.role === "editor") {
      return NextResponse.json(
        { error: "Only reviewers and admins can review articles" },
        { status: 403 }
      );
    }

    const allowed = VALID_TRANSITIONS[article.status];
    if (!allowed?.includes(newStatus)) {
      return NextResponse.json(
        { error: `Cannot transition from "${article.status}" to "${newStatus}"` },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("knowledge_articles")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    await supabase.from("status_history").insert({
      article_id: id,
      old_status: article.status,
      new_status: newStatus,
      changed_by: user.id,
      note: note || null,
    });

    return NextResponse.json({ success: true, oldStatus: article.status, newStatus });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
