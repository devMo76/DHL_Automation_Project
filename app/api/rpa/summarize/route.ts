import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Missing document id" },
        { status: 400 },
      );
    }

    const { data: document, error: fetchError } = await supabase
      .from("rpa_extracted_documents")
      .select("id, file_name, extracted_text, extraction_status")
      .eq("id", id)
      .single();

    if (fetchError || !document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    if (document.extraction_status !== "success") {
      return NextResponse.json(
        { error: "Cannot summarize failed extraction" },
        { status: 400 },
      );
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
Summarize this extracted document text.

Return the answer in this format:

Suggested Title:
...

Short Summary:
...

Key Points:
- ...
- ...
- ...
- ...
- ...

Document text:
${document.extracted_text}
      `,
    });

    const summary = response.text || "";

    const { error: updateError } = await supabase
      .from("rpa_extracted_documents")
      .update({
        ai_summary: summary,
        ai_summary_status: "completed",
        summarized_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
