import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, addDoc, serverTimestamp, getDocs, where } from 'firebase/firestore';
import { 
  Building2, Search, Filter, Plus, Edit2, ShieldCheck, 
  Activity, Users, CreditCard, X, CheckCircle, XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Institution {
  id: string;
  name: string;
  domain: string;
  plan: 'basic' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'trial';
  contactEmail: string;
  createdAt: any;
  usersCount?: number;
  settings?: {
    address?: string;
    phone?: string;
    logoUrl?: string;
    primaryColor?: string;
  };
}

const planConfig = {
  basic: { label: 'Basic', color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' },
  pro: { label: 'Pro', color: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-200' },
  enterprise: { label: 'Enterprise', color: 'text-purple-700', bg: 'bg-purple-100', border: 'border-purple-200' },
};

const statusConfig = {
  active: { label: 'Actif', icon: CheckCircle, color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200' },
  suspended: { label: 'Suspendu', icon: XCircle, color: 'text-rose-700', bg: 'bg-rose-100', border: 'border-rose-200' },
  trial: { label: 'Essai', icon: Activity, color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-200' },
};

export default function InstitutionsManager() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingInst, setEditingInst] = useState<Institution | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    plan: 'pro',
    status: 'active',
    contactEmail: '',
    address: '',
    phone: '',
    logoUrl: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'institutions'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Institution[];
      setInstitutions(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredInstitutions = institutions.filter(i => 
    i.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.domain?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.domain) return;

    setIsSubmitting(true);
    try {
      const institutionData = {
        name: formData.name,
        domain: formData.domain,
        plan: formData.plan,
        status: formData.status,
        contactEmail: formData.contactEmail,
        settings: {
          address: formData.address,
          phone: formData.phone,
          logoUrl: formData.logoUrl,
        }
      };

      let instId = editingInst?.id;

      if (editingInst) {
        await updateDoc(doc(db, 'institutions', editingInst.id), {
          ...institutionData,
          updatedAt: serverTimestamp()
        });
      } else {
        const docRef = await addDoc(collection(db, 'institutions'), {
          ...institutionData,
          usersCount: 0,
          createdAt: serverTimestamp()
        });
        instId = docRef.id;
      }

      // If an admin email is provided, check if the user exists and update their role/tenant
      if (formData.contactEmail && instId) {
        try {
          const userQuery = query(collection(db, 'users'), where('email', '==', formData.contactEmail));
          const userSnapshot = await getDocs(userQuery);
          
          if (!userSnapshot.empty) {
            const userDoc = userSnapshot.docs[0];
            // Only update if they are not already an admin for this tenant
            if (userDoc.data().role !== 'admin' || userDoc.data().tenantId !== instId) {
              await updateDoc(doc(db, 'users', userDoc.id), {
                role: 'admin',
                tenantId: instId,
                tenantName: formData.name
              });
            }
          }
        } catch (err) {
          console.error("Erreur lors de la mise à jour de l'utilisateur admin:", err);
        }
      }

      closeModal();
    } catch (error) {
      console.error("Erreur:", error);
      // In a real app, show a toast notification
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (inst: Institution) => {
    setEditingInst(inst);
    setFormData({
      name: inst.name,
      domain: inst.domain,
      plan: inst.plan,
      status: inst.status,
      contactEmail: inst.contactEmail || '',
      address: inst.settings?.address || '',
      phone: inst.settings?.phone || '',
      logoUrl: inst.settings?.logoUrl || ''
    });
    setIsAddModalOpen(true);
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingInst(null);
    setFormData({ name: '', domain: '', plan: 'pro', status: 'active', contactEmail: '', address: '', phone: '', logoUrl: '' });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Gestion des Institutions (SaaS)</h2>
            <p className="text-sm text-slate-500 mt-1">Gérez les universités clientes de la plateforme.</p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
          >
            <Plus className="w-5 h-5" />
            Nouvelle Institution
          </button>
        </div>
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-2xl shadow-sm text-white flex items-center justify-between">
          <div>
            <p className="text-indigo-100 text-sm font-medium uppercase tracking-wider mb-1">Total Clients</p>
            <h3 className="text-4xl font-bold">{institutions.length}</h3>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Building2 className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Rechercher une institution ou un domaine..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
        />
      </div>

      {/* Institutions List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="px-6 py-4">Institution</th>
                <th className="px-6 py-4">Plan SaaS</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4">Création</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                      Chargement des institutions...
                    </div>
                  </td>
                </tr>
              ) : filteredInstitutions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Building2 className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-base font-medium text-slate-700">Aucune institution trouvée</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInstitutions.map((inst) => {
                  const planInfo = planConfig[inst.plan] || planConfig.basic;
                  const statusInfo = statusConfig[inst.status] || statusConfig.active;
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <tr key={inst.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                            <Building2 className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-800">{inst.name}</div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">{inst.domain}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${planInfo.bg} ${planInfo.color} ${planInfo.border}`}>
                          {planInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {inst.createdAt ? format(inst.createdAt.toDate(), 'dd MMM yyyy', { locale: fr }) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => openEditModal(inst)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h3 className="text-lg font-bold text-slate-800">
                {editingInst ? 'Modifier l\'institution' : 'Nouvelle Institution'}
              </h3>
              <button 
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Nom de l'institution *</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="Ex: Université de Kinshasa"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Domaine (Tenant ID) *</label>
                <input 
                  type="text" 
                  required
                  value={formData.domain}
                  onChange={(e) => setFormData({...formData, domain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono"
                  placeholder="ex: unikin"
                />
                <p className="text-[10px] text-slate-400 mt-1">Identifiant unique utilisé pour l'URL (ex: unikin.saas.edu)</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Email de contact (Admin)</label>
                <input 
                  type="email" 
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="admin@univ.edu"
                />
                <p className="text-[10px] text-slate-400 mt-1">Cet email deviendra automatiquement Administrateur lors de sa première connexion.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Adresse</label>
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="Adresse de l'institution"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Téléphone</label>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="+243..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">URL du Logo</label>
                  <input 
                    type="url" 
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({...formData, logoUrl: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Plan SaaS</label>
                  <select 
                    value={formData.plan}
                    onChange={(e) => setFormData({...formData, plan: e.target.value as any})}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Statut</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value="active">Actif</option>
                    <option value="trial">En essai</option>
                    <option value="suspended">Suspendu</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-70 flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Enregistrer'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
