import { cn } from "@/lib/utils";
import type { EventTemplate } from "@/lib/event-templates";

interface Props {
  template: EventTemplate;
  selected: boolean;
  onSelect: () => void;
}

export function EventCard({ template, selected, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative flex flex-col items-start gap-4 rounded-2xl border bg-card p-6 text-left transition-all",
        "hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]",
        selected
          ? "border-gold ring-2 ring-gold shadow-[var(--shadow-gold)]"
          : "border-border",
      )}
    >
      <div
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-xl text-3xl transition-colors",
          selected ? "bg-gold/15" : "bg-muted",
        )}
      >
        {template.icon}
      </div>
      <div>
        <h3 className="text-xl font-semibold">{template.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
      </div>
      <span
        className={cn(
          "absolute right-5 top-5 h-2.5 w-2.5 rounded-full transition-colors",
          selected ? "bg-gold" : "bg-border",
        )}
      />
    </button>
  );
}
