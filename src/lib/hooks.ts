import { useEffect, useState } from 'react';
import { PenumbraRequestFailure, PenumbraManifest, PenumbraClient, PenumbraState } from '@penumbra-zone/client';
import { client } from '@/src/lib/penumbra';

// Common react api for fetching wallet data to render the list of injected wallets
export const useWalletManifests = () => {
  const [manifests, setManifests] = useState<Record<string, PenumbraManifest>>({});
  const [loading, setLoading] = useState<boolean>(true);

  const loadManifests = async () => {
    setLoading(true);
    const res = PenumbraClient.getProviderManifests();
    const resolvedManifests = await Promise.all(
      Object.entries(res).map(async ([key, promise]) => {
        const value = await promise;
        return [key, value];
      })
    );
    setManifests(Object.fromEntries(resolvedManifests));
    setLoading(false);
  };

  useEffect(() => {
    loadManifests();
  }, []);

  return { data: manifests, loading };
};

export const useConnect = () => {
  const [connectionLoading, setConnectionLoading] = useState<boolean>(false);
  const [connected, setConnected] = useState<string>();

  const reconnect = async () => {
    const providers = PenumbraClient.getProviders();
    const connected = Object.keys(providers).find((origin) => PenumbraClient.isProviderConnected(origin));
    if (!connected) return;
    try {
      await client.connect(connected);
      setConnected(connected);
    } catch (error) {
      /* no-op */
    }
  };

  const onConnect = async (origin: string) => {
    try {
      setConnectionLoading(true);
      await client.connect(origin);
    } catch (error) {
      if (error instanceof Error && error.cause) {
        if (error.cause === PenumbraRequestFailure.Denied) {
          alert('Connection denied: you may need to un-ignore this site in your extension settings.');
        }
        if (error.cause === PenumbraRequestFailure.NeedsLogin) {
          alert('Not logged in: please login into the extension and try again');
        }
      }
    } finally {
      setConnectionLoading(false);
    }
  };

  const onDisconnect = async () => {
    if (!client.connected) return;
    try {
      await client.disconnect();
    } catch (error) {
      console.error(error);
    }
  };

  // Monitors the connection
  useEffect(() => {
    // If Prax is connected on page load, reconnect to ensure the connection is still active
    reconnect();
    client.onConnectionStateChange((event) => {
      if (event.state === PenumbraState.Connected) {
        setConnected(event.origin);
      } else {
        setConnected(undefined);
      }
    });
  }, []);

  return {
    connectionLoading,
    connected,
    onConnect,
    onDisconnect,
  }
};
