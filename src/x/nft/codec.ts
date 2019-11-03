import { Codec } from "@node-a-team/ts-amino";
import { MsgTransferNFT } from "./msgs";

export function registerCodec(codec: Codec) {
  codec.registerConcrete("cosmos-sdk/MsgTransferNFT", MsgTransferNFT.prototype);
}
