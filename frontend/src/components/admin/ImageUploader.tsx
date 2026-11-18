import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/button";

/**
 * Uploads/removes an image for products|categories|stores (POST/DELETE /{entity}/{id}/image)
 * or the store logo (endpoint="/settings/logo"). Field name is "file", JPEG/PNG/WebP up to 5MB.
 */
export function ImageUploader({
  endpoint,
  imageUrl,
  onChange,
  label = "الصورة",
}: {
  endpoint: string;
  imageUrl: string | null | undefined;
  onChange?: () => void;
  label?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    if (file.size > 5 * 1024 * 1024) { toast.error("الصورة أكبر من 5 ميجا"); return; }
    const form = new FormData();
    form.append("file", file);
    setBusy(true);
    try {
      await api(endpoint, { method: "POST", form });
      toast.success("الصورة اترفعت");
      onChange?.();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await api(endpoint, { method: "DELETE" });
      toast.success("الصورة اتمسحت");
      onChange?.();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border bg-muted">
        {imageUrl ? (
          <img src={imageUrl} alt={label} className="size-full object-cover" />
        ) : (
          <ImagePlus className="size-6 text-muted-foreground" />
        )}
      </div>
      <div className="flex flex-col gap-2">
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            e.target.value = "";
          }}
        />
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? <Loader2 className="animate-spin" /> : <ImagePlus />}
          {imageUrl ? "غيّر الصورة" : "ارفع صورة"}
        </Button>
        {imageUrl && (
          <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={remove} className="text-destructive">
            <Trash2 /> امسح الصورة
          </Button>
        )}
      </div>
    </div>
  );
}
