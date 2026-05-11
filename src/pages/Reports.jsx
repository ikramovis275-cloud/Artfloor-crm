import { useEffect, useState } from 'react';
import axios from 'axios';
import { RotateCcw } from 'lucide-react';

const API = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://magazin-crm-backend.onrender.com';

const Reports = () => {
    const [reports, setReports] = useState([]);
    const [salesDetails, setSalesDetails] = useState([]);

    const fetchData = async () => {
        try {
            const res = await axios.get(`${API}/api/reports/daily`);
            setReports(res.data);
            
            const salesRes = await axios.get(`${API}/api/sales`);
            setSalesDetails(salesRes.data);
        } catch (err) {
            console.error("Error fetching reports:", err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleReturn = async (sale) => {
        const qty = prompt(`${sale.product_name} dan qancha qaytarildi? (Max: ${sale.quantity})`, sale.quantity);
        if (qty === null) return;
        
        const returnQty = parseFloat(qty);
        if (isNaN(returnQty) || returnQty <= 0 || returnQty > sale.quantity) {
            alert("Noto'g'ri miqdor kiritildi!");
            return;
        }

        if (!confirm(`${returnQty} dona mahsulotni qaytarishni tasdiqlaysizmi?`)) return;

        try {
            const response = await axios.post(`${API}/api/sales/${sale.id}/return`, {
                return_quantity: returnQty
            });
            alert(`✅ ${returnQty} dona mahsulot muvaffaqiyatli qaytarildi!`);
            fetchData();
        } catch (err) {
            const errMsg = err.response?.data?.message || err.message;
            console.error("Return error:", errMsg);
            alert("❌ Qaytarishda xatolik yuz berdi: " + errMsg);
        }
    };

    return (
        <div>
            <h2>📄 Hisobotlar</h2>
            
            <div className="card">
                <h3>Kunlik Umumiy Tushumlar</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Sana</th>
                            <th>Sotilgan Mahsulotlar Miqdori</th>
                            <th>Kunlik foyda/Tushum (So'm)</th>
                            <th>Kunlik foyda/Tushum (USD)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.map((r, i) => (
                            <tr key={i}>
                                <td>{new Date(r.date).toLocaleDateString('uz-UZ')}</td>
                                <td>{Number(r.total_quantity).toFixed(2)}</td>
                                <td>{Number(r.total_som).toLocaleString('uz-UZ')} so'm</td>
                                <td>${Number(r.total_usd).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="card">
                <h3>Barcha Sotuvlar Tarixi</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Vaqt</th>
                            <th>Maxsulot Kodi</th>
                            <th>Maxsulot Nomi</th>
                            <th>Miqdor / Kv.m</th>
                            <th>Tushum (So'm)</th>
                            <th>Tushum (USD)</th>
                            <th>Amallar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {salesDetails.map(sale => (
                            <tr key={sale.id}>
                                <td>{new Date(sale.created_at).toLocaleString('uz-UZ')}</td>
                                <td>{sale.product_code}</td>
                                <td>{sale.product_name}</td>
                                <td>{Number(sale.quantity).toFixed(2)} / {Number(sale.area).toFixed(2)} m²</td>
                                <td>{Number(sale.som).toLocaleString('uz-UZ')} so'm</td>
                                <td>${Number(sale.usd).toFixed(2)}</td>
                                <td>
                                    <button 
                                        onClick={() => handleReturn(sale)}
                                        style={{ 
                                            background: '#fef2f2', 
                                            color: '#ef4444', 
                                            border: 'none', 
                                            padding: '6px 12px', 
                                            borderRadius: '8px', 
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            fontSize: '12px',
                                            fontWeight: '600'
                                        }}
                                    >
                                        <RotateCcw size={14} /> Qaytarish
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Reports;
