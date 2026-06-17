"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import type { AnalysisReport, Repository, RepositoryAnalysis } from "@engineerdna/shared";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAnalysis, getRepository, startAnalysis } from "@/services/analysis";

function ReportContent() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [repo, setRepo] = useState<Repository | null>(null);
  const [analysis, setAnalysis] = useState<RepositoryAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    void Promise.all([getRepository(id), getAnalysis(id)]).then(([r, a]) => {
      setRepo(r);
      setAnalysis(a);
      setLoading(false);
    });
  }, [id]);

  // Poll while a job is in flight.
  const isRunning = analysis?.status === "PENDING" || analysis?.status === "RUNNING";
  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      void getAnalysis(id).then((a) => a && setAnalysis(a));
    }, 3000);
    return () => clearInterval(timer);
  }, [isRunning, id]);

  const analyze = useCallback(async () => {
    setStarting(true);
    try {
      setAnalysis(await startAnalysis(id));
    } finally {
      setStarting(false);
    }
  }, [id]);

  if (loading || !repo) return <LoadingScreen label="Loading repository…" />;

  return (
    <main className="mx-auto max-w-3xl space-y-5 px-6 py-8">
      <Link
        href="/repositories"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Repositories
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{repo.name}</h1>
          <p className="text-sm text-muted-foreground">{repo.fullName}</p>
        </div>
        <Button onClick={analyze} disabled={starting || isRunning}>
          <Sparkles className="h-4 w-4" />
          {analysis?.status === "COMPLETED" ? "Re-analyze" : "Analyze"}
        </Button>
      </div>

      {!analysis && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No report yet. Click <span className="font-medium">Analyze</span> to generate an
            engineering report for this repository.
          </CardContent>
        </Card>
      )}

      {isRunning && (
        <Card>
          <CardContent className="flex items-center justify-center gap-3 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Analyzing the repository… this can take up to a minute.
          </CardContent>
        </Card>
      )}

      {analysis?.status === "FAILED" && (
        <Card>
          <CardContent className="py-8 text-center text-sm">
            <p className="font-medium text-red-500">Analysis failed</p>
            <p className="mt-1 text-muted-foreground">{analysis.error ?? "Please try again."}</p>
          </CardContent>
        </Card>
      )}

      {analysis?.status === "COMPLETED" && analysis.report && (
        <ReportView report={analysis.report} model={analysis.model} />
      )}
    </main>
  );
}

function ChipCard({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={item} variant="outline">
            {item}
          </Badge>
        ))}
      </CardContent>
    </Card>
  );
}

function TextCard({ title, body }: { title: string; body: string }) {
  if (!body) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function ReportView({ report, model }: { report: AnalysisReport; model: string | null }) {
  const complexityVariant =
    report.complexity.level === "advanced"
      ? "verified"
      : report.complexity.level === "intermediate"
        ? "default"
        : "claimed";

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>What this project does</CardTitle>
          <Badge variant={complexityVariant}>{report.complexity.level}</Badge>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{report.summary}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            Complexity: {report.complexity.reasoning}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <ChipCard title="Languages" items={report.languages} />
        <ChipCard title="Frameworks" items={report.frameworks} />
        <ChipCard title="Databases" items={report.databases} />
        <ChipCard title="Authentication" items={report.authentication} />
        <ChipCard title="Deployment" items={report.deployment} />
        <ChipCard title="Build tools" items={report.buildTools} />
        <ChipCard title="Notable libraries" items={report.thirdPartyLibraries} />
      </div>

      <TextCard title="Folder organization" body={report.folderStructure} />
      <TextCard title="API structure" body={report.apiStructure} />
      <TextCard title="Testing approach" body={report.testing} />
      <ListCard title="Missing best practices" items={report.missingBestPractices} />
      <ListCard title="Suggested improvements" items={report.suggestedImprovements} />

      {model && (
        <p className="text-center text-xs text-muted-foreground">Report generated by {model}</p>
      )}
    </div>
  );
}

export default function RepositoryReportPage() {
  return (
    <ProtectedRoute>
      <ReportContent />
    </ProtectedRoute>
  );
}
