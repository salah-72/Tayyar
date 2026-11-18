import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/** Side panel form used for create/edit across admin pages. */
export function FormSheet({
  open,
  onOpenChange,
  title,
  description,
  onSubmit,
  busy,
  submitLabel = "حفظ",
  children,
  footerExtra,
  wide,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  onSubmit?: () => void;
  busy?: boolean;
  submitLabel?: string;
  children: ReactNode;
  footerExtra?: ReactNode;
  wide?: boolean;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className={cn("flex w-full flex-col gap-0 p-0", wide ? "sm:max-w-2xl" : "sm:max-w-lg")} dir="rtl">
        <SheetHeader className="border-b p-5 text-right">
          <SheetTitle>{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : <SheetDescription className="sr-only">{title}</SheetDescription>}
        </SheetHeader>
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit?.();
          }}
        >
          <div className="flex-1 space-y-5 overflow-y-auto p-5">{children}</div>
          {(onSubmit || footerExtra) && (
            <div className="flex items-center gap-2 border-t bg-card p-4">
              {onSubmit && (
                <Button type="submit" disabled={busy} className="min-w-28 rounded-xl">
                  {busy && <Loader2 className="animate-spin" />} {submitLabel}
                </Button>
              )}
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                إلغاء
              </Button>
              <div className="ms-auto">{footerExtra}</div>
            </div>
          )}
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function Field({ label, hint, htmlFor, children, className }: { label: string; hint?: string; htmlFor?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SwitchField({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border bg-card px-3.5 py-3">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-3 text-sm font-bold text-primary-deep">{title}</legend>
      {children}
    </fieldset>
  );
}

/** Number input value helpers: "" stays empty, otherwise numeric. */
export const num = (v: string) => (v.trim() === "" ? null : Number(v));
export const egpStr = (minor: number | null | undefined) => (minor == null ? "" : String(minor / 100));
