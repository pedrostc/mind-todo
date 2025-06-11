# Mind-Todo Development Guidelines

This document provides guidelines for developing and maintaining the Mind-Todo project.

## Build/Configuration Instructions

### Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. For e2e testing, install Playwright browsers:
   ```bash
   npx playwright install
   ```

### Development
1. Start the development server:
   ```bash
   npm run dev
   ```

2. To open the app in a browser automatically:
   ```bash
   npm run dev -- --open
   ```

### Building for Production
1. Create a production build:
   ```bash
   npm run build
   ```

2. Preview the production build:
   ```bash
   npm run preview
   ```

## Testing Information

### Testing Architecture
The project uses two testing frameworks:
- **Vitest**: For unit and integration tests
- **Playwright**: For end-to-end (e2e) tests

The testing configuration is split into two environments:
1. **Client tests**: For testing Svelte components using jsdom
2. **Server tests**: For testing server-side code using Node.js

### Running Tests

#### Unit Tests
```bash
# Run all unit tests
npm run test:unit -- --run

# Run unit tests in watch mode
npm run test:unit
```

#### E2E Tests
```bash
# Run all e2e tests
npm run test:e2e
```

#### All Tests
```bash
# Run all tests (unit and e2e)
npm run test
```

### Adding New Tests

#### Unit Tests for Components
1. Create a file with the naming pattern `*.svelte.test.ts` in the same directory as the component
2. Import the component and testing utilities:
   ```typescript
   import { describe, test, expect } from 'vitest';
   import '@testing-library/jest-dom/vitest';
   import { render, screen } from '@testing-library/svelte';
   import YourComponent from './YourComponent.svelte';
   ```
3. Write tests using the Testing Library API:
   ```typescript
   describe('YourComponent', () => {
     test('should render correctly', () => {
       render(YourComponent);
       expect(screen.getByText('Expected Text')).toBeInTheDocument();
     });
   });
   ```

#### Server-Side Tests
1. Create a file with the naming pattern `*.spec.ts` or `*.test.ts` (not `*.svelte.test.ts`)
2. Import Vitest utilities:
   ```typescript
   import { describe, it, expect } from 'vitest';
   ```
3. Write tests:
   ```typescript
   describe('your function', () => {
     it('should behave as expected', () => {
       expect(yourFunction()).toBe(expectedResult);
     });
   });
   ```

#### E2E Tests
1. Create a file in the `e2e` directory with the naming pattern `*.test.ts`
2. Import Playwright utilities:
   ```typescript
   import { expect, test } from '@playwright/test';
   ```
3. Write tests:
   ```typescript
   test('feature should work correctly', async ({ page }) => {
     await page.goto('/your-route');
     await expect(page.locator('selector')).toBeVisible();
     // Interact with the page
     await page.click('button');
     // Assert the expected outcome
     await expect(page.locator('result-selector')).toHaveText('Expected Result');
   });
   ```

## Additional Development Information

### Code Style and Formatting
- The project uses Prettier for code formatting
- Run `npm run format` to format all files
- Run `npm run lint` to check for linting issues

### Test-Driven Development (TDD)
All development should follow Test-Driven Development principles:

1. **Write a failing test first**: Before implementing a feature or fixing a bug, write a test that defines the expected behavior.
2. **Run the test to confirm it fails**: This verifies that the test is working correctly and that the feature doesn't already exist.
3. **Write the minimal code to make the test pass**: Focus on making the test pass, not on writing perfect code.
4. **Run the test to confirm it passes**: This verifies that your implementation works as expected.
5. **Refactor the code**: Clean up the code while ensuring the test continues to pass.
6. **Repeat**: Continue this cycle for each new feature or bug fix.

### Project Structure
- `src/`: Source code
  - `routes/`: SvelteKit routes
  - `lib/`: Shared components and utilities
    - `server/`: Server-only code
- `e2e/`: End-to-end tests
- `static/`: Static assets

### TypeScript
- The project uses TypeScript for type safety
- Run `npm run check` to type-check the project