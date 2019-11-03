import React from "react";

import { HeaderLayout } from "../../layouts/HeaderLayout";

import { AccountInfo } from "./account-info";
import { TokenInfo } from "./token";

import style from "./style.module.scss";
import { Button } from "../../../components/button";
import { observer } from "mobx-react";
import { useStore } from "../../stores";

const Test: React.FunctionComponent = observer(() => {
  const { keyRingStore } = useStore();

  return (
    <aside className="menu">
      <p className="menu-label">General</p>
      <ul className="menu-list">
        <li>
          <a>Test</a>
        </li>
        <Button
          onClick={() => {
            keyRingStore.clear();
          }}
        >
          Clear
        </Button>
      </ul>
    </aside>
  );
});

export class MainPage extends React.Component {
  public render() {
    return (
      <HeaderLayout showChainName canChangeChainInfo menuRenderer={<Test />}>
        <div className={style.containerAccount}>
          <AccountInfo />
        </div>
        <div className={style.containerTxs}>
          <TokenInfo />
        </div>
      </HeaderLayout>
    );
  }
}
