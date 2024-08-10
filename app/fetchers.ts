import { ViewService, StakeService } from '@penumbra-zone/protobuf';
import { createPenumbraClient } from '@penumbra-zone/client/create';
import { bech32mAddress } from '@penumbra-zone/bech32m/penumbra';
import { joinLoHiAmount } from '@penumbra-zone/types/amount';
import { getMetadataFromBalancesResponseOptional, getAmount } from '@penumbra-zone/getters/balances-response';
import { useCallback, useEffect, useState } from 'react';

const createFetchClient = (wallet: string) => {
  return createPenumbraClient<typeof ViewService>(ViewService, wallet);
};

export const fetchAddress = async (wallet: string, account: number): Promise<string | undefined> => {
  const client = await createFetchClient(wallet);
  const res = await client.addressByIndex({ addressIndex: { account } });
  return res?.address && bech32mAddress(res.address);
};

export const fetchBalances = async (wallet: string, account: number): Promise<string[]> => {
  const client = await createFetchClient(wallet);
  const iterable = client.balances({ accountFilter: { account: account } });
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
      setAddress(await fetchAddress(connectedWallet, 0));
      setBalances(await fetchBalances(connectedWallet, 0));
    }
  }, [connectedWallet, setAddress]);

  useEffect(() => {
    fetchInfo();
  }, [connectedWallet, fetchInfo]);

  return { address, balances };
};
