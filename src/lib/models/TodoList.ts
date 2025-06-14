import { TodoItem } from './TodoItem';
import { Note } from './Note';
import { openDB, putToStore, DBNAME, OBJECT_STORE_LISTS, upgradeCallback } from '../services/indexedDB';

interface TodoListOptions {
	items?: TodoItem[];
	nextId?: number;
	id?: string;
}

function formatDateToId(date: Date): string {
	const year = date.getFullYear();
	const month = (date.getMonth() + 1).toString().padStart(2, '0');
	const day = date.getDate().toString().padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export class TodoList {
	id: string;
	date: Date;
	items: TodoItem[] = [];
	nextId: number = 1;
	private dbPromise: Promise<IDBDatabase> | null = null;

	constructor(date: Date, options: TodoListOptions = {}) {
		this.date = date;
		this.id = options.id || formatDateToId(date);
		this.items = options.items || [];
		// Ensure items passed via options also get this list as parentList
		this.items.forEach(item => {
			if (!item.parentList) item.parentList = this;
			item.subItems.forEach(subItem => { // And their sub-items, recursively
				const setParentListRecursively = (currentItem: TodoItem) => {
					if (!currentItem.parentList) currentItem.parentList = this;
					currentItem.notes.forEach(note => {
						if(!note.parentList) note.parentList = this;
					});
					currentItem.subItems.forEach(sub => setParentListRecursively(sub));
				};
				setParentListRecursively(subItem);
			});
			item.notes.forEach(note => {
				if (!note.parentList) note.parentList = this;
			});
		});
		this.nextId = options.nextId || 1;
	}

	private getDB(): Promise<IDBDatabase> {
		if (!this.dbPromise) {
			this.dbPromise = openDB(DBNAME, 1, upgradeCallback);
		}
		return this.dbPromise;
	}

	async save(): Promise<void> {
		try {
			const db = await this.getDB();
			await putToStore(db, OBJECT_STORE_LISTS, this.toPlainObject());
			// console.log(`TodoList ${this.id} saved successfully.`);
		} catch (error) {
			console.error(`Error saving TodoList ${this.id}:`, error);
		}
	}

	async addItem(item: TodoItem): Promise<void> {
		if (item.id === 0 || this.items.find(i => i.id === item.id) || this.getAllItems(true).find(i => i.id === item.id && i !== item)) {
			if (item.id === 0 || !this.items.includes(item)) {
				item.id = this.getNextId();
			}
		}
		item.parentList = this; // Ensure parentList is set
		if (!this.items.includes(item)) {
			this.items.push(item);
		}
		await this.save();
	}

	async createItem(title: string): Promise<TodoItem> {
		const item = new TodoItem(title, { id: this.getNextId(), parentList: this });
		// No need to call this.addItem explicitly if we push here and save
		this.items.push(item);
		await this.save();
		return item;
	}

	async createSubItem(parentItem: TodoItem, title: string): Promise<TodoItem> {
		if (parentItem.parentItem && !parentItem.parentNote) {
			console.warn("Attempting to create sub-item for an item that is already a sub-item. This might lead to unexpected structure or errors.");
		}

		// TodoItem's addSubItem is now async and handles saving through its parentList.
		// We just need to ensure the ID is unique if generated here.
		// However, addSubItem in TodoItem does not take an ID.
		// Instead, we create the subItem and let parentItem.addSubItem handle it.
		// The ID should be assigned by this list.
		const subItemId = this.getNextId();
		// The addSubItem method on parentItem will call parentList.save()
		const subItem = await parentItem.addSubItem(title, subItemId);
		// subItem.id = subItemId; // addSubItem on TodoItem should accept and assign the ID.
		// Let's adjust TodoItem.addSubItem to take the id.
		// For now, assuming parentItem.addSubItem handles the save. If not, save here.
		// await this.save(); // Already saved by parentItem.addSubItem if parentList is set correctly
		return subItem;
	}

	getAllItems(includeSubItems: boolean = true): TodoItem[] {
		let allItemsToReturn: TodoItem[] = [];
		// Add main level items
		allItemsToReturn = allItemsToReturn.concat(this.items);

		if (includeSubItems) {
			for (const item of this.items) {
				const collectSubItems = (currentItem: TodoItem) => {
					const directSubItems = currentItem.subItems;
					allItemsToReturn = allItemsToReturn.concat(directSubItems);
					for (const sub of directSubItems) {
						collectSubItems(sub);
					}
				};
				collectSubItems(item);
			}
		}
		return allItemsToReturn;
	}

	getAllNotes(): Note[] {
		let allNotesToReturn: Note[] = [];
		const allItemsInList = this.getAllItems(true);

		for (const item of allItemsInList) {
			allNotesToReturn = allNotesToReturn.concat(item.getAllNotes());
		}
		return Array.from(new Set(allNotesToReturn));
	}

	async createNextDayList(nextDate: Date): Promise<TodoList> {
		await this.save(); // Save the current list first

		const nextList = new TodoList(nextDate, { parentList: null } as any); // nextList will manage its own saving

		// Logic for carrying over items
		for (const item of this.items) {
			const carriedItem = item.carryOver(); // TodoItem.carryOver now sets parentList to undefined
			if (carriedItem) {
				carriedItem.id = nextList.getNextId(); // Assign ID from the new list
				carriedItem.parentList = nextList; // Set parentList for the carried item

				const assignNewIdsAndParentList = (currentItem: TodoItem, pList: TodoList) => {
					currentItem.parentList = pList;
					currentItem.notes.forEach(note => {
						note.parentList = pList;
					});
					currentItem.subItems.forEach(sub => {
						sub.id = pList.getNextId(); // Assign new ID from next list
						assignNewIdsAndParentList(sub, pList);
					});
				};
				assignNewIdsAndParentList(carriedItem, nextList);
				// addItem on nextList will also save it.
				await nextList.addItem(carriedItem); // addItem is async
			}
		}

		if (nextList.items.length === 0) {
			await nextList.save(); // Explicitly save if the next list is empty
		}
		return nextList;
	}

	static async createFirstList(date: Date): Promise<TodoList> {
		const list = new TodoList(date);
		await list.save(); // Save the newly created first list
		return list;
	}

	public getNextId(): number { // Make public if accessed from components, or keep private/protected
		return this.nextId++;
	}

	toPlainObject(): any {
		return {
			id: this.id,
			date: this.date.toISOString(),
			items: this.items.map(item => item.toPlainObject()),
			nextId: this.nextId,
		};
	}

	static fromPlainObject(plainList: any): TodoList {
		const date = new Date(plainList.date);
		const list = new TodoList(date, { // parentList is not passed here; this list is the root
			id: plainList.id,
			nextId: plainList.nextId,
		});

		list.items = plainList.items.map((itemData: any) =>
			TodoItem.fromPlainObject(itemData, list) // Pass 'list' as parentList
		);

		// Second pass: Link parent references (IDs to instances)
		const itemMap = new Map<number, TodoItem>();
		const noteMap = new Map<string, Note>();

		const allItemsForLinking = list.getAllItems(true);

		allItemsForLinking.forEach(item => {
			if (item.id !== undefined) itemMap.set(item.id, item);
			// Ensure all notes, including nested ones, are in the noteMap and have parentList set
			const collectAllNotesAndSetParentList = (notes: Note[], pList: TodoList) => {
				for (const note of notes) {
					if (note.id && !noteMap.has(note.id)) noteMap.set(note.id, note);
					if (!note.parentList) note.parentList = pList; // Set parentList if not already set
					if (note.subNotes.length > 0) {
						collectAllNotesAndSetParentList(note.subNotes, pList);
					}
				}
			};
			collectAllNotesAndSetParentList(item.notes, list);
		});

		// Populate noteMap more thoroughly, especially for notes that might be parented by other notes.
		// This ensures all notes within the list structure are captured for linking.
		const allRootNotes = list.items.reduce((acc, item) => acc.concat(item.notes), [] as Note[]);
		const fullyCollectNotes = (notes: Note[]) => {
			for (const note of notes) {
				if (note.id && !noteMap.has(note.id)) {
					noteMap.set(note.id, note);
				}
				if (!note.parentList) note.parentList = list; // Crucial: ensure all notes know their parent list
				if (note.subNotes) {
					fullyCollectNotes(note.subNotes);
				}
			}
		};
		fullyCollectNotes(allRootNotes);


		allItemsForLinking.forEach(item => {
			if (item.parentItemId !== undefined) {
				const parent = itemMap.get(item.parentItemId);
				if (parent) item.parentItem = parent;
				else console.warn(`Parent item with ID ${item.parentItemId} not found for item ${item.id}`);
			}
			if (item.originalParentId !== undefined) {
				const originalParent = itemMap.get(item.originalParentId);
				if (originalParent) item.originalParent = originalParent;
				else console.warn(`Original parent item with ID ${item.originalParentId} not found for item ${item.id}`);
			}
			if (item.parentNoteId !== undefined) {
				const parentNoteEntity = noteMap.get(item.parentNoteId);
				if (parentNoteEntity) item.parentNote = parentNoteEntity;
				else console.warn(`Parent note with ID ${item.parentNoteId} not found for item ${item.id}`);
			}

			// Link parents for notes within this item
			const notesToLink = item.getAllNotes();
			notesToLink.forEach(note => {
				if (!note.parentList) note.parentList = list; // Ensure parentList is set on all notes

				if (note.parentItemId !== undefined) {
					const parentItemRef = itemMap.get(note.parentItemId);
					if (parentItemRef) note.parentItem = parentItemRef;
					else console.warn(`Parent item with ID ${note.parentItemId} not found for note ${note.id}`);
				}
				if (note.parentNoteId !== undefined) {
					const parentNoteRef = noteMap.get(note.parentNoteId);
					if (parentNoteRef) note.parentNote = parentNoteRef;
					else console.warn(`Parent note with ID ${note.parentNoteId} not found for note ${note.id}`);
				}
			});
		});
		return list;
	}
}
