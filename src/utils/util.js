// Utility functions
export function cleanObject(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(cleanObject).filter(item => item !== null && item !== undefined);
  }
  
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) {
      cleaned[key] = cleanObject(value);
    }
  }
  
  return cleaned;
}

export function flattenArraysInObject(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(flattenArraysInObject);
  }
  
  const flattened = {};
  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value) && value.length === 1) {
      flattened[key] = flattenArraysInObject(value[0]);
    } else {
      flattened[key] = flattenArraysInObject(value);
    }
  }
  
  return flattened;
}

export function pickBySchema(obj, schema) {
  if (schema === true) return obj;
  if (schema === false || schema === null || schema === undefined) return undefined;
  
  if (typeof schema !== 'object' || schema === null) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => pickBySchema(item, schema));
  }
  
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const result = {};
  for (const [key, schemaValue] of Object.entries(schema)) {
    if (obj.hasOwnProperty(key)) {
      const picked = pickBySchema(obj[key], schemaValue);
      if (picked !== undefined) {
        result[key] = picked;
      }
    }
  }
  
  return result;
}
