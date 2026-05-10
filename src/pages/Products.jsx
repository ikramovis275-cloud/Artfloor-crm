import { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, Package, Plus, Layers, X, CheckCircle, PlusCircle, Printer, Trash2 } from 'lucide-react';
import Barcode from 'react-barcode';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const handleDelete = async (e, id, name) => {
        e.stopPropagation();
        if (window.confirm(`${name} mahsulotini o'chirmoqchimisiz?`)) {
            try {
                await axios.delete(`https://magazin-crm-backend.onrender.com/api/products/${id}`);
                setProducts(products.filter(p => p.id !== id));
            } catch (err) {
                alert("O'chirishda xatolik yuz berdi");
            }
        }
    };

    // Restock modal state
    const [restockModal, setRestockModal] = useState(null); // holds product object
    const [addQty, setAddQty] = useState('');
    const [restockLoading, setRestockLoading] = useState(false);

    const printBarcode = (product) => {
        const printWindow = window.open('', '', 'width=400,height=300');
        printWindow.document.write(`
            <html>
                <head><title>Print Barcode</title></head>
                <body style="text-align: center; font-family: sans-serif; padding-top: 30px;">
                    <h3>${product.name}</h3>
                    <svg id="barcode"></svg>
                    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js"></script>
                    <script>
                        JsBarcode("#barcode", "${product.code}", {
                            format: "CODE128",
                            width: 2,
                            height: 60,
                            displayValue: true
                        });
                        setTimeout(() => { window.print(); window.close(); }, 500);
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const fetchProducts = async () => {
        try {
            const res = await axios.get('https://magazin-crm-backend.onrender.com/api/products');
            setProducts(res.data);
        } catch (err) {
            console.error("Error fetching products", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProducts(); }, []);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase()) ||
        String(p.sale_usd).includes(search)
    );

    const handleRestock = async () => {
        if (!addQty || parseFloat(addQty) <= 0) {
            alert("Iltimos, to'g'ri miqdor kiriting!");
            return;
        }
        setRestockLoading(true);
        try {
            await axios.patch(`https://magazin-crm-backend.onrender.com/api/products/${restockModal.id}/restock`, {
                add_quantity: parseFloat(addQty)
            });
            alert(`✅ ${restockModal.name} ga ${addQty} dona qo'shildi!`);
            setRestockModal(null);
            setAddQty('');
            fetchProducts(); // Refresh list
        } catch (e) {
            alert("Xatolik: " + (e.response?.data?.message || "Qayta urinib ko'ring"));
        } finally {
            setRestockLoading(false);
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out', position: 'relative' }}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes modalIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
                .product-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
                    gap: 25px;
                    margin-top: 25px;
                }
                .product-card {
                    background: white;
                    border-radius: 20px;
                    overflow: hidden;
                    transition: 0.3s;
                    border: 1px solid #e2e8f0;
                    cursor: pointer;
                    position: relative;
                }
                .product-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.12);
                    border-color: #4f46e5;
                }
                .image-container {
                    height: 200px;
                    width: 100%;
                    background: #f8fafc;
                    overflow: hidden;
                    position: relative;
                }
                .image-container img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: 0.5s;
                }
                .product-card:hover .image-container img { transform: scale(1.08); }
                .restock-btn {
                    position: absolute;
                    top: 12px;
                    left: 12px;
                    background: rgba(255,255,255,0.95);
                    border: 2px solid #4f46e5;
                    color: #4f46e5;
                    border-radius: 10px;
                    padding: 6px 14px;
                    font-weight: 700;
                    font-size: 13px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                    transition: 0.2s;
                    z-index: 10;
                }
                .restock-btn:hover { background: #4f46e5; color: white; }
                .out-badge {
                    position: absolute;
                    bottom: 12px;
                    left: 12px;
                    background: #fee2e2;
                    color: #ef4444;
                    border-radius: 8px;
                    padding: 4px 10px;
                    font-weight: 800;
                    font-size: 12px;
                }
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    backdrop-filter: blur(4px);
                }
                .modal-box {
                    background: white;
                    border-radius: 24px;
                    padding: 35px;
                    width: 420px;
                    animation: modalIn 0.3s ease-out;
                    box-shadow: 0 25px 60px rgba(0,0,0,0.25);
                }
            `}</style>

            {/* Header */}
            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ background: 'var(--primary-gradient)', padding: '12px', borderRadius: '15px', color: 'white' }}>
                        <Package size={24} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0 }}>Mahsulotlar Ombori</h2>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Jami: {filteredProducts.length} xil mahsulot</p>
                    </div>
                </div>

                <div style={{ position: 'relative', width: '100%', maxWidth: '450px' }}>
                    <Search style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={20} />
                    <input
                        type="text"
                        placeholder="Nomi yoki kodi bo'yicha qidirish..."
                        className="input-field"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ margin: 0, paddingLeft: '50px', height: '55px', borderRadius: '15px', border: '2px solid #e2e8f0' }}
                    />
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px', color: '#94a3b8' }}>Yuklanmoqda...</div>
            ) : (
                <div className="product-grid">
                    {filteredProducts.map(p => (
                        <div key={p.id} className="product-card">
                            <div className="image-container">
                                {p.image_url ? (
                                    <img src={`https://magazin-crm-backend.onrender.com${p.image_url}`} alt={p.name} />
                                ) : (
                                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                                        <Package size={48} />
                                    </div>
                                )}

                                {/* Restock button top-left */}
                                <button className="restock-btn" onClick={(e) => { e.stopPropagation(); setRestockModal(p); setAddQty(''); }}>
                                    <PlusCircle size={15} /> Qo'shish
                                </button>

                                {/* Delete button top-right */}
                                <button 
                                    onClick={(e) => handleDelete(e, p.id, p.name)}
                                    style={{ position: 'absolute', top: '12px', right: '12px', background: '#ef4444', border: 'none', color: 'white', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                                >
                                    <Trash2 size={16} />
                                </button>

                                {/* Code badge bottom-right */}
                                <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(255,255,255,0.9)', padding: '5px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: 800, color: '#4f46e5' }}>
                                    #{p.code}
                                </div>

                                {/* Out of stock badge */}
                                {parseFloat(p.quantity) <= 0 && (
                                    <div className="out-badge">TUGADI</div>
                                )}
                            </div>

                            <div style={{ padding: '20px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>{p.category || 'Kategoriya'}</span>
                                <h3 style={{ margin: '5px 0 15px 0', fontSize: '17px', color: '#1e293b' }}>{p.name}</h3>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                    <div>
                                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Sotish narxi</span>
                                        <div style={{ fontSize: '22px', fontWeight: 800, color: '#10b981' }}>${p.sale_usd}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Olish narxi</span>
                                        <div style={{ fontSize: '16px', fontWeight: 600, color: '#ef4444' }}>${p.cost_usd}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
                                    <div style={{ padding: '6px 12px', borderRadius: '8px', background: parseFloat(p.quantity) <= 0 ? '#fee2e2' : '#eff6ff', color: parseFloat(p.quantity) <= 0 ? '#ef4444' : '#3b82f6', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <Plus size={14} /> {p.quantity} dona
                                    </div>
                                    <div style={{ padding: '6px 12px', borderRadius: '8px', background: '#fef2f2', color: '#ef4444', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <Layers size={14} /> {Number(p.total_area).toFixed(1)} m²
                                    </div>
                                </div>

                                <div style={{ marginTop: '15px', background: '#f8fafc', padding: '10px', borderRadius: '12px', textAlign: 'center', position: 'relative' }}>
                                    <div style={{ transform: 'scale(0.8)', transformOrigin: 'top center', height: '65px' }}>
                                        <Barcode value={p.code} height={40} width={1.8} displayValue={false} background="transparent" />
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); printBarcode(p); }} 
                                        style={{ position: 'absolute', right: '10px', bottom: '10px', background: '#e2e8f0', color: '#475569', border: 'none', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}
                                        title="Shtrix-kodni Print qilish"
                                    >
                                        <Printer size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && filteredProducts.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: '100px', color: '#94a3b8' }}>
                    <Package size={48} style={{ opacity: 0.1, marginBottom: '20px' }} />
                    <p>Hech narsa topilmadi...</p>
                </div>
            )}

            {/* RESTOCK MODAL */}
            {restockModal && (
                <div className="modal-overlay" onClick={() => setRestockModal(null)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
                            <div>
                                <p style={{ margin: 0, fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Ombor to'ldirish</p>
                                <h2 style={{ margin: '5px 0 0 0' }}>{restockModal.name}</h2>
                            </div>
                            <button onClick={() => setRestockModal(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '10px', padding: '10px', cursor: 'pointer' }}>
                                <X size={20} color="#64748b" />
                            </button>
                        </div>

                        <div style={{ background: '#f8fafc', borderRadius: '15px', padding: '20px', marginBottom: '25px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Hozirgi qoldiq:</span>
                                <span style={{ fontWeight: 800, color: parseFloat(restockModal.quantity) <= 0 ? '#ef4444' : '#10b981', fontSize: '20px' }}>
                                    {restockModal.quantity} dona
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                                <span style={{ color: '#64748b' }}>Mahsulot kodi:</span>
                                <span style={{ fontWeight: 700, color: '#4f46e5' }}>#{restockModal.code}</span>
                            </div>
                        </div>

                        <label style={{ fontWeight: 700, display: 'block', marginBottom: '10px' }}>
                            Necha dona qo'shmoqchisiz?
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={addQty}
                            onChange={e => setAddQty(e.target.value)}
                            placeholder="Masalan: 50"
                            className="input-field"
                            style={{ marginBottom: '20px', fontSize: '20px', fontWeight: 700, textAlign: 'center' }}
                            autoFocus
                            onKeyDown={e => e.key === 'Enter' && handleRestock()}
                        />

                        {addQty && parseFloat(addQty) > 0 && (
                            <div style={{ background: '#f0fdf4', border: '1px solid #10b981', borderRadius: '12px', padding: '12px 18px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Yangi qoldiq bo'ladi:</span>
                                <span style={{ fontWeight: 800, color: '#10b981', fontSize: '18px' }}>
                                    {parseFloat(restockModal.quantity) + parseFloat(addQty)} dona
                                </span>
                            </div>
                        )}

                        <button
                            onClick={handleRestock}
                            disabled={restockLoading}
                            className="btn-primary"
                            style={{ background: '#10b981', padding: '18px', fontSize: '16px', opacity: restockLoading ? 0.7 : 1 }}
                        >
                            <CheckCircle size={20} />
                            {restockLoading ? 'Saqlanmoqda...' : "SAQLASH"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
