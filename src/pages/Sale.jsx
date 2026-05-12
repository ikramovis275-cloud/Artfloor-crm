import { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { Trash2, ShoppingCart, Plus, Search, XCircle, CheckCircle, Printer, Camera } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const API = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://magazin-crm-backend.onrender.com';

const Sale = () => {
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [basket, setBasket] = useState([]);
    const [tempProduct, setTempProduct] = useState(null);
    const [sellQuantity, setSellQuantity] = useState(1);
    const [sellArea, setSellArea] = useState(0);
    const [sellSom, setSellSom] = useState(0);
    const [sellUsd, setSellUsd] = useState(0);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchVal, setSearchVal] = useState('');
    const [searchStatus, setSearchStatus] = useState(''); // 'searching' | 'found' | 'notfound'
    const [showReceipt, setShowReceipt] = useState(false);
    const [lastSale, setLastSale] = useState(null);
    const [showScanner, setShowScanner] = useState(false);
    const searchInputRef = useRef(null);
    const debounceTimer = useRef(null);

    // ─── Fetch All Products ──────────────────────────────────────────────────
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/api/products`);
            setAllProducts(res.data || []);
        } catch (e) {
            console.error("Error fetching products:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // ─── Search ──────────────────────────────────────────────────────────────
    const doSearch = useCallback(async (val) => {
        const q = (val || '').trim();
        if (!q) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        setSearchStatus('searching');

        try {
            // Search by name / category / code
            const res = await axios.get(`${API}/api/products?search=${encodeURIComponent(q)}`);
            const list = res.data || [];
            setSuggestions(list.slice(0, 10));
            setShowSuggestions(true);
            setSearchStatus(list.length > 0 ? 'found' : 'notfound');
        } catch (_) { setSearchStatus('notfound'); }
    }, []);

    const handleInputChange = (e) => {
        const val = e.target.value;
        setSearchVal(val);
        setSearchStatus('');
        clearTimeout(debounceTimer.current);
        if (val.length > 0) {
            debounceTimer.current = setTimeout(() => doSearch(val), 300);
        } else {
            setShowSuggestions(false);
        }
    };

    const handleInputKeyDown = (e) => {
        if (e.key === 'Enter' && suggestions.length === 1) {
            selectProduct(suggestions[0]);
        }
    };

    const selectProduct = (p) => {
        setTempProduct(p);
        setSellQuantity(1);
        const initialArea = p.size ? (1 * p.size).toFixed(3) : 0;
        setSellArea(initialArea);
        setSellSom(p.sale_som || 0);
        setSellUsd(p.sale_usd || 0);
        setShowSuggestions(false);
        setSearchVal('');
    };

    const handleQuantityChange = (val) => {
        setSellQuantity(val);
        if (tempProduct && tempProduct.size) {
            const qty = parseFloat(val) || 0;
            setSellArea((qty * tempProduct.size).toFixed(3));
        }
    };

    const handleUsdChange = (val) => {
        setSellUsd(val);
        if (tempProduct && tempProduct.dollar_rate) {
            setSellSom(Math.round(parseFloat(val) * tempProduct.dollar_rate));
        }
    };

    const handleSomChange = (val) => {
        setSellSom(val);
        if (tempProduct && tempProduct.dollar_rate && tempProduct.dollar_rate > 0) {
            setSellUsd((parseFloat(val) / tempProduct.dollar_rate).toFixed(2));
        }
    };

    // ─── Basket ──────────────────────────────────────────────────────────────
    const addToBasket = () => {
        if (!tempProduct) return;
        const qty = parseFloat(sellQuantity) || 0;
        const area = parseFloat(sellArea) || 0;
        const som = parseFloat(sellSom) || 0;
        const usd = parseFloat(sellUsd) || 0;

        if (qty <= 0) {
            alert("Miqdor 0 dan katta bo'lishi kerak");
            return;
        }

        const exists = basket.findIndex(i => i.product_id === tempProduct.id && i.sale_usd === usd);

        if (exists > -1) {
            const nb = [...basket];
            nb[exists].sell_quantity += qty;
            nb[exists].sell_area += area;
            nb[exists].total_usd = nb[exists].sell_quantity * nb[exists].sale_usd;
            nb[exists].total_som = nb[exists].sell_quantity * nb[exists].sale_som;
            setBasket(nb);
        } else {
            setBasket([...basket, {
                product_id: tempProduct.id,
                name: tempProduct.name,
                code: tempProduct.code,
                image_url: tempProduct.image_url,
                sell_quantity: qty,
                sell_area: area,
                sale_som: som,
                sale_usd: usd,
                total_usd: qty * usd,
                total_som: qty * som
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
            const res = await axios.post(`${API}/api/sales`, {
                items: basket.map(i => ({
                    product_id: i.product_id,
                    sell_quantity: i.sell_quantity,
                    sell_area: i.sell_area,
                    sale_som: i.sale_som,
                    sale_usd: i.sale_usd
                }))
            });
            setLastSale({
                items: basket,
                date: new Date().toLocaleString(),
                total_usd: basket.reduce((s, i) => s + i.total_usd, 0),
                total_som: basket.reduce((s, i) => s + i.total_som, 0)
            });
            setShowReceipt(true);
            setBasket([]);
            fetchProducts(); // Refresh stock
        } catch (e) {
            alert('❌ ' + (e.response?.data?.message || 'Xatolik yuz berdi'));
        }
    };

    const handlePrint = () => {
        window.print();
    };

    useEffect(() => {
        if (!showScanner) return;

        const scanner = new Html5QrcodeScanner("qr-reader", { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true,
            aspectRatio: 1.0
        });

        scanner.render((decodedText) => {
            setSearchVal(decodedText);
            doSearch(decodedText);
            setShowScanner(false);
        }, (error) => {
            // Ignore trivial scanning errors
        });

        return () => {
            scanner.clear().catch(err => console.error("Scanner clear error:", err));
        };
    }, [showScanner, doSearch]);

    const grandTotalUsd = basket.reduce((s, i) => s + i.total_usd, 0);
    const grandTotalSom = basket.reduce((s, i) => s + i.total_som, 0);

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

                @media print {
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    body { background: white; margin: 0; padding: 0; }
                    .receipt-container { width: 80mm; padding: 5mm; font-family: monospace; }
                }
                .print-only { display: none; }
            `}</style>

            <div className="no-print" style={{ flex: 1, minWidth: 0 }}>
                {/* SEARCH — PRIMARY METHOD */}
                <div className="card" style={{ marginBottom: 20 }}>
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
                            onClick={() => setShowScanner(!showScanner)}
                            style={{ position: 'absolute', right: '65px', top: '50%', transform: 'translateY(-50%)', background: '#f1f5f9', border: 'none', color: '#4f46e5', borderRadius: '10px', padding: '10px 14px', cursor: 'pointer' }}
                            title="Kameradan skanerlash"
                        >
                            <Camera size={18} />
                        </button>
                        <button
                            onClick={() => doSearch(searchVal)}
                            style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: '#4f46e5', border: 'none', color: 'white', borderRadius: '10px', padding: '10px 14px', cursor: 'pointer' }}
                        >
                            {searchStatus === 'searching'
                                ? <div style={{ width: 18, height: 18, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                                : <Search size={18} />
                            }
                        </button>

                        {showScanner && (
                            <div style={{ marginTop: '20px', borderRadius: '16px', overflow: 'hidden', border: '2px solid #4f46e5' }}>
                                <div id="qr-reader" style={{ width: '100%' }}></div>
                            </div>
                        )}
                    </div>

                    {searchStatus === 'notfound' && (
                        <div style={{ marginTop: 12, padding: '12px 18px', background: '#fef2f2', borderRadius: 12, color: '#ef4444', fontWeight: 600, fontSize: 14 }}>
                            ❌ Mahsulot topilmadi. Kodni tekshirib qayta urinib ko'ring.
                        </div>
                    )}
                </div>

                {/* FOUND PRODUCT CARD (MODAL-LIKE) */}
                {tempProduct && (
                    <div className="card" style={{ marginBottom: 20, border: '3px solid #10b981', background: '#f0fdf4', position: 'sticky', top: '10px', zIndex: 100 }}>
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
                                <div style={{ fontSize: 13, color: '#64748b' }}>Kod: {tempProduct.code} &nbsp;|&nbsp; Qoldiq: {tempProduct.quantity} dona {tempProduct.size ? `(${tempProduct.total_area} m³)` : ''}</div>
                            </div>
                            <XCircle onClick={() => { setTempProduct(null); setSearchVal(''); }} style={{ cursor: 'pointer', color: '#94a3b8' }} size={22} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 6 }}>MIQDOR (DONA)</label>
                                <input type="number" min="0" max="1000000000" value={sellQuantity} onChange={e => handleQuantityChange(e.target.value)} onKeyDown={e => e.key === 'Enter' && addToBasket()} className="input-field" style={{ margin: 0 }} autoFocus />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 6 }}>{tempProduct?.size ? 'KUB (m³)' : 'KVADRAT (m²)'}</label>
                                <input type="number" min="0" max="1000000000" value={sellArea} onChange={e => setSellArea(e.target.value)} className="input-field" style={{ margin: 0 }} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 800, color: '#4f46e5', display: 'block', marginBottom: 6 }}>NARX (SO'M)</label>
                                <input type="number" min="0" max="2000000000" value={sellSom} onChange={e => handleSomChange(e.target.value)} className="input-field" style={{ margin: 0, fontWeight: 800, color: '#4f46e5', fontSize: '18px' }} />
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', marginTop: '5px' }}>= ${sellUsd}</div>
                            </div>
                            <div style={{ opacity: 0.5 }}>
                                <label style={{ fontSize: 12, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 6 }}>NARX ($)</label>
                                <input type="number" min="0" max="1000000000" step="0.01" value={sellUsd} onChange={e => handleUsdChange(e.target.value)} className="input-field" style={{ margin: 0, color: '#94a3b8' }} />
                            </div>
                        </div>

                        <button onClick={addToBasket} className="btn-primary" style={{ marginTop: 16, background: '#10b981', padding: '16px' }}>
                            <Plus size={20} /> SAVATGA QO'SHISH
                        </button>
                    </div>
                )}

                {/* PRODUCT CATALOG */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <ShoppingCart size={20} color="#4f46e5" />
                            <span style={{ fontWeight: 800, fontSize: '16px' }}>Mahsulotlar katalogi</span>
                        </div>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                            {searchVal ? `Topildi: ${allProducts.filter(p => p.name.toLowerCase().includes(searchVal.toLowerCase()) || p.code.toLowerCase().includes(searchVal.toLowerCase())).length} ta` : `Jami: ${allProducts.length} xil`}
                        </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px' }}>
                        {loading && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>Yuklanmoqda...</div>}
                        {!loading && allProducts.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Mahsulotlar yo'q</div>}
                        {allProducts
                            .filter(p => !searchVal || p.name.toLowerCase().includes(searchVal.toLowerCase()) || p.code.toLowerCase().includes(searchVal.toLowerCase()) || (p.category && p.category.toLowerCase().includes(searchVal.toLowerCase())))
                            .map((p, i) => (
                            <div key={i} className="catalog-item" onClick={() => selectProduct(p)} style={{
                                background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '12px',
                                cursor: 'pointer', transition: '0.2s', display: 'flex', flexDirection: 'column', gap: '8px'
                            }}>
                                <style>{`
                                    .catalog-item:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); border-color: #4f46e5; }
                                    .catalog-item img { transition: 0.3s; }
                                    .catalog-item:hover img { transform: scale(1.05); }
                                `}</style>
                                <div style={{ width: '100%', aspectRatio: '1', borderRadius: '10px', overflow: 'hidden', background: '#f1f5f9', position: 'relative' }}>
                                    {p.image_url
                                        ? <img src={`${API}${p.image_url}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>📦</div>
                                    }
                                    <div style={{ position: 'absolute', bottom: '5px', right: '5px', background: 'rgba(255,255,255,0.9)', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, color: '#4f46e5' }}>
                                        {parseFloat(p.sale_som).toLocaleString()}
                                    </div>
                                </div>
                                <div style={{ fontWeight: 700, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Kod: {p.code}</span>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: p.quantity > 0 ? '#10b981' : '#ef4444' }}>{p.quantity} dona</span>
                                </div>
                                <button className="btn-primary" style={{ padding: '6px', fontSize: '10px', marginTop: 'auto', background: '#f1f5f9', color: '#4f46e5', border: 'none' }}>
                                    <ShoppingCart size={14} /> SAVATGA
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN — BASKET */}
            <div className="card no-print" style={{ flex: '0 0 420px', maxWidth: 420 }}>
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
                                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.code} | ${item.sale_usd} | {item.sale_som.toLocaleString()}so'm</div>
                                    </td>
                                    <td style={{ fontWeight: 700 }}>{item.sell_quantity}</td>
                                    <td style={{ fontWeight: 800, color: '#10b981' }}>
                                        {item.total_som.toLocaleString()} so'm<br/>
                                        <span style={{fontSize: 10, color: '#94a3b8'}}>${item.total_usd.toFixed(2)}</span>
                                    </td>
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 14 }}>Jami (so'm):</span>
                            <span style={{ fontSize: 28, fontWeight: 800 }}>{grandTotalSom.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
                            <span style={{ fontSize: 14 }}>Jami ($):</span>
                            <span style={{ fontSize: 16, fontWeight: 600, opacity: 0.8 }}>${grandTotalUsd.toFixed(2)}</span>
                        </div>
                        <button onClick={handleCheckout} className="btn-primary" style={{ background: 'white', color: '#4f46e5', padding: 18, fontSize: 16 }}>
                            SOTUVNI YAKUNLASH ✅
                        </button>
                    </div>
                )}
            </div>

            {/* RECEIPT MODAL */}
            {showReceipt && lastSale && (
                <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="card" style={{ width: 400, padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: 20, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Sotuv yakunlandi</h3>
                            <XCircle onClick={() => setShowReceipt(false)} style={{ cursor: 'pointer' }} />
                        </div>
                        <div style={{ padding: 20, maxHeight: '70vh', overflowY: 'auto', background: '#f8fafc' }}>
                            <div id="receipt-content" style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', fontSize: '14px', fontFamily: 'monospace' }}>
                                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                    <h2 style={{ margin: '0 0 5px 0' }}>OMBOR CRM</h2>
                                    <div>Xarid cheki</div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>{lastSale.date}</div>
                                </div>
                                <div style={{ borderBottom: '1px dashed #ccc', marginBottom: 10 }}></div>
                                <table style={{ width: '100%', fontSize: '12px' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #eee' }}>
                                            <th style={{ textAlign: 'left' }}>Nomi</th>
                                            <th style={{ textAlign: 'center' }}>Soni</th>
                                            <th style={{ textAlign: 'right' }}>Narxi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lastSale.items.map((item, i) => (
                                            <tr key={i}>
                                                <td style={{ padding: '4px 0' }}>{item.name}</td>
                                                <td style={{ textAlign: 'center' }}>{item.sell_quantity}</td>
                                                <td style={{ textAlign: 'right' }}>{item.sale_som.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div style={{ borderBottom: '1px dashed #ccc', margin: '10px 0' }}></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '18px' }}>
                                    <span>JAMI:</span>
                                    <span>{lastSale.total_som.toLocaleString()} so'm</span>
                                </div>
                                <div style={{ textAlign: 'right', fontSize: '12px', marginTop: 5, opacity: 0.6 }}>
                                    ${lastSale.total_usd.toFixed(2)}
                                </div>
                                <div style={{ textAlign: 'center', marginTop: 30, fontSize: '12px' }}>
                                    Xaridingiz uchun rahmat!
                                </div>
                            </div>
                        </div>
                        <div style={{ padding: 20, display: 'flex', gap: 10 }}>
                            <button onClick={handlePrint} className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <Printer size={18} /> CHEK CHIQARISH
                            </button>
                            <button onClick={() => setShowReceipt(false)} className="btn-primary" style={{ flex: 1, background: '#94a3b8' }}>
                                YOPISH
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PRINT ONLY VIEW */}
            <div className="print-only">
                {lastSale && (
                    <div className="receipt-container">
                        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                            <h2 style={{ margin: '0' }}>OMBOR CRM</h2>
                            <div style={{ fontSize: '12px' }}>{lastSale.date}</div>
                        </div>
                        <div style={{ borderBottom: '1px dashed black', margin: '10px 0' }}></div>
                        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid black' }}>
                                    <th style={{ textAlign: 'left' }}>Mahsulot</th>
                                    <th style={{ textAlign: 'right' }}>Soni</th>
                                    <th style={{ textAlign: 'right' }}>Summa</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lastSale.items.map((item, i) => (
                                    <tr key={i}>
                                        <td>{item.name}</td>
                                        <td style={{ textAlign: 'right' }}>{item.sell_quantity}</td>
                                        <td style={{ textAlign: 'right' }}>{item.total_som.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{ borderBottom: '1px dashed black', margin: '10px 0' }}></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
                            <span>JAMI:</span>
                            <span>{lastSale.total_som.toLocaleString()} so'm</span>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '10px', opacity: 0.6 }}>
                            ${lastSale.total_usd.toFixed(2)}
                        </div>
                        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '10px' }}>
                            Xaridingiz uchun rahmat!
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sale;
