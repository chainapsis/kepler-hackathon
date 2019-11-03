import { Amino, Type } from "@node-a-team/ts-amino";
const { Field, DefineStruct } = Amino;
import { Msg } from "@everett-protocol/cosmosjs/core/tx";
import { AccAddress } from "@everett-protocol/cosmosjs/common/address";
import { Coin } from "@everett-protocol/cosmosjs/common/coin";
import { Int } from "@everett-protocol/cosmosjs/common/int";

@DefineStruct()
export class MsgTransfer extends Msg {
  @Field.String(0, {
    jsonName: "chain_id"
  })
  public chanId: string;

  @Field.Slice(
    1,
    { type: Type.Defined },
    {
      jsonName: "amount"
    }
  )
  public amount: Coin[];

  @Field.Defined(2, {
    jsonName: "sender"
  })
  public sender: AccAddress;

  @Field.Defined(3, {
    jsonName: "receiver"
  })
  public receiver: AccAddress;

  constructor(
    chanId: string,
    amount: Coin[],
    sender: AccAddress,
    receiver: AccAddress
  ) {
    super();
    this.chanId = chanId;
    this.amount = amount;
    this.sender = sender;
    this.receiver = receiver;
  }

  public getSigners(): AccAddress[] {
    return [this.sender];
  }

  public validateBasic(): void {
    for (const coin of this.amount) {
      if (coin.amount.lte(new Int(0))) {
        throw new Error("Send amount is invalid");
      }
    }
  }
}
