import { useEffect, useState } from 'react';
import axios from 'axios';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totals: { total_som: 0, total_usd: 0, total_quantity: 0 },
        today_sales: [],
        today_sum_som: 0,
        today_sum_usd: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get('https://magazin-crm-backend.onrender.com/api/reports/dashboard');
                setStats(res.data);
            } catch (err) {
                console.error("Dashboard yuklashda xatolik");
            }
        };
        fetchStats();
    }, []);

    const fmtSom = (v) => Number(v || 0).toLocaleString('uz-UZ') + " so'm";
    const fmtUsd = (v) => "$" + Number(v || 0).toFixed(2);

    return (
        <div>
            <h2>📊 Dashboard</h2>
            
            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Jami Sotuv Miqdori</h3>
                    <p>{Number(stats.totals?.total_quantity || 0).toFixed(2)} dona/kg</p>
                </div>
                <div className="stat-card" style={{borderBottomColor: '#22c55e'}}>
                    <h3>Jami Tushum (So'm)</h3>
                    <p>{fmtSom(stats.totals?.total_som)}</p>
                </div>
                <div className="stat-card" style={{borderBottomColor: '#f59e0b'}}>
                    <h3>Jami Tushum (USD)</h3>
                    <p>{fmtUsd(stats.totals?.total_usd)}</p>
                </div>
            </div>

            <div className="card">
                <h3>Bugungi kunlik sotuvlar va summa: {fmtSom(stats.today_sum_som)} / {fmtUsd(stats.today_sum_usd)}</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Vaqt</th>
                            <th>Nomi</th>
                            <th>Kod</th>
                            <th>Miqdor / Kv.m</th>
                            <th>Summa</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.today_sales.map(sale => (
                            <tr key={sale.id}>
                                <td>{new Date(sale.created_at).toLocaleTimeString('uz-UZ')}</td>
                                <td>{sale.product_name}</td>
                                <td>{sale.product_code}</td>
                                <td>{sale.quantity} / {sale.area} m²</td>
                                <td>{fmtSom(sale.som)} / {fmtUsd(sale.usd)}</td>
                            </tr>
                        ))}
                        {stats.today_sales.length === 0 && (
                            <tr><td colSpan="5" style={{textAlign: 'center'}}>Bugun sotuv yo'q</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Dashboard;
