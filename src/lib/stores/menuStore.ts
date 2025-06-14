import { writable } from 'svelte/store';

// Store to track the currently open menu
export const activeMenuId = writable<string | null>(null);

// Function to close all menus
export function closeAllMenus() {
    activeMenuId.set(null);
}

// Function to open a specific menu
export function openMenu(id: string) {
    activeMenuId.set(id);
}

// Function to toggle a menu
export function toggleMenu(id: string) {
    activeMenuId.update(currentId => currentId === id ? null : id);
}