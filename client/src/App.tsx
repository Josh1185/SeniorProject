import { useEffect, useState } from 'react';

export function App() {
  const [api, setApi] = useState<'checking' | 'ok' | 'unreachable'>('checking');

  useEffect(() => {
    fetch('/api/health')
      .then((r) => (r.ok ? setApi('ok') : setApi('unreachable')))
      .catch(() => setApi('unreachable'));
  }, []);

  return (
    <main className="grid h-full place-items-center bg-slate-50 p-8">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-semibold text-slate-900">Trip Squad</h1>
        <p className="mt-1 text-sm text-slate-500">Scaffold is running.</p>
        <p className="mt-6 text-sm">
          API health: <span className="font-medium text-brand-600">{api}</span>
        </p>
      </div>
    </main>
  );
}
