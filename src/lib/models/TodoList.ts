import { TodoItem } from './TodoItem';
import { Note } from './Note';

export class TodoList {
	date: Date;
	items: TodoItem[] = [];
	private nextId: number = 1; // Start IDs from 1

	constructor(date: Date) {
		this.date = date;
	}

	addItem(item: TodoItem): void {
		this.items.push(item);
	}

	createItem(title: string): TodoItem {
		const item = new TodoItem(title, { id: this.nextId++ });
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
			// Store reference to original parent
			const originalParent = parentItem.parentItem;

			// Remove from original parent's subItems array
			const index = originalParent.subItems.indexOf(parentItem);
			if (index !== -1) {
				originalParent.subItems.splice(index, 1);
			}

			// Keep reference to original parent
			parentItem.originalParent = originalParent;
			// Store the original sub-item index
			parentItem.originalSubItemIndex = parentItem.subItemIndex;
			// Don't clear parentItem reference as tests expect it to remain

			// Only add to main items list if it's not already there
			if (!this.items.includes(parentItem)) {
				this.items.push(parentItem);
			}

			// Create a new sub-item directly instead of using addSubItem
			// This bypasses the check in TodoItem.addSubItem
			const subItem = new TodoItem(title, { parentItem, id: this.nextId++ });
			subItem.subItemIndex = parentItem.subItems.length;
			parentItem.subItems.push(subItem);
			return subItem;
		}

		return parentItem.addSubItem(title, this.nextId++);
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
				// Assign new ID to carried-over item
				carriedItem.id = nextList.getNextId();

				// Assign new IDs to carried-over sub-items
				for (const subItem of carriedItem.subItems) {
					subItem.id = nextList.getNextId();
				}

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

	/**
	 * Returns the next available ID and increments the counter.
	 */
	getNextId(): number {
		return this.nextId++;
	}
}
