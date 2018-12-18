# Testing React Performance

This repo exists to demonstrate how coding style, available tooling and taking time to examine when our application should change, all have great performance impact on a React Application.

## About the Application

This app allows you to log yourself as a visitor. You can enter your full name and message and add the message to an ever growing list. This ever growring list is shows messages from most recent at the top, to oldest at the bottom.

Each visitor is an object with the following shape:

```json
{
  "id": "32-bit-guid",
  "fullName": "Jane Doe",
  "message": "The quick brown fox jumps over the lazy dog.",
  "visitDate": "2018-12-18"
}
```

A mock server delivers all visitors in an array, already sorted by date, from most recent to oldest.

To measure performance we use `http://localhost:3000/?react_perf`

## Available Branches

- bad-performance-0
- bad-performance-1
- memo-only
- pure-components
- should-component-update
- lazy-loading
- master

## `bad-performance-0`

First naive implementation.

```jsx
class App extends Component {
  state = { visitors: [] };
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

  render() {
    <div>
      <div className="App">
        <Header />
      </div>
      <div className="container">
        <div className="row">
          <div className="col-lg-6">
            <Form />
          </div>
          <div className="col-lg-6">
            <Visitors visitors={visitors} />
          </div>
        </div>
      </div>
    </div>;
  }
}
```

One thing to notice right away is the use of `async` life cycle methods. Since, `this.setState` behaves asynchronously, it does make sense to use `async/await`.

Remember that `this.setState`, takes 2 arguments.

The first argument is the new state, or keys to update. The second is a callback, to execute once the update has finished! Now that's asynchronous behavior.

So what's inside `<Visitors/>`?

```jsx
import React from "react";

export function Visitors({ visitors }) {
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
```

We simply map over the visitors array, rendering a new list element every time. If we don't use the `key` prop, React will give us a warning, so we use the `index` of argument of the `map` function.

This will work, but...

Lets look at the Form handler. We want every new message to be at the top, and we want to avoid having to force the client to sort them out again, the back end already did that for us.

```js
addNewMessage = async e => {
  e.preventDefault();

  const { visitors } = this.state;
  const fullName = this.fullName.current.value;
  const message = this.message.current.value;
  if (fullName && message) {
    // here have an issue -> we do not pass a unique ID to the new visitor element
    // furthermore we put the new visitor at the beginning!
    const visitDate = new Date().toISOString().split("T")[0];
    const updatedVisitors = [{ fullName, message, visitDate }].concat(visitors);
    await this.setStateAsync({ visitors: updatedVisitors });

    // clear the fields
    this.fullName.current.value = "";
    this.message.current.value = "";
  }
  return null;
};
```

We use React Refs to collect the input data for `fullName` and `message`, then if these are not empty, we proceed to generate a day and place our new visitor as first element of visitors, `updatedVisitors`.

Then we set the state, and once done, we clear the inputs.

Always return null.

One big issue, is that our new visitor does not have an `id`! We should be `POST`ing this data or `PUT`ing to the back end. Anyhow, that's the least of our problems now.

Back in `Visitors.js`, something very bad has happened, every element on visitors, has been pushed one index to the right and a new one appended to the beginning, which means the key prop points at a different visitor, now, everytime, 100 + 1 times.

React has to re render every element, because the Virtual DOM has totally changed!

> The Performance tools in Chrome, show rendering times between `80 to 100 ms`.

## `bad-performance-1`

A great improvement to `bad-performance-0` would have been to make use of the id's sent by the back end.

So let's do that! We just need a way to generate a new id for each new message.

We can use timestamps or an npm package. I use [uuid.](https://www.npmjs.com/package/uuid)

```js
import uuid from "uuid/v1";

const addNewMessage = async e => {
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
```

So now back in `Visitors.js`:

```jsx
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
```

Much better! React's Virtual DOM now has better knowledge of each visitor and therefore can avoid re rendering to them DOM. The browser will just handle the addition of a new child.

> The Performance tools in Chrome, show rendering times between `60 to 90 ms`.

Still high. Since this is a static list, without animations or anything else relying in order, we don't gain so much from using index correctly, but surely there are cases where one can gain a lot.

## `memo-only`

Most of React's power comes from Single File Components, so let's use them!

```jsx
import React from "react";
import Visitor from "./Visitor";

export function Visitors({ visitors }) {
  return (
    <ul className="list-group">
      {visitors.map(({ id, ...visitor }) => (
        <Visitor key={id} {...visitor} />
      ))}
    </ul>
  );
}
```

Where `<Visitor/>` is:

```jsx
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
```

Since, the Visitor React Element is has very shallow props, we can make it into a function and memoize it. This means, avoid recalculating the what to render, given the same inputs.

There's a couple of ways to do this, using `function` and `React.memo`, with `shouldComponentUpdate`, or using `PureComponent`.

Aside from creating very beautiful and more readable code, we actually gain a huge boost.

> The Performance tools in Chrome, show rendering times between `15 to 20 ms`.

## `pure-components`

```jsx
import React, { PureComponent } from "react";

// shallow comparisson of props,
// {id: 1, name: 2} !== {id:2, name:3}
// but fails to do {id: 1, name:2, dates: [{...}]}
class Visitor extends PureComponent {
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
```

`PureComponent` does a shallow comparisson. It also compares immutable objects, to determine if the component should re-render.

> The Performance tools in Chrome, show rendering times between `15 to 20 ms`.

## `should-component-update`

```jsx
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
```

We use the id to compare quicker!

```jsx
import React, { Component } from "react";

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
```

This lifecycle method can be a glass cannon. It allows us to tell React when to let `componentUpdate`, or render run, but we must do the check. And the check can be expensive. For that reason we fallback to using the id, to decide whether or not to re-render.

> The Performance tools in Chrome, show rendering times between `20 to 30 ms`.

## lazy-loading

Performance is also affected by loading times.

This application is very lightweight, which makes it easier to analyze what we are serving to the browser.

First, we use `webpack-bundle-analyzer`, a tool to create a graphical report of how our application is structured.

[Analyzer](file:///home/joseph/Documents/webDev/performance/build/report.html)

As one can expect, the actual application bundle, our JavaScript, is not that big. The whole application weighs about 100kb, and of that we are about 4%.

However, we could easily break down the application further, to optimize what React needs to do upon first load.

```jsx
import React, { lazy, Suspense, Component } from "react";

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
```

Now, we can examine our Network requests in Chrome, and see that we serve three small JavaScript chunks, containing each component.

Each component is now roughly a 1000 Bytes. Had this been a more complicated app, perhaps we could have hundreds of Kb's wait for user demand, and not be pushed on first load.

> The Performance tools in Chrome, show rendering times between `15 to 20 ms`.

## BUILD!

React, on development mode, serves with tons of add-ons to make our life easier.

However, users do not need these. By creating a production build, we can strip all of these out.

We'll lose the ability to pass `?react_perf` to the URL, and any `prop-types` we might be using, but the end user doesn't care.

The `create-react-app` does this by default, when running `yarn build`.

> The Performance tools in Chrome, show submit event handling times between `5 to 8 ms`.
