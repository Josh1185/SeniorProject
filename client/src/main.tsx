/**
 * FILE: main.tsx
 * DESCRIPTION: App entry point that boots everything up
 *
 * LAST UPDATED: 2026-09-26 - Add providers for auth and query client (Josh Iehle)
 */

// -------------------- Module and lib imports --------------------
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App';
import './index.css';

// -------------------- Provider imports --------------------
import { AuthProvider } from './lib/auth/auth.tsx';

// -------------------- Query Client handling --------------------
// query client serves as our client-side cache system
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

// -------------------- Root Handling --------------------
const root = document.getElementById('root');
if (!root) throw new Error('No #root element in index.html');

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
