import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  MenuItem,
} from '@mui/material';
import { resultService, studentService } from '../services/api';

function ResultForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    student: '',
    subject: '',
    marks_obtained: '',
    total_marks: '',
    semester: '',
  });

  useEffect(() => {
    loadStudents();
    if (id) {
      loadResult();
    }
  }, [id]);

  const loadStudents = async () => {
    try {
      const data = await studentService.getAll();
      setStudents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const loadResult = async () => {
    try {
      const data = await resultService.getById(id);
      if (data) {
        setFormData(data);
      }
    } catch (error) {
      console.error('Error loading result:', error);
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
        await resultService.update(id, formData);
      } else {
        await resultService.create(formData);
      }
      navigate('/results');
    } catch (error) {
      console.error('Error saving result:', error);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {id ? 'Edit Result' : 'Add New Result'}
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <TextField
          select
          fullWidth
          label="Student"
          name="student"
          value={formData.student}
          onChange={handleChange}
          margin="normal"
          required
        >
          {students.map((student) => (
            <MenuItem key={student.id} value={student.id}>
              {student.name} ({student.roll_number})
            </MenuItem>
          ))}
        </TextField>
        <TextField
          fullWidth
          label="Subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="Marks Obtained"
          name="marks_obtained"
          type="number"
          value={formData.marks_obtained}
          onChange={handleChange}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="Total Marks"
          name="total_marks"
          type="number"
          value={formData.total_marks}
          onChange={handleChange}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="Semester"
          name="semester"
          value={formData.semester}
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
            onClick={() => navigate('/results')}
          >
            Cancel
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

export default ResultForm; 