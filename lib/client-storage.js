export const isSessionStorageAvailable = () => {
  try {
    const testKey = '__storage_test__';
    sessionStorage.setItem(testKey, testKey);
    sessionStorage.removeItem(testKey);
    return true;
  } catch (e) {
    console.warn(`Client sessionStorage seem to be unavailable: ${e}`);
    return false;
  }
};
