'use client';
import { ViewService, StakeService, DexService, SimulationService } from '@penumbra-zone/protobuf';
import { createPenumbraClient } from '@penumbra-zone/client/create';
import { bech32mAddress } from '@penumbra-zone/bech32m/penumbra';
import { formatAmount, joinLoHiAmount } from '@penumbra-zone/types/amount';
import { Amount } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/num/v1/num_pb';
import { AssetsRequest, AssetsResponse, BalancesResponse } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/view/v1/view_pb';
import { getMetadataFromBalancesResponse, getAmount } from '@penumbra-zone/getters/balances-response';
import { useCallback, useEffect, useState } from 'react';
import { AssetId, Metadata } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/asset/v1/asset_pb';
import { getValidatorInfo } from '@penumbra-zone/getters/validator-info-response';
import { ValidatorInfoResponse, ValidatorInfo } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/component/stake/v1/stake_pb';
import { useQueries, useQuery } from '@tanstack/react-query';
import { bech32mAssetId, assetIdFromBech32m } from '@penumbra-zone/bech32m/passet';

// import type {PartialMessage } from "@bufbuild/protobuf";
import { create } from 'domain';
import { LiquidityPositionsRequest, LiquidityPositionsResponse, Position, SimulateTradeRequest, SimulateTradeRequest_Routing_SingleHop, SimulateTradeResponse, SpreadResponse, TradingPair } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/component/dex/v1/dex_pb';

import type { PartialMessage, ServiceType, MethodInfo, MethodInfoBiDiStreaming, MethodInfoClientStreaming, MethodInfoServerStreaming, MethodInfoUnary } from "@bufbuild/protobuf";

import { PromiseClient } from "@connectrpc/connect"

// const createFetchClient = (wallet: string) => {
//   return createPenumbraClient<typeof ViewService>(ViewService, wallet);
// };

export const useStakeService = (wallet?: string): (() => PromiseClient<typeof StakeService>) => {
  const q = useQuery({
    queryKey: ['StakeService'],
    queryFn: (): Promise<PromiseClient<typeof StakeService>> =>
      createPenumbraClient<typeof StakeService>(StakeService, wallet)
  })
  const getStakeService = () => q.data!
  return getStakeService
}

export const useDexService = (wallet?: string): (() => PromiseClient<typeof DexService>) => {
  const q = useQuery({
    queryKey: ['DexService'],
    queryFn: (): Promise<PromiseClient<typeof DexService>> =>
      createPenumbraClient<typeof DexService>(DexService, wallet)
  })
  const getDexService = () => q.data!
  return getDexService
}

export const useSimulationService = (wallet?: string): (() => PromiseClient<typeof SimulationService>) => {
  const q = useQuery({
    queryKey: ['SimulationService'],
    queryFn: (): Promise<PromiseClient<typeof SimulationService>> =>
      createPenumbraClient<typeof SimulationService>(SimulationService, wallet)
  })
  const getSimulationService = () => q.data!
  return getSimulationService
}

export const useViewService = (wallet?: string): (() => PromiseClient<typeof ViewService>) => {
  const q = useQuery({
    queryKey: ['ViewService'],
    queryFn: (): Promise<PromiseClient<typeof ViewService>> =>
      createPenumbraClient<typeof ViewService>(ViewService, wallet)
  })
  const getViewService = () => q.data!
  return getViewService
}



export const useValidators = (wallet?: string): (() => ValidatorInfo[]) => {
  const getStakeService = useStakeService(wallet);
  const q = useQuery({
    queryKey: ['Validators'],
    queryFn: ({ signal }): Promise<ValidatorInfoResponse[]> =>
        Array.fromAsync(getStakeService().validatorInfo({})),
    select: (data: ValidatorInfoResponse[]) => data.map(getValidatorInfo)
  })

  const getValidators = () => q.isSuccess ? q.data : [];
  return getValidators;
}
export const useBalances = (wallet?: string, account?: number): (() => Map<string, Amount>) => {
  const getViewService = useViewService(wallet);
  const q = useQuery({
    queryKey: ['Balances'],
    queryFn: ({ signal }): Promise<BalancesResponse[]> =>
      Array.fromAsync(getViewService().balances({ accountFilter: { account: account ? account : 0}})),
    select: (data: BalancesResponse[]) =>
      new Map(data.map(x =>
        [getMetadataFromBalancesResponse(x).base!, getAmount(x)]))
  })

  const getBalances = () => q.isSuccess ? q.data : new Map();
  return getBalances;
}

export const useAssets = (filter: PartialMessage<AssetsRequest>, wallet?: string, baseOnly?: boolean): (() => Map<string, Metadata>) => {
  const getViewService = useViewService(wallet);
  const q = useQuery({
    queryKey: [`Assets {${filter}} {${baseOnly}}`],
    queryFn: ({ signal }): Promise<AssetsResponse[]> =>
      Array.fromAsync(getViewService().assets(filter)),
    select: (data: AssetsResponse[]) =>
      new Map(data.filter((x,a,b) => !baseOnly || 
        x.denomMetadata?.base=='upenumbra' || x.denomMetadata?.base.startsWith("transfer")
      ).map(x =>
        [x.denomMetadata?.base!,x.denomMetadata]))
  })
  const getAssets = () => q.isSuccess ? q.data : new Map();
  return getAssets;
}

export const useLiquidity = (wallet?: string): (() => Position[]) => {
  const getDexService = useDexService(wallet);
  const q = useQuery({
    queryKey: [`Liquidity`],
    queryFn: ({ signal }): Promise<LiquidityPositionsResponse[]> =>
      Array.fromAsync(getDexService().liquidityPositions({})),
    select: (data: LiquidityPositionsResponse[]) =>
      data.map(x => x.data!)
  })
  const getLiquidity = () => q.isSuccess ? q.data! : []
  return getLiquidity;
}
export const simQuery = (a: AssetId, b: AssetId, size: Amount): SimulateTradeRequest => {
  console.log(a,b,size)
  return new SimulateTradeRequest({
    input: {
      amount: size,
      assetId: a
    },
    output: b,
    routing: {setting: {case: "singleHop", value: SimulateTradeRequest_Routing_SingleHop}}
  })
}

export const useSimulations = (reqs: SimulateTradeRequest[], wallet?: string): (() => SimulateTradeResponse[]) => {
  const getSimulationService = useSimulationService(wallet);
  const q = useQueries({
    queries: reqs.filter(r => r.input && r.output).map(r => {
      console.log(r)
      const size = formatAmount({amount: r.input?.amount!, exponent: 6});
      const b32In = bech32mAssetId(r.input?.assetId!);
      const b32Out = bech32mAssetId(r.output!);
      return {
        queryKey: [
          `Simulate ${size} : ${b32In} => ${b32Out}`
        ],
        queryFn: (): Promise<SimulateTradeResponse> =>
          getSimulationService().simulateTrade(r)
    }})
  })
  const getSimulations = () => q.filter(x => x.isSuccess).map(x => x.data)
  return getSimulations
}

export const useSimulation = (a:AssetId, b: AssetId, size: Amount, wallet?: string): (() => Amount) => {
  const getSimulationService = useSimulationService(wallet);
  const r = simQuery(a,b,size)
  const q = useQuery({
    queryKey: [`Simulate ${formatAmount({amount: size, exponent: 6})} : ${bech32mAssetId(a)} => ${bech32mAssetId(b)}`],
    queryFn: (): Promise<SimulateTradeResponse> =>
      getSimulationService().simulateTrade(r),
    select: (data: SimulateTradeResponse) => data.output?.output?.amount!
  })
  const getSimulation = () => q.isSuccess ? q.data! : new Amount({hi: 0n, lo: 0n})
  return getSimulation
}

export const useSpread = (a:string, b:string, wallet?: string): (()=>Map<string, number>) => {
  const getDexService = useDexService(wallet);
  const q = useQuery({
    queryKey: [`Spread {${a}} {${b}}`],
    queryFn: ({ signal }): Promise<SpreadResponse> => getDexService().spread({
      tradingPair: {asset1: assetIdFromBech32m(a), asset2: assetIdFromBech32m(b)}
    }),
    select: (data: SpreadResponse) => new Map([[`${a}:${b}`, data.approxEffectivePrice1To2]])
  })
  const getSpread = () => q.isSuccess ? q.data : new Map();
  return getSpread
}

export const useSpreads = (assets: Map<string, Metadata>, wallet?: string): (() => Map<[string,string], SpreadResponse>) => {
  const cprom = createPenumbraClient<typeof DexService>(DexService, wallet)
  const qs = useQueries({
    queries: Array.from(assets.keys()).flatMap(a => {
      return Array.from(assets.keys()).map(b => {return {
        queryKey: [`Spread {${assets.get(a)?.base}} {${assets.get(b)?.base}}`],
        queryFn: (): Promise<[[string, string], SpreadResponse]> =>
          cprom.then(c => {
            const tp:PartialMessage<TradingPair> = {asset1: assetIdFromBech32m(a), asset2: assetIdFromBech32m(b)};
            // console.log(tp);
            // console.log(`${tp.asset1! > tp.asset2!}`)
            return c.spread({tradingPair: tp}).then(r =>
              [[a,b],r])
            }
          )
      }})})
  })
  const getSpreads = () => {
    return new Map(qs.filter(x => x.isSuccess).map(x => x.data!))
  }
  return getSpreads
}
