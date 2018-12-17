import React from "react";

function Visitor({ fullName, message, visitDate }) {
  return (
    <li className="list-group-item d-flex-column justify-content-between align-items-center">
      <div className="lead">{fullName}</div>
      <div className="text-secondary light-text">{message}</div>
      <div className="text-muted light-text">
        <em>{visitDate}</em>
      </div>
    </li>
  );
}

export default React.memo(Visitor);
