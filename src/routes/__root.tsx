import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Sidebar } from "@/components/Common/Sidebar";
import { Header } from "@/components/Common/Header";
import { AmbientBackground } from "@/components/Common/AmbientBackground";
import { InvestigationProvider } from "@/state/investigation";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="num text-7xl font-bold text-cyan">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Sector not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This surveillance route does not exist in the OceanTrace console.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md border border-cyan/40 bg-cyan/12 px-4 py-2 num text-[11px] tracking-widest text-cyan uppercase hover:bg-cyan/20"
          >
            Return to command overview
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    console.error(error);
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This console panel didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Telemetry interrupted. Retry the request or return to the overview.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "OceanTrace — Oil Spill Forensic Intelligence" },
      {
        name: "description",
        content:
          "OceanTrace correlates SAR oil spill detections, drift hindcasts and AIS vessel traffic into ranked, explainable vessel attribution.",
      },
      { name: "author", content: "OceanTrace" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Lato:wght@300;400;700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&family=Space+Mono:wght@400;700&display=swap",
      },
      { rel: "icon", href: "/hackappeal-favicon.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLanding = pathname === "/";

  if (isLanding) {
    return (
      <QueryClientProvider client={queryClient}>
        <InvestigationProvider>
          <Outlet />
        </InvestigationProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <InvestigationProvider>
        <AmbientBackground />
        <div className="flex h-screen w-full overflow-hidden bg-transparent">
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
          <div className="flex min-w-0 flex-1 flex-col">
            <Header />
            <main className="flex-1 overflow-y-auto p-5">
              {/* Required: nested routes render here. */}
              <Outlet />
            </main>
          </div>
        </div>
      </InvestigationProvider>
    </QueryClientProvider>
  );
}
