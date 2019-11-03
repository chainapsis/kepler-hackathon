import React, { FunctionComponent } from "react";

import { observer } from "mobx-react";
import { useStore } from "../../stores";
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

export const TokenInfo: FunctionComponent = observer(() => {
  const { chainStore, accountStore } = useStore();

  const tokens = accountStore.assets.filter(asset => {
    return asset.denom !== chainStore.chainInfo.coinMinimalDenom;
  });

  return (
    <div>
      <div style={{ fontSize: "24px" }}>Tokens</div>
      {tokens.map(token => {
        return (
          <div style={{ fontSize: "20px" }} key={token.denom}>
            {decimalStrAmount(token.amount, 6) + " " + token.denom}
          </div>
        );
      })}
    </div>
  );
});
