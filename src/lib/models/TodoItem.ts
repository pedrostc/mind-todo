import { Note } from './Note';
import type { TodoList } from './TodoList'; // Type-only import for TodoList

interface TodoItemOptions {
	completed?: boolean;
	age?: number;
	parentItem?: TodoItem;
	parentNote?: Note;
	originalParent?: TodoItem;
	id?: number;
	subItemIndex?: number;
	originalSubItemIndex?: number;
	parentList?: TodoList; // Added parentList
}

export class TodoItem {
	title: string;
	completed: boolean;
	age: number;
	id: number;
	subItems: TodoItem[] = [];
	notes: Note[] = [];
	parentItem?: TodoItem;
	parentNote?: Note;
	originalParent?: TodoItem;
	subItemIndex: number;
	originalSubItemIndex: number;
	parentList?: TodoList; // Added parentList property

	// IDs for persistence
	parentItemId?: number;
	parentNoteId?: string;
	originalParentId?: number;


	constructor(title: string, options: TodoItemOptions = {}) {
		this.title = title;
		this.completed = options.completed ?? false;
		this.age = options.age ?? 0;
		this.id = options.id ?? 0;
		this.parentItem = options.parentItem;
		this.parentNote = options.parentNote;
		this.originalParent = options.originalParent;
		this.subItemIndex = options.subItemIndex ?? 0;
		this.originalSubItemIndex = options.originalSubItemIndex ?? 0;
		this.parentList = options.parentList; // Assign parentList
	}

	async addSubItem(title: string, id?: number): Promise<TodoItem> {
		// Check if this is already a sub-item (can't have sub-sub-items)
		if (this.parentItem && !this.parentNote) {
			throw new Error('Cannot add sub-items to a sub-item that is not directly under a note. Only one level of item nesting is allowed unless parented by a note.');
		}

		const subItem = new TodoItem(title, {
			parentItem: this,
			id, // ID for subItem will usually be provided by TodoList.createSubItem
			originalParent: this.parentItem ? this.originalParent : this,
			parentList: this.parentList, // Pass parentList
		});
		subItem.subItemIndex = this.subItems.length;
		subItem.originalSubItemIndex = subItem.subItemIndex;
		this.subItems.push(subItem);
		await this.parentList?.save(); // Save the list
		return subItem;
	}

	async addNote(content: string): Promise<Note> {
		const note = new Note(content, {
			parentItem: this,
			parentList: this.parentList, // Pass parentList
		});
		this.notes.push(note);
		await this.parentList?.save(); // Save the list
		return note;
	}

	async toggleCompleted(): Promise<void> {
		this.completed = !this.completed;
		await this.parentList?.save();
	}

	async updateTitle(newTitle: string): Promise<void> {
		this.title = newTitle;
		await this.parentList?.save();
	}

	async updateAge(newAge: number): Promise<void> {
		this.age = newAge;
		await this.parentList?.save();
	}

	carryOver(): TodoItem | null {
		// Don't carry over completed items
		if (this.completed) {
			return null;
		}

		const newItem = new TodoItem(this.title, {
			age: this.age + 1,
			id: this.id, // ID might be reassigned by the new list
			parentItem: this.parentItem, // This structure might change in new list context
			originalParent: this.originalParent,
			subItemIndex: this.subItemIndex,
			originalSubItemIndex: this.originalSubItemIndex,
			parentList: undefined, // parentList will be set by the new TodoList
		});

		// Carry over sub-items
		for (const subItem of this.subItems) {
			const carriedSubItem = subItem.carryOver(); // subItem.parentList will be undefined initially
			if (carriedSubItem) {
				// ParentItem for carriedSubItem will be newItem.
				// Its parentList also needs to be undefined initially.
				carriedSubItem.parentItem = newItem; // Explicitly set parent for carried sub-item
				newItem.subItems.push(carriedSubItem);
			}
		}

		// Notes are associated with their specific item instance,
		// if notes need to be "carried over" (duplicated or moved), that logic should be here.
		// For now, let's assume notes are part of the state of this item and "move" with it.
		// If notes are independent entities that can be re-associated, this would be different.
		// Current Note structure with parentItem links them to the item.
		// If newItem is a conceptually "new" item, notes would typically not transfer unless explicitly cloned.
		// Given carryOver is for rescheduling, keeping notes seems logical.
		this.notes.forEach(note => {
			// Notes are reconstructed for the newItem, their parentList will be undefined initially.
			const newNote = Note.fromPlainObject(note.toPlainObject(), newItem, undefined, undefined);
			newNote.parentItem = newItem; // Explicitly set parentItem
			newItem.notes.push(newNote);
		});

		return newItem;
	}


	getAllSubItems(): TodoItem[] {
		return this.subItems.slice();
	}

	getAllNotes(): Note[] {
		let allNotes: Note[] = [];

		// Add this item's notes
		allNotes = allNotes.concat(this.notes);

		// Add notes from sub-notes of this item's notes (notes can have sub-notes)
		for (const note of this.notes) {
			// note.getAllNotes() includes the note itself and all its descendants.
			// If we only want children, we'd skip the first one.
			// Here, we want all notes associated with this item, including nested notes.
			allNotes = allNotes.concat(note.getAllNotes().filter(n => n !== note)); // Get descendants
		}

		return allNotes;
	}

	toPlainObject(): any {
		return {
			id: this.id,
			title: this.title,
			completed: this.completed,
			age: this.age,
			subItemIndex: this.subItemIndex,
			originalSubItemIndex: this.originalSubItemIndex,
			notes: this.notes.map(note => note.toPlainObject()),
			subItems: this.subItems.map(item => item.toPlainObject()),
			parentItemId: this.parentItem ? this.parentItem.id : undefined,
			parentNoteId: this.parentNote ? this.parentNote.id : undefined,
			originalParentId: this.originalParent ? this.originalParent.id : undefined,
			// parentList is not serialized
		};
	}

	static fromPlainObject(plainItem: any, parentList?: TodoList, parentItemRef?: TodoItem, parentNoteRef?: Note): TodoItem {
		const options: TodoItemOptions = {
			id: plainItem.id,
			completed: plainItem.completed,
			age: plainItem.age,
			subItemIndex: plainItem.subItemIndex,
			originalSubItemIndex: plainItem.originalSubItemIndex,
			parentList: parentList, // Pass parentList to options
		};

		if (parentItemRef) options.parentItem = parentItemRef;
		if (parentNoteRef) options.parentNote = parentNoteRef;

		const newItem = new TodoItem(plainItem.title, options);

		newItem.parentItemId = plainItem.parentItemId;
		newItem.parentNoteId = plainItem.parentNoteId;
		newItem.originalParentId = plainItem.originalParentId;

		if (plainItem.notes && Array.isArray(plainItem.notes)) {
			newItem.notes = plainItem.notes.map((noteData: any) =>
				Note.fromPlainObject(noteData, newItem, undefined, parentList) // Pass parentList to notes
			);
		}

		if (plainItem.subItems && Array.isArray(plainItem.subItems)) {
			newItem.subItems = plainItem.subItems.map((subItemData: any) => {
				// Pass parentList and newItem (as parentItemRef) to sub-items
				const subItem = TodoItem.fromPlainObject(subItemData, parentList, newItem);
				// Logic for originalParent (already present, seems okay)
				if (plainItem.id !== undefined && subItem.originalParentId === undefined && subItem.parentItemId === plainItem.id) {
					subItem.originalParent = newItem.originalParent ? newItem.originalParent : newItem;
					subItem.originalParentId = subItem.originalParent.id;
				}
				return subItem;
			});
		}
		return newItem;
	}
}
