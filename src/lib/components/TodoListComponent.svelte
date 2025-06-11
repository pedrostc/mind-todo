<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { TodoList } from '../models/TodoList';
  import { TodoItem } from '../models/TodoItem';
  import { Note } from '../models/Note';
  import TodoItemComponent from './TodoItemComponent.svelte';
  
  export let todoList: TodoList;
  
  const dispatch = createEventDispatcher();
  
  let newItemTitle = '';
  
  // Format the date as "Month Day, Year"
  $: formattedDate = todoList.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  function addItem() {
    if (newItemTitle.trim()) {
      todoList.createItem(newItemTitle);
      newItemTitle = '';
    }
  }
  
  function handleAddSubItem(event) {
    const { parentItem, title } = event.detail;
    
    // Check if this would create a sub-sub-item
    if (parentItem.parentItem) {
      // Convert the sub-item to a main level item
      todoList.createSubItem(parentItem, title);
    } else {
      parentItem.addSubItem(title);
    }
  }
  
  function handleAddNote(event) {
    const { parentItem, content } = event.detail;
    parentItem.addNote(content);
  }
  
  function handleAddSubNote(event) {
    const { parentNote, content } = event.detail;
    parentNote.addSubNote(content);
  }
  
  function handleCreateTodoFromNote(event) {
    const note = event.detail;
    const newItem = note.createTodoItem();
    todoList.addItem(newItem);
  }
  
  function handleEditNote(event) {
    const { note, content } = event.detail;
    note.content = content;
  }
  
  function handleDeleteNote(event) {
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
  }
  
  function createNextDayList() {
    const tomorrow = new Date(todoList.date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextList = todoList.createNextDayList(tomorrow);
    dispatch('nextDayList', nextList);
  }
</script>

<div class="todo-list">
  <header>
    <h1>{formattedDate}</h1>
    <button class="next-day-button" on:click={createNextDayList}>
      Create Next Day List
    </button>
  </header>
  
  <div class="add-item">
    <input 
      type="text" 
      placeholder="Add a new item..." 
      bind:value={newItemTitle}
    />
    <button on:click={addItem}>Add</button>
  </div>
  
  <div class="items">
    {#if todoList.items.length === 0}
      <p class="empty-message">No items for today. Add one above!</p>
    {:else}
      {#each todoList.items as item}
        <TodoItemComponent 
          {item} 
          on:addSubItem={handleAddSubItem}
          on:addNote={handleAddNote}
          on:addSubNote={handleAddSubNote}
          on:createTodoFromNote={handleCreateTodoFromNote}
          on:editNote={handleEditNote}
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