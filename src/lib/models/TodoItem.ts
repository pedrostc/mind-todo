import { Note } from './Note';

interface TodoItemOptions {
  completed?: boolean;
  age?: number;
  parentItem?: TodoItem;
  parentNote?: Note;
  originalParent?: TodoItem;
}

export class TodoItem {
  title: string;
  completed: boolean;
  age: number;
  subItems: TodoItem[] = [];
  notes: Note[] = [];
  parentItem?: TodoItem;
  parentNote?: Note;
  originalParent?: TodoItem;

  constructor(title: string, options: TodoItemOptions = {}) {
    this.title = title;
    this.completed = options.completed ?? false;
    this.age = options.age ?? 0;
    this.parentItem = options.parentItem;
    this.parentNote = options.parentNote;
    this.originalParent = options.originalParent;
  }

  addSubItem(title: string): TodoItem {
    // Check if this is already a sub-item (can't have sub-sub-items)
    if (this.parentItem) {
      throw new Error('Cannot add sub-items to a sub-item. Only one level of nesting is allowed.');
    }

    const subItem = new TodoItem(title, { parentItem: this });
    this.subItems.push(subItem);
    return subItem;
  }

  addNote(content: string): Note {
    const note = new Note(content, { parentItem: this });
    this.notes.push(note);
    return note;
  }

  carryOver(): TodoItem | null {
    // Don't carry over completed items
    if (this.completed) {
      return null;
    }

    // Create a new item with incremented age
    const newItem = new TodoItem(this.title, {
      age: this.age + 1,
      parentItem: this.parentItem,
      originalParent: this.originalParent
    });

    // Carry over sub-items
    for (const subItem of this.subItems) {
      const carriedSubItem = subItem.carryOver();
      if (carriedSubItem) {
        newItem.subItems.push(carriedSubItem);
      }
    }

    // Copy over notes (they don't carry over but should be accessible)
    newItem.notes = [...this.notes];

    return newItem;
  }

  getAllSubItems(): TodoItem[] {
    return this.subItems.slice();
  }

  getAllNotes(): Note[] {
    let allNotes: Note[] = [];

    // Add this item's notes
    allNotes = allNotes.concat(this.notes);

    // Add notes from sub-notes
    for (const note of this.notes) {
      allNotes = allNotes.concat(note.getAllNotes().slice(1)); // Skip the note itself
    }

    return allNotes;
  }
}
