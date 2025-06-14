import type { TodoItem } from './TodoItem'; // Use type-only import if possible
import type { TodoList } from './TodoList'; // Type-only import for TodoList

interface NoteOptions {
	id?: string;
	parentItem?: TodoItem;
	parentNote?: Note;
	level?: number;
	parentList?: TodoList; // Added parentList
}

export class Note {
	id: string;
	content: string;
	subNotes: Note[] = [];
	parentItem?: TodoItem;
	parentNote?: Note;
	level: number;
	parentList?: TodoList; // Added parentList property

	constructor(content: string, options: NoteOptions = {}) {
		this.id = options.id || crypto.randomUUID();
		this.content = content;
		this.parentItem = options.parentItem;
		this.parentNote = options.parentNote;
		this.level = options.level ?? 0;
		this.parentList = options.parentList; // Assign parentList
	}

	async addSubNote(content: string): Promise<Note> {
		// Check if we're already at the maximum nesting level (2)
		if (this.level >= 2) {
			// console.warn('Cannot add sub-notes beyond 2 levels deep.');
		}

		const subNote = new Note(content, {
			parentNote: this,
			level: this.level + 1,
			parentList: this.parentList, // Pass parentList to sub-note
			// parentItem will be implicitly undefined
		});

		this.subNotes.push(subNote);
		await this.parentList?.save(); // Save the list after adding a sub-note
		return subNote;
	}

	async updateContent(newContent: string): Promise<void> {
		this.content = newContent;
		await this.parentList?.save();
	}

	// createTodoItem is removed as per the instructions in the other file's modification (TodoItem.ts)
	// If it's needed, it should be re-evaluated in the context of how Notes and TodoItems interact.

	/**
	 * Gets the parent item's ID.
	 */
	getParentItemId(): string | undefined {
		return this.parentItem?.id;
	}

	/**
	 * Gets the parent note's ID.
	 */
	getParentNoteId(): string | undefined {
		return this.parentNote?.id;
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

	toPlainObject(): any {
		return {
			id: this.id,
			content: this.content,
			level: this.level,
			subNotes: this.subNotes.map(sn => sn.toPlainObject()),
			parentItemId: this.parentItem ? this.parentItem.id : undefined,
			parentNoteId: this.parentNote ? this.parentNote.id : undefined,
			// parentList is not serialized, it's a runtime reference
		};
	}

	static fromPlainObject(plainNote: any, parentItem?: TodoItem, parentNote?: Note, parentList?: TodoList): Note {
		const note = new Note(plainNote.content, {
			id: plainNote.id,
			level: plainNote.level,
			parentItem: parentItem,
			parentNote: parentNote,
			parentList: parentList, // Assign parentList from argument
		});

		if (plainNote.subNotes && Array.isArray(plainNote.subNotes)) {
			note.subNotes = plainNote.subNotes.map((subPlainNote: any) =>
				Note.fromPlainObject(subPlainNote, undefined, note, parentList) // Pass parentList to sub-notes
			);
		}
		return note;
	}
}
