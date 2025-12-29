import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// --- Global Types for Telegram ---
declare global {
  interface Window {
    Telegram: any;
  }
}

// --- Types ---
type Gender = "male" | "female";
type Orientation = "hetero" | "gay" | "bi";
type Goal = "relationship" | "friendship" | "18+";

interface UserProfile {
  telegram_id: number;
  username: string;
  first_name: string;
  name: string;
  age: number;
  gender: Gender;
  orientation: Orientation;
  country: string;
  city: string;
  goal: Goal;
  photo: string | null; // Base64 string
  bio: string;
  is_premium: boolean;
}

interface Match {
  user_id: number;
  name: string;
  username: string;
  photo: string;
  matched_at: string;
}

interface FilterState {
    city: string;
    minAge: number;
    maxAge: number;
}

// --- API Configuration ---
const API_URL = `http://${window.location.hostname}:8000`;

// --- Mock Data ---
const CITIES = ["Алматы", "Астана", "Шымкент", "Караганда", "Актобе", "Тараз"];

// --- Helper: Get Telegram User ---
const getTelegramUser = () => {
  const tg = window.Telegram?.WebApp;
  if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
    return tg.initDataUnsafe.user;
  }
  return { id: 123456789, username: "test_user", first_name: "Test" };
};

// --- Components ---

const AdminPanel = ({ onBack }: { onBack: () => void }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAuth, setIsAuth] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  const handleLogin = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        setIsAuth(true);
        loadUsers();
      } else {
        alert("Неверный email или пароль");
      }
    } catch (e) {
      alert("Ошибка подключения к серверу");
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/users`);
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isAuth) {
    return (
      <div className="container" style={{justifyContent: 'center', alignItems: 'center'}}>
        <h2>Админ Панель</h2>
        <div className="form-group" style={{width: '100%'}}>
            <label>Email</label>
          <input 
            type="email" 
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{marginBottom: 10}}
          />
          <label>Пароль</label>
          <input 
            type="password" 
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={handleLogin}>Войти</button>
        <button className="btn btn-ghost" onClick={onBack} style={{marginTop: 20}}>Назад</button>
      </div>
    );
  }

  return (
    <div className="container" style={{justifyContent: 'flex-start', paddingTop: 40}}>
      <div className="header">
        <h1>Пользователи ({users.length})</h1>
      </div>
      <div style={{overflowY: 'auto', width: '100%', paddingBottom: 20}}>
        {users.map((u: any) => (
          <div key={u.telegram_id} style={{
            background: '#2c2c2e', 
            padding: 10, 
            borderRadius: 8, 
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <div style={{width: 40, height: 40, borderRadius: '50%', background: '#ccc', overflow: 'hidden', flexShrink: 0}}>
               {u.photo ? <img src={u.photo} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : null}
            </div>
            <div style={{fontSize: 14, overflow: 'hidden'}}>
              <div style={{fontWeight: 'bold'}}>
                  {u.name}, {u.age}
                  {u.is_premium && <span style={{marginLeft: 5}}>🌟</span>}
              </div>
              <div style={{color: '#aaa', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                @{u.username} | {u.city}
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className="btn btn-secondary" onClick={onBack} style={{marginTop: 'auto', marginBottom: 20}}>Выйти</button>
    </div>
  );
};

const Registration = ({ onComplete }: { onComplete: (profile: UserProfile) => void }) => {
  const [step, setStep] = useState(1);
  const tgUser = getTelegramUser();
  
  const [formData, setFormData] = useState<UserProfile>({
    telegram_id: tgUser.id,
    username: tgUser.username || "unknown",
    first_name: tgUser.first_name || "",
    name: tgUser.first_name || "",
    age: 18,
    gender: "male",
    orientation: "hetero",
    country: "Казахстан",
    city: "Алматы",
    goal: "relationship",
    photo: null,
    bio: "",
    is_premium: false
  });

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const updateField = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        updateField("photo", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Регистрация</h1>
        <p>Шаг {step} из 4</p>
      </div>

      {step === 1 && (
        <>
          <div className="form-group">
            <label>Ваше Имя</label>
            <input 
              type="text" 
              value={formData.name} 
              onChange={e => updateField("name", e.target.value)}
              placeholder="Как вас зовут?"
            />
          </div>
          <div className="form-group">
            <label>Возраст</label>
            <input 
              type="number" 
              value={formData.age} 
              onChange={e => updateField("age", parseInt(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>Пол</label>
            <div className="selection-grid">
              <div 
                className={`selection-card ${formData.gender === 'male' ? 'selected' : ''}`}
                onClick={() => updateField("gender", "male")}
              >
                <span className="icon">👨</span>
                Мужской
              </div>
              <div 
                className={`selection-card ${formData.gender === 'female' ? 'selected' : ''}`}
                onClick={() => updateField("gender", "female")}
              >
                <span className="icon">👩</span>
                Женский
              </div>
            </div>
          </div>
          <div className="form-group">
            <label>Ориентация</label>
            <select value={formData.orientation} onChange={e => updateField("orientation", e.target.value)}>
              <option value="hetero">Натурал(ка)</option>
              <option value="gay">Гей / Лесбиянка</option>
              <option value="bi">Би</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleNext} disabled={!formData.name}>
            Далее
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <div className="form-group">
            <label>Страна</label>
            <input type="text" value="Казахстан" disabled />
          </div>
          <div className="form-group">
            <label>Город</label>
            <select value={formData.city} onChange={e => updateField("city", e.target.value)}>
              {CITIES.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          <div style={{display: 'flex', gap: '10px'}}>
            <button className="btn btn-secondary" onClick={handleBack}>Назад</button>
            <button className="btn btn-primary" onClick={handleNext}>Далее</button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="form-group">
            <label>Кого вы ищете?</label>
            <div className="selection-grid" style={{gridTemplateColumns: '1fr'}}>
              <div 
                className={`selection-card ${formData.goal === 'relationship' ? 'selected' : ''}`}
                onClick={() => updateField("goal", "relationship")}
              >
                <span className="icon">❤️</span>
                Серьезные отношения
              </div>
              <div 
                className={`selection-card ${formData.goal === 'friendship' ? 'selected' : ''}`}
                onClick={() => updateField("goal", "friendship")}
              >
                <span className="icon">🤝</span>
                Дружба
              </div>
              <div 
                className={`selection-card ${formData.goal === '18+' ? 'selected' : ''}`}
                onClick={() => updateField("goal", "18+")}
              >
                <span className="icon">🔥</span>
                18+ / Веселье
              </div>
            </div>
          </div>
          <div style={{display: 'flex', gap: '10px'}}>
            <button className="btn btn-secondary" onClick={handleBack}>Назад</button>
            <button className="btn btn-primary" onClick={handleNext}>Далее</button>
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <div className="form-group">
            <label>Фотография</label>
            <label className="image-upload-label">
              {formData.photo ? (
                <img src={formData.photo} alt="Preview" className="image-preview" />
              ) : (
                <>
                  <span className="material-icons-round" style={{fontSize: 48, color: '#9e9e9e'}}>add_a_photo</span>
                  <span style={{color: '#9e9e9e', marginTop: 8}}>Загрузить фото</span>
                </>
              )}
              <input type="file" accept="image/*" onChange={handlePhotoUpload} hidden />
            </label>
          </div>

          <div className="form-group">
            <label>О себе (Био)</label>
            <textarea 
              rows={4}
              value={formData.bio}
              onChange={e => updateField("bio", e.target.value)}
              placeholder="Напишите пару слов о себе. Это увидят другие пользователи."
            />
          </div>

          <div style={{display: 'flex', gap: '10px'}}>
            <button className="btn btn-secondary" onClick={handleBack}>Назад</button>
            <button className="btn btn-accent" onClick={() => onComplete(formData)} disabled={!formData.photo || !formData.bio}>
              Завершить
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// --- App Component ---
const App = () => {
  const [view, setView] = useState<"register" | "swipe" | "matches" | "profile" | "admin">("register");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [candidates, setCandidates] = useState<UserProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState<Match[]>([]);
  const [showMatchPopup, setShowMatchPopup] = useState<UserProfile | null>(null);
  
  // Filter & Premium State
  const [showFilters, setShowFilters] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
      city: "all",
      minAge: 18,
      maxAge: 50
  });

  const [secretCounter, setSecretCounter] = useState(0);

  // 1. Initial Load
  useEffect(() => {
    const tgUser = getTelegramUser();
    
    const checkUser = async () => {
      try {
        const res = await fetch(`${API_URL}/me?telegram_id=${tgUser.id}`);
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          setView("swipe");
          loadCandidates(tgUser.id, userData.is_premium, filters);
          loadMatches(tgUser.id);
        } else {
          setView("register");
        }
      } catch (error) {
        console.error("Backend offline, defaulting to Register screen.");
        setView("register");
      }
    };
    
    checkUser();
  }, []);

  const loadCandidates = async (tgId: number, isPremium: boolean, currentFilters: FilterState) => {
    try {
      let query = `${API_URL}/candidates?telegram_id=${tgId}`;
      
      // Apply filters if Premium
      if (isPremium) {
          if (currentFilters.city !== "all") query += `&city=${currentFilters.city}`;
          query += `&min_age=${currentFilters.minAge}`;
          query += `&max_age=${currentFilters.maxAge}`;
      }

      const res = await fetch(query);
      if (res.ok) {
        const data = await res.json();
        setCandidates(data);
        setCurrentIndex(0);
      }
    } catch (e) {
      console.error("Failed to load candidates", e);
    }
  };

  const loadMatches = async (tgId: number) => {
    try {
        const res = await fetch(`${API_URL}/matches?telegram_id=${tgId}`);
        if(res.ok) {
            const data = await res.json();
            setMatches(data);
        }
    } catch(e) {
        console.error(e);
    }
  }

  const handleRegistrationComplete = async (profile: UserProfile) => {
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile)
      });
      
      if (!res.ok) throw new Error("Registration failed");
      
      setUser(profile);
      setView("swipe");
      loadCandidates(profile.telegram_id, profile.is_premium, filters);
    } catch (error) {
      alert("Ошибка: Не удалось соединиться с сервером.");
    }
  };

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!user) return;
    const currentCandidate = candidates[currentIndex];

    if (direction === 'right') {
        try {
            const res = await fetch(`${API_URL}/like`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    from_user: user.telegram_id,
                    to_user: currentCandidate.telegram_id
                })
            });
            const result = await res.json();
            
            if (result.is_match) {
                setShowMatchPopup(currentCandidate);
                loadMatches(user.telegram_id);
            }
        } catch (e) {
            console.error("Swipe API failed", e);
        }
    }

    setTimeout(() => {
        if (currentIndex < candidates.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            // Check if there are more
             setCurrentIndex(0); // For demo, loop back or empty
             alert("Анкеты закончились! Попробуйте сменить фильтры.");
        }
    }, 200);
  };

  // Filter Logic
  const openFilters = () => {
      if (user?.is_premium) {
          setShowFilters(true);
      } else {
          setShowPremiumModal(true);
      }
  };

  const applyFilters = () => {
      setShowFilters(false);
      if (user) {
          loadCandidates(user.telegram_id, true, filters);
      }
  };

  // --- Payment Logic: Telegram Payments / Stars ---
  const handleBuyPremium = async () => {
      if (!user) return;
      
      try {
          // 1. Request the backend to generate a Payment Invoice Link
          const res = await fetch(`${API_URL}/create_invoice`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ telegram_id: user.telegram_id })
          });

          if (!res.ok) {
              const err = await res.json();
              alert("Ошибка создания счета: " + (err.detail || "Unknown error"));
              return;
          }

          const data = await res.json();
          const invoiceLink = data.invoice_link;

          // 2. Open the Invoice inside Telegram
          if (window.Telegram?.WebApp) {
              window.Telegram.WebApp.openInvoice(invoiceLink, (status: string) => {
                  if (status === "paid") {
                      // 3. Payment Successful UI Update
                      // Note: The real database update happens via Webhook/Polling on the backend
                      window.Telegram.WebApp.close(); // Close invoice
                      setShowPremiumModal(false);
                      alert("Оплата прошла успешно! Ваш Premium активирован.");
                      
                      // Optimistically update UI or reload user
                      const updatedUser = { ...user, is_premium: true };
                      setUser(updatedUser);
                      loadCandidates(updatedUser.telegram_id, true, filters);
                  } else if (status === "cancelled") {
                       // User cancelled
                  } else if (status === "failed") {
                      alert("Оплата не прошла.");
                  }
              });
          } else {
              alert("Пожалуйста, откройте приложение в Telegram, чтобы совершить оплату.");
          }

      } catch(e) {
          console.error(e);
          alert("Ошибка подключения к платежному шлюзу");
      }
  };

  const handleProfileImageClick = () => {
      const newCount = secretCounter + 1;
      setSecretCounter(newCount);
      if (newCount >= 5) {
          setView("admin");
          setSecretCounter(0);
      }
  }

  if (view === "admin") {
    return <AdminPanel onBack={() => setView("profile")} />;
  }

  if (!user || view === "register") {
    return <Registration onComplete={handleRegistrationComplete} />;
  }

  const currentCandidate = candidates[currentIndex];

  return (
    <div className="app-view">
      <div className="content-area">
        {view === "swipe" && (
          <div className="card-stack">
            {/* Filter Button */}
            <button className="filter-btn" onClick={openFilters}>
                <span className="material-icons-round">tune</span>
            </button>

            {currentCandidate ? (
              <div className="profile-card">
                <div 
                  className="card-image"
                  style={{ backgroundImage: `url(${currentCandidate.photo})` }}
                >
                  <div className="card-overlay">
                    <h2 className="card-name">
                      {currentCandidate.name}, {currentCandidate.age}
                      <span style={{fontSize: 20, marginLeft: 6}}>
                        {currentCandidate.gender === 'male' ? '👨' : '👩'}
                      </span>
                    </h2>
                    <div className="card-meta">
                      📍 {currentCandidate.city} • {
                          currentCandidate.goal === 'relationship' ? '❤️ Отношения' : 
                          currentCandidate.goal === 'friendship' ? '🤝 Дружба' : '🔥 18+'
                      }
                    </div>
                    <div className="card-bio">{currentCandidate.bio}</div>
                  </div>
                </div>
              </div>
            ) : (
                <div style={{textAlign: 'center', opacity: 0.5}}>
                    <span className="material-icons-round" style={{fontSize: 64, color: '#333'}}>search_off</span>
                    <p style={{marginTop: 10}}>Анкеты закончились или сервер недоступен.</p>
                </div>
            )}
            
            {currentCandidate && (
                <div className="card-controls">
                <button className="control-btn btn-dislike" onClick={() => handleSwipe('left')}>
                    <span className="material-icons-round">close</span>
                </button>
                <button className="control-btn btn-like" onClick={() => handleSwipe('right')}>
                    <span className="material-icons-round">favorite</span>
                </button>
                </div>
            )}
          </div>
        )}

        {view === "matches" && (
          <div className="match-list">
            <div className="header">
              <h1>Совпадения</h1>
              <p>Напишите им в Telegram!</p>
            </div>
            {matches.length === 0 ? (
                <div style={{textAlign: 'center', color: '#9e9e9e', marginTop: 40}}>
                    <span className="material-icons-round" style={{fontSize: 48, marginBottom: 16}}>heart_broken</span>
                    <p>Пока нет совпадений.</p>
                </div>
            ) : (
                matches.map(match => (
                <div key={match.user_id} className="match-item">
                    <img src={match.photo || ''} alt={match.name} className="match-avatar" />
                    <div className="match-info">
                    <div className="match-name">{match.name}</div>
                    <div className="match-status">@{match.username}</div>
                    </div>
                    <a 
                    href={`https://t.me/${match.username}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="match-action"
                    >
                    <span className="material-icons-round">send</span>
                    </a>
                </div>
                ))
            )}
          </div>
        )}

        {view === "profile" && (
          <div className="container">
            <div className="header">
              <h1>Мой профиль</h1>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16}}>
                <div style={{position: 'relative'}} onClick={handleProfileImageClick}>
                    <img 
                        src={user.photo || ''} 
                        style={{width: 120, height: 120, borderRadius: '50%', objectFit: 'cover'}} 
                    />
                    {user.is_premium && (
                        <div style={{
                            position: 'absolute', bottom: 0, right: 0, 
                            background: 'gold', borderRadius: '50%', 
                            width: 32, height: 32, display: 'flex', 
                            alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}>
                            <span style={{fontSize: 18}}>🌟</span>
                        </div>
                    )}
                </div>
                <h2>{user.name}, {user.age}</h2>
                {user.is_premium ? (
                    <div className="premium-badge">PREMIUM ACTIVATED</div>
                ) : (
                    <div style={{textAlign: 'center'}}>
                        <button className="btn btn-premium" onClick={() => setShowPremiumModal(true)}>
                            Купить Premium за 590 ₸
                        </button>
                        <p style={{fontSize: 12, color: '#aaa', marginTop: 5}}>Оплата через Telegram Stars / Карту (Тест)</p>
                    </div>
                )}

                <div style={{color: '#9e9e9e', textAlign: 'center'}}>{user.bio}</div>
                <div style={{
                    background: '#2c2c2e', 
                    padding: 16, 
                    borderRadius: 12, 
                    width: '100%',
                    marginTop: 16
                }}>
                    <p>📍 Город: {user.city}</p>
                    <p>🎯 Цель: {user.goal === 'relationship' ? 'Отношения' : user.goal === 'friendship' ? 'Дружба' : '18+'}</p>
                    <p>👀 Ориентация: {user.orientation === 'hetero' ? 'Натурал' : user.orientation === 'gay' ? 'Гей' : 'Би'}</p>
                </div>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}

      {/* Filter Modal */}
      {showFilters && (
          <div className="modal-overlay">
              <div className="modal-content">
                  <h3>Фильтры поиска</h3>
                  <div className="form-group">
                      <label>Город</label>
                      <select 
                        value={filters.city} 
                        onChange={(e) => setFilters(prev => ({...prev, city: e.target.value}))}
                      >
                          <option value="all">Все города</option>
                          {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                  </div>
                  <div className="form-group">
                      <label>Возраст: {filters.minAge} - {filters.maxAge}</label>
                      <div style={{display: 'flex', gap: 10, alignItems: 'center'}}>
                          <input 
                            type="number" 
                            value={filters.minAge} 
                            min={18} max={99}
                            onChange={(e) => setFilters(prev => ({...prev, minAge: parseInt(e.target.value)}))}
                            style={{width: 80}}
                          />
                          <span>до</span>
                          <input 
                            type="number" 
                            value={filters.maxAge} 
                            min={18} max={99}
                            onChange={(e) => setFilters(prev => ({...prev, maxAge: parseInt(e.target.value)}))}
                            style={{width: 80}}
                          />
                      </div>
                  </div>
                  <button className="btn btn-primary" onClick={applyFilters}>Применить</button>
                  <button className="btn btn-ghost" onClick={() => setShowFilters(false)} style={{marginTop: 10}}>Отмена</button>
              </div>
          </div>
      )}

      {/* Premium Modal */}
      {showPremiumModal && (
          <div className="modal-overlay">
              <div className="modal-content premium-content">
                  <div style={{fontSize: 64, marginBottom: 10}}>🌟</div>
                  <h2 style={{background: 'linear-gradient(45deg, #FFD700, #FFA500)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
                      PREMIUM
                  </h2>
                  <p>Разблокируй полный доступ!</p>
                  <ul style={{textAlign: 'left', margin: '20px 0', color: '#ddd'}}>
                      <li>✅ Фильтр по городу</li>
                      <li>✅ Фильтр по возрасту</li>
                      <li>✅ Выделение анкеты</li>
                  </ul>
                  <button className="btn btn-premium" onClick={handleBuyPremium}>
                      Купить за 590 ₸
                  </button>
                  <button className="btn btn-ghost" onClick={() => setShowPremiumModal(false)} style={{marginTop: 10}}>
                      Позже
                  </button>
              </div>
          </div>
      )}

      {/* Match Popup Overlay */}
      {showMatchPopup && (
        <div className="match-popup" onClick={() => setShowMatchPopup(null)}>
          <h2>IT'S A MATCH!</h2>
          <div style={{display: 'flex', gap: 20, marginBottom: 30}}>
             <img src={user?.photo || ''} style={{width: 80, height: 80, borderRadius: '50%', border: '2px solid white'}} />
             <img src={showMatchPopup.photo || ''} style={{width: 80, height: 80, borderRadius: '50%', border: '2px solid #8774e1'}} />
          </div>
          <p>Вы и {showMatchPopup.name} понравились друг другу!</p>
          <a 
            href={`https://t.me/${showMatchPopup.username}`}
            target="_blank"
            className="btn btn-accent"
            style={{marginTop: 20, textDecoration: 'none', display: 'inline-flex'}}
            onClick={(e) => e.stopPropagation()}
          >
            Написать сообщение
          </a>
          <button className="btn btn-ghost" style={{color: 'white', marginTop: 10}}>Продолжить поиск</button>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button 
            className={`nav-item ${view === 'swipe' ? 'active' : ''}`}
            onClick={() => setView('swipe')}
        >
          <span className="material-icons-round">style</span>
          <span>Анкеты</span>
        </button>
        <button 
            className={`nav-item ${view === 'matches' ? 'active' : ''}`}
            onClick={() => setView('matches')}
        >
          <span className="material-icons-round">chat_bubble</span>
          <span>Чаты</span>
        </button>
        <button 
            className={`nav-item ${view === 'profile' ? 'active' : ''}`}
            onClick={() => setView('profile')}
        >
          <span className="material-icons-round">person</span>
          <span>Профиль</span>
        </button>
      </nav>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
