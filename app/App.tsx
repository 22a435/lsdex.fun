'use client';
import ValGrid from '@/app/ValGrid'
import AssetGrid from './AssetGrid';
import LiquidityGrid from './LiquidityGrid';

import { simQuery, useSimulations } from './simService';
import { useAssets, useBalances } from './viewService';
import { useLiquidity } from './dexService';
import { useValidators } from './stakeService';

import { fromString } from '@penumbra-zone/types/amount';
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

  const getUsdPrices = () => new Map(getUSDSims().map(r => [denoms.get(bech32mAssetId(r.output?.input?.assetId!))!, r.output?.output?.amount!]))
  const getUmPrices = () => new Map(getUUMSims().map(r => [denoms.get(bech32mAssetId(r.output?.input?.assetId!))!, r.output?.output?.amount!]))

  return (
    <div>
      <h1>Validators</h1>
      <ValGrid assets={getAssets()} balances={getBalances()} umPrices={getUmPrices()} validators={getValidators()}/>
      <h1>Assets</h1>
      <AssetGrid assets={getAssets()} balances={getBalances()} usdPrices={getUsdPrices()} umPrices={getUmPrices()}/>
      <h1>Liquidity</h1>
      <LiquidityGrid assets={getAssets()} liquidity={getLiquidity()}/>
  </div>
  );
}
