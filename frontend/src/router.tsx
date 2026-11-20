import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { routeTree } from "./routeTree.gen";
import { cart } from "./lib/cart";

export const getRouter = () => {
  // One client per request: a module-level QueryClient leaks cached data between SSR requests.
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Lets Query own freshness; set caching defaults on the QueryClient, not the router.
    defaultPreloadStaleTime: 0,
  });

  // Ships the query cache filled during SSR (e.g. the catalog) to the browser, so the client
  // doesn't fetch it a second time on load.
  setupRouterSsrQueryIntegration({ router, queryClient });

  // Read the saved cart before React hydrates (no-op on the server) so pages see it on first use.
  cart.hydrate();

  return router;
};
