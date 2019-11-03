import { Amino } from "@node-a-team/ts-amino";
const { Field, DefineStruct } = Amino;
import { Msg } from "@everett-protocol/cosmosjs/core/tx";
import { AccAddress } from "@everett-protocol/cosmosjs/common/address";
import { Coin } from "@everett-protocol/cosmosjs/common/coin";

@DefineStruct()
export class MsgSwap extends Msg {
  @Field.Defined(0, {
    jsonName: "sender"
  })
  public sender: AccAddress;

  @Field.Defined(1, {
    jsonName: "asset"
  })
  public asset: Coin;

  @Field.String(2, {
    jsonName: "target_denom"
  })
  public targetDenom: string;

  constructor(sender: AccAddress, asset: Coin, targetDenom: string) {
    super();
    this.sender = sender;
    this.asset = asset;
    this.targetDenom = targetDenom;
  }

  public getSigners(): AccAddress[] {
    return [this.sender];
  }

  public validateBasic(): void {
    // noop
  }
}
