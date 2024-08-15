'use client';
import { useConnect, useWalletManifests } from '@/src/lib/hooks';
import { useInfo } from '@/src/lib/fetchers';
import App from '@/src/app/App';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function Home() {
  const { data: wallets, loading } = useWalletManifests();
  const { connectionLoading, connected, onConnect, onDisconnect } = useConnect();
  const { address, balances } = useInfo(connected);
  const qc = new QueryClient();

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      {loading && <p>Wallets loading...</p>}

      {!loading && !connected && (
        <ul className='flex flex-col gap-2'>
          {!Object.keys(wallets).length && (
            <p>
              No injected wallets found. Try{' '}
              <a className='underline' href='https://chromewebstore.google.com/detail/prax-wallet/lkpmkhpnhknhmibgnmmhdhgdilepfghe' target='_blank'>
                installing Prax
              </a>
            </p>
          )}

          {Object.entries(wallets).map(([origin, manifest]) => (
            <button
              type="button"
              key={origin}
              disabled={connectionLoading}
              className='border rounded cursor-pointer border-gray-300 px-4 py-2 hover:bg-gray-800 transition'
              onClick={() => onConnect(origin)}
            >
              {connectionLoading ? 'Connecting...' : `Connect to ${manifest.name}`}
            </button>
          ))}
        </ul>
      )}

      {connected && (
        <section>
          <h3 className='text-lg font-bold'>Connected!</h3>
          <button
            type="button"
            className='mt-2 mb-4 border rounded cursor-pointer border-gray-300 px-4 py-2 hover:bg-gray-800 transition'
            onClick={onDisconnect}
          >
            Disconnect
          </button>

          <p className='mb-4 break-all'>Your address is {address}</p>
          <p>Balances</p>
          <ul>
            {balances.map((balance, index) => (
              <li key={index}>{balance}</li>
            ))}
          </ul>
          <div>{connected}</div>
          <div>
            <QueryClientProvider client={qc}>
              <App/>
            </QueryClientProvider>
          </div>
        </section>
      )}
    </main>
  );
}

