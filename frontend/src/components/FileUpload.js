import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  CircularProgress,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { studentService, resultService } from '../services/api';

function FileUpload({ onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [importType, setImportType] = useState('students');

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      // Check if file is CSV or Excel
      const fileType = selectedFile.name.split('.').pop().toLowerCase();
      if (fileType === 'csv' || fileType === 'xlsx' || fileType === 'xls') {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please upload a CSV or Excel file');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);
    setSuccessMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      let response;
      if (importType === 'students') {
        response = await studentService.importFile(formData);
        setSuccessMessage(`Successfully imported student data! ${response?.message || ''}`);
      } else {
        response = await resultService.importFile(formData);
        setSuccessMessage(`Successfully imported result data! ${response?.message || ''}`);
      }
      
      setSuccess(true);
      console.log('Upload successful:', response);
      
      // Clear the file input after successful upload
      setFile(null);
      document.getElementById('file-upload').value = '';
      
      // Call the callback function to reload data
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (err) {
      console.error('Error during upload:', err);
      setError(err.message || 'Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccess = () => {
    setSuccess(false);
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Import Data
      </Typography>
      
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="import-type-label">Import Type</InputLabel>
        <Select
          labelId="import-type-label"
          value={importType}
          label="Import Type"
          onChange={(e) => setImportType(e.target.value)}
        >
          <MenuItem value="students">Students</MenuItem>
          <MenuItem value="results">Results</MenuItem>
        </Select>
      </FormControl>
      
      <Box sx={{ mb: 2 }}>
        <input
          accept=".csv,.xlsx,.xls"
          style={{ display: 'none' }}
          id="file-upload"
          type="file"
          onChange={handleFileChange}
        />
        <label htmlFor="file-upload">
          <Button
            variant="outlined"
            component="span"
            startIcon={<CloudUploadIcon />}
          >
            Select File
          </Button>
        </label>
        {file && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Selected file: {file.name}
          </Typography>
        )}
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Snackbar
        open={success}
        autoHideDuration={5000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSuccess} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>
      
      <Button
        variant="contained"
        color="primary"
        onClick={handleUpload}
        disabled={!file || loading}
        startIcon={loading ? <CircularProgress size={20} /> : null}
      >
        {loading ? 'Uploading...' : 'Upload'}
      </Button>
    </Paper>
  );
}

export default FileUpload; 