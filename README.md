# observable-tree-router

#### Type-safe, state-oriented, reactive, hierarchical router for single page applications

## Table of Contents
- [Installation](#installation)
- [Introduction](#introduction)
- [Features](#features)
- [Usage](#usage)
  - [Basic Setup](#basic-setup)
  - [Route Parameters](#route-parameters)
  - [Nested Routes](#nested-routes)
  - [Navigation](#navigation)
  - [Route Matching](#route-matching)
  - [Accessing Router State](#accessing-router-state)
- [API Reference](#api-reference)
  - [Creating Routers](#creating-routers)
  - [Defining Routes](#defining-routes)
  - [Router Interface](#router-interface)
- [License](#license)

## Installation

```bash
# Using npm
npm install observable-tree-router

# Using yarn
yarn add observable-tree-router
```

This library has a peer dependency on RxJS v7.0.0 or higher:

```bash
npm install rxjs@^7.0.0
```

## Introduction

observable-tree-router is a TypeScript-friendly, reactive router designed for single page applications. It provides a hierarchical, state-oriented approach to routing with full type safety, making it ideal for complex applications that require a predictable and typesafe routing solution.

Unlike traditional imperative routers, observable-tree-router treats routing as an observable state tree. This enables reactive patterns and makes it easy to synchronize your UI with the current route state.

## Features

- **Observable state** - Full reactive approach with RxJS observables
- **Hierarchical routing** - Nested routes with inherited parameters
- **Type-safe params** - Utilize TypeScript's type system to ensure route parameters are correct
- **Cascading params** - Nested routes have access to parent route parameters

## Usage

### Basic Setup

First, define your routes and create a router:

```typescript
import { createBrowserRouter, route } from 'observable-tree-router';
import { createBrowserHistory } from 'history';

// Create a browser history instance
const history = createBrowserHistory();

// Define your routes
const router = createBrowserRouter(history, {
  home: route({ path: '/' }),
  about: route({ path: '/about' }),
  users: route({ path: '/users' })
});
```

### Route Parameters

Routes can have parameters that are extracted from the URL:

```typescript
const router = createBrowserRouter(history, {
  user: route({
    path: '/user/:userId',
    params: ['userId']
  })
});

// Navigate to a user profile with a specific ID
router.user.push({ userId: '123' });
```

### Nested Routes

Routes can be nested to create hierarchical structures:

```typescript
const router = createBrowserRouter(history, {
  user: route({
    path: '/user/:userId',
    params: ['userId'],
    nested: {
      profile: route({ path: '/profile' }),
      posts: route({ path: '/posts' })
    }
  })
});

// Navigate to user's profile with ID 123
router.user.profile.push({ userId: '123' });
// URL will be /user/123/profile
```

### Navigation

To navigate to a route:

```typescript
// Navigate to home route
router.home.push();

// Navigate to user route with parameters
router.user.push({ userId: '123' });

// Replace current history entry instead of pushing a new one
router.about.replace();
```

### Route Matching

Check if a route is currently active:

```typescript
// Check if route is exactly matching the current URL
if (router.user.isMatchingExact) {
  // Current URL matches exactly the user route
}

// Check if route or any nested route is matching
if (router.user.isMatching) {
  // Current URL matches the user route or one of its children
}

// Check if a child route is matching
if (router.user.isMatchingChild) {
  // A child route of user is matching
}
```

### Accessing Router State

The router state is available as both an observable and a current value:

```typescript
// Get current router state
const currentState = router.currentState;

// Subscribe to router state changes
router.state$.subscribe(state => {
  console.log('Router state changed:', state);
});

// Subscribe to a specific route's state changes
router.user.state$.subscribe(state => {
  console.log('User route state changed:', state);
});

// Subscribe to route match changes
router.user.match$.subscribe(match => {
  if (match) {
    console.log('User route matched with params:', match.params);
    console.log('Exact match:', match.exact);
  } else {
    console.log('User route not matched');
  }
});
```

## API Reference

### Creating Routers

#### `createBrowserRouter(history, config)`
Creates a router that synchronizes with the browser's URL.

- `history`: A history object from the history package
- `config`: Router configuration object

#### `createMemoryRouter(config)`
Creates a router that doesn't synchronize with the browser's URL, currently unsupported.

- `config`: Router configuration object

### Defining Routes

#### `route(options)`
Function to create a route configuration.

Options:
- `path`: The URL path pattern (e.g., `/users/:id`)
- `params`: Array of parameter names that this route extracts from the URL
- `nested`: Object containing nested routes

Examples:
```typescript
// Simple route
route({ path: '/about' })

// Route with parameters
route({ path: '/user/:userId', params: ['userId'] })

// Route with nested routes
route({
  path: '/user/:userId',
  params: ['userId'],
  nested: {
    profile: route({ path: '/profile' }),
    settings: route({ path: '/settings' })
  }
})
```

### Router Interface

Each route in the router provides:

- `push(params?)`: Navigate to this route with optional parameters
- `replace(params?)`: Replace current history entry with this route
- `path`: The full path pattern of this route
- `isMatching`: Whether this route or any of its children match the current URL
- `isMatchingExact`: Whether this route exactly matches the current URL
- `isMatchingChild`: Whether a child of this route matches the current URL
- `state$`: Observable of this route's state
- `currentState`: Current state of this route
- `match$`: Observable that emits when route match state changes (entering or leaving route)

The root router provides:
- `state$`: Observable of the entire router state
- `currentState`: Current state of the entire router

## License

MIT © [Mikael Couzic](https://github.com/couzic)