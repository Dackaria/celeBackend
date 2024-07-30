import { Routes, Route, useLocation } from 'react-router-dom'
import Sidenav from '../layout/sidenav/Sidenav'
import Dashboard from '../dashboard/Dashboard'
import Login from '../auth/Login'

export default function AppRoutes() {
    const location = useLocation();
    const isLogin = location.pathname === '/login';
  return (
  

    <div className='flex gap-2'>
    <div>
        {!isLogin && <Sidenav />}
    </div>
      <Routes>

        <Route path='/' element={<Dashboard />} />
        <Route path='/login' element={<Login />} />

      </Routes>
    </div>
   
  )
}






