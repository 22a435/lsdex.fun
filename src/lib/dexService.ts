import { DexService } from '@penumbra-zone/protobuf';
import { assetIdFromBech32m } from '@penumbra-zone/bech32m/passet';
import { Metadata } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/asset/v1/asset_pb';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Position, SpreadResponse } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/component/dex/v1/dex_pb';
import { bech32mPositionId } from '@penumbra-zone/bech32m/plpid';
import { client } from '@/src/lib/penumbra';

const importWasmDex = import("@penumbra-zone/wasm/dex");

export const useLiquidity = (): Map<string, Position> => {
  const q = useQuery({
    queryKey: [`Liquidity`],
    queryFn: (): Promise<Map<string, Position>> =>
      importWasmDex.then(d =>
        Array.fromAsync(client.service(DexService).liquidityPositions({})).then(m =>
          new Map(m.map(x =>
            [bech32mPositionId(d.computePositionId(x.data!)), x.data!]
          ))
        )
      )
  })
  return q.isSuccess ? q.data! : new Map()
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
