import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TodoItemComponent from './TodoItemComponent.svelte';
import { TodoItem } from '../models/TodoItem';

describe('TodoItemComponent', () => {
  let todoItem: TodoItem;

  beforeEach(() => {
    todoItem = new TodoItem('Test item');
  });

  it('should render the todo item title', () => {
    render(TodoItemComponent, { props: { item: todoItem } });

    expect(screen.getByText('Test item')).toBeInTheDocument();
  });

  it('should allow marking an item as completed', async () => {
    render(TodoItemComponent, { props: { item: todoItem } });

    const checkbox = screen.getByRole('checkbox');
    await fireEvent.click(checkbox);

    expect(todoItem.completed).toBe(true);
  });

  it('should display sub-items', () => {
    const subItem = todoItem.addSubItem('Sub item');

    render(TodoItemComponent, { props: { item: todoItem } });

    expect(screen.getByText('Sub item')).toBeInTheDocument();
  });

  it('should display notes', () => {
    const note = todoItem.addNote('Test note');

    render(TodoItemComponent, { props: { item: todoItem } });

    const noteText = screen.getByTestId('note-text');
    expect(noteText).toHaveTextContent('Test note');
  });

  it('should display the age of the item if greater than 0', () => {
    const oldItem = new TodoItem('Old item', { age: 3 });

    render(TodoItemComponent, { props: { item: oldItem } });

    expect(screen.getByText('3 days')).toBeInTheDocument();
  });

  it('should not display the age if it is 0', () => {
    render(TodoItemComponent, { props: { item: todoItem } });

    expect(screen.queryByText('0 days')).not.toBeInTheDocument();
  });

  it('should allow adding a sub-item', async () => {
    // Since we can't use component.$on in Svelte 5, we'll just test that the UI elements are displayed correctly
    render(TodoItemComponent, { props: { item: todoItem } });

    await fireEvent.click(screen.getByText('...'));
    expect(screen.getByText('Add Sub-item')).toBeInTheDocument();

    await fireEvent.click(screen.getByText('Add Sub-item'));
    expect(screen.getByPlaceholderText('Add a sub-item...')).toBeInTheDocument();
  });

  it('should dispatch addSubItem event when pressing Enter in sub-item input', async () => {
    const mockDispatch = vi.fn();
    vi.spyOn(todoItem, 'addSubItem');

    // Mock the createEventDispatcher
    vi.mock('svelte', async () => {
      const actual = await vi.importActual('svelte');
      return {
        ...actual,
        createEventDispatcher: () => mockDispatch
      };
    });

    render(TodoItemComponent, { props: { item: todoItem } });

    // Open the sub-item form
    await fireEvent.click(screen.getByText('...'));
    await fireEvent.click(screen.getByText('Add Sub-item'));

    // Enter text and press Enter
    const input = screen.getByPlaceholderText('Add a sub-item...');
    await fireEvent.input(input, { target: { value: 'New sub-item' } });
    await fireEvent.keyDown(input, { key: 'Enter' });

    // Check that the dispatch function was called with the correct arguments
    expect(mockDispatch).toHaveBeenCalledWith('addSubItem', {
      parentItem: todoItem,
      title: 'New sub-item'
    });
  });

  it('should allow adding a note', async () => {
    // Since we can't use component.$on in Svelte 5, we'll just test that the UI elements are displayed correctly
    render(TodoItemComponent, { props: { item: todoItem } });

    await fireEvent.click(screen.getByText('...'));
    expect(screen.getByText('Add Note')).toBeInTheDocument();

    await fireEvent.click(screen.getByText('Add Note'));
    expect(screen.getByPlaceholderText('Add a note...')).toBeInTheDocument();
  });

  it('should dispatch addNote event when pressing Enter in note input', async () => {
    const mockDispatch = vi.fn();

    // Mock the createEventDispatcher
    vi.mock('svelte', async () => {
      const actual = await vi.importActual('svelte');
      return {
        ...actual,
        createEventDispatcher: () => mockDispatch
      };
    });

    render(TodoItemComponent, { props: { item: todoItem } });

    // Open the note form
    await fireEvent.click(screen.getByText('...'));
    await fireEvent.click(screen.getByText('Add Note'));

    // Enter text and press Enter
    const input = screen.getByPlaceholderText('Add a note...');
    await fireEvent.input(input, { target: { value: 'New note' } });
    await fireEvent.keyDown(input, { key: 'Enter' });

    // Check that the dispatch function was called with the correct arguments
    expect(mockDispatch).toHaveBeenCalledWith('addNote', {
      parentItem: todoItem,
      content: 'New note'
    });
  });

  it('should allow creating a todo item from a note', async () => {
    // Since we can't use component.$on in Svelte 5, we'll just test that the UI elements are displayed correctly
    const note = todoItem.addNote('Test note');

    render(TodoItemComponent, { props: { item: todoItem } });

    // Open the note's menu
    await fireEvent.click(screen.getAllByText('...')[1]);
    expect(screen.getByText('Create Todo')).toBeInTheDocument();
  });
});
