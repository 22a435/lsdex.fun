import { DexService } from '@penumbra-zone/protobuf';
import { Metadata } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/asset/v1/asset_pb';
import { useQueries, useQuery } from '@tanstack/react-query';
import { assetIdFromBech32m } from '@penumbra-zone/bech32m/passet';
import { LiquidityPositionsByIdRequest, LiquidityPositionsByIdResponse, LiquidityPositionsResponse, Position, PositionId, SpreadResponse, TradingPair } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/component/dex/v1/dex_pb';
import type { PartialMessage } from "@bufbuild/protobuf";
import { client } from '@/src/lib/penumbra';

export const useLiquidity = (): Position[] => {
  const q = useQuery({
    queryKey: [`Liquidity`],
    queryFn: (): Promise<LiquidityPositionsResponse[]> =>
      Array.fromAsync(client.service(DexService).liquidityPositions({})),
    select: (data: LiquidityPositionsResponse[]) =>
      data.map(x => x.data!)
  })
  return q.isSuccess ? q.data! : []
}

export const useOwnedPositions = (owned: PositionId[]): Position[] => {
  const q = useQuery({
    queryKey: ['OwnedPositions'],
    queryFn: (): Promise<LiquidityPositionsByIdResponse[]> =>
      Array.fromAsync(client.service(DexService).liquidityPositionsById({
        positionId: owned
      })),
    select: (data: LiquidityPositionsByIdResponse[]) =>
      data.map(x => x.data!)
  })
  return q.isSuccess? q.data! : []
}

export const useSpread = (a: string, b: string): Map<string, number> => {
  const q = useQuery({
    queryKey: [`Spread {${a}} {${b}}`],
    queryFn: (): Promise<SpreadResponse> => client.service(DexService).spread({
      tradingPair: { asset1: assetIdFromBech32m(a), asset2: assetIdFromBech32m(b) }
    }),
    select: (data: SpreadResponse) => new Map([[`${a}:${b}`, data.approxEffectivePrice1To2]])
  })
  return q.isSuccess ? q.data : new Map();
}

export const useSpreads = (assets: Map<string, Metadata>): Map<[string, string], SpreadResponse> => {
  const qs = useQueries({
    queries: Array.from(assets.keys()).flatMap(a => {
      return Array.from(assets.keys()).map(b => {
        return {
          queryKey: [`Spread {${assets.get(a)?.base}} {${assets.get(b)?.base}}`],
          queryFn: (): Promise<[[string, string], SpreadResponse]> =>
            client.service(DexService).spread({
              tradingPair: { asset1: assetIdFromBech32m(a), asset2: assetIdFromBech32m(b) }
            }).then(r => [[a, b], r])
        }
      })
    })
  })
  return new Map(qs.filter(x => x.isSuccess).map(x => x.data!))
}
