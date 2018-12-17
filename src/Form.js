import React from "react";

export function Form({ fullNameRef, messageRef, onSubmit }) {
  return (
    <form onSubmit={e => e.preventDefault()} className="new-message-form">
      <div className="form-group">
        <label htmlFor="fullName">Full Name</label>
        <input
          type="text"
          autoComplete="off"
          className="form-control"
          id="fullName"
          aria-describedby="Full Name"
          placeholder="Enter Full Name"
          ref={fullNameRef}
        />
      </div>
      <div className="form-group">
        <label htmlFor="message">Message</label>
        <textarea
          className="form-control"
          id="mesage"
          rows="2"
          placeholder="Enter a message"
          ref={messageRef}
        />
      </div>
      <div>
        <button onClick={onSubmit} className="btn btn-primary">
          Add Message
        </button>
      </div>
    </form>
  );
}

export default React.memo(Form);
