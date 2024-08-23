import { ViewService } from '@penumbra-zone/protobuf';
import { Amount } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/num/v1/num_pb';
import { AssetsRequest, AssetsResponse, BalancesResponse, OwnedPositionIdsResponse } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/view/v1/view_pb';
import { getMetadataFromBalancesResponse, getAmount } from '@penumbra-zone/getters/balances-response';
import { Metadata } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/asset/v1/asset_pb';
import { useQuery } from '@tanstack/react-query';
import type { PartialMessage } from "@bufbuild/protobuf";
import {bech32mPositionId} from "@penumbra-zone/bech32m/plpid"
import { client } from '@/src/lib/penumbra'

export const useAssets = (filter: PartialMessage<AssetsRequest>): Map<string, Metadata> => {
  const q = useQuery({
    queryKey: [`Assets {${filter}}`],
    queryFn: (): Promise<AssetsResponse[]> =>
      Array.fromAsync(client.service(ViewService).assets(filter)),
    select: (data: AssetsResponse[]) =>
      new Map(data.map(x =>
        [x.denomMetadata?.base!,x.denomMetadata]))
  })
  return q.isSuccess ? q.data : new Map();
}

export const useBalances = (account?: number): Map<string, Amount> => {
  const q = useQuery({
    queryKey: ['Balances'],
    queryFn: (): Promise<BalancesResponse[]> =>
      Array.fromAsync(client.service(ViewService).balances({
        accountFilter: { account: account ? account : 0}
      })),
    select: (data: BalancesResponse[]) =>
      new Map(data.map(x =>
        [getMetadataFromBalancesResponse(x).base!, getAmount(x)]))
  })
  return q.isSuccess ? q.data : new Map();
}

export const useOwnedPositionIds = (): Set<string> => {
  const q = useQuery({
    queryKey: ['Owned Positions'],
    queryFn: (): Promise<OwnedPositionIdsResponse[]> =>
      Array.fromAsync(client.service(ViewService).ownedPositionIds({
        // positionState: {state: PositionState_PositionStateEnum.OPENED}
      })),
    select: (data: OwnedPositionIdsResponse[]) => new Set(data.map(x => bech32mPositionId(x.positionId!)))
  })
  return q.isSuccess ? q.data : new Set();
}