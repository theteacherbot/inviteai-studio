import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { EventTemplate } from "@/lib/event-templates";

interface Props {
  template: EventTemplate;
  onSubmit: (data: Record<string, string>) => void;
}

export function DynamicForm({ template, onSubmit }: Props) {
  const [data, setData] = useState<Record<string, string>>({});

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(data);
  };

  return (
    <form onSubmit={handle} className="grid gap-5 sm:grid-cols-2">
      {template.fields.map((f) => (
        <div key={f.name} className="flex flex-col gap-2">
          <Label htmlFor={f.name} className="text-sm font-medium">
            {f.label}
            {f.required && <span className="ml-1 text-gold">*</span>}
          </Label>
          {f.type === "textarea" ? (
            <Textarea
              id={f.name}
              required={f.required}
              placeholder={f.placeholder}
              value={data[f.name] || ""}
              onChange={(e) => setData({ ...data, [f.name]: e.target.value })}
            />
          ) : f.type === "select" ? (
            <select
              id={f.name}
              required={f.required}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={data[f.name] || ""}
              onChange={(e) => setData({ ...data, [f.name]: e.target.value })}
            >
              <option value="" disabled>
                {f.placeholder || "Selecciona una opción"}
              </option>
              {(f.options || []).map((option) => (
                <option key={`${f.name}-${option.value}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <Input
              id={f.name}
              type={f.type}
              required={f.required}
              placeholder={f.placeholder}
              value={data[f.name] || ""}
              onChange={(e) => setData({ ...data, [f.name]: e.target.value })}
            />
          )}
        </div>
      ))}
      <div className="sm:col-span-2 flex justify-end pt-2">
        <Button type="submit" size="lg" className="bg-foreground text-background hover:bg-foreground/90">
          Generar invitación →
        </Button>
      </div>
    </form>
  );
}
