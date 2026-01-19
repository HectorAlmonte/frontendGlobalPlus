import { Button } from "@/components/ui/button";
import { IncidentFile } from "../_lib/types";
import { API_BASE } from "../_lib/api";

type Props = {
  files: IncidentFile[];
};

export default function EvidenceList({ files }: Props) {
  if (!files?.length) {
    return <p className="text-sm text-muted-foreground">Sin evidencias.</p>;
  }

  return (
    <div className="space-y-2">
      {files.map((f) => {
        const url = `${API_BASE}/api/incidents/files/${f.id}`;
        const isImage = (f.mimeType ?? "").startsWith("image/");
        return (
          <div key={f.id} className="rounded-lg border p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {f.originalName ?? "archivo"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {f.stage} • {f.mimeType ?? "—"}
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <a href={url} target="_blank" rel="noreferrer">
                  Abrir
                </a>
              </Button>
            </div>

            {isImage && (
              <div className="mt-3 overflow-hidden rounded-lg border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={f.originalName ?? "evidencia"}
                  className="h-auto w-full"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
