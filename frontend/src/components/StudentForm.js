import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
} from '@mui/material';
import { studentService } from '../services/api';

function StudentForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    roll_number: '',
    name: '',
    class_name: '',
  });

  useEffect(() => {
    if (id) {
      loadStudent();
    }
  }, [id]);

  const loadStudent = async () => {
    try {
      const data = await studentService.getById(id);
      if (data) {
        setFormData(data);
      }
    } catch (error) {
      console.error('Error loading student:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (id) {
        await studentService.update(id, formData);
      } else {
        await studentService.create(formData);
      }
      navigate('/students');
    } catch (error) {
      console.error('Error saving student:', error);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {id ? 'Edit Student' : 'Add New Student'}
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <TextField
          fullWidth
          label="Roll Number"
          name="roll_number"
          value={formData.roll_number}
          onChange={handleChange}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="Class"
          name="class_name"
          value={formData.class_name}
          onChange={handleChange}
          margin="normal"
          required
        />
        <Box sx={{ mt: 3 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ mr: 2 }}
          >
            {id ? 'Update' : 'Save'}
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/students')}
          >
            Cancel
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

export default StudentForm; 