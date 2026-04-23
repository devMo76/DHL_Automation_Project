import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, Upload, CheckCircle, AlertTriangle } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { count: draftCount },
    { count: reviewedCount },
    { count: publishedCount },
    { count: duplicateCount },
  ] = await Promise.all([
    supabase
      .from("knowledge_articles")
      .select("*", { count: "exact", head: true })
      .eq("status", "draft"),
    supabase
      .from("knowledge_articles")
      .select("*", { count: "exact", head: true })
      .eq("status", "reviewed"),
    supabase
      .from("knowledge_articles")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("knowledge_articles")
      .select("*", { count: "exact", head: true })
      .eq("duplicate_flag", true),
  ]);

  const stats = [
    {
      title: "Drafts",
      value: draftCount ?? 0,
      icon: FileText,
      color: "text-orange-500",
    },
    {
      title: "Reviewed",
      value: reviewedCount ?? 0,
      icon: CheckCircle,
      color: "text-blue-500",
    },
    {
      title: "Published",
      value: publishedCount ?? 0,
      icon: Upload,
      color: "text-green-500",
    },
    {
      title: "Duplicates",
      value: duplicateCount ?? 0,
      icon: AlertTriangle,
      color: "text-red-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your knowledge base activity
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Quick actions to manage your knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <a
            href="/dashboard/upload"
            className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
          >
            <Upload className="h-5 w-5 text-[#D40511]" />
            <div>
              <p className="font-medium">Upload Content</p>
              <p className="text-sm text-muted-foreground">
                Upload PDF, DOCX, or paste text
              </p>
            </div>
          </a>
          <a
            href="/dashboard/articles"
            className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
          >
            <FileText className="h-5 w-5 text-[#D40511]" />
            <div>
              <p className="font-medium">Browse Articles</p>
              <p className="text-sm text-muted-foreground">
                Search and manage knowledge articles
              </p>
            </div>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
