import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useLocation,
} from 'react-router';
import { APP_NAME } from '@resolve/shared';
import type { Route } from './+types/root';
import { AppLoading } from '~/components/app-loading';
import { ScreenTooSmall } from '~/components/screen-too-small';
import { ErrorCard } from '~/components/ui/error-card';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '~/lib/query-client';
import { Toaster } from '~/components/ui/toaster';
import { TooltipProvider } from '~/components/ui/tooltip';
import { ThemeProvider, themeInitScript } from '~/lib/theme';
import './styles/tokens.css';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <title>{APP_NAME}</title>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function HydrateFallback() {
  return <AppLoading />;
}

const RESPONSIVE_PATHS = new Set(['/']);

export default function App() {
  const responsive = RESPONSIVE_PATHS.has(useLocation().pathname);
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          {responsive ? (
            <Outlet />
          ) : (
            <>
              <div className="app-root">
                <Outlet />
              </div>
              <ScreenTooSmall />
            </>
          )}
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const routeError = isRouteErrorResponse(error);
  const notFound = routeError && error.status === 404;
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center p-6">
      <ErrorCard
        layout="centered"
        title={notFound ? 'Page not found' : 'Something went wrong'}
        message={
          notFound
            ? "That page doesn't exist. Go back and try again."
            : 'Reload the page, or go back and try again.'
        }
        code={routeError ? `${error.status}` : undefined}
        onRetry={() => window.location.reload()}
      />
    </main>
  );
}
