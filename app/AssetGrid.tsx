'use client';

import React, { useMemo } from 'react';
import { AgGridReact } from '@ag-grid-community/react';
import { ColDef } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import "@ag-grid-community/styles/ag-grid.css"
import "@ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the Data Grid
import { fromString, formatAmount } from '@penumbra-zone/types/amount';
import { Amount } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/num/v1/num_pb';
import { bech32mAssetId } from '@penumbra-zone/bech32m/passet';
import { AssetId, Metadata } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/asset/v1/asset_pb';

export default function AssetGrid({ assets, balances, usdPrices, umPrices }: { assets: Map<string, Metadata>, balances: Map<string, Amount>, usdPrices: Map<string, Amount>, umPrices: Map<string, Amount> }) {
  const denoms = new Map(Array.from(assets).map(([k, v]) => {
    return [bech32mAssetId(v.penumbraAssetId!), k]
  }))

  const getOrElseZero = (x: string, y: Map<string, Amount>) => {
    return y.has(x) ? y.get(x)! : fromString("0")
  }

  const t8 = fromString("100000000")
  interface AssetRow {
    Base: string;
    MetaData: string;
    Symbol: string;
    Name: string;
    Description: string;
    AssetId: AssetId;
    USDValue: Amount;
    UUMValue: Amount;
  }

  const rowData: AssetRow[] = Array.from(assets).filter(p =>
    p[1].base.startsWith("transfer") || p[1].base == "upenumbra").map(([k, v]) => {
      return {
        Base: k,
        MetaData: v.toJsonString(),
        Symbol: v.symbol,
        Name: v.name,
        Description: v.description,
        AssetId: v.penumbraAssetId!,
        USDValue: getOrElseZero(v.base, usdPrices),
        UUMValue: getOrElseZero(v.base, umPrices)
      }
    });
  const colDefs = useMemo<ColDef<AssetRow, any>[]>(() => [
    { headerName: 'Base', field: 'Base' },
    { headerName: 'MetaData', field: 'MetaData', hide: true },
    { headerName: 'Symbol', field: 'Symbol' },
    { headerName: 'Name', field: 'Name' },
    { headerName: 'Description', field: 'Description', hide: true },
    {
      headerName: 'AssetId', field: 'AssetId', valueFormatter: p =>
        bech32mAssetId(p.data?.AssetId!)

    },
    {
      headerName: '$ Price', field: 'USDValue', valueFormatter: p =>
        formatAmount({ amount: p.data?.USDValue!, exponent: 6 })
    },
    {
      headerName: 'UM Price', field: 'UUMValue', valueFormatter: p =>
        formatAmount({ amount: p.data?.UUMValue!, exponent: 6 })
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