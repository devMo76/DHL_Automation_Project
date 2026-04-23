import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: article, error } = await supabase
      .from("knowledge_articles")
      .select("*, article_steps(*, id, step_number, step_text), article_tags(id, tag_name), profiles!knowledge_articles_creator_id_fkey(full_name)")
      .eq("id", id)
      .order("step_number", { referencedTable: "article_steps" })
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 404 });

    return NextResponse.json(article);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { title, summary, steps, tags, changeNote } = body;

    const { data: existing } = await supabase
      .from("knowledge_articles")
      .select("*")
      .eq("id", id)
      .single();

    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const newVersion = existing.current_version_number + 1;

    // Update article
    const { error: updateError } = await supabase
      .from("knowledge_articles")
      .update({
        title,
        summary,
        current_version_number: newVersion,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    // Replace steps
    if (steps) {
      await supabase.from("article_steps").delete().eq("article_id", id);
      const stepsData = steps.map((text: string, i: number) => ({
        article_id: id,
        step_number: i + 1,
        step_text: text,
      }));
      await supabase.from("article_steps").insert(stepsData);
    }

    // Replace tags
    if (tags) {
      await supabase.from("article_tags").delete().eq("article_id", id);
      const tagsData = tags.map((tag: string) => ({
        article_id: id,
        tag_name: tag,
      }));
      await supabase.from("article_tags").insert(tagsData);
    }

    // Save version snapshot
    await supabase.from("article_versions").insert({
      article_id: id,
      version_number: newVersion,
      title,
      summary,
      status_at_that_time: existing.status,
      edited_by: user.id,
      change_note: changeNote || "Manual edit",
      snapshot_json: { title, summary, steps, tags },
    });

    return NextResponse.json({ success: true, version: newVersion });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
