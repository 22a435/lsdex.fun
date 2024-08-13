import { useCallback, useEffect, useState } from 'react';
import { ViewService } from '@penumbra-zone/protobuf';
import { bech32mAddress } from '@penumbra-zone/bech32m/penumbra';
import { joinLoHiAmount } from '@penumbra-zone/types/amount';
import { getMetadataFromBalancesResponseOptional, getAmount } from '@penumbra-zone/getters/balances-response';
import { client } from './penumbra';


export const fetchAddress = async (account: number): Promise<string | undefined> => {
  const viewService = client.service(ViewService);
  const res = await viewService.addressByIndex({ addressIndex: { account } });
  return res?.address && bech32mAddress(res.address);
};

export const fetchBalances = async (account: number): Promise<string[]> => {
  const viewService = client.service(ViewService);
  const iterable = viewService.balances({ accountFilter: { account: account } });
  const balances = await Array.fromAsync(iterable);

  return balances.map((balance) => {
    const metadata = getMetadataFromBalancesResponseOptional(balance);
    const metadataSymbol = metadata?.symbol;
    const amount = getAmount(balance);

    if (metadataSymbol && amount) {
      const joinedAmount = joinLoHiAmount(amount).toString();
      return `${metadataSymbol}: ${joinedAmount}`;
    }
    return '';
  }).filter(Boolean);
};

export const useInfo = (connectedWallet?: string) => {
  const [address, setAddress] = useState<string>();
  const [balances, setBalances] = useState<string[]>([]);

  const fetchInfo = useCallback(async () => {
    if (!connectedWallet) {
      setAddress(undefined);
      setBalances([]);
    } else {
      setAddress(await fetchAddress(0));
      setBalances(await fetchBalances(0));
    }
  }, [connectedWallet, setAddress]);

  useEffect(() => {
    fetchInfo();
  }, [connectedWallet, fetchInfo]);

  return { address, balances };
};
