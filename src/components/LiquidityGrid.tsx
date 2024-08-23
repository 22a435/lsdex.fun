'use client';

import React, { useMemo } from 'react';
import { AgGridReact } from '@ag-grid-community/react';
import { ColDef } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import "@ag-grid-community/styles/ag-grid.css"
import "@ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the Data Grid
import { fromString, formatAmount, divideAmounts, multiplyAmountByNumber } from '@penumbra-zone/types/amount';
import { Amount } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/num/v1/num_pb';
import { bech32mAssetId } from '@penumbra-zone/bech32m/passet';
import { Metadata } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/asset/v1/asset_pb';
import { Position } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/component/dex/v1/dex_pb';


export default function LiquidityGrid({ assets, liquidity, ownedIds }: { assets: Map<string, Metadata>, liquidity: Map<string,Position>, ownedIds: Set<string> }) {

  const getDenom = new Map(Array.from(assets).map(([k,v]) => {
    return [bech32mAssetId(v.penumbraAssetId!), k]
  }))

  const t8 = fromString("100000000")
  interface LiquidityRow {
    Fee: number;
    P: Amount;
    Q: Amount;
    Bid: string;
    Ask: string;
    R1: Amount;
    R2: Amount;
    Asset1: string;
    Asset2: string;
    State: string;
    Owned: boolean;
  }

  const rowData: LiquidityRow[] = Array.from(liquidity).map(([pid, lp]) => {
    const Fee = lp.phi?.component?.fee!;
    const P = lp.phi?.component?.p!;
    const Q = lp.phi?.component?.q!;
    const R1 = lp.reserves?.r1!;
    const R2 = lp.reserves?.r2!;
    const sym1 = assets.get(getDenom.get(bech32mAssetId(lp.phi?.pair?.asset1!))!)?.symbol!;
    const base1 = assets.get(getDenom.get(bech32mAssetId(lp.phi?.pair?.asset1!))!)?.base!;
    const sym2 = assets.get(getDenom.get(bech32mAssetId(lp.phi?.pair?.asset2!))!)?.symbol!;
    const base2 = assets.get(getDenom.get(bech32mAssetId(lp.phi?.pair?.asset2!))!)?.base!;
    return {
      Fee: Fee,
      P: P,
      Q: Q,
      Bid: `${divideAmounts(multiplyAmountByNumber(P, 1 - parseFloat(Fee.toString()) / 10000), Q).toFixed(4)} : ${divideAmounts(multiplyAmountByNumber(P, 1 + parseFloat(Fee.toString()) / 10000), Q).toFixed(4)}`,
      Ask: `${divideAmounts(multiplyAmountByNumber(Q, 1 - parseFloat(Fee.toString()) / 10000), P).toFixed(4)} : ${divideAmounts(multiplyAmountByNumber(Q, 1 + parseFloat(Fee.toString()) / 10000), P).toFixed(4)}`,
      R1: R1,
      R2: R2,
      Asset1: sym1,
      Asset2: sym2,
      State: lp.state?.state.toString()!,
      Owned: ownedIds.has(pid)
    }
  });
  const colDefs = useMemo<ColDef<LiquidityRow, any>[]>(() => [
    {
      headerName: 'Fee', field: 'Fee', valueFormatter: p =>
        `${(parseFloat(p.data?.Fee?.toString()!) / 100).toFixed(2)!}%`
    },
    {
      headerName: 'P', field: 'P', hide: true, valueFormatter: p =>
        formatAmount({ amount: p.data?.P! })
    },
    {
      headerName: 'Q', field: 'Q', hide: true, valueFormatter: p =>
        formatAmount({ amount: p.data?.Q! })
    },
    {
      headerName: 'R1/R2', field: 'Bid', valueFormatter: p =>
        p.data?.Bid!
    },
    {
      headerName: 'R2/R1', field: 'Ask', valueFormatter: p =>
        p.data?.Ask!
    },

    {
      headerName: 'R1', field: 'R1', valueFormatter: p =>
        formatAmount({ amount: p.data?.R1!, exponent: 6 })
    },
    {
      headerName: 'R2', field: 'R2', valueFormatter: p =>
        formatAmount({ amount: p.data?.R2!, exponent: 6 })
    },
    {
      headerName: 'Asset1', field: 'Asset1'
    },
    {
      headerName: 'Asset2', field: 'Asset2'
    },
    { headerName: 'State', field: 'State' },
    { headerName: 'Owned', field: 'Owned' }
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