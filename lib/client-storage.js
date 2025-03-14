export const isStorageAvailable = (type) => {
  try {
    const storage = window[type];
    const testKey = '__storage_test__';
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    return true;
  } catch (e) {
    console.warn(`Client storage of type: ${type} seem to be unavailable: ${e}`);
    return false;
  }
};
