// The time in Utah is UTC-6 during Daylight Saving Time (MDT)
// and UTC-7 during Standard Time (MST).
// We'll use UTC-6.
const now = new Date();
const utc = now.getTime() + (now.getTimezoneOffset() * 60000); // get UTC time in msec
const utahTime = new Date(utc - (3600000 * 6));

export const APP_UPDATE_TIME = utahTime;
export const APP_UPDATE_DATE_STRING = utahTime.toISOString();
