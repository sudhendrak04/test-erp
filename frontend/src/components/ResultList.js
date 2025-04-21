import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  CircularProgress,
  Paper,
  Alert,
} from '@mui/material';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import { resultService } from '../services/api';
import FileUpload from './FileUpload';

function ResultList() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [gridApi, setGridApi] = useState(null);
  const navigate = useNavigate();

  // AG Grid column definitions
  const [columnDefs] = useState([
    { headerName: 'Student', field: 'student_name', sortable: true, filter: true, editable: false },
    { 
      headerName: 'Subject', 
      field: 'subject', 
      sortable: true, 
      filter: true,
      editable: (params) => editMode
    },
    { 
      headerName: 'Marks Obtained', 
      field: 'marks_obtained', 
      sortable: true, 
      filter: true,
      type: 'numericColumn',
      editable: (params) => editMode
    },
    { 
      headerName: 'Total Marks', 
      field: 'total_marks', 
      sortable: true, 
      filter: true,
      type: 'numericColumn',
      editable: (params) => editMode
    },
    { 
      headerName: 'Percentage', 
      field: 'percentage', 
      sortable: true, 
      filter: true,
      type: 'numericColumn',
      editable: false,
      valueFormatter: (params) => {
        return params.value ? `${params.value}%` : '';
      }
    },
    { 
      headerName: 'Semester', 
      field: 'semester', 
      sortable: true, 
      filter: true,
      editable: (params) => editMode
    },
    {
      headerName: 'Actions',
      field: 'id',
      sortable: false,
      filter: false,
      width: 120,
      editable: false,
      cellRenderer: (params) => (
        <Box sx={{ display: 'flex' }}>
          <Button
            size="small"
            color="primary"
            onClick={() => navigate(`/results/${params.value}/edit`)}
          >
            <EditIcon fontSize="small" />
          </Button>
          <Button
            size="small"
            color="error"
            onClick={() => handleDelete(params.value)}
          >
            <DeleteIcon fontSize="small" />
          </Button>
        </Box>
      )
    }
  ]);

  // Default column configuration
  const defaultColDef = {
    flex: 1,
    minWidth: 100,
    resizable: true,
    singleClickEdit: true, // Allow editing with a single click when editable
  };

  const fetchResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await resultService.getAll();
      console.log('Fetched results:', data);
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching results:', err);
      setError('Failed to fetch results. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this result?')) {
      try {
        await resultService.delete(id);
        fetchResults();
      } catch (error) {
        console.error('Error deleting result:', error);
      }
    }
  };

  const handleUploadComplete = () => {
    // Refresh the results list after an upload is complete
    fetchResults();
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
    if (gridApi) {
      gridApi.refreshCells({ force: true });
    }
  };

  const handleCellValueChanged = async (params) => {
    if (!editMode) return;
    
    try {
      const updatedResult = { ...params.data };
      await resultService.update(updatedResult.id, updatedResult);
      console.log('Result updated successfully:', updatedResult);
    } catch (error) {
      console.error('Error updating result:', error);
      // Refresh to get the original data
      fetchResults();
    }
  };

  const handleSaveAll = async () => {
    setEditMode(false);
    // Refresh data after save
    fetchResults();
  };

  const onGridReady = (params) => {
    setGridApi(params.api);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Results
      </Typography>
      
      <FileUpload onUploadComplete={handleUploadComplete} />
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 2 }}>
        <Button
          variant="contained"
          color={editMode ? "success" : "secondary"}
          onClick={toggleEditMode}
          startIcon={editMode ? <SaveIcon /> : <EditIcon />}
        >
          {editMode ? "Exit Edit Mode" : "Enable Cell Editing"}
        </Button>
        {editMode && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveAll}
            startIcon={<SaveIcon />}
          >
            Save All Changes
          </Button>
        )}
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/results/new')}
        >
          Add New Result
        </Button>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Results List {editMode && <span style={{ color: 'green', fontSize: '0.8em' }}>(Edit Mode Enabled - Click cells to edit)</span>}
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : results.length === 0 ? (
          <Alert severity="info">
            No results found. Upload a CSV file to import results.
          </Alert>
        ) : (
          <div className="ag-theme-alpine" style={{ height: 500, width: '100%' }}>
            <AgGridReact
              rowData={results}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              animateRows={true}
              pagination={true}
              paginationPageSize={10}
              rowSelection="single"
              onCellValueChanged={handleCellValueChanged}
              stopEditingWhenCellsLoseFocus={true}
              onGridReady={onGridReady}
              suppressClickEdit={!editMode}
              editType="fullRow"
              onRowDoubleClicked={(params) => {
                if (!editMode) {
                  navigate(`/results/${params.data.id}/edit`);
                }
              }}
            />
          </div>
        )}
      </Paper>
    </Container>
  );
}

export default ResultList; 