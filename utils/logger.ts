// A simple logger that can be toggled on/off based on app settings.

let isDevModeEnabled = false;

// We add prefixes to easily distinguish our logs from browser/library logs.
const prefixes = {
  log: '[DEV LOG]',
  warn: '[DEV WARN]',
  error: '[DEV ERROR]',
};

export const logger = {
  /**
   * Initializes or updates the logger's status. This should be called
   * when the app starts and whenever the developer mode setting changes.
   * @param {boolean} isEnabled - Whether developer mode is currently enabled.
   */
  init: (isEnabled: boolean) => {
    isDevModeEnabled = isEnabled;
  },

  /**
   * Logs a message to the console if developer mode is enabled.
   * @param {...any[]} args - The message(s) to log.
   */
  log: (...args: any[]) => {
    if (isDevModeEnabled) {
      console.log(prefixes.log, ...args);
    }
  },
  
  /**
   * Logs a warning to the console if developer mode is enabled.
   * @param {...any[]} args - The message(s) to log as a warning.
   */
  warn: (...args: any[]) => {
    if (isDevModeEnabled) {
      console.warn(prefixes.warn, ...args);
    }
  },
  
  /**
   * Logs an error to the console if developer mode is enabled.
   * In a production environment, you might always log errors or send them
   * to a reporting service, but for this implementation, we respect the toggle.
   * @param {...any[]} args - The message(s) to log as an error.
   */
  error: (...args: any[]) => {
    if (isDevModeEnabled) {
      console.error(prefixes.error, ...args);
    }
  },
};
