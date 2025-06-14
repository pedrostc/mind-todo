<script lang="ts">
	import { onMount } from 'svelte';
	import { TodoList } from '$lib/models/TodoList';
	import TodoListComponent from '$lib/components/TodoListComponent.svelte';
	import { closeAllMenus } from '$lib/stores/menuStore';

	let currentList: TodoList;
	let allLists: TodoList[] = [];

	onMount(() => {
		// Create the first list for today
		const today = new Date();
		currentList = TodoList.createFirstList(today);
		allLists = [currentList];

		// Add a global click handler to close menus when clicking anywhere
		document.addEventListener('click', (event) => {
			// Only close menus if the click wasn't on a menu or menu button
			// This is handled by checking if the event has been defaultPrevented
			// by a menu's clickOutside directive
			if (!event.defaultPrevented) {
				closeAllMenus();
			}
		});
	});

	function handleNextDayList(event: CustomEvent<TodoList>) {
		const nextList = event.detail;
		currentList = nextList;
		allLists = [...allLists, nextList];
	}
</script>

<main>
	<h1>Mind-Todo</h1>

	{#if currentList}
		<TodoListComponent todoList={currentList} on:nextDayList={handleNextDayList} />
	{:else}
		<p>Loading...</p>
	{/if}
</main>

<style>
	main {
		padding: 1rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	h1 {
		text-align: center;
		color: #4a90e2;
		margin-bottom: 2rem;
	}
</style>
