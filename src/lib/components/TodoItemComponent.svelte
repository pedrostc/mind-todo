<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { TodoItem } from '../models/TodoItem';
	import NoteComponent from './NoteComponent.svelte';

	export let item: TodoItem;

	const dispatch = createEventDispatcher();

	// Click outside action
	function clickOutside(
		node: HTMLElement,
		{ enabled, callback }: { enabled: boolean; callback: () => void }
	) {
		const handleClick = (event: MouseEvent) => {
			if (enabled && node && !node.contains(event.target as Node) && !event.defaultPrevented) {
				callback();
			}
		};

		document.addEventListener('click', handleClick, true);

		return {
			update(params: { enabled: boolean; callback: () => void }) {
				enabled = params.enabled;
				callback = params.callback;
			},
			destroy() {
				document.removeEventListener('click', handleClick, true);
			}
		};
	}

	let showMenu = false;
	let showAddSubItem = false;
	let showAddNote = false;
	let isEditing = false;
	let newSubItemTitle = '';
	let newNoteContent = '';
	let editedTitle = item.title;
	let subItemInput: HTMLInputElement;
	let noteInput: HTMLInputElement;
	let editInput: HTMLInputElement;

	// Function to get the full ID path for an item
	function getItemIdPath(currentItem: TodoItem): string {
		// Base case: if this is a top-level item
		if (!currentItem.parentItem) {
			return `${currentItem.id}`;
		}

		// If this item has a parent
		const parentPath = getItemIdPath(currentItem.parentItem);
		return `${parentPath}.${currentItem.subItemIndex + 1}`;
	}

	function toggleMenu(): void {
		showMenu = !showMenu;
	}

	function toggleCompleted(): void {
		item.completed = !item.completed;
	}

	function openAddSubItem(): void {
		showAddSubItem = true;
		showMenu = false;
		// Focus the input after the DOM updates
		setTimeout(() => subItemInput?.focus(), 0);
	}

	function addSubItem(): void {
		if (newSubItemTitle.trim()) {
			dispatch('addSubItem', {
				parentItem: item,
				title: newSubItemTitle
			});
			newSubItemTitle = '';
			showAddSubItem = false;
		}
	}

	function openAddNote(): void {
		showAddNote = true;
		showMenu = false;
		// Focus the input after the DOM updates
		setTimeout(() => noteInput?.focus(), 0);
	}

	function addNote(): void {
		if (newNoteContent.trim()) {
			dispatch('addNote', {
				parentItem: item,
				content: newNoteContent
			});
			newNoteContent = '';
			showAddNote = false;
		}
	}

	function handleAddSubNote(event: CustomEvent<Note>): void {
		dispatch('addSubNote', {
			parentNote: event.detail,
			content: ''
		});
	}

	function handleCreateTodoFromNote(event: CustomEvent<Note>): void {
		dispatch('createTodoFromNote', event.detail);
	}

	function handleEditNote(event: CustomEvent<{ note: Note; content: string }>): void {
		const note = event.detail.note;
		const content = event.detail.content;
		dispatch('editNote', { note, content });
	}

	function handleDeleteNote(event: CustomEvent<Note>): void {
		dispatch('deleteNote', event.detail);
	}

	function startEditing(): void {
		isEditing = true;
		editedTitle = item.title;
		showMenu = false;
		// Focus the input after the DOM updates
		setTimeout(() => editInput?.focus(), 0);
	}

	function saveEdit(): void {
		if (editedTitle.trim()) {
			dispatch('editItem', {
				item,
				title: editedTitle
			});
			isEditing = false;
		}
	}
</script>

<div class="todo-item" role="application" on:contextmenu={(event) => { toggleMenu(); event.preventDefault(); }}>
	{#if isEditing}
		<div class="edit-container">
			<input
				type="text"
				bind:value={editedTitle}
				bind:this={editInput}
				on:keydown={(e) => e.key === 'Enter' && saveEdit()}
			/>
			<button on:click={saveEdit}>Save</button>
		</div>
	{:else}
		<div class="item-header">
			<input type="checkbox" checked={item.completed} on:change={toggleCompleted} />
			<span class="item-id">
				{getItemIdPath(item)}
			</span>
			<span
				class={item.completed ? 'completed' : ''}
				role="button"
				tabindex="0"
				on:click={startEditing}
				on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && startEditing()}>{item.title}</span
			>

			{#if item.age > 0}
				<span class="age">{item.age} {item.age === 1 ? 'day' : 'days'}</span>
			{/if}

			{#if item.originalParent}
				<span class="parent-tag">from: {getItemIdPath(item.originalParent)}</span>
			{/if}

			{#if item.parentNote && item.parentNote.getParentReference()}
				<span class="reference-tag">ref: {item.parentNote.getParentReference()}</span>
			{/if}

			<button class="menu-button" on:click={toggleMenu}>...</button>

			{#if showMenu}
				<div
					class="menu"
					use:clickOutside={{ enabled: showMenu, callback: () => (showMenu = false) }}
				>
					<button on:click={openAddSubItem}>Add Sub-item</button>
					<button on:click={openAddNote}>Add Note</button>
					<button on:click={startEditing}>Edit</button>
				</div>
			{/if}
		</div>
	{/if}

	{#if showAddSubItem}
		<div class="add-form">
			<input
				type="text"
				placeholder="Add a sub-item..."
				bind:value={newSubItemTitle}
				bind:this={subItemInput}
				on:keydown={(e) => e.key === 'Enter' && addSubItem()}
			/>
			<button on:click={addSubItem}>Add</button>
		</div>
	{/if}

	{#if showAddNote}
		<div class="add-form">
			<input
				type="text"
				placeholder="Add a note..."
				bind:value={newNoteContent}
				bind:this={noteInput}
				on:keydown={(e) => e.key === 'Enter' && addNote()}
			/>
			<button on:click={addNote}>Add</button>
		</div>
	{/if}

	{#if item.notes.length > 0}
		<div class="notes">
			{#each item.notes as note (note.content)}
				<NoteComponent
					{note}
					on:addSubNote={handleAddSubNote}
					on:createTodo={handleCreateTodoFromNote}
					on:editNote={handleEditNote}
					on:deleteNote={handleDeleteNote}
				/>
			{/each}
		</div>
	{/if}

	{#if item.subItems.length > 0}
		<div class="sub-items">
			{#each item.subItems as subItem (subItem.id)}
				<svelte:self
					item={subItem}
					on:addSubItem
					on:addNote
					on:addSubNote
					on:createTodoFromNote
					on:editNote
					on:editItem
					on:deleteNote
				/>
			{/each}
		</div>
	{/if}
</div>

<style>
	.todo-item {
		margin: 8px 0;
		padding: 8px;
		border: 1px solid #eee;
		border-radius: 4px;
	}

	.item-header {
		display: flex;
		align-items: center;
		position: relative;
	}

	.item-header input[type='checkbox'] {
		margin-right: 8px;
	}

	.completed {
		text-decoration: line-through;
		color: #888;
	}

	.age {
		margin-left: 8px;
		font-size: 0.8em;
		color: #888;
		background: #f5f5f5;
		padding: 2px 6px;
		border-radius: 10px;
	}

	.item-id {
		margin-right: 8px;
		font-size: 0.8em;
		color: #fff;
		background: #333;
		padding: 2px 6px;
		border-radius: 10px;
		min-width: 20px;
		text-align: center;
		display: inline-block;
	}

	.parent-tag {
		margin-left: 8px;
		font-size: 0.8em;
		color: #fff;
		background: #4a90e2;
		padding: 2px 6px;
		border-radius: 10px;
	}

	.reference-tag {
		margin-left: 8px;
		font-size: 0.8em;
		color: #fff;
		background: #6c5ce7;
		padding: 2px 6px;
		border-radius: 10px;
	}

	.menu-button {
		background: none;
		border: none;
		cursor: pointer;
		margin-left: auto;
	}

	.menu {
		position: absolute;
		right: 0;
		top: 100%;
		background: white;
		border: 1px solid #ccc;
		border-radius: 4px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		z-index: 10;
		display: flex;
		flex-direction: column;
	}

	.menu button {
		background: none;
		border: none;
		padding: 8px 12px;
		text-align: left;
		cursor: pointer;
	}

	.menu button:hover {
		background: #f5f5f5;
	}

	.add-form,
	.edit-container {
		display: flex;
		margin: 8px 0;
	}

	.add-form input,
	.edit-container input {
		flex: 1;
		padding: 4px 8px;
		margin-right: 8px;
	}

	.sub-items {
		margin-left: 24px;
		margin-top: 8px;
		border-left: 2px solid #4a90e2;
		padding-left: 8px;
	}

	.notes {
		margin-top: 8px;
		margin-left: 24px;
		padding-top: 8px;
		border-top: 1px dashed #eee;
		background-color: #f9f9f9;
		border-radius: 4px;
		padding: 8px;
	}
</style>
