import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('https://magazin-crm-backend.onrender.com/api/auth/login', { username, password });
            localStorage.setItem('token', res.data.token);
            navigate('/');
        } catch (error) {
            alert('Xato: Login yoki parol notogri');
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>Tizimga kirish</h2>
                <form onSubmit={handleLogin}>
                    <input 
                        type="text" 
                        placeholder="Login" 
                        className="input-field" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required 
                    />
                    <input 
                        type="password" 
                        placeholder="Parol" 
                        className="input-field" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required 
                    />
                    <button type="submit" className="btn-primary" style={{marginTop: '20px'}}>Kirish</button>
                </form>
            </div>
        </div>
    );
};

export default Login;
