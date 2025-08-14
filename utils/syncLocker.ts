export const syncLocker = {
    mutationsInFlight: 0,
    increment: () => syncLocker.mutationsInFlight++,
    decrement: () => {
        syncLocker.mutationsInFlight = Math.max(0, syncLocker.mutationsInFlight - 1);
    },
    isLocked: () => syncLocker.mutationsInFlight > 0,
};
