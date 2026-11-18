<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- This is the frontend only; data lives in the user's own Express backend on Railway (not Lovable Cloud). Why: the user built and hosts the backend themselves.
- Browser calls go through the same-origin bridge `src/routes/api/public/tayyar.$.ts` via `src/lib/api/client.ts` (`api`, `apiPage`, `apiRaw`). Why: the backend's CORS list doesn't include this site and the refresh cookie must be re-scoped.
- The public catalog loads through the `getCatalog` server function (`src/lib/catalog.ts` → `catalogQuery`) so storefront pages render with data on first load.
- All money from/to the backend is integer piasters; format with `formatMoney`, convert admin input with `toMinor`; percentages are basis points. Why: backend contract.
- The cart lives in localStorage (`src/lib/cart.ts`); prices shown in the cart always come from `POST /orders/quote`, never from local math. Why: backend pricing is the source of truth.
- Admin routes (`/admin/*`) are client-only (`ssr: false`) and read data with `useQuery` + the api client; access token in localStorage, refresh via httpOnly cookie.
- UI is Arabic, RTL (`<html dir="rtl">`); use logical spacing (`ms-`/`me-`, `start`/`end`).
- `exactOptionalPropertyTypes` and `noPropertyAccessFromIndexSignature` are off in tsconfig. Why: backend payloads use many optional/undefined fields and dynamic keys.
