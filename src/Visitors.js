import React from "react";
import Visitor from "./Visitor";

export function Visitors({ visitors }) {
  return (
    <ul className="list-group">
      {visitors.map(({ id, ...visitor }) => (
        <Visitor key={id} {...visitor} visitorId={id} />
      ))}
    </ul>
  );
}

export default Visitors;
