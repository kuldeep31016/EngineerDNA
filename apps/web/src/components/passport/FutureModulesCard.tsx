import { Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Placeholders for capabilities that later modules unlock from verified
 * evidence. Shown locked so the passport hints at what it will become.
 */
export function FutureModulesCard() {
  const items = [
    { title: "Developer DNA", note: "Your engineering strengths, scored from evidence." },
    { title: "Verified Skills", note: "Skills proven by your real repositories." },
    { title: "Engineering Score", note: "An auditable, evidence-based reputation." },
    { title: "Career Intelligence", note: "Roles, gaps, and what to build next." },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Coming to your passport</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.title}
            className="rounded-lg border border-dashed border-border p-4 opacity-80"
          >
            <div className="flex items-center gap-2 font-medium">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              {item.title}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{item.note}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
