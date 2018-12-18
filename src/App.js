import React, { lazy, Suspense, Component } from "react";
import axios from "axios";
import uuid from "uuid/v1";
// import Header from "./Header";
// import Form from "./Form";
// import Visitors from "./Visitors";

import "./App.css";

const LazyVisitors = lazy(() =>
  import(/* webpackChunkName: "lazy-visitors" */ "./Visitors")
);

function SuspenseVisitors({ ...props }) {
  return (
    <Suspense fallback={null}>
      <LazyVisitors {...props} />
    </Suspense>
  );
}

const LazyForm = lazy(() =>
  import(/* webpackChunkName: "lazy-form" */ "./Form")
);

function SuspenseForm({ ...props }) {
  return (
    <Suspense fallback={null}>
      <LazyForm {...props} />
    </Suspense>
  );
}

const LazyHeader = lazy(() =>
  import(/* webpackChunkName: "lazy-header" */ "./Header")
);

function SuspenseHeader() {
  return (
    <Suspense fallback={null}>
      <LazyHeader />
    </Suspense>
  );
}

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
    if (fullName && message) {
      const id = uuid();
      const visitDate = new Date().toISOString().split("T")[0];
      const updatedVisitors = [{ id, fullName, message, visitDate }].concat(
        visitors
      );
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
          <SuspenseHeader />
        </div>
        <div className="container">
          <div className="row">
            <div className="col-lg-6">
              <SuspenseForm
                fullNameRef={this.fullName}
                messageRef={this.message}
                onSubmit={this.addNewMessage}
              />
            </div>
            <div className="col-lg-6">
              <SuspenseVisitors visitors={visitors} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
