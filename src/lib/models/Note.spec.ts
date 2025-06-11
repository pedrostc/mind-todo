import { describe, it, expect } from 'vitest';
import { Note } from './Note';
import { TodoItem } from './TodoItem';

describe('Note', () => {
  it('should create a Note with default values', () => {
    const note = new Note('Test note');
    
    expect(note.content).toBe('Test note');
    expect(note.subNotes).toEqual([]);
    expect(note.parentItem).toBeUndefined();
    expect(note.parentNote).toBeUndefined();
    expect(note.level).toBe(0);
  });

  it('should create a Note with a parent item', () => {
    const item = new TodoItem('Test item');
    const note = new Note('Test note', { parentItem: item });
    
    expect(note.content).toBe('Test note');
    expect(note.parentItem).toBe(item);
    expect(note.level).toBe(0);
  });

  it('should add a sub-note', () => {
    const note = new Note('Parent note');
    const subNote = note.addSubNote('Sub note');
    
    expect(note.subNotes.length).toBe(1);
    expect(note.subNotes[0]).toBe(subNote);
    expect(subNote.parentNote).toBe(note);
    expect(subNote.level).toBe(1);
  });

  it('should add a sub-sub-note', () => {
    const note = new Note('Parent note');
    const subNote = note.addSubNote('Sub note');
    const subSubNote = subNote.addSubNote('Sub-sub note');
    
    expect(subNote.subNotes.length).toBe(1);
    expect(subNote.subNotes[0]).toBe(subSubNote);
    expect(subSubNote.parentNote).toBe(subNote);
    expect(subSubNote.level).toBe(2);
  });

  it('should not allow adding notes beyond 2 levels deep', () => {
    const note = new Note('Parent note');
    const subNote = note.addSubNote('Sub note');
    const subSubNote = subNote.addSubNote('Sub-sub note');
    
    expect(() => subSubNote.addSubNote('Sub-sub-sub note')).toThrow();
  });

  it('should create a todo item from a note', () => {
    const parentItem = new TodoItem('Parent item');
    const note = new Note('Test note', { parentItem });
    const todoItem = note.createTodoItem();
    
    expect(todoItem.title).toBe('Test note');
    expect(todoItem.parentNote).toBe(note);
  });

  it('should get formatted content with proper indentation based on level', () => {
    const note = new Note('Parent note');
    const subNote = note.addSubNote('Sub note');
    const subSubNote = subNote.addSubNote('Sub-sub note');
    
    expect(note.getFormattedContent()).toBe('• Parent note');
    expect(subNote.getFormattedContent()).toBe('  • Sub note');
    expect(subSubNote.getFormattedContent()).toBe('    • Sub-sub note');
  });

  it('should get all notes in hierarchical order', () => {
    const note = new Note('Parent note');
    const subNote1 = note.addSubNote('Sub note 1');
    const subNote2 = note.addSubNote('Sub note 2');
    const subSubNote1 = subNote1.addSubNote('Sub-sub note 1');
    const subSubNote2 = subNote2.addSubNote('Sub-sub note 2');
    
    const allNotes = note.getAllNotes();
    
    expect(allNotes.length).toBe(5);
    expect(allNotes[0]).toBe(note);
    expect(allNotes[1]).toBe(subNote1);
    expect(allNotes[2]).toBe(subSubNote1);
    expect(allNotes[3]).toBe(subNote2);
    expect(allNotes[4]).toBe(subSubNote2);
  });
});