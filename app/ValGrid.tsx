'use client';
// import dynamic from 'next/dynamic'

// import Image from "next/image";
// import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
// import { ColDef } from 'ag-grid-community';
// import { AgGridReact } from "ag-grid-react";
import React, { useEffect, useState, useMemo } from 'react';
// import { createConnectTransport } from "@connectrpc/connect-web";

// import dynamic from 'next/dynamic'
 
// const agd = dynamic(() => import('@ag-grid-community/react'), {
//   ssr: false,
// })
import { AgGridReact } from '@ag-grid-community/react';
import { ColDef } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import "@ag-grid-community/styles/ag-grid.css"
import "@ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the Data Grid
// import { createChannelTransport } from '@penumbra-zone/transport-dom/create';
// import { TransportProvider } from "@connectrpc/connect-query";
// import { useQuery, QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { useQuery } from '@connectrpc/connect-query'
// import { ViewService, jsonOptions, StakeService, DexService, SimulationService } from '@penumbra-zone/protobuf';
// import { createPromiseClient } from '@connectrpc/connect';
// import { createChannelTransport } from '@penumbra-zone/transport-dom/create';
// import { assertProvider } from '@penumbra-zone/client/create';
// import { bech32mAddress } from '@penumbra-zone/bech32m/penumbra';
import { bech32mIdentityKey } from '@penumbra-zone/bech32m/penumbravalid';

// import { getMetadataFromBalancesResponseOptional, getAmount } from '@penumbra-zone/getters/balances-response';
// import { getValidatorInfo } from '@penumbra-zone/getters/validator-info-response';
import { type ValidatorInfoResponse, type ValidatorInfo } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/component/stake/v1/stake_pb';
import { addAmounts, fromString, toDecimalExchangeRate, formatAmount, joinLoHiAmount } from '@penumbra-zone/types/amount';
import { Amount } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/num/v1/num_pb';
import { useValidators, useBalances, useAssets, useSimulations, simQuery } from './hooks';
import { bech32mAssetId } from '@penumbra-zone/bech32m/passet';
// import { addressByIndex } from "@buf/penumbra-zone_penumbra.connectrpc_query-es/penumbra/view/v1/view-ViewService_connectquery";
// import { Outlet } from 'react-router-dom';
// import { PenumbraProvider } from '@penumbra-zone/react';
// import { usePenumbraTransportSync } from '@penumbra-zone/react/hooks/use-penumbra-transport';
// import { TransportProvider } from '@connectrpc/connect-query';
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { usePenumbraServiceSync } from '@penumbra-zone/react/hooks/use-penumbra-service';

export default function ValGrid({ wallet }:{wallet?: string}) {
  const getValidators = useValidators(wallet);
  const getBalances = useBalances(wallet);
  const getAssets = useAssets({},wallet,false);
  const getDenom = () => new Map(Array.from(getAssets()).map(([k,v]) => {
    return [bech32mAssetId(v.penumbraAssetId!), k]
  }))
  console.log(getAssets())
  // const getBalances = useBalances(wallet);
  // const getUSDSims = useSimulations(Array.from(getAssets()).map(([k,v]) => {
  //   return simQuery(v.penumbraAssetId!,getAssets().get("transfer/channel-2/uusdc")?.penumbraAssetId!,fromString("1000000"))
  // }), wallet)
  const getUUMSims = useSimulations(getValidators().map(v => {
    return simQuery(
      getAssets().get(`udelegation_${bech32mIdentityKey(v.validator?.identityKey!)}`)?.penumbraAssetId!,
      getAssets().get("upenumbra")?.penumbraAssetId!,
      fromString("1000000")
    )
  }), wallet)

  const getOrElseZero = (x: string, y: Map<string, Amount>) => {
    return y.has(x) ? y.get(x)! : fromString("0")
  }
  // const getUSDValues = new Map(getUSDSims().map(r => [getDenom().get(bech32mAssetId(r.output?.input?.assetId!))!, r.output?.output?.amount!]))
  const getUUMValues = new Map(getUUMSims().map(r => [getDenom().get(bech32mAssetId(r.output?.input?.assetId!))!, r.output?.output?.amount!]))
  
  // console.log(getBalances())
  // console.log(getAssets())

  const t8 = fromString("100000000")
  interface ValRow {
    Name: string;
    IdentityKey: string;
    Delegations: number;
    Commission: number;
    RewardRate: number;
    ExchangeRate: number;
    Balance: number;
    ExchValue: number;
    SwapValue: Amount;
  }
  
  const getStake = (balances: Map<string, Amount>, v: ValidatorInfo): number => {
    const b = balances.get(`udelegation_${bech32mIdentityKey(v.validator?.identityKey!)}`)
    return b ? parseFloat(formatAmount({amount:b, exponent: 6, decimalPlaces: 3})) : 0
  }
  const rowData:ValRow[] = Array.from(getValidators()).map(v => {
    return {
      Name: v.validator?.name!,
      IdentityKey: bech32mIdentityKey(v.validator?.identityKey!),
      Delegations: parseInt(formatAmount({amount:v.status?.votingPower!,exponent:6})),
      Commission: 0,//sum(v.validator?.fundingStreams.map(f => f.recipient.value)),
      RewardRate: (Math.pow(toDecimalExchangeRate(addAmounts(t8, v.rateData?.validatorRewardRate!)),182)-1),
      ExchangeRate: toDecimalExchangeRate(v.rateData?.validatorExchangeRate!),
      Balance: getStake(getBalances(), v),
      ExchValue: getStake(getBalances(),v)*toDecimalExchangeRate(v.rateData?.validatorExchangeRate!),
      SwapValue: getOrElseZero(`udelegation_${bech32mIdentityKey(v.validator?.identityKey!)}`, getUUMValues)
    }
  });
  const colDefs = useMemo<ColDef<ValRow, any>[]>(() => [
    { headerName: 'Name', field: 'Name' },
    { headerName: 'IdentityKey', field: 'IdentityKey', hide: true },
    { headerName: 'Delegations', field: 'Delegations' },
    { headerName: 'Commission', field: 'Commission', hide: true },
    { headerName: 'RewardRate', valueFormatter: p =>
      (p.data?.RewardRate!*100).toFixed(2)+"%", field: 'RewardRate' },
    { headerName: 'ExchangeRate', field: 'ExchangeRate' },
    { headerName: 'Balance', field: 'Balance' },
    { headerName: 'Unbond Value (UM)', field: 'ExchValue' },
    { headerName: 'Swap Price (del(UM)/UM)', field: 'SwapValue', valueFormatter: p =>
      formatAmount({amount: p.data?.SwapValue!, exponent: 6})
    }
  ], []);

  const defaultColDef = useMemo(() => {
    return { width: 130, cellStyle: {}, };
  }, []);

  return < div className="ag-theme-quartz" style={{ height: 500 }} >
    <AgGridReact
      rowData={rowData}
      defaultColDef={defaultColDef}
      columnDefs={colDefs}
      modules={[ClientSideRowModelModule]}
    />
  </div> 
 
  // const AgGridReact = dynamic(() =>
  //   import('@ag-grid-community/react').then((mod) => mod.AgGridReact<MarketRow>),{ssr: false}
  // )
  // const v = useQuery(StakeService.methods.validatorInfo)



}