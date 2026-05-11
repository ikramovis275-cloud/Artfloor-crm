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
            <h2 className="no-mobile">Ombor CRM</h2>
            <NavLink to="/" className={({isActive}) => isActive ? "active" : ""} end title="Dashboard">
                <LayoutDashboard size={20} /> <span>Dashboard</span>
            </NavLink>
            <NavLink to="/add-product" className={({isActive}) => isActive ? "active" : ""} title="Kiritish">
                <PlusCircle size={20} /> <span>Kiritish</span>
            </NavLink>
            <NavLink to="/products" className={({isActive}) => isActive ? "active" : ""} title="Mahsulotlar">
                <Package size={20} /> <span>Mahsulotlar</span>
            </NavLink>
            <NavLink to="/sale" className={({isActive}) => isActive ? "active" : ""} title="Sotuv">
                <ShoppingCart size={20} /> <span>Sotuv</span>
            </NavLink>
            <NavLink to="/reports" className={({isActive}) => isActive ? "active" : ""} title="Hisobotlar">
                <FileText size={20} /> <span>Hisobotlar</span>
            </NavLink>
            
            <div className="sidebar-footer">
                <button onClick={handleLogout} className="btn-logout" title="Chiqish">
                    <LogOut size={20} /> <span className="no-mobile">Chiqish</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
