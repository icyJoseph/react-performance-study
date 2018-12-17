import React from "react";
import logo from "./logo.svg";

export function Header() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Testing <code>React</code> performance.
        </p>
      </header>
    </div>
  );
}

export default React.memo(Header);
