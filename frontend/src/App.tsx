import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProjectList from './ProjectList';
import ProjectDetail from './ProjectDetail';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProjectList />} />
        <Route path="/project/:id" element={<ProjectDetail />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
