'use client';
import ValGrid from '@/src/components/ValGrid'
import AssetGrid from '@/src/components/AssetGrid';
import LiquidityGrid from '@/src/components/LiquidityGrid';

import { simQuery, useSimulations } from '@/src/lib/simService';
import { useAssets, useBalances, useOwnedPositionIds } from '@/src/lib/viewService';
import { useLiquidity } from '@/src/lib/dexService';
import { useValidators } from '@/src/lib/stakeService';

import { fromString } from '@penumbra-zone/types/amount';
import { bech32mAssetId } from '@penumbra-zone/bech32m/passet';

export default function App() {
  const assets = useAssets({});
  const balances = useBalances();
  const liquidity = useLiquidity();
  const ownedPositonIds = useOwnedPositionIds();
  const validators = useValidators();
  const denoms = new Map(Array.from(assets).map(([k, v]) => {
    return [bech32mAssetId(v.penumbraAssetId!), k]
  }))

  const USDSims = useSimulations(Array.from(assets).map(([k, v]) => {
    return simQuery(v.penumbraAssetId!, assets.get("transfer/channel-2/uusdc")?.penumbraAssetId!, fromString("1000000"))
  }))
  const UMSims = useSimulations(Array.from(assets).map(([k, v]) => {
    return simQuery(v.penumbraAssetId!, assets.get("upenumbra")?.penumbraAssetId!, fromString("1000000"))
  }))

  const USDPrices = new Map(USDSims.map(r => [denoms.get(bech32mAssetId(r.output?.input?.assetId!))!, r.output?.output?.amount!]))
  const UMPrices = new Map(UMSims.map(r => [denoms.get(bech32mAssetId(r.output?.input?.assetId!))!, r.output?.output?.amount!]))

  return (
    <div>
      <h1>Validators</h1>
      <ValGrid assets={assets} balances={balances} umPrices={UMPrices} validators={validators} />
      <h1>Assets</h1>
      <AssetGrid assets={assets} balances={balances} usdPrices={USDPrices} umPrices={UMPrices} />
      <h1>Liquidity</h1>
      <LiquidityGrid assets={assets} liquidity={liquidity} ownedIds={ownedPositonIds} />
    </div>
  );
}
