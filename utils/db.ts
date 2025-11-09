const DB_NAME = 'AnnotationAudioDB';
const DB_VERSION = 1;
const STORE_NAME = 'audioClips';

let db: IDBDatabase;

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Error opening database');
      reject('Error opening database');
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('annotationId', 'annotationId', { unique: false });
      }
    };
  });
};

export const saveAudio = async (annotationId: string, audioId: string, data: ArrayBuffer): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const id = `${annotationId}_${audioId}`;
    store.put({ id, annotationId, audioId, data });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject('Error saving audio');
  });
};

export const getAudio = async (annotationId: string, audioId: string): Promise<ArrayBuffer | undefined> => {
    const db = await initDB();
    return new Promise((resolve) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const id = `${annotationId}_${audioId}`;
        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result?.data);
        };
        request.onerror = () => {
            console.error('Error getting audio from DB');
            resolve(undefined);
        };
    });
};

export const getAllAudioForAnnotation = async (annotationId: string): Promise<{ audioId: string; data: ArrayBuffer }[]> => {
    const db = await initDB();
    return new Promise((resolve) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('annotationId');
        const results: { audioId: string; data: ArrayBuffer }[] = [];
        const request = index.openCursor(IDBKeyRange.only(annotationId));

        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
                results.push({ audioId: cursor.value.audioId, data: cursor.value.data });
                cursor.continue();
            } else {
                resolve(results);
            }
        };
        request.onerror = () => resolve([]);
    });
};


export const deleteAudioForAnnotation = async (annotationId: string): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('annotationId');
        const request = index.openKeyCursor(IDBKeyRange.only(annotationId));

        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursor>).result;
            if (cursor) {
                store.delete(cursor.primaryKey);
                cursor.continue();
            } else {
                resolve();
            }
        };
        request.onerror = () => reject('Error deleting audio for annotation');
    });
};
