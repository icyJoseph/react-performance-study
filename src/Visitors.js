import React from "react";

export function Visitors({ visitors }) {
  return (
    <ul className="list-group">
      {visitors.map(({ id, fullName, message, visitDate }) => (
        <li
          key={id}
          className="list-group-item d-flex-column justify-content-between align-items-center"
        >
          <div className="lead">{fullName}</div>
          <div className="text-secondary light-text">{message}</div>
          <div className="text-muted light-text">
            <em>{visitDate}</em>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default Visitors;
