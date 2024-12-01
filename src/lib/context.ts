import { Metadata } from "@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb";
import { Position, SimulateTradeResponse } from "@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb";
import { ValidatorInfo } from "@penumbra-zone/protobuf/penumbra/core/component/stake/v1/stake_pb";
import { Amount } from "@penumbra-zone/protobuf/penumbra/core/num/v1/num_pb";
import { Context, createContext } from "react";

export const assetsContext:Context<Map<string, Metadata>> = createContext(new Map());
export const denomsContext:Context<Map<string, string>> = createContext(new Map());
export const balancesContext:Context<Map<string, Amount>> = createContext(new Map());
export const ownedPositionIdsContext:Context<Set<string>> = createContext(new Set());

export const validatorsContext:Context<ValidatorInfo[]> = createContext(new Array());

export const liquidityContext:Context<Map<string, Position>> = createContext(new Map());
//spreads

export const simulationsContext:Context<SimulateTradeResponse[]> = createContext(new Array());
export const usdPricesContext:Context<Map<string, Amount>> = createContext(new Map());
export const umPricesContext:Context<Map<string, Amount>> = createContext(new Map());

