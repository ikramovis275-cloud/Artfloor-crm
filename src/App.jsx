import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddProduct from './pages/AddProduct';
import Products from './pages/Products';
import Sale from './pages/Sale';
import Reports from './pages/Reports';
import './index.css';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        {children}
      </div>
    </div>
  ) : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/add-product" element={<PrivateRoute><AddProduct /></PrivateRoute>} />
        <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
        <Route path="/sale" element={<PrivateRoute><Sale /></PrivateRoute>} />
        <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
