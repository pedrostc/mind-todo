import { describe, test, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import Page from './+page.svelte';
import { TodoList } from '$lib/models/TodoList';

// Mock the TodoList.createFirstList method
vi.mock('$lib/models/TodoList', () => {
  const mockDate = new Date('2023-01-01');
  const mockList = {
    date: mockDate,
    items: []
  };

  return {
    TodoList: {
      createFirstList: vi.fn().mockReturnValue(mockList)
    }
  };
});

describe('/+page.svelte', () => {
  test('should render the app title', () => {
    render(Page);
    expect(screen.getByRole('heading', { level: 1, name: 'Mind-Todo' })).toBeInTheDocument();
  });

  test('should create and display the first list', () => {
    render(Page);

    // Check that TodoList.createFirstList was called
    expect(TodoList.createFirstList).toHaveBeenCalled();

    // Check that the TodoListComponent is rendered with a date heading
    const dateHeading = screen.getByRole('heading', { level: 1, name: /\w+ \d+, \d{4}/ });
    expect(dateHeading).toBeInTheDocument();
  });
});
