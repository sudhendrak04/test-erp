import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
} from '@mui/material';

function Navbar() {
  return (
    <AppBar position="static">
      <Container>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Result Management System
          </Typography>
          <Button color="inherit" component={RouterLink} to="/students">
            Students
          </Button>
          <Button color="inherit" component={RouterLink} to="/results">
            Results
          </Button>
          <Button color="inherit" component={RouterLink} to="/csv-viewer">
            CSV Viewer
          </Button>
          <Button color="inherit" component={RouterLink} to="/student-data">
            Excel Editor
          </Button>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Navbar; 