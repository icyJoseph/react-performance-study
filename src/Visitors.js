import React from "react";

export function Visitors({ visitors }) {
  // the issue highlighted in App.js, ends up here
  // when visitors extends one element, all items li items will get a new index
  return (
    <ul className="list-group">
      {visitors.map((visitor, index) => (
        <li
          key={index}
          className="list-group-item d-flex-column justify-content-between align-items-center"
        >
          <div className="lead">{visitor.fullName}</div>
          <div className="text-secondary light-text">{visitor.message}</div>
          <div className="text-muted light-text">
            <em>{visitor.visitDate}</em>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default Visitors;
