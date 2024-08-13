'use client';

import React, { useMemo } from 'react';
import { AgGridReact } from '@ag-grid-community/react';
import { ColDef } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import "@ag-grid-community/styles/ag-grid.css"
import "@ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the Data Grid
import { bech32mIdentityKey } from '@penumbra-zone/bech32m/penumbravalid';
import { type ValidatorInfo } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/component/stake/v1/stake_pb';
import { addAmounts, fromString, toDecimalExchangeRate, formatAmount } from '@penumbra-zone/types/amount';
import { Amount } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/num/v1/num_pb';
import { bech32mAssetId } from '@penumbra-zone/bech32m/passet';
import { Metadata } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/asset/v1/asset_pb';

export default function ValGrid({ assets, balances, umPrices, validators }:{assets: Map<string, Metadata>, balances: Map<string, Amount>, umPrices: Map<string, Amount>, validators: ValidatorInfo[]}) {
  const denoms = new Map(Array.from(assets).map(([k,v]) => {
    return [bech32mAssetId(v.penumbraAssetId!), k]
  }))

  const getOrElseZero = (x: string, y: Map<string, Amount>) => {
    return y.has(x) ? y.get(x)! : fromString("0")
  }

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
    SwapPrice: Amount;
  }
  
  const getStake = (balances: Map<string, Amount>, v: ValidatorInfo): number => {
    const b = balances.get(`udelegation_${bech32mIdentityKey(v.validator?.identityKey!)}`)
    return b ? parseFloat(formatAmount({amount:b, exponent: 6, decimalPlaces: 3})) : 0
  }
  const rowData:ValRow[] = Array.from(validators).map(v => {
    return {
      Name: v.validator?.name!,
      IdentityKey: bech32mIdentityKey(v.validator?.identityKey!),
      Delegations: parseInt(formatAmount({amount:v.status?.votingPower!,exponent:6})),
      Commission: 0,//sum(v.validator?.fundingStreams.map(f => f.recipient.value)),
      RewardRate: (Math.pow(toDecimalExchangeRate(addAmounts(t8, v.rateData?.validatorRewardRate!)),182)-1),
      ExchangeRate: toDecimalExchangeRate(v.rateData?.validatorExchangeRate!),
      Balance: getStake(balances, v),
      ExchValue: getStake(balances,v)*toDecimalExchangeRate(v.rateData?.validatorExchangeRate!),
      SwapPrice: getOrElseZero(`udelegation_${bech32mIdentityKey(v.validator?.identityKey!)}`, umPrices)
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
    { headerName: 'Swap Price (del(UM)/UM)', field: 'SwapPrice', valueFormatter: p =>
      formatAmount({amount: p.data?.SwapPrice!, exponent: 6})
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
}