import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Package, ShoppingCart, FileText, LogOut } from 'lucide-react';

const Sidebar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div className="sidebar">
            <h2>Ombor CRM</h2>
            <NavLink to="/" className={({isActive}) => isActive ? "active" : ""} end>
                <LayoutDashboard size={20} /> Dashboard
            </NavLink>
            <NavLink to="/add-product" className={({isActive}) => isActive ? "active" : ""}>
                <PlusCircle size={20} /> Kiritish
            </NavLink>
            <NavLink to="/products" className={({isActive}) => isActive ? "active" : ""}>
                <Package size={20} /> Mahsulotlar
            </NavLink>
            <NavLink to="/sale" className={({isActive}) => isActive ? "active" : ""}>
                <ShoppingCart size={20} /> Sotuv
            </NavLink>
            <NavLink to="/reports" className={({isActive}) => isActive ? "active" : ""}>
                <FileText size={20} /> Hisobotlar
            </NavLink>
            
            <div style={{marginTop: 'auto', padding: '20px'}}>
                <button onClick={handleLogout} className="btn-primary" style={{backgroundColor: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center'}}>
                    <LogOut size={20} /> Chiqish
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
