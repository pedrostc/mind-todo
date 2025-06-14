import { expect, test } from '@playwright/test';

test.describe('Todo App', () => {
	test('should create a new todo list and add items', async ({ page }) => {
		// Navigate to the app
		await page.goto('/');

		// Check that the app title is displayed
		await expect(page.locator('h1')).toHaveText('Mind-Todo');

		// Check that the current date is displayed
		const today = new Date();
		const formattedDate = today.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
		await expect(page.locator('header h1')).toHaveText(formattedDate);

		// Add a new todo item
		await page.fill('input[placeholder="Add a new item..."]', 'Test todo item');
		await page.click('button:has-text("Add")');

		// Check that the item was added
		await expect(page.locator('.todo-item')).toContainText('Test todo item');

		// Add a sub-item
		await page.click('.todo-item .menu-button');
		await page.click('button:has-text("Add Sub-item")');
		await page.fill('input[placeholder="Add a sub-item..."]', 'Test sub-item');
		await page.click('.add-form button:has-text("Add")');

		// Check that the sub-item was added
		await expect(page.locator('.sub-items .todo-item')).toContainText('Test sub-item');

		// Add a note
		await page.click('.todo-item .menu-button');
		await page.click('button:has-text("Add Note")');
		await page.fill('input[placeholder="Add a note..."]', 'Test note');
		await page.click('.add-form button:has-text("Add")');

		// Check that the note was added
		await expect(page.locator('.notes')).toContainText('• Test note');

		// Mark the item as completed
		await page.click('.todo-item input[type="checkbox"]');

		// Create a new list for the next day
		await page.click('button:has-text("Create Next Day List")');

		// Check that the new date is displayed
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		const tomorrowFormatted = tomorrow.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
		await expect(page.locator('header h1')).toHaveText(tomorrowFormatted);

		// Check that completed items were not carried over
		await expect(page.locator('.todo-item')).not.toContainText('Test todo item');
	});

	test('should handle sub-sub-items by promoting the parent sub-item', async ({ page }) => {
		await page.goto('/');

		// Add a main item
		await page.fill('input[placeholder="Add a new item..."]', 'Main item');
		await page.click('button:has-text("Add")');

		// Add a sub-item
		await page.click('.todo-item .menu-button');
		await page.click('button:has-text("Add Sub-item")');
		await page.fill('input[placeholder="Add a sub-item..."]', 'Sub-item');
		await page.click('.add-form button:has-text("Add")');

		// Try to add a sub-sub-item (should promote the sub-item)
		await page.click('.sub-items .todo-item .menu-button');
		await page.click('button:has-text("Add Sub-item")');
		await page.fill('input[placeholder="Add a sub-item..."]', 'Sub-sub-item');
		await page.click('.add-form button:has-text("Add")');

		// Check that the sub-item was promoted (now there should be 2 main items)
		const mainItems = await page.locator('.todo-list > .items > .todo-item').count();
		expect(mainItems).toBe(2);

		// Check that the sub-sub-item was added to the promoted sub-item
		await expect(page.locator('.todo-item:has-text("Sub-item") .sub-items')).toContainText(
			'Sub-sub-item'
		);
	});

	test('should create todo items from notes', async ({ page }) => {
		await page.goto('/');

		// Add a main item
		await page.fill('input[placeholder="Add a new item..."]', 'Main item');
		await page.click('button:has-text("Add")');

		// Add a note
		await page.click('.todo-item .menu-button');
		await page.click('button:has-text("Add Note")');
		await page.fill('input[placeholder="Add a note..."]', 'Note to convert');
		await page.click('.add-form button:has-text("Add")');

		// Create a todo item from the note
		await page.click('.note-content .menu-button');
		await page.click('button:has-text("Create Todo")');

		// Check that a new todo item was created from the note
		const mainItems = await page.locator('.todo-list > .items > .todo-item').count();
		expect(mainItems).toBe(2);
		await expect(page.locator('.todo-item')).toContainText('Note to convert');
	});
});
