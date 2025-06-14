import { describe, it, expect } from 'vitest';
import { TodoList } from './TodoList';
import { TodoItem } from './TodoItem';

describe('TodoList', () => {
	it('should create an empty TodoList for a specific date', () => {
		const date = new Date('2023-01-01');
		const list = new TodoList(date);

		expect(list.date).toBe(date);
		expect(list.items).toEqual([]);
	});

	it('should add a todo item to the list', () => {
		const list = new TodoList(new Date());
		const item = new TodoItem('Test item');

		list.addItem(item);

		expect(list.items.length).toBe(1);
		expect(list.items[0]).toBe(item);
	});

	it('should create and add a new todo item to the list', () => {
		const list = new TodoList(new Date());
		const item = list.createItem('Test item');

		expect(list.items.length).toBe(1);
		expect(list.items[0]).toBe(item);
		expect(item.title).toBe('Test item');
	});

	it('should get all items including sub-items', () => {
		const list = new TodoList(new Date());
		const item1 = list.createItem('Item 1');
		const item2 = list.createItem('Item 2');
		const subItem1 = item1.addSubItem('Sub item 1');
		const subItem2 = item1.addSubItem('Sub item 2');

		const allItems = list.getAllItems();

		expect(allItems.length).toBe(4);
		expect(allItems).toContain(item1);
		expect(allItems).toContain(item2);
		expect(allItems).toContain(subItem1);
		expect(allItems).toContain(subItem2);
	});

	it('should get all notes from all items', () => {
		const list = new TodoList(new Date());
		const item1 = list.createItem('Item 1');
		const item2 = list.createItem('Item 2');
		const note1 = item1.addNote('Note 1');
		const note2 = item2.addNote('Note 2');
		const subNote = note1.addSubNote('Sub note');

		const allNotes = list.getAllNotes();

		expect(allNotes.length).toBe(3);
		expect(allNotes).toContain(note1);
		expect(allNotes).toContain(note2);
		expect(allNotes).toContain(subNote);
	});

	it('should create a new list for the next day with carried over items', () => {
		const day1 = new Date('2023-01-01');
		const list1 = new TodoList(day1);
		const item1 = list1.createItem('Item 1');
		const item2 = list1.createItem('Item 2');
		const _subItem = item1.addSubItem('Sub item');
		item2.completed = true;

		const day2 = new Date('2023-01-02');
		const list2 = list1.createNextDayList(day2);

		expect(list2.date).toBe(day2);
		expect(list2.items.length).toBe(1);
		expect(list2.items[0].title).toBe('Item 1');
		expect(list2.items[0].age).toBe(1);
		expect(list2.items[0].subItems.length).toBe(1);
		expect(list2.items[0].subItems[0].title).toBe('Sub item');
		expect(list2.items[0].subItems[0].age).toBe(1);
	});

	it('should handle the case when all items are completed (empty next day list)', () => {
		const day1 = new Date('2023-01-01');
		const list1 = new TodoList(day1);
		const item = list1.createItem('Item 1');
		item.completed = true;

		const day2 = new Date('2023-01-02');
		const list2 = list1.createNextDayList(day2);

		expect(list2.date).toBe(day2);
		expect(list2.items.length).toBe(0);
	});

	it('should create the first list for a user with no carried over items', () => {
		const list = TodoList.createFirstList(new Date());

		expect(list.items.length).toBe(0);
	});

	it('should convert a sub-sub-item to a main level item when created', () => {
		const list = new TodoList(new Date());
		const item = list.createItem('Main item');
		const subItem = item.addSubItem('Sub item');

		// This should convert subItem to a main level item
		const subSubItem = list.createSubItem(subItem, 'Sub-sub item');

		expect(list.items.length).toBe(2);
		expect(list.items[1]).toBe(subItem);
		expect(subItem.parentItem).toBe(item); // Still keeps the link to original parent
		expect(subItem.subItems.length).toBe(1);
		expect(subItem.subItems[0]).toBe(subSubItem);
	});

	it('should promote a sub-task with existing sub-tasks, assigning a new ID to the promoted task', () => {
		const list = new TodoList(new Date());
		const mainTask = list.createItem('Main Task');
		const promotedTask = list.createSubItem(mainTask, 'Promoted Task'); // Becomes sub-item of mainTask
		const childOfPromotedTask = list.createSubItem(promotedTask, 'Child of Promoted Task'); // Becomes sub-item of promotedTask

		const originalPromotedTaskId = promotedTask.id;

		// Act: Promote 'promotedTask' by adding a new sub-item to it.
		// This call will make 'promotedTask' a main-level item.
		const newSubTaskForPromoted = list.createSubItem(promotedTask, 'New Sub-task for Promoted');

		// Assert
		// 1. Promoted task gets a new ID
		expect(promotedTask.id).not.toBe(originalPromotedTaskId);
		expect(promotedTask.id).toBeGreaterThan(originalPromotedTaskId); // New IDs are incremental

		// 2. Promoted task's original parent is maintained
		expect(promotedTask.originalParent).toBe(mainTask);

		// 3. Child of the promoted task still points to the promoted task
		expect(childOfPromotedTask.parentItem).toBe(promotedTask);
		// Ensure childOfPromotedTask is still part of promotedTask's subItems
		expect(promotedTask.subItems).toContain(childOfPromotedTask);

		// 4. The new sub-task (that triggered promotion) correctly has promotedTask as its parent
		expect(newSubTaskForPromoted.parentItem).toBe(promotedTask);
		expect(promotedTask.subItems).toContain(newSubTaskForPromoted);

		// 5. Check structure: mainTask should no longer have promotedTask as a direct subItem (it's promoted)
		expect(mainTask.subItems).not.toContain(promotedTask);

		// 6. PromotedTask should now be a top-level item in the list
		expect(list.items).toContain(promotedTask);

		// 7. Check sub-item counts
		expect(mainTask.subItems.length).toBe(0); // Assuming promotedTask was its only subitem
		expect(promotedTask.subItems.length).toBe(2); // childOfPromotedTask and newSubTaskForPromoted
	});
});
