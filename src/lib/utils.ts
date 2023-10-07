/**
 * Shorten string by adding .... in the middle
 * @param value 
 * @param numChars 
 * @returns string
 */
export function shortenString(value: string, numChars: number) {
    if (typeof value !== 'string' || value.length <= numChars * 2) {
      return value;
    }
  
    const start = value.substring(0, numChars);
    const end = value.substring(value.length - numChars);
    return start + '....' + end;
}

/**
 * Capitalize first letter of a string
 * @param name 
 * @returns string
 */
export function capitalizeFirstLetter(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1);
};

export function calculateTimeDifference(startTime: string, endTime: string | Date) {
  // Convert start time to NZ timezone
  const nzStartTime = new Date(new Date(startTime).toLocaleString("en-NZ", {timeZone: "Pacific/Auckland"}));

  // Convert end time to NZ timezone
  let nzEndTime;
  if (endTime instanceof Date) {
    nzEndTime = new Date(endTime.toLocaleString("en-NZ", {timeZone: "Pacific/Auckland"}));
  } else {
    nzEndTime = new Date(new Date(endTime).toLocaleString("en-NZ", {timeZone: "Pacific/Auckland"}));
  }

  // Calculate the difference in minutes
  const totalMinutes = (nzEndTime.getTime() - nzStartTime.getTime()) / (1000 * 60);

  // Return the difference in hours and minutes
  return { hours: Math.floor(totalMinutes / 60), minutes: Math.round(totalMinutes % 60) };
};
