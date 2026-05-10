import { useEffect, useState } from 'react';
import axios from 'axios';

const Reports = () => {
    const [reports, setReports] = useState([]);
    const [salesDetails, setSalesDetails] = useState([]);

    useEffect(() => {
        const fetchReports = async () => {
            const res = await axios.get('https://magazin-crm-backend.onrender.com/api/reports/daily');
            setReports(res.data);
            
            const salesRes = await axios.get('https://magazin-crm-backend.onrender.com/api/sales');
            setSalesDetails(salesRes.data);
        };
        fetchReports();
    }, []);

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
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Reports;
