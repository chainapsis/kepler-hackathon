import { Amino } from "@node-a-team/ts-amino";
const { Field, DefineStruct } = Amino;
import { Msg } from "@everett-protocol/cosmosjs/core/tx";
import { AccAddress } from "@everett-protocol/cosmosjs/common/address";

@DefineStruct()
export class MsgTransferNFT extends Msg {
  @Field.Defined(0, {
    jsonName: "Sender"
  })
  public sender: AccAddress;

  @Field.Defined(1, {
    jsonName: "Recipient"
  })
  public recipient: AccAddress;

  @Field.String(2, {
    jsonName: "Denom"
  })
  public denom: string;

  @Field.String(3, {
    jsonName: "ID"
  })
  public id: string;

  constructor(
    sender: AccAddress,
    recipient: AccAddress,
    denom: string,
    id: string
  ) {
    super();
    this.sender = sender;
    this.recipient = recipient;
    this.denom = denom;
    this.id = id;
  }

  public getSigners(): AccAddress[] {
    return [this.sender];
  }

  public validateBasic(): void {
    // noop
  }
}
