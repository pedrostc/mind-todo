<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Note } from '../models/Note';

  export let note: Note;

  const dispatch = createEventDispatcher();

  let showMenu = false;
  let isEditing = false;
  let editedContent = note.content;

  function toggleMenu() {
    showMenu = !showMenu;
  }

  function addSubNote() {
    dispatch('addSubNote', note);
    showMenu = false;
  }

  function createTodo() {
    dispatch('createTodo', note);
    showMenu = false;
  }

  function startEditing() {
    isEditing = true;
    editedContent = note.content;
    showMenu = false;
  }

  function saveEdit() {
    dispatch('editNote', editedContent);
    isEditing = false;
  }

  function deleteNote() {
    dispatch('deleteNote', note);
    showMenu = false;
  }
</script>

<div class="note-container">
  {#if isEditing}
    <div class="edit-container">
      <input type="text" bind:value={editedContent} />
      <button on:click={saveEdit}>Save</button>
    </div>
  {:else}
    <div class="note-content" data-testid="note-content" data-level={note.level}>
      <span class="note-text" data-testid="note-text">{note.content}</span>
      <button class="menu-button" on:click={toggleMenu}>...</button>

      {#if showMenu}
        <div class="menu">
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
      {#each note.subNotes as subNote}
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
    align-items: center;
    position: relative;
  }

  .menu-button {
    background: none;
    border: none;
    cursor: pointer;
    margin-left: 8px;
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

  .edit-container input {
    flex: 1;
    padding: 4px 8px;
    margin-right: 8px;
  }

  .sub-notes {
    margin-left: 16px;
  }
</style>
