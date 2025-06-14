<script lang="ts">
	import { onMount } from 'svelte';
	import { TodoList } from '$lib/models/TodoList';
	import TodoListComponent from '$lib/components/TodoListComponent.svelte';
	import { openDB, getAllFromStore, DBNAME, OBJECT_STORE_LISTS, upgradeCallback as dbUpgradeCallback } from '../lib/services/indexedDB';

	let currentList: TodoList | undefined = undefined; // Initialize as undefined
	let allLists: TodoList[] = [];

	onMount(async () => {
		const today = new Date();
		try {
			const db = await openDB(DBNAME, 1, dbUpgradeCallback);
			const plainLists: any[] = await getAllFromStore(db, OBJECT_STORE_LISTS);

			if (plainLists && plainLists.length > 0) {
				const reconstructedLists = plainLists.map(plainList => TodoList.fromPlainObject(plainList));

				// Sort by date descending (most recent first)
				reconstructedLists.sort((a, b) => b.date.getTime() - a.date.getTime());

				currentList = reconstructedLists[0];
				allLists = reconstructedLists;
			} else {
				// No lists in DB, create a new one for today
				currentList = TodoList.createFirstList(today);
				allLists = [currentList];
				// Optionally, save this new list to DB here if that's desired on first load
				// For now, assuming save happens on interaction or specific save action
			}
		} catch (error) {
			console.error("Failed to load data from IndexedDB:", error);
			// Fallback: create a new list for today
			currentList = TodoList.createFirstList(today);
			allLists = [currentList];
		}
	});

	function handleNextDayList(event: CustomEvent<TodoList>) {
		const nextList = event.detail;
		// TODO: Save the nextList to IndexedDB
		currentList = nextList;
		allLists = [...allLists, nextList].sort((a, b) => b.date.getTime() - a.date.getTime()); // Keep sorted
	}

	// TODO: Add functions to save currentList or allLists to IndexedDB
	// e.g., on data change, or when a "save" button is clicked, or when list is switched.
</script>

<main>
	<h1>Mind-Todo</h1>

	{#if currentList}
		<TodoListComponent todoList={currentList} on:nextDayList={handleNextDayList} />
	{:else}
		<p>Loading list...</p> <!-- Updated loading message -->
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
