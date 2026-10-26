import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Board from './pages/Board' // 引入看板
import PrivateRoute from './components/PrivateRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/projects" replace />} />
      <Route path="/login" element={<Login />} />
      
      <Route path="/projects" element={<PrivateRoute><Projects /></PrivateRoute>} />
      
      <Route path="/projects/:id" element={<PrivateRoute><ProjectDetail /></PrivateRoute>} />
      
      <Route 
        path="/projects/:id/sprints/:sprintId" 
        element={<PrivateRoute><Board /></PrivateRoute>} 
      />
    </Routes>
  )
}

export default App