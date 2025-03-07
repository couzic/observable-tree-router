# observable-tree-router Development Guide

## Commands
- Build: `npm run build`
- Lint: `npm run lint`
- Test all: `npm run test`
- Test watch mode: `npm run tdd`
- Single test: `npx mocha --grep "test pattern" src/**/*.test.ts`
- Test compilation errors: `npm run test-compilation-errors`

## Code Style
- TypeScript with strict typing, generics for type safety
- RxJS for reactive programming with pipeable operators
- Tests: Mocha/Chai with BDD-style describe/it nesting
- Naming: camelCase for variables/functions, PascalCase for types/interfaces
- Imports: external libraries first, then internal modules
- Error handling: leverage TypeScript's type system, custom error testing
- Formatting: Prettier via tslint-config-prettier
- Architecture: Tree-based hierarchical router with observable state

## Features
- Hierarchical routing with nested routes
- Observable-based state management
- Type-safe parameter handling