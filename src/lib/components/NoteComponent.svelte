<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Note } from '../models/Note';

	export let note: Note;

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
	let isEditing = false;
	let editedContent = note.content;
	let editTextarea: HTMLTextAreaElement;

	function toggleMenu(): void {
		showMenu = !showMenu;
	}

	function addSubNote(): void {
		dispatch('addSubNote', note);
		showMenu = false;
	}

	function createTodo(): void {
		dispatch('createTodo', note);
		showMenu = false;
	}

	function startEditing(): void {
		isEditing = true;
		editedContent = note.content;
		showMenu = false;
		// Focus the textarea after the DOM updates
		setTimeout(() => editTextarea?.focus(), 0);
	}

	function saveEdit(): void {
		dispatch('editNote', { note, content: editedContent });
		isEditing = false;
	}

	function deleteNote(): void {
		dispatch('deleteNote', note);
		showMenu = false;
	}
</script>

<div class="note-container">
	{#if isEditing}
		<div class="edit-container">
			<textarea
				bind:value={editedContent}
				bind:this={editTextarea}
				rows="3"
				on:keydown={(e) => e.key === 'Enter' && saveEdit()}
			></textarea>
			<button on:click={saveEdit}>Save</button>
		</div>
	{:else}
		<div class="note-content" data-testid="note-content" data-level={note.level}>
			<span class="note-text" data-testid="note-text" on:click={startEditing}>{note.content}</span>
			<button class="menu-button" on:click={toggleMenu}>...</button>

			{#if showMenu}
				<div
					class="menu"
					use:clickOutside={{ enabled: showMenu, callback: () => (showMenu = false) }}
				>
					{#if note.level < 2}
						<button on:click={addSubNote}>Add Sub-note</button>
					{/if}
					<button on:click={createTodo}>Create Todo</button>
					<button on:click={startEditing}>Edit</button>
					<button on:click={deleteNote}>Delete</button>
				</div>
			{/if}
		</div>
	{/if}

	{#if note.subNotes.length > 0}
		<div class="sub-notes">
			{#each note.subNotes as subNote (subNote.content)}
				<svelte:self note={subNote} on:addSubNote on:createTodo on:editNote on:deleteNote />
			{/each}
		</div>
	{/if}
</div>

<style>
	.note-container {
		margin: 4px 0;
	}

	.note-content {
		display: flex;
		align-items: flex-start;
		position: relative;
		padding: 4px;
		border-radius: 3px;
		background-color: #f9f9f9;
	}

	.note-text {
		font-style: italic;
		color: #555;
		flex: 1;
		white-space: pre-wrap;
		word-break: break-word;
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

	.edit-container {
		display: flex;
		margin: 4px 0;
	}

	.edit-container textarea {
		flex: 1;
		padding: 4px 8px;
		margin-right: 8px;
		resize: vertical;
		min-height: 60px;
	}

	.sub-notes {
		margin-left: 16px;
		border-left: 1px dashed #aaa;
		padding-left: 8px;
		margin-top: 4px;
	}
</style>
