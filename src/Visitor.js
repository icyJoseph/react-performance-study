import React, { Component } from "react";

// shallow comparisson of props,
// {id: 1, name: 2} !== {id:2, name:3}
// but fails to do {id: 1, name:2, dates: [{...}]}
class Visitor extends Component {
  shouldComponentUpdate(nextProps) {
    if (nextProps.visitorId !== this.props.visitorId) {
      return true;
    }
    return false;
  }

  render() {
    const { fullName, message, visitDate } = this.props;
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
}

export default Visitor;
