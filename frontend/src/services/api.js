const API_URL = 'http://localhost:8000/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Something went wrong');
  }
  return response.json();
};

const defaultHeaders = {
  'Content-Type': 'application/json',
};

export const studentService = {
  getAll: async () => {
    try {
      const response = await fetch(`${API_URL}/students/`, {
        method: 'GET',
        headers: defaultHeaders,
      });
      const data = await handleResponse(response);
      return data; // Return directly as the backend is already sending the array
    } catch (error) {
      console.error('Error in getAll students:', error);
      return [];
    }
  },

  getById: async (id) => {
    const response = await fetch(`${API_URL}/students/${id}/`, {
      method: 'GET',
      headers: defaultHeaders,
    });
    return handleResponse(response);
  },

  create: async (data) => {
    const response = await fetch(`${API_URL}/students/`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  update: async (id, data) => {
    const response = await fetch(`${API_URL}/students/${id}/`, {
      method: 'PUT',
      headers: defaultHeaders,
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_URL}/students/${id}/`, {
      method: 'DELETE',
      headers: defaultHeaders,
    });
    return handleResponse(response);
  },

  importFile: async (formData) => {
    try {
      const response = await fetch(`${API_URL}/students/import/`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error in importFile:', error);
      throw error;
    }
  },
};

export const resultService = {
  getAll: async () => {
    try {
      const response = await fetch(`${API_URL}/results/`, {
        method: 'GET',
        headers: defaultHeaders,
      });
      const data = await handleResponse(response);
      return data; // Return directly as the backend is already sending the array
    } catch (error) {
      console.error('Error in getAll results:', error);
      return [];
    }
  },

  getById: async (id) => {
    const response = await fetch(`${API_URL}/results/${id}/`, {
      method: 'GET',
      headers: defaultHeaders,
    });
    return handleResponse(response);
  },

  create: async (data) => {
    const response = await fetch(`${API_URL}/results/`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  update: async (id, data) => {
    const response = await fetch(`${API_URL}/results/${id}/`, {
      method: 'PUT',
      headers: defaultHeaders,
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_URL}/results/${id}/`, {
      method: 'DELETE',
      headers: defaultHeaders,
    });
    return handleResponse(response);
  },

  importFile: async (formData) => {
    try {
      const response = await fetch(`${API_URL}/results/import/`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      return handleResponse(response);
    } catch (error) {
      console.error('Error in importFile results:', error);
      throw error;
    }
  },
}; 