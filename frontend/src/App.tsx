import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Projects from './pages/Projects'
import PrivateRoute from './components/PrivateRoute'

function App() {
  return (
    <Routes>
      {/* 根路径跳转到项目页，由 PrivateRoute 决定是拦截还是放行 */}
      <Route path="/" element={<Navigate to="/projects" replace />} />
      
      <Route path="/login" element={<Login />} />
      
      {/* 需要登录才能访问的页面 */}
      <Route
        path="/projects"
        element={
          <PrivateRoute>
            <Projects />
          </PrivateRoute>
        }
      />
    </Routes>
  )
}

export default App