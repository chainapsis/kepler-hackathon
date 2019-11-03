import { Codec } from "@node-a-team/ts-amino";
import { MsgSwap } from "./msgs";

export function registerCodec(codec: Codec) {
  codec.registerConcrete("cosmos-sdk/MsgSwap", MsgSwap.prototype);
}
