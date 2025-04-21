import { API_URL } from './api';

export const fileService = {
  // Get file from backend
  getFile: async (filePath) => {
    try {
      const response = await fetch(`${API_URL}/file/?path=${encodeURIComponent(filePath)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      return response;
    } catch (error) {
      console.error('Error fetching file:', error);
      throw error;
    }
  },
  
  // Save file to backend
  saveFile: async (filePath, fileData) => {
    try {
      const formData = new FormData();
      formData.append('file', fileData);
      formData.append('path', filePath);
      
      const response = await fetch(`${API_URL}/file/save/`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save file: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error saving file:', error);
      throw error;
    }
  }
};

export default fileService; 