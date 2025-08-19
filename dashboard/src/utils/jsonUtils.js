/**
 * Safely parse JSON with fallback and error logging
 */
export function safeJsonParse(jsonString, fallback = null, context = '') {
  if (!jsonString) return fallback;
  
  // If it's not a string, return as-is or fallback
  if (typeof jsonString !== 'string') {
    console.warn(`Expected string for JSON parsing${context ? ` (${context})` : ''}, got:`, typeof jsonString, jsonString);
    return jsonString || fallback;
  }
  
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error(`Failed to parse JSON${context ? ` (${context})` : ''}:`, {
      input: jsonString,
      error: error.message,
      firstChars: jsonString.substring(0, 50)
    });
    return fallback;
  }
}

/**
 * Safely handle data that might be already parsed or needs parsing
 */
export function safeDataParse(data, fallback = null, context = '') {
  if (!data) return fallback;
  
  if (typeof data === 'string') {
    return safeJsonParse(data, fallback, context);
  }
  
  return data;
}