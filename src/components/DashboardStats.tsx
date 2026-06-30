import { Card, CardContent } from "@/components/ui/card";

interface Stat {
  label: string;
  value: number;
}

export function DashboardStats({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {stats.map((s) => (
        <Card key={s.label} className="rounded-lg shadow-none">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <p className="truncate text-xs font-semibold uppercase text-muted-foreground">
              {s.label}
            </p>
            <p className="text-2xl font-semibold text-foreground">
              {s.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
