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
  Trash2,
  Plus,
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
import Modal from './Modal';

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
      admin: ['overview', 'users', 'students', 'courses', 'documents', 'payments', 'library', 'ai', 'settings'],
      professor: ['overview', 'courses', 'library'],
      student: ['overview', 'library'],
      cashier: ['overview', 'payments', 'ai'],
      chef: ['overview', 'students', 'courses', 'documents', 'library', 'ai']
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
    },
    customRoles: [] as { id: string, name: string, permissions: string[] }[]
  });

  const [isCustomRoleModalOpen, setIsCustomRoleModalOpen] = useState(false);
  const [editingCustomRole, setEditingCustomRole] = useState<{ id: string, name: string, permissions: string[] } | null>(null);
  const [newCustomRole, setNewCustomRole] = useState({ name: '', permissions: [] as string[] });

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

  const handleSaveCustomRole = () => {
    if (!newCustomRole.name) return;

    const roleId = editingCustomRole ? editingCustomRole.id : `custom_${Date.now()}`;
    const roleData = {
      id: roleId,
      name: newCustomRole.name,
      permissions: newCustomRole.permissions
    };

    let updatedCustomRoles;
    if (editingCustomRole) {
      updatedCustomRoles = settings.customRoles.map(r => r.id === roleId ? roleData : r);
    } else {
      updatedCustomRoles = [...(settings.customRoles || []), roleData];
    }

    setSettings({
      ...settings,
      customRoles: updatedCustomRoles,
      rolePermissions: {
        ...settings.rolePermissions,
        [roleId]: newCustomRole.permissions
      }
    });

    setIsCustomRoleModalOpen(false);
    setEditingCustomRole(null);
    setNewCustomRole({ name: '', permissions: [] });
  };

  const handleDeleteCustomRole = (roleId: string) => {
    const updatedCustomRoles = settings.customRoles.filter(r => r.id !== roleId);
    const updatedRolePermissions = { ...settings.rolePermissions };
    delete (updatedRolePermissions as any)[roleId];

    setSettings({
      ...settings,
      customRoles: updatedCustomRoles,
      rolePermissions: updatedRolePermissions
    });
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

          {/* Role Permissions Settings - Restricted to Admin and Super Admin */}
          {(user?.role === 'super_admin' || user?.role === 'admin') && (
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
                        {[
                          { id: 'admin', label: 'Admin' },
                          { id: 'professor', label: 'Professeur' },
                          { id: 'student', label: 'Étudiant' },
                          { id: 'cashier', label: 'Caissier' },
                          { id: 'chef', label: 'Chef Dép.' },
                          ...(settings.customRoles || []).map(r => ({ id: r.id, label: r.name }))
                        ].map((roleObj) => (
                          <th key={roleObj.id} className="px-4 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px] text-center">
                            <div className="flex flex-col items-center gap-2">
                              <span>{roleObj.label}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const allFeatures = [
                                    'overview', 'users', 'students', 'courses', 'documents', 
                                    'payments', 'library', 'ai', 'workspace', 'deposit', 'settings'
                                  ];
                                  const currentPerms = settings.rolePermissions?.[roleObj.id as keyof typeof settings.rolePermissions] || [];
                                  const isAllSelected = allFeatures.every(f => currentPerms.includes(f));
                                  
                                  setSettings({
                                    ...settings,
                                    rolePermissions: {
                                      ...settings.rolePermissions,
                                      [roleObj.id]: isAllSelected ? [] : allFeatures
                                    }
                                  });
                                }}
                                className="text-[9px] px-2 py-0.5 bg-white border border-slate-200 rounded hover:bg-slate-50 text-slate-500 transition-colors"
                              >
                                {settings.rolePermissions?.[roleObj.id as keyof typeof settings.rolePermissions]?.length === 11 ? 'Aucun' : 'Tous'}
                              </button>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {[
                        { id: 'overview', name: "Tableau de Bord", desc: "Vue d'ensemble et statistiques", icon: LayoutDashboard },
                        { id: 'institutions', name: "Institutions", desc: "Gestion des institutions SaaS", icon: Building2 },
                        { id: 'users', name: "Utilisateurs", desc: "Gestion des comptes et rôles", icon: Users },
                        { id: 'students', name: "Étudiants", desc: "Inscriptions et dossiers académiques", icon: GraduationCap },
                        { id: 'courses', name: "Cours & Programmes", desc: "Gestion des programmes et contenus", icon: BookOpen },
                        { id: 'documents', name: "Documents & TFC", desc: "Gestion des travaux de fin de cycle", icon: FileText },
                        { id: 'payments', name: "Paiements", desc: "Frais académiques et paiements", icon: Banknote },
                        { id: 'library', name: "Bibliothèque", desc: "Ressources numériques et livres", icon: Library },
                        { id: 'ai', name: "Outils IA", desc: "Assistance par intelligence artificielle", icon: Sparkles },
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
                                <div className="min-w-[150px]">
                                  <p className="font-bold text-slate-700 leading-none mb-1">{feature.name}</p>
                                  <p className="text-[10px] text-slate-400 font-medium">{feature.desc}</p>
                                </div>
                              </div>
                            </td>
                            {[
                              'admin', 'professor', 'student', 'cashier', 'chef',
                              ...(settings.customRoles || []).map(r => r.id)
                            ].map((role) => (
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

                {/* Custom Roles Management Section */}
                {user?.role === 'super_admin' && (
                  <div className="p-6 border-t border-slate-100 bg-slate-50/30">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-indigo-600" />
                          Gestion des Rôles Personnalisés
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">Définissez des rôles spécifiques avec des permissions granulaires pour votre institution.</p>
                      </div>
                      <button
                        onClick={() => {
                          setEditingCustomRole(null);
                          setNewCustomRole({ name: '', permissions: [] });
                          setIsCustomRoleModalOpen(true);
                        }}
                        className="flex items-center gap-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl shadow-sm shadow-indigo-200 transition-all active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                        Nouveau Rôle
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(settings.customRoles || []).map((role) => (
                        <div key={role.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <Users className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 leading-tight">{role.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                  {role.permissions.length} modules actifs
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setEditingCustomRole(role);
                                  setNewCustomRole({ name: role.name, permissions: role.permissions });
                                  setIsCustomRoleModalOpen(true);
                                }}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCustomRole(role.id)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-1.5">
                            {role.permissions.slice(0, 4).map(p => (
                              <span key={p} className="px-2 py-0.5 bg-slate-50 text-[9px] font-bold text-slate-500 rounded-md border border-slate-100 uppercase tracking-tighter">
                                {p}
                              </span>
                            ))}
                            {role.permissions.length > 4 && (
                              <span className="px-2 py-0.5 bg-indigo-50 text-[9px] font-bold text-indigo-600 rounded-md border border-indigo-100 uppercase tracking-tighter">
                                +{role.permissions.length - 4}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      {(!settings.customRoles || settings.customRoles.length === 0) && (
                        <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                            <ShieldCheck className="w-6 h-6" />
                          </div>
                          <p className="text-sm font-bold text-slate-500">Aucun rôle personnalisé</p>
                          <p className="text-xs text-slate-400 mt-1">Commencez par créer un rôle pour définir des accès spécifiques.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
      <Modal
        isOpen={!!editingPlanKey}
        onClose={() => setEditingPlanKey(null)}
        title={`Modifier le Plan: ${editingPlanKey}`}
        maxWidth="max-w-md"
        footer={
          <>
            <button 
              onClick={() => setEditingPlanKey(null)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button 
              onClick={handleUpdatePlan}
              disabled={saving}
              className="px-6 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm hover:shadow-md"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Sauvegarder
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Prix ($/mois)</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</div>
                <input 
                  type="number" 
                  value={editingPlanData?.price || 0}
                  onChange={(e) => setEditingPlanData({...editingPlanData, price: Number(e.target.value)})}
                  className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Limite Étudiants</label>
              <input 
                type="text" 
                value={editingPlanData?.students || ''}
                onChange={(e) => setEditingPlanData({...editingPlanData, students: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                placeholder="Ex: 1000 ou Illimité"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Stockage</label>
              <input 
                type="text" 
                value={editingPlanData?.storage || ''}
                onChange={(e) => setEditingPlanData({...editingPlanData, storage: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                placeholder="Ex: 10GB"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Niveau de Support</label>
              <input 
                type="text" 
                value={editingPlanData?.support || ''}
                onChange={(e) => setEditingPlanData({...editingPlanData, support: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                placeholder="Ex: Prioritaire"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Custom Role Modal */}
      <Modal
        isOpen={isCustomRoleModalOpen}
        onClose={() => setIsCustomRoleModalOpen(false)}
        title={editingCustomRole ? 'Modifier le Rôle' : 'Nouveau Rôle Personnalisé'}
        maxWidth="max-w-lg"
        footer={
          <>
            <button 
              onClick={() => setIsCustomRoleModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button 
              onClick={handleSaveCustomRole}
              className="px-6 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
            >
              <Check className="w-4 h-4" />
              {editingCustomRole ? 'Mettre à jour' : 'Créer le rôle'}
            </button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nom du Rôle</label>
            <input 
              type="text" 
              value={newCustomRole.name}
              onChange={(e) => setNewCustomRole({...newCustomRole, name: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
              placeholder="Ex: Bibliothécaire"
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Permissions du Rôle</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setNewCustomRole({...newCustomRole, permissions: ['overview', 'institutions', 'users', 'students', 'courses', 'documents', 'payments', 'library', 'ai', 'settings']})}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-tighter"
                >
                  Tout cocher
                </button>
                <div className="w-px h-3 bg-slate-200" />
                <button
                  onClick={() => setNewCustomRole({...newCustomRole, permissions: []})}
                  className="text-[10px] font-bold text-slate-400 hover:text-slate-500 uppercase tracking-tighter"
                >
                  Tout décocher
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2.5 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
              {[
                { id: 'overview', name: "Dashboard", icon: LayoutDashboard },
                { id: 'institutions', name: "Institutions", icon: Building2 },
                { id: 'users', name: "Utilisateurs", icon: Users },
                { id: 'students', name: "Étudiants", icon: GraduationCap },
                { id: 'courses', name: "Cours", icon: BookOpen },
                { id: 'documents', name: "Documents", icon: FileText },
                { id: 'payments', name: "Paiements", icon: Banknote },
                { id: 'library', name: "Bibliothèque", icon: Library },
                { id: 'ai', name: "Outils IA", icon: Sparkles },
                { id: 'settings', name: "Paramètres", icon: Settings },
              ].map((feature) => {
                const Icon = feature.icon;
                const isChecked = newCustomRole.permissions.includes(feature.id);
                return (
                  <label 
                    key={feature.id} 
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      isChecked 
                        ? 'bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-100' 
                        : 'bg-white/50 border-transparent hover:border-slate-200'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isChecked ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className={`text-xs font-bold transition-colors ${isChecked ? 'text-slate-800' : 'text-slate-500'}`}>
                        {feature.name}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-indigo-600 rounded-lg border-slate-300 focus:ring-indigo-500 transition-all"
                      checked={isChecked}
                      onChange={(e) => {
                        const perms = e.target.checked
                          ? [...newCustomRole.permissions, feature.id]
                          : newCustomRole.permissions.filter(p => p !== feature.id);
                        setNewCustomRole({...newCustomRole, permissions: perms});
                      }}
                    />
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>

      {/* Institution Management Modal */}
      <Modal
        isOpen={!!editingInstitutionId}
        onClose={() => setEditingInstitutionId(null)}
        title={`Gérer l'Abonnement: ${editingInstitutionData?.name}`}
        maxWidth="max-w-2xl"
        footer={
          <>
            <button 
              onClick={() => setEditingInstitutionId(null)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button 
              onClick={handleUpdateInstitution}
              disabled={saving}
              className="px-6 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm hover:shadow-md"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Mettre à jour
            </button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Plan de l'Institution</label>
              <select 
                value={editingInstitutionData?.plan || 'basic'}
                onChange={(e) => setEditingInstitutionData({...editingInstitutionData, plan: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all appearance-none"
              >
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Statut du Compte</label>
              <select 
                value={editingInstitutionData?.status || 'trial'}
                onChange={(e) => setEditingInstitutionData({...editingInstitutionData, status: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all appearance-none"
              >
                <option value="active">Actif</option>
                <option value="suspended">Suspendu</option>
                <option value="trial">En essai</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              <strong>Attention:</strong> La suspension d'une institution bloquera l'accès à tous ses utilisateurs. Le changement de plan affectera immédiatement les limites de stockage et d'étudiants.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Permissions par Rôle</h4>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase">Configuration Directe</span>
            </div>
            
            <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/30">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Module</th>
                      {['admin', 'professor', 'student', 'cashier', 'chef'].map((role) => (
                        <th key={role} className="px-2 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                          {role === 'admin' ? 'Adm' : role === 'professor' ? 'Prof' : role === 'student' ? 'Etud' : role === 'cashier' ? 'Caiss' : 'Chef'}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { id: 'overview', name: "Dashboard" },
                      { id: 'users', name: "Utilisateurs" },
                      { id: 'students', name: "Étudiants" },
                      { id: 'courses', name: "Cours & Programmes" },
                      { id: 'documents', name: "Documents" },
                      { id: 'payments', name: "Finances" },
                      { id: 'library', name: "Bibliothèque" },
                      { id: 'ai', name: "Outils IA" },
                      { id: 'settings', name: "Paramètres" },
                    ].map((feature) => (
                      <tr key={feature.id} className="hover:bg-white transition-colors">
                        <td className="px-4 py-2.5 text-xs font-bold text-slate-700">{feature.name}</td>
                        {['admin', 'professor', 'student', 'cashier', 'chef'].map((role) => {
                          const isSettingsAdmin = role === 'admin' && feature.id === 'settings';
                          const isChecked = isSettingsAdmin ? true : editingInstitutionData?.settings?.rolePermissions?.[role]?.includes(feature.id);
                          
                          return (
                            <td key={role} className="px-2 py-2.5 text-center">
                              <input
                                type="checkbox"
                                className="w-4 h-4 text-indigo-600 rounded-lg border-slate-300 focus:ring-indigo-500 transition-all cursor-pointer disabled:opacity-50"
                                checked={isChecked}
                                disabled={isSettingsAdmin}
                                onChange={(e) => {
                                  if (isSettingsAdmin) return;
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
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
