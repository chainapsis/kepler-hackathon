import { BIP44 } from "@everett-protocol/cosmosjs/core/bip44";
import {
  Bech32Config,
  defaultBech32Config
} from "@everett-protocol/cosmosjs/core/bech32Config";

export interface ChainInfo {
  readonly rpc: string;
  readonly chainId: string;
  readonly chainName: string;
  readonly coinDenom: string;
  readonly coinMinimalDenom: string;
  readonly coinDecimals: number;
  readonly coinIconUrl: string;
  readonly walletUrl: string;
  readonly bip44: BIP44;
  readonly bech32Config: Bech32Config;
}

export const NativeChainInfos: ChainInfo[] = [
  {
    rpc: "http://localhost:81",
    chainId: "evrt0",
    chainName: "Cosmos",
    coinDenom: "ATOM",
    coinMinimalDenom: "uatom",
    coinDecimals: 6,
    coinIconUrl: require("assets/atom-icon.png"),
    walletUrl:
      process.env.NODE_ENV === "production"
        ? ""
        : "http://localhost:8081/#/evrt0",
    bip44: new BIP44(44, 118, 0),
    bech32Config: defaultBech32Config("cosmos")
  },
  {
    rpc: "http://localhost:82",
    chainId: "evrt1",
    chainName: "Everett",
    coinDenom: "EVRT",
    coinMinimalDenom: "uevrt",
    coinDecimals: 6,
    coinIconUrl: require("assets/everett-icon.svg"),
    walletUrl:
      process.env.NODE_ENV === "production"
        ? ""
        : "http://localhost:8081/#/evrt1",
    bip44: new BIP44(44, 118, 0),
    bech32Config: defaultBech32Config("cosmos")
  }
];

export interface AccessOrigin {
  chainId: string;
  origins: string[];
}

/**
 * This declares which origins can access extension without explicit approval.
 */
export const ExtensionAccessOrigins: AccessOrigin[] = [
  {
    chainId: "evrt0",
    origins: ["http://localhost:8081"]
  },
  {
    chainId: "evrt1",
    origins: ["http://localhost:8081"]
  }
];
