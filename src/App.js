import React, { Component } from "react";
import axios from "axios";

import Header from "./Header";
import Form from "./Form";
import Visitors from "./Visitors";

import "./App.css";

class App extends Component {
  state = {
    visitors: []
  };

  fullName = React.createRef();
  message = React.createRef();

  async componentDidMount() {
    const visitors = await axios
      .get("http://localhost:9191/")
      .then(({ data }) => data);
    await this.setStateAsync({ visitors });
  }

  setStateAsync(state) {
    return new Promise(resolve => {
      this.setState(state, resolve);
    });
  }

  addNewMessage = async e => {
    e.preventDefault();

    const { visitors } = this.state;
    const fullName = this.fullName.current.value;
    const message = this.message.current.value;
    const visitDate = new Date().toISOString().split("T")[0];
    const updatedVisitors = [{ fullName, message, visitDate }].concat(visitors);
    if (fullName && message) {
      await this.setStateAsync({ visitors: updatedVisitors });

      // clear the fields
      this.fullName.current.value = "";
      this.message.current.value = "";
    }
    return null;
  };

  render() {
    const { visitors } = this.state;

    return (
      <div>
        <div className="App">
          <Header />
        </div>
        <div className="container">
          <div className="row">
            <div className="col-lg-6">
              <Form
                fullNameRef={this.fullName}
                messageRef={this.message}
                onSubmit={this.addNewMessage}
              />
            </div>
            <div className="col-lg-6">
              <Visitors visitors={visitors} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
