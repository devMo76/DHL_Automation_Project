import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!UUID_PATTERN.test(id)) {
      return NextResponse.json(
        { error: "Invalid document id" },
        { status: 400 },
      );
    }

    const authSupabase = await createClient();

    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await authSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const serviceSupabase = createAdminClient();
    const { data: deletedDocument, error: deleteError } = await serviceSupabase
      .from("rpa_extracted_documents")
      .delete()
      .eq("id", id)
      .select("id")
      .single();

    if (deleteError || !deletedDocument) {
      if (deleteError?.code === "PGRST116") {
        return NextResponse.json(
          { error: "Document not found" },
          { status: 404 },
        );
      }

      return NextResponse.json(
        { error: deleteError?.message || "Could not delete document" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, id: deletedDocument.id });
  } catch (error) {
    console.error("RPA DELETE ERROR:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
