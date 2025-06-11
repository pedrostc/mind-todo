import { describe, it, expect } from 'vitest';
import { TodoItem } from './TodoItem';

describe('TodoItem', () => {
  it('should create a TodoItem with default values', () => {
    const item = new TodoItem('Test item');
    
    expect(item.title).toBe('Test item');
    expect(item.completed).toBe(false);
    expect(item.age).toBe(0);
    expect(item.subItems).toEqual([]);
    expect(item.notes).toEqual([]);
    expect(item.parentItem).toBeUndefined();
    expect(item.parentNote).toBeUndefined();
  });

  it('should create a TodoItem with custom values', () => {
    const parentItem = new TodoItem('Parent item');
    const item = new TodoItem('Test item', {
      completed: true,
      age: 2,
      parentItem
    });
    
    expect(item.title).toBe('Test item');
    expect(item.completed).toBe(true);
    expect(item.age).toBe(2);
    expect(item.parentItem).toBe(parentItem);
  });

  it('should add a sub-item', () => {
    const item = new TodoItem('Parent item');
    const subItem = item.addSubItem('Sub item');
    
    expect(item.subItems.length).toBe(1);
    expect(item.subItems[0]).toBe(subItem);
    expect(subItem.parentItem).toBe(item);
  });

  it('should not allow adding more than one level of sub-items', () => {
    const item = new TodoItem('Parent item');
    const subItem = item.addSubItem('Sub item');
    
    expect(() => subItem.addSubItem('Sub-sub item')).toThrow();
  });

  it('should increment age when carried over', () => {
    const item = new TodoItem('Test item');
    expect(item.age).toBe(0);
    
    const carriedItem = item.carryOver();
    expect(carriedItem.age).toBe(1);
    
    const carriedAgain = carriedItem.carryOver();
    expect(carriedAgain.age).toBe(2);
  });

  it('should not carry over completed items', () => {
    const item = new TodoItem('Test item');
    item.completed = true;
    
    expect(item.carryOver()).toBeNull();
  });

  it('should carry over sub-items', () => {
    const item = new TodoItem('Parent item');
    const subItem1 = item.addSubItem('Sub item 1');
    const subItem2 = item.addSubItem('Sub item 2');
    subItem2.completed = true;
    
    const carriedItem = item.carryOver();
    expect(carriedItem.subItems.length).toBe(1);
    expect(carriedItem.subItems[0].title).toBe('Sub item 1');
    expect(carriedItem.subItems[0].age).toBe(1);
  });

  it('should add a note to an item', () => {
    const item = new TodoItem('Test item');
    const note = item.addNote('Test note');
    
    expect(item.notes.length).toBe(1);
    expect(item.notes[0]).toBe(note);
    expect(note.parentItem).toBe(item);
  });

  it('should create a new todo item from a note', () => {
    const item = new TodoItem('Test item');
    const note = item.addNote('Test note');
    const newItem = note.createTodoItem();
    
    expect(newItem.title).toBe('Test note');
    expect(newItem.parentNote).toBe(note);
  });
});