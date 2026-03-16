import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { Settings, CreditCard, Smartphone, Save, AlertCircle, CheckCircle2, Building2, Palette, MapPin, Phone, Image as ImageIcon } from 'lucide-react';

export default function SettingsManager() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [institutionName, setInstitutionName] = useState('');
  const [settings, setSettings] = useState({
    address: '',
    phone: '',
    logoUrl: '',
    primaryColor: '#4f46e5', // Default indigo-600
    paymentMethods: {
      mobileMoney: {
        enabled: false,
        provider: 'mpesa',
        merchantId: '',
        apiKey: ''
      },
      creditCard: {
        enabled: false,
        provider: 'stripe',
        publicKey: '',
        secretKey: ''
      }
    }
  });

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user?.tenantId) return;
      
      try {
        const docRef = doc(db, 'institutions', user.tenantId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setInstitutionName(data.name || '');
          if (data.settings) {
            // Merge existing settings with default structure to avoid undefined errors
            setSettings(prev => ({
              ...prev,
              ...data.settings
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  const handleSave = async () => {
    if (!user?.tenantId) return;
    
    setSaving(true);
    setMessage(null);
    
    try {
      const docRef = doc(db, 'institutions', user.tenantId);
      await updateDoc(docRef, {
        name: institutionName,
        settings: settings
      });
      setMessage({ type: 'success', text: 'Paramètres sauvegardés avec succès.' });
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde des paramètres.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Paramètres de l'Institution</h2>
            <p className="text-sm text-slate-500">Configurez les méthodes de paiement et autres options.</p>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Identité de l'Institution */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center gap-3">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-800">Identité & Coordonnées</h3>
            </div>
            <div className="p-4 space-y-4 bg-white">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom de l'Institution</label>
                <input 
                  type="text" 
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ex: Université de Kinshasa"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    Adresse
                  </label>
                  <input 
                    type="text" 
                    value={settings.address || ''}
                    onChange={(e) => setSettings({...settings, address: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Adresse complète"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    Téléphone
                  </label>
                  <input 
                    type="text" 
                    value={settings.phone || ''}
                    onChange={(e) => setSettings({...settings, phone: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="+243..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-slate-400" />
                    URL du Logo
                  </label>
                  <input 
                    type="url" 
                    value={settings.logoUrl || ''}
                    onChange={(e) => setSettings({...settings, logoUrl: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-slate-400" />
                    Couleur Principale
                  </label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={settings.primaryColor || '#4f46e5'}
                      onChange={(e) => setSettings({...settings, primaryColor: e.target.value})}
                      className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                    />
                    <input 
                      type="text" 
                      value={settings.primaryColor || '#4f46e5'}
                      onChange={(e) => setSettings({...settings, primaryColor: e.target.value})}
                      className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Money Settings */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800">Mobile Money</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={settings.paymentMethods.mobileMoney.enabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    paymentMethods: {
                      ...settings.paymentMethods,
                      mobileMoney: {
                        ...settings.paymentMethods.mobileMoney,
                        enabled: e.target.checked
                      }
                    }
                  })}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {settings.paymentMethods.mobileMoney.enabled && (
              <div className="p-4 space-y-4 bg-white">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fournisseur</label>
                  <select 
                    value={settings.paymentMethods.mobileMoney.provider}
                    onChange={(e) => setSettings({
                      ...settings,
                      paymentMethods: {
                        ...settings.paymentMethods,
                        mobileMoney: {
                          ...settings.paymentMethods.mobileMoney,
                          provider: e.target.value
                        }
                      }
                    })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="mpesa">M-Pesa</option>
                    <option value="airtel">Airtel Money</option>
                    <option value="orange">Orange Money</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Merchant ID</label>
                  <input 
                    type="text" 
                    value={settings.paymentMethods.mobileMoney.merchantId}
                    onChange={(e) => setSettings({
                      ...settings,
                      paymentMethods: {
                        ...settings.paymentMethods,
                        mobileMoney: {
                          ...settings.paymentMethods.mobileMoney,
                          merchantId: e.target.value
                        }
                      }
                    })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ex: 123456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Clé API (Secrète)</label>
                  <input 
                    type="password" 
                    value={settings.paymentMethods.mobileMoney.apiKey}
                    onChange={(e) => setSettings({
                      ...settings,
                      paymentMethods: {
                        ...settings.paymentMethods,
                        mobileMoney: {
                          ...settings.paymentMethods.mobileMoney,
                          apiKey: e.target.value
                        }
                      }
                    })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="••••••••••••••••"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Credit Card Settings */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800">Carte Bancaire</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={settings.paymentMethods.creditCard.enabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    paymentMethods: {
                      ...settings.paymentMethods,
                      creditCard: {
                        ...settings.paymentMethods.creditCard,
                        enabled: e.target.checked
                      }
                    }
                  })}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
            
            {settings.paymentMethods.creditCard.enabled && (
              <div className="p-4 space-y-4 bg-white">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fournisseur</label>
                  <select 
                    value={settings.paymentMethods.creditCard.provider}
                    onChange={(e) => setSettings({
                      ...settings,
                      paymentMethods: {
                        ...settings.paymentMethods,
                        creditCard: {
                          ...settings.paymentMethods.creditCard,
                          provider: e.target.value
                        }
                      }
                    })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="stripe">Stripe</option>
                    <option value="paystack">Paystack</option>
                    <option value="flutterwave">Flutterwave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Clé Publique</label>
                  <input 
                    type="text" 
                    value={settings.paymentMethods.creditCard.publicKey}
                    onChange={(e) => setSettings({
                      ...settings,
                      paymentMethods: {
                        ...settings.paymentMethods,
                        creditCard: {
                          ...settings.paymentMethods.creditCard,
                          publicKey: e.target.value
                        }
                      }
                    })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="pk_test_..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Clé Secrète</label>
                  <input 
                    type="password" 
                    value={settings.paymentMethods.creditCard.secretKey}
                    onChange={(e) => setSettings({
                      ...settings,
                      paymentMethods: {
                        ...settings.paymentMethods,
                        creditCard: {
                          ...settings.paymentMethods.creditCard,
                          secretKey: e.target.value
                        }
                      }
                    })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="sk_test_..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-70"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Save className="w-5 h-5" />
            )}
            Enregistrer les paramètres
          </button>
        </div>
      </div>
    </div>
  );
}
