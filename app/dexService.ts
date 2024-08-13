import { DexService } from '@penumbra-zone/protobuf';
import { Metadata } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/asset/v1/asset_pb';
import { useQueries, useQuery } from '@tanstack/react-query';
import { assetIdFromBech32m } from '@penumbra-zone/bech32m/passet';
import { LiquidityPositionsResponse, Position, SpreadResponse, TradingPair } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/component/dex/v1/dex_pb';
import type { PartialMessage } from "@bufbuild/protobuf";
import { client } from './penumbra';

export const useLiquidity = (wallet?: string): (() => Position[]) => {
  const getDexService = client.service(DexService);
  const q = useQuery({
    queryKey: [`Liquidity`],
    queryFn: ({ signal }): Promise<LiquidityPositionsResponse[]> =>
      Array.fromAsync(getDexService.liquidityPositions({})),
    select: (data: LiquidityPositionsResponse[]) =>
      data.map(x => x.data!)
  })
  const getLiquidity = () => q.isSuccess ? q.data! : []
  return getLiquidity;
}

export const useSpread = (a:string, b:string, wallet?: string): (()=>Map<string, number>) => {
  const getDexService = client.service(DexService);
  const q = useQuery({
    queryKey: [`Spread {${a}} {${b}}`],
    queryFn: ({ signal }): Promise<SpreadResponse> => getDexService.spread({
      tradingPair: {asset1: assetIdFromBech32m(a), asset2: assetIdFromBech32m(b)}
    }),
    select: (data: SpreadResponse) => new Map([[`${a}:${b}`, data.approxEffectivePrice1To2]])
  })
  const getSpread = () => q.isSuccess ? q.data : new Map();
  return getSpread
}

export const useSpreads = (assets: Map<string, Metadata>, wallet?: string): (() => Map<[string,string], SpreadResponse>) => {
  const dex = client.service(DexService);
  const qs = useQueries({
    queries: Array.from(assets.keys()).flatMap(a => {
      return Array.from(assets.keys()).map(b => {return {
        queryKey: [`Spread {${assets.get(a)?.base}} {${assets.get(b)?.base}}`],
        queryFn: (): Promise<[[string, string], SpreadResponse]> =>
          {
            const tp:PartialMessage<TradingPair> = {asset1: assetIdFromBech32m(a), asset2: assetIdFromBech32m(b)};
            return dex.spread({tradingPair: tp}).then(r =>
              [[a,b],r])
          }
          
      }})})
  })
  const getSpreads = () => {
    return new Map(qs.filter(x => x.isSuccess).map(x => x.data!))
  }
  return getSpreads
}
