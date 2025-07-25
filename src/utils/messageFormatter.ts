
export const formatMessageContent = (content: string): string => {
  // Convert escaped newlines to actual line breaks
  let formatted = content.replace(/\\n/g, '\n');
  
  // Clean up any excessive spacing
  formatted = formatted.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return formatted.trim();
};
