export const DBNAME = "MindTodoDB";
export const OBJECT_STORE_LISTS = "lists";
export const OBJECT_STORE_ITEMS = "items";
export const OBJECT_STORE_NOTES = "notes";

export function openDB(dbName: string, version: number, upgradeCallback: (db: IDBDatabase) => void): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      upgradeCallback(db);
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject(`Error opening database ${dbName}: ${(event.target as IDBOpenDBRequest).error}`);
    };
  });
}

export function addToStore(db: IDBDatabase, storeName: string, data: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.add(data);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      reject(`Error adding data to store ${storeName}: ${(event.target as IDBRequest).error}`);
    };
  });
}

export function getFromStore(db: IDBDatabase, storeName: string, key: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = (event) => {
      resolve((event.target as IDBRequest).result);
    };

    request.onerror = (event) => {
      reject(`Error getting data from store ${storeName}: ${(event.target as IDBRequest).error}`);
    };
  });
}

export function getAllFromStore(db: IDBDatabase, storeName: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = (event) => {
      resolve((event.target as IDBRequest).result);
    };

    request.onerror = (event) => {
      reject(`Error getting all data from store ${storeName}: ${(event.target as IDBRequest).error}`);
    };
  });
}

export function putToStore(db: IDBDatabase, storeName: string, data: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      reject(`Error putting data to store ${storeName}: ${(event.target as IDBRequest).error}`);
    };
  });
}

export function deleteFromStore(db: IDBDatabase, storeName: string, key: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      reject(`Error deleting data from store ${storeName}: ${(event.target as IDBRequest).error}`);
    };
  });
}

export const upgradeCallback = (db: IDBDatabase) => {
  if (!db.objectStoreNames.contains(OBJECT_STORE_LISTS)) {
    db.createObjectStore(OBJECT_STORE_LISTS, { keyPath: 'id' });
  }
  if (!db.objectStoreNames.contains(OBJECT_STORE_ITEMS)) {
    db.createObjectStore(OBJECT_STORE_ITEMS, { keyPath: 'id' });
  }
  if (!db.objectStoreNames.contains(OBJECT_STORE_NOTES)) {
    db.createObjectStore(OBJECT_STORE_NOTES, { keyPath: 'id' });
  }
};
