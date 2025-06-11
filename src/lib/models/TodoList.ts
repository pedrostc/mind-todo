import { TodoItem } from './TodoItem';
import { Note } from './Note';

export class TodoList {
  date: Date;
  items: TodoItem[] = [];

  constructor(date: Date) {
    this.date = date;
  }

  addItem(item: TodoItem): void {
    this.items.push(item);
  }

  createItem(title: string): TodoItem {
    const item = new TodoItem(title);
    this.addItem(item);
    return item;
  }

  /**
   * Creates a sub-item for a given parent item.
   * If the parent is already a sub-item, it will be promoted to a main level item
   * while maintaining its link to its original parent.
   */
  createSubItem(parentItem: TodoItem, title: string): TodoItem {
    // If the parent is already a sub-item, promote it to main level
    if (parentItem.parentItem) {
      // Only add to main items list if it's not already there
      if (!this.items.includes(parentItem)) {
        this.items.push(parentItem);
      }

      // Create a new sub-item directly instead of using addSubItem
      // This bypasses the check in TodoItem.addSubItem
      const subItem = new TodoItem(title, { parentItem });
      parentItem.subItems.push(subItem);
      return subItem;
    }

    return parentItem.addSubItem(title);
  }

  getAllItems(): TodoItem[] {
    let allItems: TodoItem[] = [];

    // Add main level items
    allItems = allItems.concat(this.items);

    // Add sub-items
    for (const item of this.items) {
      allItems = allItems.concat(item.getAllSubItems());
    }

    return allItems;
  }

  getAllNotes(): Note[] {
    let allNotes: Note[] = [];

    // Get notes from all items
    for (const item of this.getAllItems()) {
      allNotes = allNotes.concat(item.getAllNotes());
    }

    return allNotes;
  }

  createNextDayList(nextDate: Date): TodoList {
    const nextList = new TodoList(nextDate);

    // Carry over incomplete items
    for (const item of this.items) {
      const carriedItem = item.carryOver();
      if (carriedItem) {
        nextList.addItem(carriedItem);
      }
    }

    return nextList;
  }

  /**
   * Creates the first list for a user, which is always empty.
   */
  static createFirstList(date: Date): TodoList {
    return new TodoList(date);
  }
}
