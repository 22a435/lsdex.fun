import { SimulationService } from '@penumbra-zone/protobuf';
import { formatAmount } from '@penumbra-zone/types/amount';
import { Amount } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/num/v1/num_pb';
import { AssetId } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/asset/v1/asset_pb';
import { useQueries, useQuery } from '@tanstack/react-query';
import { bech32mAssetId } from '@penumbra-zone/bech32m/passet';
import { SimulateTradeRequest, SimulateTradeResponse } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/component/dex/v1/dex_pb';
import { client } from '@/src/lib/penumbra';

export const simQuery = (a: AssetId, b: AssetId, size: Amount): SimulateTradeRequest => {
  return new SimulateTradeRequest({
    input: {
      amount: size,
      assetId: a
    },
    output: b
  })
}

export const useSimulations = (reqs: SimulateTradeRequest[]): SimulateTradeResponse[] => {
  const q = useQueries({
    queries: reqs.filter(r => r.input && r.output).map(r => {
      const size = formatAmount({amount: r.input?.amount!, exponent: 6});
      const b32In = bech32mAssetId(r.input?.assetId!);
      const b32Out = bech32mAssetId(r.output!);
      return {
        queryKey: [
          `Simulate ${size} : ${b32In} => ${b32Out}`
        ],
        queryFn: (): Promise<SimulateTradeResponse> =>
          client.service(SimulationService).simulateTrade(r)
    }})
  })
  return q.filter(x => x.isSuccess).map(x => x.data)
}

export const useSimulation = (a:AssetId, b: AssetId, size: Amount): Amount => {
  const q = useQuery({
    queryKey: [`Simulate ${formatAmount({amount: size, exponent: 6})} : ${bech32mAssetId(a)} => ${bech32mAssetId(b)}`],
    queryFn: (): Promise<SimulateTradeResponse> =>
      client.service(SimulationService).simulateTrade(simQuery(a,b,size)),
    select: (data: SimulateTradeResponse) => data.output?.output?.amount!
  })
  return q.isSuccess ? q.data! : new Amount({hi: 0n, lo: 0n})
}
