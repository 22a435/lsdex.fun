import { ViewService } from '@penumbra-zone/protobuf';
import { Amount } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/num/v1/num_pb';
import { AssetsRequest, AssetsResponse, BalancesResponse } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/view/v1/view_pb';
import { getMetadataFromBalancesResponse, getAmount } from '@penumbra-zone/getters/balances-response';
import { Metadata } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/asset/v1/asset_pb';
import { useQuery } from '@tanstack/react-query';
import type { PartialMessage } from "@bufbuild/protobuf";
import { client } from './penumbra';

export const useBalances = (wallet?: string, account?: number): (() => Map<string, Amount>) => {
  const getViewService = client.service(ViewService);
  const q = useQuery({
    queryKey: ['Balances'],
    queryFn: ({ signal }): Promise<BalancesResponse[]> =>
      Array.fromAsync(getViewService.balances({ accountFilter: { account: account ? account : 0}})),
    select: (data: BalancesResponse[]) =>
      new Map(data.map(x =>
        [getMetadataFromBalancesResponse(x).base!, getAmount(x)]))
  })

  const getBalances = () => q.isSuccess ? q.data : new Map();
  return getBalances;
}

export const useAssets = (filter: PartialMessage<AssetsRequest>, wallet?: string, baseOnly?: boolean): (() => Map<string, Metadata>) => {
  const getViewService = client.service(ViewService);
  const q = useQuery({
    queryKey: [`Assets {${filter}} {${baseOnly}}`],
    queryFn: ({ signal }): Promise<AssetsResponse[]> =>
      Array.fromAsync(getViewService.assets(filter)),
    select: (data: AssetsResponse[]) =>
      new Map(data.filter((x,a,b) => !baseOnly || 
        x.denomMetadata?.base=='upenumbra' || x.denomMetadata?.base.startsWith("transfer")
      ).map(x =>
        [x.denomMetadata?.base!,x.denomMetadata]))
  })
  const getAssets = () => q.isSuccess ? q.data : new Map();
  return getAssets;
}