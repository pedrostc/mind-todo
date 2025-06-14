import { TodoItem } from './TodoItem';

interface NoteOptions {
	parentItem?: TodoItem;
	parentNote?: Note;
	level?: number;
}

export class Note {
	content: string;
	subNotes: Note[] = [];
	parentItem?: TodoItem;
	parentNote?: Note;
	level: number;

	constructor(content: string, options: NoteOptions = {}) {
		this.content = content;
		this.parentItem = options.parentItem;
		this.parentNote = options.parentNote;
		this.level = options.level ?? 0;
	}

	addSubNote(content: string): Note {
		// Check if we're already at the maximum nesting level (2)
		if (this.level >= 2) {
			throw new Error('Cannot add sub-notes beyond 2 levels deep.');
		}

		const subNote = new Note(content, {
			parentNote: this,
			level: this.level + 1
		});

		this.subNotes.push(subNote);
		return subNote;
	}

	createTodoItem(): TodoItem {
		// Create a new todo item with a reference to this note
		const todoItem = new TodoItem(this.content, {
			parentNote: this
		});

		return todoItem;
	}

	/**
	 * Gets the parent item's ID, or if the parent is a sub-item, returns the parent item's ID and the sub-item's ID
	 * in the format "item.sub-item".
	 */
	getParentReference(): string | undefined {
		if (this.parentItem) {
			if (this.parentItem.parentItem) {
				// This is a note of a sub-item, format: "parent.sub"
				return `${this.parentItem.parentItem.id}.${this.parentItem.subItemIndex + 1}`;
			} else {
				// This is a note of a main item
				return `${this.parentItem.id}`;
			}
		}
		return undefined;
	}

	getFormattedContent(): string {
		// Add indentation based on level
		const indent = '  '.repeat(this.level);
		return `${indent}• ${this.content}`;
	}

	getAllNotes(): Note[] {
		let allNotes: Note[] = [this];

		// Add all sub-notes in a depth-first manner
		for (const subNote of this.subNotes) {
			allNotes = allNotes.concat(subNote.getAllNotes());
		}

		return allNotes;
	}
}
