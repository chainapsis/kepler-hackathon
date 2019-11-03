import React, { FunctionComponent, useState } from "react";

import { Input } from "../../../../components/form";

import classames from "classnames";
import style from "./styles.module.scss";
import { Button } from "../../../../components/button";
import { Dropdown } from "../../../../components/dropdown";
import useForm from "react-hook-form";
import { observer } from "mobx-react";
import { useStore } from "../../../stores";
import {
  AccAddress,
  useBech32Config,
  useBech32ConfigPromise
} from "@everett-protocol/cosmosjs/common/address";
import { Coin } from "@everett-protocol/cosmosjs/common/coin";
import { Api } from "@everett-protocol/cosmosjs/core/api";
import { Rest } from "@everett-protocol/cosmosjs/core/rest";
import {
  defaultTxEncoder,
  StdTx
} from "@everett-protocol/cosmosjs/common/stdTx";
import { stdTxBuilder } from "@everett-protocol/cosmosjs/common/stdTxBuilder";
import { Context } from "@everett-protocol/cosmosjs/core/context";
import { GaiaRest } from "@everett-protocol/cosmosjs/gaia/rest";
import { Account } from "@everett-protocol/cosmosjs/core/account";
import { queryAccount } from "@everett-protocol/cosmosjs/core/query";
import { Codec } from "@node-a-team/ts-amino";
import * as Crypto from "@everett-protocol/cosmosjs/crypto";
import bigInteger from "big-integer";
import { Int } from "@everett-protocol/cosmosjs/common/int";
import { useNotification } from "../../../../components/notification";

import classnames from "classnames";
import { MsgTransfer, registerCodec } from "../../../../../x/ibc-transfer";
import { Channels } from "../../../channels";

interface FormData {
  readonly recipient: string;
  readonly amount: string;
}

export const IBCTransferSection: FunctionComponent = observer(() => {
  const { register, handleSubmit, setValue, errors } = useForm<FormData>({
    defaultValues: {
      recipient: "",
      amount: ""
    }
  });

  const { chainStore } = useStore();

  const [loading, setLoading] = useState(false);

  const notification = useNotification();

  const clearForm = () => {
    setValue("recipient", "");
    setValue("amount", "");
  };

  const targetChains = chainStore.chainList.filter(chain => {
    return chain.chainId !== chainStore.chainInfo.chainId;
  });

  const [selectedTargetChain, setSelectedTargetChain] = useState(
    targetChains[0].chainId
  );

  return (
    <div className="columns is-gapless">
      <div className="column is-6-widescreen is-7-tablet">
        <div className={style.sendFormColumn}>
          <div className={classames("card", style.card)}>
            <label className="label">To</label>
            <div style={{ marginBottom: "16px" }}>
              {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
              <Dropdown
                title={
                  chainStore.chainList.find(
                    info => info.chainId === selectedTargetChain
                  )!.chainName
                }
              >
                {targetChains.map(chainInfo => {
                  const title = `${chainInfo.chainName} (${chainInfo.chainId})`;
                  return (
                    <div
                      className={classnames("dropdown-item", {
                        "is-active": selectedTargetChain === chainInfo.chainId
                      })}
                      key={title}
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        setSelectedTargetChain(chainInfo.chainId);
                      }}
                    >
                      {title}
                    </div>
                  );
                })}
              </Dropdown>
            </div>
            <form
              onSubmit={handleSubmit(async data => {
                const cosmosjs = new Api<Rest>(
                  {
                    chainId: chainStore.chainInfo.chainId,
                    // TODO: handle null wallet provider.
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    walletProvider: window.cosmosJSWalletProvider!,
                    rpc: chainStore.chainInfo.rpc,
                    // No need.
                    rest: "",
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
                    bech32Config: chainStore.chainInfo.bech32Config,
                    bip44: chainStore.chainInfo.bip44,
                    registerCodec: (codec: Codec) => {
                      codec.registerConcrete(
                        "cosmos-sdk/StdTx",
                        StdTx.prototype
                      );
                      Crypto.registerCodec(codec);
                      registerCodec(codec);
                    }
                  }
                );

                await cosmosjs.enable();

                setLoading(true);

                const keys = await cosmosjs.getKeys();

                // This is not react hook.
                // eslint-disable-next-line react-hooks/rules-of-hooks
                useBech32ConfigPromise(
                  chainStore.chainInfo.bech32Config,
                  async () => {
                    const msg = new MsgTransfer(
                      ((Channels.transfer as any)[
                        chainStore.chainInfo.chainId
                      ] as any)[selectedTargetChain],
                      [Coin.parse(data.amount)],
                      new AccAddress(keys[0].address),
                      AccAddress.fromBech32(data.recipient)
                    );

                    try {
                      // TODO: change mode to commit.
                      const result = await cosmosjs.sendMsgs(
                        [msg],
                        {
                          gas: bigInteger(60000),
                          memo: "",
                          fee: new Coin(
                            chainStore.chainInfo.coinMinimalDenom.toLowerCase(),
                            new Int("0")
                          )
                        },
                        "commit"
                      );

                      if (result.mode === "commit") {
                        if (result.checkTx.code || result.deliverTx.code) {
                          notification.push({
                            type: "danger",
                            content: result.deliverTx.log
                              ? result.deliverTx.log
                              : result.checkTx.log
                              ? result.checkTx.log
                              : "",
                            duration: 5,
                            canDelete: true,
                            placement: "top-right",
                            transition: {
                              duration: 0.25
                            }
                          });
                        } else {
                          notification.push({
                            type: "success",
                            content: "Wait a second. Tx will be commited soon.",
                            duration: 5,
                            canDelete: true,
                            placement: "top-right",
                            transition: {
                              duration: 0.25
                            }
                          });
                        }
                      }
                    } catch (e) {
                      notification.push({
                        type: "danger",
                        content: e.toString(),
                        duration: 5,
                        canDelete: true,
                        placement: "top-right",
                        transition: {
                          duration: 0.25
                        }
                      });
                    } finally {
                      clearForm();
                      setLoading(false);
                    }
                  }
                );
              })}
            >
              <Input
                type="text"
                label="Recipient"
                name="recipient"
                error={errors.recipient && errors.recipient.message}
                ref={register({
                  required: "Recipient is required",
                  validate: value => {
                    // This is not react hook.
                    // eslint-disable-next-line react-hooks/rules-of-hooks
                    return useBech32Config(
                      chainStore.chainInfo.bech32Config,
                      () => {
                        try {
                          AccAddress.fromBech32(value);
                        } catch (e) {
                          return "Invalid address";
                        }
                      }
                    );
                  }
                })}
              />
              <Input
                type="text"
                label="Amount"
                name="amount"
                error={errors.amount && errors.amount.message}
                ref={register({
                  required: "Amount is required",
                  validate: value => {
                    try {
                      Coin.parse(value);
                    } catch (e) {
                      return "Invalid amount";
                    }
                  }
                })}
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
