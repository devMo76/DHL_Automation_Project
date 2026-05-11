"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type RpaDocument = {
  id: string;
  file_name: string | null;
  file_type: string | null;
  extraction_status: string | null;
  extracted_text: string | null;
  error_message: string | null;
  ai_summary: string | null;
  ai_summary_status: string | null;
  extracted_at: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "No timestamp";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function ExtractionStatusBadge({ status }: { status: string | null }) {
  if (status === "success") {
    return (
      <Badge className="bg-green-50 text-green-700 ring-1 ring-green-600/20 hover:bg-green-50">
        <CheckCircle2 className="h-3 w-3" />
        Success
      </Badge>
    );
  }

  if (status === "failed") {
    return (
      <Badge
        variant="destructive"
        className="bg-red-50 text-red-700 ring-1 ring-red-600/20"
      >
        <AlertCircle className="h-3 w-3" />
        Failed
      </Badge>
    );
  }

  return (
    <Badge variant="secondary">
      <Clock className="h-3 w-3" />
      {status || "Pending"}
    </Badge>
  );
}

function SummaryStatusBadge({
  summary,
  status,
}: {
  summary: string | null;
  status: string | null;
}) {
  if (summary) {
    return (
      <Badge className="bg-[#FFCC00]/25 text-foreground ring-1 ring-[#FFCC00]/60 hover:bg-[#FFCC00]/25">
        <Sparkles className="h-3 w-3" />
        Summarized
      </Badge>
    );
  }

  return <Badge variant="outline">{status || "No summary"}</Badge>;
}

export default function RpaResultsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [documents, setDocuments] = useState<RpaDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summarizingId, setSummarizingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const successfulCount = documents.filter(
    (doc) => doc.extraction_status === "success",
  ).length;
  const failedCount = documents.filter(
    (doc) => doc.extraction_status === "failed",
  ).length;
  const summarizedCount = documents.filter((doc) => doc.ai_summary).length;

  const fetchDocuments = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setRefreshing(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("rpa_extracted_documents")
        .select("*")
        .order("extracted_at", { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        toast.error("Could not load RPA results");
      } else {
        setDocuments((data ?? []) as RpaDocument[]);
      }

      if (showRefresh) setRefreshing(false);
    },
    [supabase],
  );

  async function generateSummary(id: string) {
    setSummarizingId(id);

    try {
      const res = await fetch("/api/rpa/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Summary generation failed");
      }

      toast.success("AI summary generated");
      await fetchDocuments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Summary failed");
    } finally {
      setSummarizingId(null);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function loadInitialDocuments() {
      const { data, error: fetchError } = await supabase
        .from("rpa_extracted_documents")
        .select("*")
        .order("extracted_at", { ascending: false });

      if (!mounted) return;

      if (fetchError) {
        setError(fetchError.message);
        toast.error("Could not load RPA results");
      } else {
        setDocuments((data ?? []) as RpaDocument[]);
      }

      setLoading(false);
    }

    void loadInitialDocuments();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardContent className="flex items-center gap-3 py-6">
            <Loader2 className="h-5 w-5 animate-spin text-[#D40511]" />
            <div>
              <p className="font-medium">Loading RPA results</p>
              <p className="text-sm text-muted-foreground">
                Fetching extracted documents
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">RPA Extraction Results</h1>
          <p className="text-muted-foreground">
            Extracted documents from the automation pipeline
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => fetchDocuments(true)}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Successful Extractions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successfulCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              AI Summaries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summarizedCount}</div>
            {failedCount > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                {failedCount} failed extraction{failedCount === 1 ? "" : "s"}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-start gap-3 py-4 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <span>{error}</span>
          </CardContent>
        </Card>
      )}

      {documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <h2 className="font-semibold">No extracted documents found</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              RPA results will appear here after documents are processed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardHeader>
                <div className="min-w-0">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-[#D40511]" />
                    <span className="truncate">
                      {doc.file_name || "Untitled document"}
                    </span>
                  </CardTitle>
                  <CardDescription className="mt-1 flex flex-wrap items-center gap-2">
                    <span>{doc.file_type || "Unknown type"}</span>
                    <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                    <span>{formatDate(doc.extracted_at)}</span>
                  </CardDescription>
                </div>

                <CardAction className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                  <div className="flex flex-wrap justify-end gap-2">
                    <ExtractionStatusBadge status={doc.extraction_status} />
                    <SummaryStatusBadge
                      summary={doc.ai_summary}
                      status={doc.ai_summary_status}
                    />
                  </div>

                  {doc.extraction_status === "success" && (
                    <Button
                      onClick={() => generateSummary(doc.id)}
                      disabled={summarizingId === doc.id}
                      className="bg-[#D40511] text-white hover:bg-[#b5040e]"
                    >
                      {summarizingId === doc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      {summarizingId === doc.id
                        ? "Generating"
                        : doc.ai_summary
                          ? "Regenerate Summary"
                          : "Generate Summary"}
                    </Button>
                  )}
                </CardAction>
              </CardHeader>

              <CardContent className="space-y-4">
                {doc.extraction_status === "failed" && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{doc.error_message || "Extraction failed"}</span>
                  </div>
                )}

                <Separator />

                <div className="grid gap-4 lg:grid-cols-2">
                  <section className="space-y-2">
                    <h3 className="text-sm font-medium">Extracted Text</h3>
                    <div className="h-56 overflow-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                      {doc.extracted_text || "No extracted text"}
                    </div>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-sm font-medium">AI Summary</h3>
                    <div className="h-56 overflow-auto rounded-lg border border-[#FFCC00]/50 bg-[#FFCC00]/10 p-3 text-sm leading-relaxed whitespace-pre-wrap">
                      {doc.ai_summary || "No summary generated yet."}
                    </div>
                  </section>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
