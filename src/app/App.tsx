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

import { assetsContext, denomsContext, balancesContext, ownedPositionIdsContext, validatorsContext, liquidityContext, usdPricesContext, umPricesContext } from '@/src/lib/context';

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
    <assetsContext.Provider value={assets}>
      <denomsContext.Provider value={denoms}>
        <balancesContext.Provider value={balances}>
          <ownedPositionIdsContext.Provider value={ownedPositonIds}>
            <validatorsContext.Provider value={validators}>
              <liquidityContext.Provider value={liquidity}>
                <usdPricesContext.Provider value={USDPrices}>
                  <umPricesContext.Provider value={UMPrices}>
                    <div>
                      <h1>Validators</h1>
                      <ValGrid />
                      <h1>Assets</h1>
                      <AssetGrid />
                      <h1>Liquidity</h1>
                      <LiquidityGrid />
                    </div>
                  </umPricesContext.Provider>
                </usdPricesContext.Provider>
              </liquidityContext.Provider>
            </validatorsContext.Provider>
          </ownedPositionIdsContext.Provider>
        </balancesContext.Provider>
      </denomsContext.Provider>
    </assetsContext.Provider>

  );
}
