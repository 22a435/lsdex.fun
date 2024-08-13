// 'use client';

// import { useEffect, useState } from 'react';
// import { PenumbraState } from '@penumbra-zone/client';
// import { assertGlobalPresent, assertProvider, assertProviderManifest } from '@penumbra-zone/client/assert';
// import { isPenumbraManifest, type PenumbraManifest } from '@penumbra-zone/client/manifest';

// // Retrieve injected wallet origins
// export const getWallets = () => {
//   const injection = assertGlobalPresent();
//   return Object.keys(injection);
// };

// type PenumbraManifests = Record<string, PenumbraManifest>

// // Send requests to the wallet origin (browser extension URL) and retrieve the manifest
// const fetchManifests = async (): Promise<PenumbraManifests> => {
//   const wallets = getWallets();

//   const manifests: PenumbraManifests = {};
//   await Promise.all(wallets.map(async (origin) => {
//     try {
//       const manifest = await assertProviderManifest(origin) as PenumbraManifest;

//       if (isPenumbraManifest(manifest)) {
//         manifests[origin] = manifest;
//       }
//     } catch (_) {
//       return;
//     }
//   }));

//   return manifests;
// };

// // Common react api for fetching wallet data to render the list of injected wallets
// export const useWalletManifests = () => {
//   const [manifests, setManifests] = useState<PenumbraManifests>({});
//   const [loading, setLoading] = useState<boolean>(true);

//   const loadManifests = async () => {
//     setLoading(true);
//     setManifests(await fetchManifests());
//     setLoading(false);
//   };

//   useEffect(() => {
//     loadManifests();
//   }, []);

//   return { data: manifests, loading };
// };

// export const connectToWallet = (origin: string) => {
//   return new Promise(async (resolve, reject) => {
//     try {
//       const provider = await assertProvider(origin);

//       const onStateChange: EventListener = (event) => {
//         const typedEvent = event as CustomEvent<{ origin: string, state: PenumbraState }>;
//         if (typedEvent.detail.state === PenumbraState.Connected || typedEvent.detail.state === PenumbraState.Requested) {
//           resolve(true);
//           provider.removeEventListener('penumbrastate', onStateChange);
//         }
//         if (typedEvent.detail.state === PenumbraState.Disconnected || typedEvent.detail.state === PenumbraState.Failed) {
//           reject(new Error('could not connect to the wallet'));
//           provider.removeEventListener('penumbrastate', onStateChange);
//         }
//       };

//       provider.addEventListener('penumbrastate', onStateChange);
//       provider.request();
//     } catch (error) {
//       reject(error);
//     }
//   });
// };

// export const useConnect = () => {
//   const [connectionLoading, setConnectionLoading] = useState<boolean>(false);
//   const [connected, setConnected] = useState<string>();

//   // Finds already connected wallet
//   const reconnectToWallet = async () => {
//     const wallets = getWallets();

//     const origin = await Promise.race(wallets.map(async (wallet) => {
//       try {
//         const provider = await assertProvider(wallet);
//         return provider.isConnected() ? wallet : undefined;
//       } catch (_) {
//         return undefined;
//       }
//     }));
//     setConnected(origin);
//   };

//   // Auto connect to the wallet on page load
//   useEffect(() => {
//     reconnectToWallet();
//   }, []);

//   const onConnect = async (origin: string) => {
//     try {
//       setConnectionLoading(true);
//       await connectToWallet(origin);
//       setConnected(origin);
//     } catch (error) {
//       setConnected(undefined);
//     } finally {
//       setConnectionLoading(false);
//     }
//   };

//   const onDisconnect = async () => {
//     if (!connected) return;
//     try {
//       const provider = await assertProvider(connected);
//       provider.disconnect;
//       setConnected(undefined);
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   return {
//     connectionLoading,
//     connected,
//     onConnect,
//     onDisconnect,
//   }
// };
