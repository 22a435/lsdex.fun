'use client';
// import { useConnect, useWalletManifests } from '@/app/wrappers';
// import { useInfo } from '@/app/fetchers';
import ValGrid from '@/app/ValGrid'
import AssetGrid from './AssetGrid';

import { TransportProvider } from "@connectrpc/connect-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { getPenumbraUnsafe } from '@penumbra-zone/client';
import { usePenumbraTransportSync } from '@penumbra-zone/react/hooks/use-penumbra-transport';
import { PenumbraContextProvider } from '@penumbra-zone/react';
// import { assertGlobalPresent, assertProviderConnected, assertProviderManifest } from '@penumbra-zone/client/assert';
import LiquidityGrid from './LiquidityGrid';


import { simQuery, useAssets, useBalances, useConnect, useLiquidity, useSimulations, useValidators, useWalletManifests } from '@/app/hooks';
import { useInfo } from '@/app/fetchers';
import { fromString } from '@penumbra-zone/types/amount';
import { Amount } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/num/v1/num_pb';
import { bech32mAssetId } from '@penumbra-zone/bech32m/passet';

export default function App({ connected }:{ connected?: string }) {
  const getAssets = useAssets({},connected,false);
  const getBalances = useBalances(connected);
  const getLiquidity = useLiquidity(connected);
  const getValidators = useValidators(connected);
  const denoms = new Map(Array.from(getAssets()).map(([k,v]) => {
    return [bech32mAssetId(v.penumbraAssetId!), k]
  }))
  
  const getUSDSims = useSimulations(Array.from(getAssets()).map(([k, v]) => {
    return simQuery(v.penumbraAssetId!, getAssets().get("transfer/channel-2/uusdc")?.penumbraAssetId!, fromString("1000000"))
  }), connected)
  const getUUMSims = useSimulations(Array.from(getAssets()).map(([k, v]) => {
    return simQuery(v.penumbraAssetId!, getAssets().get("upenumbra")?.penumbraAssetId!, fromString("1000000"))
  }), connected)

  const getOrElseZero = (x: string, y: Map<string, Amount>) => {
    return y.has(x) ? y.get(x)! : fromString("0")
  }
  const getUsdPrices = () => new Map(getUSDSims().map(r => [denoms.get(bech32mAssetId(r.output?.input?.assetId!))!, r.output?.output?.amount!]))
  const getUmPrices = () => new Map(getUUMSims().map(r => [denoms.get(bech32mAssetId(r.output?.input?.assetId!))!, r.output?.output?.amount!]))
  

  // const { data: wallets, loading } = useWalletManifests();
  // const { connectionLoading, connected, onConnect, onDisconnect } = useConnect();
  // const { address, balances } = useInfo(connected);

  // const { data: wallets, loading } = useWalletManifests();
  // const { connectionLoading, connected, onConnect, onDisconnect } = useConnect();
  // const { address, balances } = useInfo(connected);
  // const ts = usePenumbraTransportSync()
  // const qc = new QueryClient();

  return (
    <div>
    {/* <PenumbraContextProvider penumbra={assertProviderConnected(connected)} makeApprovalRequest> */}
      {/* <TransportProvider transport={ts}> */}
        {/* <QueryClientProvider client={qc}> */}
          <h1>Validators</h1>
          <ValGrid assets={getAssets()} balances={getBalances()} umPrices={getUmPrices()} validators={getValidators()}/>
          <h1>Assets</h1>
          <AssetGrid assets={getAssets()} balances={getBalances()} usdPrices={getUsdPrices()} umPrices={getUmPrices()}/>
          <h1>Liquidity</h1>
          <LiquidityGrid assets={getAssets()} liquidity={getLiquidity()}/>
        {/* </QueryClientProvider> */}
      {/* </TransportProvider> */}
    {/* </PenumbraContextProvider> */}
  </div>
  );
}
