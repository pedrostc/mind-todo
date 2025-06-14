<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { TodoList } from '../models/TodoList';
	import TodoItemComponent from './TodoItemComponent.svelte';
	import type { TodoItem } from '$lib/models/TodoItem';
	import type { Note } from '$lib/models/Note';

	export let todoList: TodoList;

	const dispatch = createEventDispatcher();

	let newItemTitle = '';
	let newItemInput: HTMLInputElement;

	// Format the date as "Month Day, Year"
	$: formattedDate = todoList.date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});

	function addItem(): void {
		if (newItemTitle.trim()) {
			todoList.createItem(newItemTitle);
			// Force reactivity by reassigning the items array
			todoList.items = [...todoList.items];
			newItemTitle = '';
			// Focus the input after adding an item
			setTimeout(() => newItemInput?.focus(), 0);
		}
	}

	// Focus the input when the component is mounted
	onMount(() => {
		// Focus the input after the component is mounted
		setTimeout(() => newItemInput?.focus(), 0);
	});

	function handleAddSubItem(event: CustomEvent<{ parentItem: TodoItem; title: string }>): void {
		const { parentItem, title } = event.detail;

		// Check if this would create a sub-sub-item
		if (parentItem.parentItem) {
			// Convert the sub-item to a main level item
			todoList.createSubItem(parentItem, title);
			// Force reactivity by reassigning the items array
			todoList.items = [...todoList.items];
		} else {
			parentItem.addSubItem(title);
			// Force reactivity for sub-items
			todoList.items = [...todoList.items];
		}
	}

	function handleAddNote(event: CustomEvent<{ parentItem: TodoItem; content: string }>): void {
		const { parentItem, content } = event.detail;
		parentItem.addNote(content);
		// Force reactivity
		todoList.items = [...todoList.items];
	}

	function handleAddSubNote(event: CustomEvent<{ parentNote: Note; content: string }>): void {
		const { parentNote, content } = event.detail;
		parentNote.addSubNote(content);
		// Force reactivity
		todoList.items = [...todoList.items];
	}

	function handleCreateTodoFromNote(event: CustomEvent<Note>): void {
		const note = event.detail;
		const newItem = note.createTodoItem();
		// Assign a new ID to the todo item
		newItem.id = todoList.getNextId();
		todoList.addItem(newItem);
		// Force reactivity by reassigning the items array
		todoList.items = [...todoList.items];
	}

	function handleEditNote(event: CustomEvent<{ note: Note; content: string }>): void {
		const { note, content } = event.detail;
		note.content = content;
		// Force reactivity
		todoList.items = [...todoList.items];
	}

	function handleEditItem(event: CustomEvent<{ item: TodoItem; title: string }>): void {
		const { item, title } = event.detail;
		item.title = title;
		// Force reactivity
		todoList.items = [...todoList.items];
	}

	function handleDeleteNote(event: CustomEvent<Note>): void {
		const noteToDelete = event.detail;

		// Find the parent item or note
		if (noteToDelete.parentItem) {
			const parentItem = noteToDelete.parentItem;
			const index = parentItem.notes.indexOf(noteToDelete);
			if (index !== -1) {
				parentItem.notes.splice(index, 1);
			}
		} else if (noteToDelete.parentNote) {
			const parentNote = noteToDelete.parentNote;
			const index = parentNote.subNotes.indexOf(noteToDelete);
			if (index !== -1) {
				parentNote.subNotes.splice(index, 1);
			}
		}
		// Force reactivity
		todoList.items = [...todoList.items];
	}

	function createNextDayList(): void {
		const tomorrow = new Date(todoList.date);
		tomorrow.setDate(tomorrow.getDate() + 1);

		const nextList = todoList.createNextDayList(tomorrow);
		dispatch('nextDayList', nextList);
	}
</script>

<div class="todo-list">
	<header>
		<h1>{formattedDate}</h1>
		<button class="next-day-button" on:click={createNextDayList}> Create Next Day List </button>
	</header>

	<div class="add-item">
		<input
			type="text"
			placeholder="Add a new item..."
			bind:value={newItemTitle}
			bind:this={newItemInput}
			on:keydown={(e) => e.key === 'Enter' && addItem()}
		/>
		<button on:click={addItem}>Add</button>
	</div>

	<div class="items">
		{#if todoList.items.length === 0}
			<p class="empty-message">No items for today. Add one above!</p>
		{:else}
			{#each todoList.items as item (item.id)}
				<TodoItemComponent
					{item}
					on:addSubItem={handleAddSubItem}
					on:addNote={handleAddNote}
					on:addSubNote={handleAddSubNote}
					on:createTodoFromNote={handleCreateTodoFromNote}
					on:editNote={handleEditNote}
					on:editItem={handleEditItem}
					on:deleteNote={handleDeleteNote}
				/>
			{/each}
		{/if}
	</div>
</div>

<style>
	.todo-list {
		max-width: 800px;
		margin: 0 auto;
		padding: 16px;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
	}

	h1 {
		margin: 0;
		font-size: 1.5rem;
	}

	.next-day-button {
		background: #4a90e2;
		color: white;
		border: none;
		border-radius: 4px;
		padding: 8px 16px;
		cursor: pointer;
	}

	.next-day-button:hover {
		background: #3a80d2;
	}

	.add-item {
		display: flex;
		margin-bottom: 16px;
	}

	.add-item input {
		flex: 1;
		padding: 8px;
		border: 1px solid #ddd;
		border-radius: 4px 0 0 4px;
	}

	.add-item button {
		background: #4a90e2;
		color: white;
		border: none;
		border-radius: 0 4px 4px 0;
		padding: 8px 16px;
		cursor: pointer;
	}

	.add-item button:hover {
		background: #3a80d2;
	}

	.empty-message {
		text-align: center;
		color: #888;
		font-style: italic;
		padding: 24px;
		border: 1px dashed #ddd;
		border-radius: 4px;
	}
</style>
