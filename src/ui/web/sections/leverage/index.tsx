import React, { FunctionComponent, useEffect, useState } from "react";

import { Input } from "../../../components/form";

import classames from "classnames";
import style from "./styles.module.scss";
import { Button } from "../../../components/button";
import { observer } from "mobx-react";
import { useStore } from "../../stores";

import { queryAccount } from "@everett-protocol/cosmosjs/core/query";
import { ChainInfo } from "../../../../chain-info";
import { Api } from "@everett-protocol/cosmosjs/core/api";
import { Rest } from "@everett-protocol/cosmosjs/core/rest";
import { defaultTxEncoder } from "@everett-protocol/cosmosjs/common/stdTx";
import { stdTxBuilder } from "@everett-protocol/cosmosjs/common/stdTxBuilder";
import { Context } from "@everett-protocol/cosmosjs/core/context";
import { GaiaRest } from "@everett-protocol/cosmosjs/gaia/rest";
import { Account } from "@everett-protocol/cosmosjs/core/account";
import { Codec } from "@node-a-team/ts-amino";
import { Int } from "@everett-protocol/cosmosjs/common/int";

function decimalStrAmount(amount: Int, decimals: number): string {
  const decimalPoint = new Int(
    "1" +
      Array.from(new Array(decimals))
        .map(() => "0")
        .join("")
  );
  const integerPart = amount.div(decimalPoint);
  const fractionalPart = amount.mod(decimalPoint);

  const fractionalStr =
    Array.from(new Array(decimals - fractionalPart.toString().length))
      .map(() => "0")
      .join("") + fractionalPart.toString();
  return integerPart.toString() + "." + fractionalStr;
}

const getCosmosAPI = (chainInfo: ChainInfo): Api<Rest> => {
  return new Api<Rest>(
    {
      chainId: chainInfo.chainId,
      // TODO: handle null wallet provider.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      walletProvider: window.cosmosJSWalletProvider!,
      rpc: chainInfo.rpc,
      // No need.
      rest: chainInfo.rest,
      disableGlobalBech32Config: true
    },
    {
      txEncoder: defaultTxEncoder,
      txBuilder: stdTxBuilder,
      restFactory: (context: Context) => {
        return new GaiaRest(context);
      },
      queryAccount: (
        context: Context,
        address: string | Uint8Array
      ): Promise<Account> => {
        return queryAccount(
          context.get("bech32Config"),
          context.get("rpcInstance"),
          address
        );
      },
      bech32Config: chainInfo.bech32Config,
      bip44: chainInfo.bip44,
      registerCodec: (_: Codec) => {
        // noop
      }
    }
  );
};

export const LeverageSection: FunctionComponent = observer(() => {
  const { chainStore } = useStore();

  const [leverage, setLeverage] = useState("50");
  const [asset, setAsset] = useState(new Int(0));
  const [loading] = useState(false);

  const query = async () => {
    const hubChainInfo = chainStore.chainList.find(info => {
      return info.chainId === "evrt0";
    }) as ChainInfo;
    const api = getCosmosAPI(hubChainInfo);
    const keys = await api.getKeys();
    const address = keys[0].bech32Address;

    const account = await queryAccount(
      api.context.get("bech32Config"),
      api.context.get("rpcInstance"),
      address
    );

    const coin = account.getCoins().find(coin => {
      return coin.denom === "uatom";
    });
    if (coin) {
      setAsset(coin.amount);
    }
  };

  useEffect(() => {
    setTimeout(query, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="columns is-gapless">
      <div className="column is-6-widescreen is-7-tablet">
        <div className={style.sendFormColumn}>
          <div className={classames("card", style.card)}>
            <form
              onSubmit={() => {
                alert("Not yet implemented");
              }}
            >
              <label className="label">
                {`Leverage (x${parseInt(leverage) / 10})`}
              </label>
              <input
                className="slider is-fullwidth"
                step="1"
                min="10"
                max="100"
                value={leverage}
                type="range"
                onChange={e => {
                  setLeverage(e.target.value);
                }}
              />
              <Input
                type="text"
                label="Margin"
                value={`${decimalStrAmount(asset, 6) + " atom"}`}
              />
              <Input
                type="text"
                label="Effective Bond"
                value={
                  decimalStrAmount(
                    new Int(
                      asset
                        .mul(new Int(leverage))
                        .toString()
                        .slice(0, -1)
                    ),
                    6
                  ) + " atom"
                }
              />
              <Input
                type="text"
                label="Expected Reward (yearly)"
                value={
                  decimalStrAmount(
                    new Int(
                      new Int(
                        asset
                          .mul(new Int(leverage))
                          .toString()
                          .slice(0, -1)
                      )
                        .toString()
                        .slice(0, -1)
                    ),
                    6
                  ) + " atom"
                }
              />
              <Button
                type="submit"
                color="primary"
                size="medium"
                fullwidth
                loading={loading}
              >
                Send
              </Button>
            </form>
          </div>
        </div>
      </div>
      {/*<div className="column is-6-widescreen is-5-tablet">
        <div className={style.assetColumn}>
          <div className={classames("card")}>
            <div className="notification is-warning">
              Primar lorem ipsum dolor sit amet, consectetur adipiscing elit
              lorem ipsum dolor. <strong>Pellentesque risus mi</strong>, tempus
              quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit
              amet fringilla. Nullam gravida purus diam, et dictum{" "}
              <a>felis venenatis</a> efficitur. Sit amet, consectetur adipiscing
              elit
            </div>
          </div>
        </div>
      </div>*/}
    </div>
  );
});
