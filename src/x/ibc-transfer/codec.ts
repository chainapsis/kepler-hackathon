import { Codec } from "@node-a-team/ts-amino";
import { MsgTransfer } from "./msgs";

export function registerCodec(codec: Codec) {
  codec.registerConcrete("ibc/Transfer", MsgTransfer.prototype);
}
