<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { TodoItem } from '../models/TodoItem';
  import NoteComponent from './NoteComponent.svelte';

  export let item: TodoItem;

  const dispatch = createEventDispatcher();

  let showMenu = false;
  let showAddSubItem = false;
  let showAddNote = false;
  let isEditing = false;
  let newSubItemTitle = '';
  let newNoteContent = '';
  let editedTitle = item.title;

  function toggleMenu() {
    showMenu = !showMenu;
  }

  function toggleCompleted() {
    item.completed = !item.completed;
  }

  function openAddSubItem() {
    showAddSubItem = true;
    showMenu = false;
  }

  function addSubItem() {
    if (newSubItemTitle.trim()) {
      dispatch('addSubItem', {
        parentItem: item,
        title: newSubItemTitle
      });
      newSubItemTitle = '';
      showAddSubItem = false;
    }
  }

  function openAddNote() {
    showAddNote = true;
    showMenu = false;
  }

  function addNote() {
    if (newNoteContent.trim()) {
      dispatch('addNote', {
        parentItem: item,
        content: newNoteContent
      });
      newNoteContent = '';
      showAddNote = false;
    }
  }

  function handleAddSubNote(event) {
    dispatch('addSubNote', {
      parentNote: event.detail,
      content: ''
    });
  }

  function handleCreateTodoFromNote(event) {
    dispatch('createTodoFromNote', event.detail);
  }

  function handleEditNote(event) {
    const note = event.detail.note;
    const content = event.detail.content;
    dispatch('editNote', { note, content });
  }

  function handleDeleteNote(event) {
    dispatch('deleteNote', event.detail);
  }

  function startEditing() {
    isEditing = true;
    editedTitle = item.title;
    showMenu = false;
  }

  function saveEdit() {
    if (editedTitle.trim()) {
      dispatch('editItem', {
        item,
        title: editedTitle
      });
      isEditing = false;
    }
  }
</script>

<div class="todo-item">
  {#if isEditing}
    <div class="edit-container">
      <input 
        type="text" 
        bind:value={editedTitle} 
        on:keydown={(e) => e.key === 'Enter' && saveEdit()}
      />
      <button on:click={saveEdit}>Save</button>
    </div>
  {:else}
    <div class="item-header">
      <input 
        type="checkbox" 
        checked={item.completed} 
        on:change={toggleCompleted}
      />
      <span class={item.completed ? 'completed' : ''} on:click={startEditing}>{item.title}</span>

      {#if item.age > 0}
        <span class="age">{item.age} {item.age === 1 ? 'day' : 'days'}</span>
      {/if}

      {#if item.originalParent}
        <span class="parent-tag">from: {item.originalParent.title}</span>
      {/if}

      <button class="menu-button" on:click={toggleMenu}>...</button>

      {#if showMenu}
        <div class="menu">
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
        on:keydown={(e) => e.key === 'Enter' && addNote()}
      />
      <button on:click={addNote}>Add</button>
    </div>
  {/if}

  {#if item.subItems.length > 0}
    <div class="sub-items">
      {#each item.subItems as subItem}
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

  {#if item.notes.length > 0}
    <div class="notes">
      {#each item.notes as note}
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

  .parent-tag {
    margin-left: 8px;
    font-size: 0.8em;
    color: #fff;
    background: #4a90e2;
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

  .add-form, .edit-container {
    display: flex;
    margin: 8px 0;
  }

  .add-form input, .edit-container input {
    flex: 1;
    padding: 4px 8px;
    margin-right: 8px;
  }

  .sub-items {
    margin-left: 24px;
    margin-top: 8px;
  }

  .notes {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px dashed #eee;
  }
</style>
