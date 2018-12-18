# Testing React Performance

This repo exists to demonstrate how coding style, available tooling and taking time to examine when our application should change, all have great performance impact on a React Application.

## About the Application

This app allows you to log yourself as a visitor, by adding your full name and a message to an ever growing list of visitors.

Most recent messages are shown at the top.

Each visitor and its message are represented by an object with the following shape:

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

To start the application:

```
yarn install && yarn start-all
```

## Available Branches

- bad-performance-0
- bad-performance-1
- memo-only
- pure-components
- should-component-update
- lazy-loading
- master

Additionally we also analyze a production build.

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

> The Performance tools in Chrome, show rendering times between `70 to 90 ms`.

![Bad Performance 0 Benchmark][bad-performance-0]

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

> The Performance tools in Chrome, show rendering times between `50 to 70 ms`.

![Bad Performance 1 Benchmark][bad-performance-1]

Still high. Since this is a static list, without animations or anything else relying in order, we don't gain so much from using index correctly, but surely there are cases where one can gain a lot.

## `memo-only`

We notice that the `<li>` element inside Visitors could be extracted away into it's own file, allowing us to read it as a Stateless Functional Component own its own. Which can be optimized further by React.

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

> Notice the `export default React.memo(Visitor)`

Since, the Visitor React Element is has very shallow props, we can make it into a function and memoize it. This means, avoid recalculating the what to render, given the same inputs.

There's a couple of ways to do this:

- using `function` and `React.memo`, as we've just done with Visitor
- or using `PureComponent` [here](#pure-components)
- with `shouldComponentUpdate` life cycle [here](#should-component-update)

Aside from creating very beautiful and more readable code, we actually gain a huge performance boost.

> The Performance tools in Chrome, show great improvements by using Memo.

![Memo Only][memo-only]

## <a id="pure-components"></a>`pure-components`

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

> The Performance tools in Chrome indicate similar reconciliation times between Memo and PureComponents.

![PureComponent][pure-components]

## <a id="should-component-update"></a>`should-component-update`

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

> The React reconciliation time in Chrome Tools is about the same as memo-only and pure components.

![Should Component Update][should-component-update]

## lazy-loading

Performance is also affected by loading time.

This application is very lightweight, which makes it easier to analyze what we are serving to the browser.

First, we use `webpack-bundle-analyzer`, a tool to create a graphical report of how our application is structured.

[See Report from Analyzer](https://icjoseph.com/performance/report.html)

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

> The Performance tools in Chrome show the reconciliation time for React.

> Although, there was no improvement, we can see, the `Suspense Update`, which doesn't make things slower!

![Lazy Loading][lazy-loading]

## BUILD!

React, on development mode, serves with tons of add-ons to make our life easier.

However, users do not need these. By creating a production build, we can strip them out.

We'll lose the ability to pass `?react_perf` to the URL, and any `prop-types` we might be using, but the end user doesn't care.

The `create-react-app` does this by default, when running `yarn build`.

> In the Chrome dev tools, we can see how long it takes to digest the event.

![Production Build][production-build]

## Inspiration

This study is inspired by, [this great talk.](https://www.youtube.com/watch?v=nhuwPinAV7E&t=830s)

## License

The MIT License (MIT)

Copyright (c) 2018 Joseph Chamochumbi

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[bad-performance-0]: https://icjoseph.com/static/bad-performance-0.png "Bad Performance 0"
[bad-performance-1]: https://icjoseph.com/static/bad-performance-1.png "Bad Performance 1"
[memo-only]: https://icjoseph.com/static/memo-only.png "Memo Only"
[pure-components]: https://icjoseph.com/static/pure-components.png "Pure Components"
[should-component-update]: https://icjoseph.com/static/should-component-update.png "Should Component Update"
[lazy-loading]: https://icjoseph.com/static/lazy-loading.png "Lazy Loading"
[production-build]: https://icjoseph.com/static/production-build.png "Production Build"
