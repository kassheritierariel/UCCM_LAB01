import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { 
  Settings, 
  CreditCard, 
  Smartphone, 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  Building2, 
  Palette, 
  MapPin, 
  Phone, 
  Image as ImageIcon, 
  Loader2, 
  Wand2, 
  ShieldCheck,
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  Banknote,
  Library,
  Sparkles,
  Briefcase,
  Upload,
  Edit,
  X,
  Check
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

export default function SettingsManager() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingLogo, setGeneratingLogo] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // SaaS Subscription Management (for Super Admin)
  const [allInstitutions, setAllInstitutions] = useState<any[]>([]);
  const [saasPlans, setSaasPlans] = useState<Record<string, any>>({
    basic: { price: 49, students: 100, storage: '1GB', support: 'Standard' },
    pro: { price: 149, students: 1000, storage: '10GB', support: 'Prioritaire' },
    enterprise: { price: 499, students: 'Illimité', storage: '100GB', support: 'Dédié' }
  });
  const [editingPlanKey, setEditingPlanKey] = useState<string | null>(null);
  const [editingPlanData, setEditingPlanData] = useState<any>(null);
  const [editingInstitutionId, setEditingInstitutionId] = useState<string | null>(null);
  const [editingInstitutionData, setEditingInstitutionData] = useState<any>(null);

  const [institutionName, setInstitutionName] = useState('UniversitySolution');
  const [settings, setSettings] = useState({
    address: '',
    phone: '',
    logoUrl: '',
    primaryColor: '#4f46e5', // Default indigo-600
    rolePermissions: {
      admin: ['overview', 'users', 'students', 'documents', 'payments', 'library', 'ai', 'settings', 'courses'],
      professor: ['overview', 'students', 'documents', 'library', 'ai', 'courses'],
      student: ['overview', 'payments', 'library', 'ai', 'workspace', 'deposit'],
      cashier: ['overview', 'payments'],
      chef: ['overview', 'students', 'documents', 'courses']
    },
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

  useEffect(() => {
    if (user?.role !== 'super_admin') return;

    const fetchAllInstitutions = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'institutions'));
        const insts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAllInstitutions(insts);
      } catch (error) {
        console.error("Error fetching all institutions:", error);
      }
    };

    const fetchSaasPlans = async () => {
      try {
        const docRef = doc(db, 'config', 'saas');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSaasPlans(docSnap.data().plans || saasPlans);
        }
      } catch (error) {
        console.error("Error fetching SaaS plans:", error);
      }
    };

    fetchAllInstitutions();
    fetchSaasPlans();
  }, [user]);

  const handleUpdatePlan = async () => {
    if (!editingPlanKey || !editingPlanData) return;
    
    setSaving(true);
    try {
      const newPlans = { ...saasPlans, [editingPlanKey]: editingPlanData };
      await setDoc(doc(db, 'config', 'saas'), { plans: newPlans }, { merge: true });
      setSaasPlans(newPlans);
      setEditingPlanKey(null);
      setMessage({ type: 'success', text: `Plan ${editingPlanKey} mis à jour.` });
    } catch (error) {
      console.error("Error updating plan:", error);
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour du plan.' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateInstitution = async () => {
    if (!editingInstitutionId || !editingInstitutionData) return;
    
    setSaving(true);
    try {
      const docRef = doc(db, 'institutions', editingInstitutionId);
      await updateDoc(docRef, {
        plan: editingInstitutionData.plan,
        status: editingInstitutionData.status,
        settings: editingInstitutionData.settings || {}
      });
      
      setAllInstitutions(prev => prev.map(inst => 
        inst.id === editingInstitutionId 
          ? { ...inst, plan: editingInstitutionData.plan, status: editingInstitutionData.status, settings: editingInstitutionData.settings }
          : inst
      ));
      
      setEditingInstitutionId(null);
      setMessage({ type: 'success', text: 'Institution mise à jour avec succès.' });
    } catch (error) {
      console.error("Error updating institution:", error);
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour de l\'institution.' });
    } finally {
      setSaving(false);
    }
  };

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

  const handleGenerateLogo = async () => {
    setGeneratingLogo(true);
    setMessage(null);
    try {
      if (typeof window !== 'undefined' && window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await window.aistudio.openSelectKey();
        }
      }
      
      const apiKey = (typeof process !== 'undefined' && process.env?.API_KEY) || import.meta.env.VITE_GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey });
      
      const res = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: { parts: [{ text: `Un logo professionnel, moderne et minimaliste pour une institution éducative nommée "${institutionName || 'UniversitySolution'}". Style vectoriel, design plat, palette de couleurs basée sur l'indigo (#4f46e5) et l'émeraude (#10b981). Fond blanc, sans aucun texte, avec un symbole iconique représentant l'excellence académique et la technologie.` }] },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
          }
        }
      });

      let foundImage = false;
      for (const part of res.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          setSettings(prev => ({ ...prev, logoUrl: imageUrl }));
          setMessage({ type: 'success', text: 'Logo généré avec succès ! N\'oubliez pas d\'enregistrer.' });
          foundImage = true;
          break;
        }
      }
      
      if (!foundImage) {
        setMessage({ type: 'error', text: "Aucune image n'a été générée." });
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('Requested entity was not found')) {
        setMessage({ type: 'error', text: "Veuillez sélectionner une clé API valide et réessayer." });
        if (window.aistudio) window.aistudio.openSelectKey();
      } else {
        setMessage({ type: 'error', text: err.message || "Erreur lors de la génération du logo." });
      }
    } finally {
      setGeneratingLogo(false);
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
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-slate-400" />
                      Logo de l'Institution
                    </span>
                    <button
                      onClick={handleGenerateLogo}
                      disabled={generatingLogo}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 disabled:opacity-50"
                    >
                      {generatingLogo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                      Générer avec l'IA
                    </button>
                  </label>
                  <div className="flex items-start gap-4 mt-3">
                    <div 
                      onClick={handleGenerateLogo}
                      className="w-16 h-16 rounded-xl border-2 border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-500 transition-colors shrink-0 group relative"
                      title="Générer un nouveau logo"
                    >
                      {settings.logoUrl ? (
                        <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                      )}
                      {generatingLogo && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <input 
                        type="url" 
                        value={settings.logoUrl || ''}
                        onChange={(e) => setSettings({...settings, logoUrl: e.target.value})}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="URL de l'image (https://...)"
                      />
                      <p className="text-xs text-slate-500 mt-1">Cliquez sur l'aperçu pour générer avec l'IA.</p>
                    </div>
                  </div>
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

          {/* Role Permissions Settings - Restricted to Super Admin */}
          {user?.role === 'super_admin' && (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Gestion des Rôles & Permissions</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Contrôle d'accès aux fonctionnalités</p>
                  </div>
                </div>
              </div>
              <div className="p-0 bg-white">
                <div className="p-4 bg-amber-50 border-b border-amber-100 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800">
                    <p className="font-bold mb-0.5">Configuration de l'Institution</p>
                    <p>Ces réglages définissent la visibilité des modules pour chaque rôle. Les administrateurs conservent toujours l'accès aux paramètres critiques.</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Module / Fonctionnalité</th>
                        {['admin', 'professor', 'student', 'cashier', 'chef'].map((role) => (
                          <th key={role} className="px-4 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px] text-center">
                            <div className="flex flex-col items-center gap-2">
                              <span>{role === 'admin' ? 'Admin' : role === 'professor' ? 'Professeur' : role === 'student' ? 'Étudiant' : role === 'cashier' ? 'Caissier' : 'Chef Dép.'}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const allFeatures = [
                                    'overview', 'users', 'students', 'courses', 'documents', 
                                    'payments', 'library', 'ai', 'workspace', 'deposit', 'settings'
                                  ];
                                  const currentPerms = settings.rolePermissions?.[role as keyof typeof settings.rolePermissions] || [];
                                  const isAllSelected = allFeatures.every(f => currentPerms.includes(f));
                                  
                                  setSettings({
                                    ...settings,
                                    rolePermissions: {
                                      ...settings.rolePermissions,
                                      [role]: isAllSelected ? [] : allFeatures
                                    }
                                  });
                                }}
                                className="text-[9px] px-2 py-0.5 bg-white border border-slate-200 rounded hover:bg-slate-50 text-slate-500 transition-colors"
                              >
                                {settings.rolePermissions?.[role as keyof typeof settings.rolePermissions]?.length === 11 ? 'Aucun' : 'Tous'}
                              </button>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {[
                        { id: 'overview', name: "Tableau de Bord", desc: "Vue d'ensemble et statistiques", icon: LayoutDashboard },
                        { id: 'users', name: "Utilisateurs", desc: "Gestion des comptes et rôles", icon: Users },
                        { id: 'students', name: "Étudiants", desc: "Inscriptions et dossiers académiques", icon: GraduationCap },
                        { id: 'courses', name: "Cours", desc: "Gestion des programmes et contenus", icon: BookOpen },
                        { id: 'documents', name: "Documents & TFC", desc: "Gestion des travaux de fin de cycle", icon: FileText },
                        { id: 'payments', name: "Finances", desc: "Frais académiques et paiements", icon: Banknote },
                        { id: 'library', name: "Bibliothèque", desc: "Ressources numériques et livres", icon: Library },
                        { id: 'ai', name: "Outils IA", desc: "Assistance par intelligence artificielle", icon: Sparkles },
                        { id: 'workspace', name: "Espace Travail", desc: "Outils collaboratifs et personnels", icon: Briefcase },
                        { id: 'deposit', name: "Dépôt", desc: "Soumission de documents par les étudiants", icon: Upload },
                        { id: 'settings', name: "Paramètres", desc: "Configuration de l'institution", icon: Settings },
                      ].map((feature) => {
                        const FeatureIcon = feature.icon;
                        return (
                          <tr key={feature.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
                                  <FeatureIcon className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-700 leading-none mb-1">{feature.name}</p>
                                  <p className="text-[10px] text-slate-400 font-medium">{feature.desc}</p>
                                </div>
                              </div>
                            </td>
                            {['admin', 'professor', 'student', 'cashier', 'chef'].map((role) => (
                              <td key={role} className="px-4 py-4 text-center">
                                <label className={`relative inline-flex items-center ${role === 'admin' && feature.id === 'settings' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                                  <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={role === 'admin' && feature.id === 'settings' ? true : settings.rolePermissions?.[role as keyof typeof settings.rolePermissions]?.includes(feature.id)}
                                    disabled={role === 'admin' && feature.id === 'settings'}
                                    onChange={(e) => {
                                      if (role === 'admin' && feature.id === 'settings') return;
                                      const currentPerms = settings.rolePermissions?.[role as keyof typeof settings.rolePermissions] || [];
                                      const newPerms = e.target.checked
                                        ? [...currentPerms, feature.id]
                                        : currentPerms.filter(p => p !== feature.id);
                                      
                                      setSettings({
                                        ...settings,
                                        rolePermissions: {
                                          ...settings.rolePermissions,
                                          [role]: newPerms
                                        }
                                      });
                                    }}
                                  />
                                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Security Settings */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-slate-600" />
              <h3 className="font-bold text-slate-800">Sécurité Avancée</h3>
            </div>
            <div className="p-4 space-y-6 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Authentification à deux facteurs (2FA)</h4>
                  <p className="text-xs text-slate-500">Ajoutez une couche de sécurité supplémentaire à votre compte.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Journaux d'Audit (Logs)</h4>
                  <p className="text-xs text-slate-500">Suivez toutes les actions critiques effectuées par les administrateurs.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Restriction par IP</h4>
                  <p className="text-xs text-slate-500">Limitez l'accès au panneau d'administration à des adresses IP spécifiques.</p>
                </div>
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-[10px] font-bold rounded uppercase tracking-wider">Enterprise</span>
              </div>
            </div>
          </div>

          {/* SaaS Subscription Management (Super Admin ONLY) */}
          {user?.role === 'super_admin' && (
            <div className="border border-indigo-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-indigo-900">Gestion des Abonnements SaaS</h3>
                </div>
                <span className="px-2 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded uppercase tracking-wider">Super Admin</span>
              </div>
              <div className="p-6 bg-white space-y-8">
                {/* Plans Configuration */}
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-slate-400" />
                    Configuration des Plans
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(saasPlans).map(([key, plan]) => (
                      <div key={key} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{key}</span>
                          <span className="text-lg font-bold text-indigo-600">${plan.price}<span className="text-[10px] text-slate-400 font-normal">/mois</span></span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Étudiants</span>
                            <span className="font-semibold text-slate-700">{plan.students}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Stockage</span>
                            <span className="font-semibold text-slate-700">{plan.storage}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Support</span>
                            <span className="font-semibold text-slate-700">{plan.support}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setEditingPlanKey(key);
                            setEditingPlanData({ ...plan });
                          }}
                          className="w-full mt-4 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                        >
                          Modifier le plan
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Institutions Status */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      Statut des Institutions Clientes
                    </h4>
                    <div className="bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-amber-600" />
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                        Paiements M-Pesa: +243 818 261 297
                      </span>
                    </div>
                  </div>
                  <div className="overflow-x-auto border border-slate-100 rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Institution</th>
                          <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Plan</th>
                          <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Statut</th>
                          <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {allInstitutions.map((inst) => (
                          <tr key={inst.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-700">{inst.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{inst.domain}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                inst.plan === 'enterprise' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                inst.plan === 'pro' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                'bg-slate-50 text-slate-600 border-slate-100'
                              }`}>
                                {inst.plan || 'basic'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                inst.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                inst.status === 'suspended' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                'bg-amber-50 text-amber-600 border-amber-100'
                              }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                  inst.status === 'active' ? 'bg-emerald-500' :
                                  inst.status === 'suspended' ? 'bg-rose-500' :
                                  'bg-amber-500'
                                }`} />
                                {inst.status === 'active' ? 'Actif' : inst.status === 'suspended' ? 'Suspendu' : 'En essai'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button 
                                onClick={() => {
                                  setEditingInstitutionId(inst.id);
                                  setEditingInstitutionData({ ...inst });
                                }}
                                className="text-indigo-600 hover:underline font-medium"
                              >
                                Gérer
                              </button>
                            </td>
                          </tr>
                        ))}
                        {allInstitutions.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">
                              Aucune institution cliente trouvée.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
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

      {/* Plan Editing Modal */}
      {editingPlanKey && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider">Modifier le Plan: {editingPlanKey}</h3>
              <button onClick={() => setEditingPlanKey(null)} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Prix ($/mois)</label>
                <input 
                  type="number" 
                  value={editingPlanData.price}
                  onChange={(e) => setEditingPlanData({...editingPlanData, price: Number(e.target.value)})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Limite Étudiants</label>
                <input 
                  type="text" 
                  value={editingPlanData.students}
                  onChange={(e) => setEditingPlanData({...editingPlanData, students: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Stockage</label>
                <input 
                  type="text" 
                  value={editingPlanData.storage}
                  onChange={(e) => setEditingPlanData({...editingPlanData, storage: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Niveau de Support</label>
                <input 
                  type="text" 
                  value={editingPlanData.support}
                  onChange={(e) => setEditingPlanData({...editingPlanData, support: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setEditingPlanKey(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={handleUpdatePlan}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Institution Management Modal */}
      {editingInstitutionId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800">Gérer l'Abonnement: {editingInstitutionData.name}</h3>
              <button onClick={() => setEditingInstitutionId(null)} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Plan de l'Institution</label>
                <select 
                  value={editingInstitutionData.plan || 'basic'}
                  onChange={(e) => setEditingInstitutionData({...editingInstitutionData, plan: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Statut du Compte</label>
                <select 
                  value={editingInstitutionData.status || 'trial'}
                  onChange={(e) => setEditingInstitutionData({...editingInstitutionData, status: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="active">Actif</option>
                  <option value="suspended">Suspendu</option>
                  <option value="trial">En essai</option>
                </select>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <p className="text-[10px] text-amber-800 leading-relaxed">
                  <strong>Note:</strong> La suspension d'une institution bloquera l'accès à tous ses utilisateurs. Le changement de plan affectera immédiatement les limites de stockage et d'étudiants.
                </p>
              </div>

              {/* Role Permissions in Modal */}
              <div className="border border-slate-200 rounded-xl overflow-hidden mt-4">
                <div className="bg-slate-50 p-3 border-b border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Permissions par Rôle</h4>
                </div>
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-[10px] text-left border-collapse">
                    <thead className="sticky top-0 bg-white z-10">
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-3 py-2 font-bold text-slate-500 uppercase">Module</th>
                        {['admin', 'professor', 'student', 'cashier', 'chef'].map((role) => (
                          <th key={role} className="px-2 py-2 font-bold text-slate-500 uppercase text-center">
                            {role === 'admin' ? 'Adm' : role === 'professor' ? 'Prof' : role === 'student' ? 'Etud' : role === 'cashier' ? 'Caiss' : 'Chef'}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {[
                        { id: 'overview', name: "Dashboard" },
                        { id: 'users', name: "Users" },
                        { id: 'students', name: "Students" },
                        { id: 'courses', name: "Courses" },
                        { id: 'documents', name: "Docs" },
                        { id: 'payments', name: "Finances" },
                        { id: 'library', name: "Library" },
                        { id: 'ai', name: "AI Tools" },
                        { id: 'workspace', name: "Workspace" },
                        { id: 'deposit', name: "Deposit" },
                        { id: 'settings', name: "Settings" },
                      ].map((feature) => (
                        <tr key={feature.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2 font-medium text-slate-700">{feature.name}</td>
                          {['admin', 'professor', 'student', 'cashier', 'chef'].map((role) => (
                            <td key={role} className="px-2 py-2 text-center">
                              <input
                                type="checkbox"
                                className="w-3 h-3 text-indigo-600 rounded focus:ring-indigo-500"
                                checked={role === 'admin' && feature.id === 'settings' ? true : editingInstitutionData.settings?.rolePermissions?.[role]?.includes(feature.id)}
                                disabled={role === 'admin' && feature.id === 'settings'}
                                onChange={(e) => {
                                  if (role === 'admin' && feature.id === 'settings') return;
                                  const currentSettings = editingInstitutionData.settings || {};
                                  const currentRolePerms = currentSettings.rolePermissions || {};
                                  const currentPerms = currentRolePerms[role] || [];
                                  
                                  const newPerms = e.target.checked
                                    ? [...currentPerms, feature.id]
                                    : currentPerms.filter((p: string) => p !== feature.id);
                                  
                                  setEditingInstitutionData({
                                    ...editingInstitutionData,
                                    settings: {
                                      ...currentSettings,
                                      rolePermissions: {
                                        ...currentRolePerms,
                                        [role]: newPerms
                                      }
                                    }
                                  });
                                }}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setEditingInstitutionId(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={handleUpdateInstitution}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Mettre à jour
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
