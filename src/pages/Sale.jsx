import { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { Trash2, ShoppingCart, Plus, Search, XCircle, CheckCircle } from 'lucide-react';

const API = 'https://magazin-crm-backend.onrender.com';

const Sale = () => {
    const [basket, setBasket] = useState([]);
    const [tempProduct, setTempProduct] = useState(null);
    const [sellQuantity, setSellQuantity] = useState(1);
    const [sellArea, setSellArea] = useState(0);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchVal, setSearchVal] = useState('');
    const [searchStatus, setSearchStatus] = useState(''); // 'searching' | 'found' | 'notfound'
    const searchInputRef = useRef(null);
    const debounceTimer = useRef(null);


    // ─── Search ──────────────────────────────────────────────────────────────
    const doSearch = useCallback(async (val) => {
        const q = (val || '').trim();
        if (!q) return;
        setSearchStatus('searching');
        setShowSuggestions(false);

        try {
            // 1. Try exact code match first
            const exact = await axios.get(`${API}/api/products/${encodeURIComponent(q)}`);
            if (exact.data) {
                setSearchStatus('found');
                selectProduct(exact.data);
                return;
            }
        } catch (_) {}

        try {
            // 2. Fallback: search by name / category
            const res = await axios.get(`${API}/api/products?search=${encodeURIComponent(q)}`);
            const list = res.data || [];
            if (list.length === 1) {
                setSearchStatus('found');
                selectProduct(list[0]);
            } else if (list.length > 1) {
                setSearchStatus('');
                setSuggestions(list.slice(0, 6));
                setShowSuggestions(true);
            } else {
                setSearchStatus('notfound');
            }
        } catch (_) { setSearchStatus('notfound'); }
    }, []);

    const handleInputChange = (e) => {
        const val = e.target.value;
        setSearchVal(val);
        setSearchStatus('');
        clearTimeout(debounceTimer.current);
        if (val.length > 1) {
            debounceTimer.current = setTimeout(() => doSearch(val), 400);
        } else {
            setShowSuggestions(false);
        }
    };

    const handleInputKeyDown = (e) => {
        if (e.key === 'Enter') {
            clearTimeout(debounceTimer.current);
            doSearch(searchVal);
        }
    };

    const selectProduct = (p) => {
        setTempProduct(p);
        setSellQuantity(1);
        setSellArea(String(p.size || 0));
        setShowSuggestions(false);
        setSuggestions([]);
    };

    // ─── Basket ──────────────────────────────────────────────────────────────
    const addToBasket = () => {
        if (!tempProduct) return;
        const qty = parseFloat(sellQuantity) || 0;
        const area = parseFloat(sellArea) || 0;
        const exists = basket.findIndex(i => i.product_id === tempProduct.id);

        if (exists > -1) {
            const nb = [...basket];
            nb[exists].sell_quantity += qty;
            nb[exists].sell_area += area;
            nb[exists].total_usd = nb[exists].sell_quantity * tempProduct.sale_usd;
            setBasket(nb);
        } else {
            setBasket([...basket, {
                product_id: tempProduct.id,
                name: tempProduct.name,
                code: tempProduct.code,
                image_url: tempProduct.image_url,
                sell_quantity: qty,
                sell_area: area,
                sale_usd: tempProduct.sale_usd,
                total_usd: qty * tempProduct.sale_usd
            }]);
        }
        setTempProduct(null);
        setSearchVal('');
        setSearchStatus('');
        searchInputRef.current?.focus();
    };

    // ─── Checkout ─────────────────────────────────────────────────────────────
    const handleCheckout = async () => {
        if (basket.length === 0) return;
        try {
            await axios.post(`${API}/api/sales`, {
                items: basket.map(i => ({
                    product_id: i.product_id,
                    sell_quantity: i.sell_quantity,
                    sell_area: i.sell_area
                }))
            });
            alert('✅ Sotuv muvaffaqiyatli yakunlandi!');
            setBasket([]);
        } catch (e) {
            alert('❌ ' + (e.response?.data?.message || 'Xatolik yuz berdi'));
        }
    };

    const grandTotal = basket.reduce((s, i) => s + i.total_usd, 0);

    return (
        <div style={{ display: 'flex', gap: '25px', alignItems: 'flex-start' }}>
            <style>{`
                #qr-reader video { border-radius: 14px; width: 100% !important; }
                #qr-reader { border: none !important; padding: 0 !important; }
                #qr-reader__scan_region { border-radius: 14px; overflow: hidden; }
                .search-wrap { position: relative; }
                .sugg-list {
                    position: absolute; top: calc(100% + 8px); left: 0; right: 0;
                    background: white; border-radius: 16px; z-index: 999;
                    box-shadow: 0 15px 40px rgba(0,0,0,0.15);
                    border: 1px solid #e2e8f0; overflow: hidden;
                }
                .sugg-item {
                    display: flex; align-items: center; gap: 14px;
                    padding: 14px 18px; cursor: pointer; transition: 0.15s;
                }
                .sugg-item:hover { background: #f8fafc; }
                .big-search {
                    width: 100%; height: 60px;
                    font-size: 20px; font-weight: 700;
                    padding: 0 55px 0 20px;
                    border: 2.5px solid #e2e8f0; border-radius: 16px;
                    outline: none; transition: 0.2s;
                    box-sizing: border-box;
                }
                .big-search:focus { border-color: #4f46e5; box-shadow: 0 0 0 4px rgba(79,70,229,0.1); }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>

            {/* LEFT COLUMN */}
            <div style={{ flex: 1, minWidth: 0 }}>


                {/* SEARCH — PRIMARY METHOD */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <Search size={20} color="#4f46e5" />
                        <span style={{ fontWeight: 800, fontSize: '16px' }}>Mahsulot qidirish</span>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>(Kod, nom yoki kategoriya)</span>
                    </div>

                    <div className="search-wrap">
                        <input
                            ref={searchInputRef}
                            type="text"
                            className="big-search"
                            value={searchVal}
                            onChange={handleInputChange}
                            onKeyDown={handleInputKeyDown}
                            placeholder="Qidiruv: masalan 'DEMO999' yoki 'kafel'..."
                            autoFocus
                        />
                        <button
                            onClick={() => doSearch(searchVal)}
                            style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: '#4f46e5', border: 'none', color: 'white', borderRadius: '10px', padding: '10px 14px', cursor: 'pointer' }}
                        >
                            {searchStatus === 'searching'
                                ? <div style={{ width: 18, height: 18, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                                : <Search size={18} />
                            }
                        </button>

                        {showSuggestions && suggestions.length > 0 && (
                            <div className="sugg-list">
                                {suggestions.map((p, i) => (
                                    <div key={i} className="sugg-item" onClick={() => selectProduct(p)}>
                                        <div style={{ width: 50, height: 50, borderRadius: 10, overflow: 'hidden', background: '#f1f5f9', flexShrink: 0 }}>
                                            {p.image_url
                                                ? <img src={`${API}${p.image_url}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📦</div>
                                            }
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700 }}>{p.name}</div>
                                            <div style={{ fontSize: 12, color: '#94a3b8' }}>Kod: {p.code} &nbsp;|&nbsp; ${p.sale_usd} &nbsp;|&nbsp; Qoldiq: {p.quantity}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {searchStatus === 'notfound' && (
                        <div style={{ marginTop: 12, padding: '12px 18px', background: '#fef2f2', borderRadius: 12, color: '#ef4444', fontWeight: 600, fontSize: 14 }}>
                            ❌ Mahsulot topilmadi. Kodni tekshirib qayta urinib ko'ring.
                        </div>
                    )}
                </div>

                {/* FOUND PRODUCT CARD */}
                {tempProduct && (
                    <div className="card" style={{ marginTop: 20, border: '2px solid #10b981', background: '#f0fdf4' }}>
                        <div style={{ display: 'flex', gap: 15, alignItems: 'center', marginBottom: 16 }}>
                            <div style={{ width: 70, height: 70, borderRadius: 12, overflow: 'hidden', background: '#e2e8f0', flexShrink: 0 }}>
                                {tempProduct.image_url
                                    ? <img src={`${API}${tempProduct.image_url}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>📦</div>
                                }
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <CheckCircle size={18} color="#10b981" />
                                    <span style={{ fontWeight: 800, fontSize: 18 }}>{tempProduct.name}</span>
                                </div>
                                <div style={{ fontSize: 13, color: '#64748b' }}>Kod: {tempProduct.code} &nbsp;|&nbsp; Qoldiq: {tempProduct.quantity} dona</div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981', marginTop: 4 }}>${tempProduct.sale_usd}</div>
                            </div>
                            <XCircle onClick={() => { setTempProduct(null); setSearchVal(''); }} style={{ cursor: 'pointer', color: '#94a3b8' }} size={22} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 6 }}>MIQDOR (DONA)</label>
                                <input type="number" min="1" value={sellQuantity} onChange={e => setSellQuantity(e.target.value)} onKeyDown={e => e.key === 'Enter' && addToBasket()} className="input-field" style={{ margin: 0 }} autoFocus />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 6 }}>KVADRAT (m²)</label>
                                <input type="number" min="0" value={sellArea} onChange={e => setSellArea(e.target.value)} className="input-field" style={{ margin: 0 }} />
                            </div>
                        </div>

                        <button onClick={addToBasket} className="btn-primary" style={{ marginTop: 16, background: '#10b981', padding: '16px' }}>
                            <Plus size={20} /> SAVATGA QO'SHISH
                        </button>
                    </div>
                )}
            </div>

            {/* RIGHT COLUMN — BASKET */}
            <div className="card" style={{ flex: '0 0 420px', maxWidth: 420 }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 0 }}>
                    <ShoppingCart size={26} /> Savat
                    {basket.length > 0 && <span style={{ background: '#4f46e5', color: 'white', borderRadius: 20, padding: '2px 10px', fontSize: 14 }}>{basket.length}</span>}
                </h2>

                <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                    <table style={{ margin: 0 }}>
                        <thead>
                            <tr><th>Mahsulot</th><th>Soni</th><th>Summa</th><th></th></tr>
                        </thead>
                        <tbody>
                            {basket.length === 0 && (
                                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                                    <ShoppingCart size={40} style={{ opacity: 0.15 }} /><br />Savat bo'sh
                                </td></tr>
                            )}
                            {basket.map((item, i) => (
                                <tr key={i}>
                                    <td>
                                        <div style={{ fontWeight: 700 }}>{item.name}</div>
                                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.code}</div>
                                    </td>
                                    <td style={{ fontWeight: 700 }}>{item.sell_quantity}</td>
                                    <td style={{ fontWeight: 800, color: '#10b981' }}>${item.total_usd.toFixed(2)}</td>
                                    <td>
                                        <button onClick={() => { const nb = [...basket]; nb.splice(i, 1); setBasket(nb); }}
                                            style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {basket.length > 0 && (
                    <div style={{ marginTop: 20, padding: 25, background: 'var(--primary-gradient)', borderRadius: 20, color: 'white' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
                            <span style={{ fontSize: 16 }}>Jami summa:</span>
                            <span style={{ fontSize: 28, fontWeight: 800 }}>${grandTotal.toFixed(2)}</span>
                        </div>
                        <button onClick={handleCheckout} className="btn-primary" style={{ background: 'white', color: '#4f46e5', padding: 18, fontSize: 16 }}>
                            SOTUVNI YAKUNLASH ✅
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sale;
