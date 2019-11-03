import React, { FunctionComponent, useState } from "react";
import { Input } from "../../../components/form";
import { RouteComponentProps } from "react-router-dom";
import { useStore } from "../../stores";

import { HeaderLayout } from "../../layouts/HeaderLayout";
import { Button } from "../../../components/button";
import { Result } from "../../../components/result";

import { PopupWalletProvider } from "../../wallet-provider";

import { Api } from "@everett-protocol/cosmosjs/core/api";
import { Rest } from "@everett-protocol/cosmosjs/core/rest";
import { Account } from "@everett-protocol/cosmosjs/core/account";
import {
  defaultTxEncoder,
  StdTx
} from "@everett-protocol/cosmosjs/common/stdTx";
import { stdTxBuilder } from "@everett-protocol/cosmosjs/common/stdTxBuilder";
import { queryAccount } from "@everett-protocol/cosmosjs/core/query";
import { GaiaRest } from "@everett-protocol/cosmosjs/gaia/rest";
import { Context } from "@everett-protocol/cosmosjs/core/context";
import { Codec } from "@node-a-team/ts-amino";
import * as Bank from "@everett-protocol/cosmosjs/x/bank";
import * as Crypto from "@everett-protocol/cosmosjs/crypto";
import { MsgSend } from "@everett-protocol/cosmosjs/x/bank";
import {
  AccAddress,
  useBech32Config,
  useBech32ConfigPromise
} from "@everett-protocol/cosmosjs/common/address";
import { Coin } from "@everett-protocol/cosmosjs/common/coin";
import { Int } from "@everett-protocol/cosmosjs/common/int";

import bigInteger from "big-integer";
import useForm from "react-hook-form";
import { observer } from "mobx-react";

import queryString from "query-string";

interface FormData {
  recipient: string;
  amount: string;
  memo: string;
}

// Don't need to be observer
export const SendPage: FunctionComponent<RouteComponentProps> = observer(
  ({ history }) => {
    const { register, handleSubmit, errors } = useForm<FormData>({
      defaultValues: {
        recipient: "",
        amount: "",
        memo: ""
      }
    });

    const { chainStore, accountStore } = useStore();
    const [loading, setLoading] = useState(false);

    return (
      <HeaderLayout
        showChainName
        canChangeChainInfo={false}
        onBackButton={() => {
          history.goBack();
        }}
      >
        <form
          onSubmit={handleSubmit(async (data: FormData) => {
            setLoading(true);

            const cosmosjs = new Api<Rest>(
              {
                chainId: chainStore.chainInfo.chainId,
                walletProvider: new PopupWalletProvider({
                  onRequestSignature: (index: string) => {
                    history.push(`/sign/${index}?inPopup=true`);
                  }
                }),
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
                  codec.registerConcrete("cosmos-sdk/StdTx", StdTx.prototype);
                  Crypto.registerCodec(codec);
                  // XXX: If cosmos-sdk/MsgSend has disambiguation bytes, it will not work
                  Bank.registerCodec(codec);
                }
              }
            );

            await cosmosjs.enable();

            // eslint-disable-next-line react-hooks/rules-of-hooks
            useBech32ConfigPromise(
              chainStore.chainInfo.bech32Config,
              async () => {
                const msg = new MsgSend(
                  AccAddress.fromBech32(accountStore.bech32Address),
                  AccAddress.fromBech32(data.recipient),
                  [Coin.parse(data.amount)]
                );

                try {
                  // TODO: change mode to commit.
                  const result = await cosmosjs.sendMsgs(
                    [msg],
                    {
                      gas: bigInteger(60000),
                      memo: data.memo,
                      fee: new Coin(
                        chainStore.chainInfo.coinMinimalDenom.toLowerCase(),
                        new Int("1000")
                      )
                    },
                    "sync"
                  );

                  if (result.mode === "sync") {
                    if (result.code !== 0) {
                      history.replace(`/send/result?error=${result.log}`);
                      return;
                    }
                  }

                  history.replace("/send/result");
                } catch (e) {
                  history.replace(`/send/result?error=${e.toString()}`);
                  return;
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
              validate: (value: string) => {
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
              validate: (value: string) => {
                try {
                  Coin.parse(value);
                } catch (e) {
                  return "Invalid amount";
                }
              }
            })}
          />
          <Input
            type="text"
            label="Memo (Optional)"
            name="memo"
            error={errors.memo && errors.memo.message}
            ref={register({ required: false })}
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
      </HeaderLayout>
    );
  }
);

export const SendResultPage: FunctionComponent<RouteComponentProps> = ({
  location,
  history
}) => {
  const query = queryString.parse(location.search);
  const error = query.error as string | undefined;

  return (
    <HeaderLayout showChainName canChangeChainInfo={false}>
      <Result
        status={error ? "error" : "success"}
        title={error ? "Transaction fails" : "Transaction succeeds"}
        subTitle={error ? error : "Wait a second. Tx will be commited soon."}
        extra={
          <Button
            size="medium"
            onClick={() => {
              history.replace("/");
            }}
          >
            Go to main
          </Button>
        }
      />
    </HeaderLayout>
  );
};
