import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Camera, UploadCloud, XCircle, Plus } from 'lucide-react';

const AddProduct = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        code: '', name: '', size: 0, quantity: 0, cost_usd: 0, sale_usd: 0, dollar_rate: 12500, category: 'luxury'
    });
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);

    // Camera features
    const [cameraOn, setCameraOn] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setImage(file);
        if (file) setPreview(URL.createObjectURL(file));
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Wait for video to be ready before playing to avoid DOM exceptions in some browsers
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play().catch(e => console.error(e));
                };
            }
            setCameraOn(true);
            setPreview(null); // Clear preview when starting camera
            setImage(null);
        } catch (err) {
            alert('Kameraga ulanishda xato: ' + err.message);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setCameraOn(false);
    };

    const capturePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        canvas.getContext('2d').drawImage(video, 0, 0);
        
        canvas.toBlob(blob => {
            if (blob) {
                const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
                setImage(file);
                setPreview(URL.createObjectURL(file));
                stopCamera();
            }
        }, 'image/jpeg', 0.95);
    };

    // Cleanup camera if user leaves component
    useEffect(() => { return () => stopCamera(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        const finalCode = formData.code ? formData.code : String(Math.floor(100000000000 + Math.random() * 900000000000));
        data.append('code', finalCode);
        
        Object.keys(formData).forEach(key => {
            if (key !== 'code') data.append(key, formData[key]);
        });
        data.append('cost_som', formData.cost_usd * formData.dollar_rate);
        data.append('sale_som', formData.sale_usd * formData.dollar_rate);
        if (image) data.append('image', image);

        try {
            await axios.post('https://magazin-crm-backend.onrender.com/api/products', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("✅ Mahsulot muvaffaqiyatli saqlandi!");
            navigate('/products');
        } catch (error) {
            alert("❌ Xatolik yuz berdi");
        }
    };
    return (
        <div className="card add-product-card">
            <style>{`
                .add-product-card { max-width: 850px; margin: 0 auto; animation: fadeIn 0.5s; }
                .add-product-grid { display: grid; grid-template-columns: minmax(300px, 1fr) 1.2fr; gap: 25px; }
                .price-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
                @media (max-width: 768px) {
                    .add-product-grid { grid-template-columns: 1fr; }
                    .price-grid { grid-template-columns: 1fr; }
                }
            `}</style>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Plus size={28} /> Mahsulot kiritish
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="add-product-grid">
                    
                    {/* LEFT: IMAGE & CAMERA SECTION */}
                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '2px dashed #cbd5e1', position: 'relative' }}>
                        <h3 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#64748b' }}>Rasm qo'shish</h3>
                        
                        {/* Always render video so ref exists, just hide it */}
                        <div style={{ display: cameraOn ? 'flex' : 'none', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: 'black', height: '240px' }}>
                                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <canvas ref={canvasRef} style={{ display: 'none' }} />
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={capturePhoto} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>
                                    📸 Rasm Olish
                                </button>
                                <button type="button" onClick={stopCamera} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>
                                    Bekor qilish
                                </button>
                            </div>
                        </div>

                        {!cameraOn && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {preview ? (
                                    <div style={{ position: 'relative' }}>
                                        <img src={preview} alt="Preview" style={{ width: '100%', height: '240px', objectFit: 'cover', borderRadius: '12px' }} />
                                        <XCircle size={28} color="#ef4444" fill="white" style={{ position: 'absolute', top: '10px', right: '10px', cursor: 'pointer' }} onClick={() => { setPreview(null); setImage(null); }} />
                                    </div>
                                ) : (
                                    <div style={{ height: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '15px', background: 'white', borderRadius: '12px' }}>
                                        <Camera size={40} color="#94a3b8" />
                                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>Rasm yo'q</p>
                                    </div>
                                )}
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                                    <button type="button" onClick={startCamera} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>
                                        <Camera size={18} /> Kameradan
                                    </button>
                                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>
                                        <UploadCloud size={18} /> Fayldan
                                        <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: TEXT FIELDS */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>Mahsulot Rudi/Kodi</label>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                                <input type="text" name="code" placeholder="(bo'sh qolsa avtomat yaratiladi)" value={formData.code} className="input-field" onChange={handleChange} style={{ flex: 1, margin: 0 }} />
                                <button type="button" onClick={() => setFormData({...formData, code: String(Math.floor(1000000 + Math.random() * 9000000))})} style={{ background: '#f1f5f9', border: 'none', padding: '0 20px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', color: '#4f46e5' }}>YARATISH</button>
                            </div>
                        </div>

                        <div>
                            <label style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>Mahsulot nomi *</label>
                            <input type="text" name="name" placeholder="Masalan: Oq Kafel 60x60" className="input-field" onChange={handleChange} required style={{ margin: '5px 0 0 0' }} />
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                                <label style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>Kategoriya</label>
                                <select name="category" className="input-field" onChange={handleChange} style={{ margin: '5px 0 0 0' }}>
                                    <option value="luxury">Luxury</option>
                                    <option value="donali">Donali</option>
                                    <option value="pachkali">Pachkali</option>
                                    <option value="golden_art_floor">Golden Art Floor</option>
                                    <option value="kiloli">Kiloli</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>O'lcham (Birlik)</label>
                                <input type="number" step="0.0001" name="size" placeholder="m² yoki kg" className="input-field" onChange={handleChange} required style={{ margin: '5px 0 0 0' }} />
                            </div>
                        </div>

                        <div style={{ marginTop: '5px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>Boshlang'ich miqdor *</label>
                            <input type="number" step="0.001" name="quantity" placeholder="Zaxiradagi soni" className="input-field" onChange={handleChange} required style={{ margin: '5px 0 0 0' }} />
                        </div>
                    </div>
                </div>

                <div className="price-grid" style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px' }}>
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: 700, color: '#ef4444' }}>Olish narxi (USD)</label>
                        <input type="number" step="0.01" name="cost_usd" placeholder="0.00" className="input-field" onChange={handleChange} required style={{ margin: '5px 0 0 0' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: 700, color: '#10b981' }}>Sotish narxi (USD)</label>
                        <input type="number" step="0.01" name="sale_usd" placeholder="0.00" className="input-field" onChange={handleChange} required style={{ margin: '5px 0 0 0' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: 700, color: '#4f46e5' }}>Dollar kursi (So'm)</label>
                        <input type="number" name="dollar_rate" value={formData.dollar_rate} className="input-field" onChange={handleChange} required style={{ margin: '5px 0 0 0' }} />
                    </div>
                </div>

                <button type="submit" className="btn-primary" style={{ padding: '20px', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <Plus size={24} /> BAZAGA QO'SHISH
                </button>
            </form>
        </div>
    );
};

export default AddProduct;
