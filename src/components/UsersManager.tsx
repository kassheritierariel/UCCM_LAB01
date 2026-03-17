import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, deleteDoc, where, getDoc } from 'firebase/firestore';
import { 
  Search, Filter, Edit2, Trash2, ShieldCheck, GraduationCap, 
  Briefcase, Award, Calculator, X, Plus, AlertCircle, MoreHorizontal,
  Mail, Calendar, ChevronUp, ChevronDown, FileBadge, Printer, Building2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '../AuthContext';
import { QRCodeSVG } from 'qrcode.react';

interface User {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: 'student' | 'professor' | 'admin' | 'cashier' | 'chef' | 'super_admin';
  faculty?: string;
  promotion?: string;
  matricule?: string;
  tenantId?: string;
  createdAt: any;
}

const roleConfig = {
  super_admin: { label: 'Super Admin', icon: ShieldCheck, color: 'text-indigo-700', bg: 'bg-indigo-100', border: 'border-indigo-200' },
  admin: { label: 'Administrateur', icon: ShieldCheck, color: 'text-purple-700', bg: 'bg-purple-100', border: 'border-purple-200' },
  student: { label: 'Étudiant', icon: GraduationCap, color: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-200' },
  professor: { label: 'Professeur', icon: Briefcase, color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200' },
  cashier: { label: 'Caissier', icon: Calculator, color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-200' },
  chef: { label: 'Chef de Dép.', icon: Award, color: 'text-rose-700', bg: 'bg-rose-100', border: 'border-rose-200' },
};

export default function UsersManager() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isAddInfoOpen, setIsAddInfoOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [generatingIdFor, setGeneratingIdFor] = useState<User | null>(null);
  const [institutionData, setInstitutionData] = useState<{name: string, logoUrl: string, address: string, primaryColor: string} | null>(null);

  useEffect(() => {
    if (!user?.tenantId || user.tenantId === 'SYSTEM') return;
    
    const fetchInstitution = async () => {
      try {
        const docRef = doc(db, 'institutions', user.tenantId!);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setInstitutionData({
            name: data.name || 'Université',
            logoUrl: data.settings?.logoUrl || '',
            address: data.settings?.address || 'Adresse non définie',
            primaryColor: data.settings?.primaryColor || '#2563eb'
          });
        }
      } catch (error) {
        console.error("Error fetching institution data:", error);
      }
    };
    
    fetchInstitution();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    let q;
    if (user.role === 'super_admin') {
      q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    } else {
      q = query(collection(db, 'users'), where('tenantId', '==', user.tenantId), orderBy('createdAt', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const filteredUsers = users.filter(u => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = u.name?.toLowerCase().includes(searchLower) || 
                          u.email?.toLowerCase().includes(searchLower) ||
                          u.matricule?.toLowerCase().includes(searchLower) ||
                          roleConfig[u.role]?.label.toLowerCase().includes(searchLower);
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortConfig) return 0;
    
    const { key, direction } = sortConfig;
    let aValue: any = a[key as keyof User];
    let bValue: any = b[key as keyof User];

    if (key === 'createdAt') {
      aValue = a.createdAt?.toMillis?.() || a.createdAt?.seconds || 0;
      bValue = b.createdAt?.toMillis?.() || b.createdAt?.seconds || 0;
    } else if (key === 'role') {
      aValue = (roleConfig[a.role as keyof typeof roleConfig]?.label || a.role).toLowerCase();
      bValue = (roleConfig[b.role as keyof typeof roleConfig]?.label || b.role).toLowerCase();
    } else if (key === 'name' || key === 'email' || key === 'id') {
      aValue = (aValue || '').toString().toLowerCase();
      bValue = (bValue || '').toString().toLowerCase();
    }

    if (aValue < bValue) {
      return direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key !== columnKey) {
      return <ChevronDown className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-500" />
      : <ChevronDown className="w-4 h-4 text-blue-500" />;
  };

  const handleDelete = async (userId: string, userName: string) => {
    // In a real app, use a custom modal instead of window.confirm
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      // In a real app, show a toast notification
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', editingUser.id);
      await updateDoc(userRef, {
        role: editingUser.role,
        faculty: editingUser.faculty || null,
        promotion: editingUser.promotion || null,
      });
      setEditingUser(null);
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      // In a real app, show a toast notification
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestion des Utilisateurs</h2>
          <p className="text-sm text-slate-500 mt-1">Gérez les accès, rôles et informations des membres.</p>
        </div>
        <button 
          onClick={() => setIsAddInfoOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
        >
          <Plus className="w-5 h-5" />
          Nouvel utilisateur
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Rechercher par nom, email, rôle ou matricule..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
          />
        </div>
        <div className="relative min-w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm appearance-none cursor-pointer"
          >
            <option value="all">Tous les rôles</option>
            <option value="student">Étudiants</option>
            <option value="professor">Professeurs</option>
            <option value="admin">Administrateurs</option>
            <option value="cashier">Caissiers</option>
            <option value="chef">Chefs de Département</option>
            <option value="super_admin">Super Admins</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th 
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center gap-1">
                    ID <SortIcon columnKey="id" />
                  </div>
                </th>
                <th 
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Utilisateur <SortIcon columnKey="name" />
                  </div>
                </th>
                <th 
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                  onClick={() => handleSort('role')}
                >
                  <div className="flex items-center gap-1">
                    Rôle <SortIcon columnKey="role" />
                  </div>
                </th>
                <th className="px-6 py-4">Département / Promo</th>
                <th 
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center gap-1">
                    Inscription <SortIcon columnKey="createdAt" />
                  </div>
                </th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                      Chargement des utilisateurs...
                    </div>
                  </td>
                </tr>
              ) : sortedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Search className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-base font-medium text-slate-700">Aucun utilisateur trouvé</p>
                      <p className="text-sm mt-1">Essayez de modifier vos filtres de recherche.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedUsers.map((u) => {
                  const roleInfo = roleConfig[u.role] || roleConfig.student;
                  const RoleIcon = roleInfo.icon;
                  
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {u.id.substring(0, 8)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${roleInfo.bg} ${roleInfo.color}`}>
                            {getInitials(u.name)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{u.name}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3" />
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${roleInfo.bg} ${roleInfo.color} ${roleInfo.border}`}>
                          <RoleIcon className="w-3.5 h-3.5" />
                          {roleInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {u.faculty ? (
                          <div>
                            <div className="text-slate-700 font-medium">{u.faculty}</div>
                            {u.promotion && <div className="text-xs text-slate-500">{u.promotion}</div>}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Non assigné</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {u.createdAt ? (u.createdAt.toDate ? format(u.createdAt.toDate(), 'dd MMM yyyy', { locale: fr }) : format(new Date(u.createdAt), 'dd MMM yyyy', { locale: fr })) : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!(user?.role === 'admin' && u.role === 'super_admin') && (
                            <button 
                              onClick={() => setGeneratingIdFor(u)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Générer la carte d'identité"
                            >
                              <FileBadge className="w-4 h-4" />
                            </button>
                          )}
                          {!(user?.role === 'admin' && u.role === 'super_admin') && (
                            <button 
                              onClick={() => setEditingUser(u)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {!(user?.role === 'admin' && u.role === 'super_admin') && (
                            <button 
                              onClick={() => handleDelete(u.id, u.name)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500 flex justify-between items-center">
          <span>Affichage de {filteredUsers.length} utilisateur(s)</span>
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Modifier l'utilisateur</h3>
              <button 
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Nom complet</label>
                <input 
                  type="text" 
                  value={editingUser.name} 
                  disabled
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Email</label>
                <input 
                  type="email" 
                  value={editingUser.email} 
                  disabled
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Rôle</label>
                <select 
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({...editingUser, role: e.target.value as any})}
                  disabled={user?.role !== 'super_admin' && user?.role !== 'admin'}
                  className={`w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${(user?.role !== 'super_admin' && user?.role !== 'admin') ? 'bg-slate-50 cursor-not-allowed text-slate-500' : ''}`}
                >
                  <option value="student">Étudiant</option>
                  <option value="professor">Professeur</option>
                  <option value="admin">Administrateur</option>
                  <option value="cashier">Caissier</option>
                  <option value="chef">Chef de Département</option>
                  {user?.role === 'super_admin' && <option value="super_admin">Super Admin</option>}
                </select>
                {(user?.role !== 'super_admin' && user?.role !== 'admin') && (
                  <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Seul un administrateur peut modifier les rôles.
                  </p>
                )}
              </div>

              {(editingUser.role === 'student' || editingUser.role === 'professor' || editingUser.role === 'chef') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Faculté / Département</label>
                  <input 
                    type="text" 
                    value={editingUser.faculty || ''}
                    onChange={(e) => setEditingUser({...editingUser, faculty: e.target.value})}
                    placeholder="Ex: Sciences Informatiques"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              )}

              {editingUser.role === 'student' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Promotion</label>
                  <input 
                    type="text" 
                    value={editingUser.promotion || ''}
                    onChange={(e) => setEditingUser({...editingUser, promotion: e.target.value})}
                    placeholder="Ex: L3 Info"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-70 flex items-center justify-center"
                >
                  {isSaving ? (
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

      {/* Add Info Modal */}
      {isAddInfoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Ajout d'utilisateur</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Pour des raisons de sécurité, les utilisateurs doivent se connecter une première fois avec leur compte Google pour créer leur profil. 
              <br/><br/>
              Une fois connectés, ils apparaîtront dans cette liste et vous pourrez modifier leur rôle (Professeur, Admin, etc.).
            </p>
            <button 
              onClick={() => setIsAddInfoOpen(false)}
              className="w-full px-4 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
            >
              J'ai compris
            </button>
          </div>
        </div>
      )}

      {/* ID Card Generation Modal */}
      {generatingIdFor && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                  <FileBadge className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Carte d'Identité</h3>
                  <p className="text-xs text-slate-500">Aperçu avant impression</p>
                </div>
              </div>
              <button 
                onClick={() => setGeneratingIdFor(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-slate-100/50">
              {/* ID Card Container */}
              <div 
                id="id-card-print-area"
                className="w-[340px] h-[540px] bg-white rounded-xl shadow-lg relative overflow-hidden border border-slate-200 flex flex-col"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${institutionData?.primaryColor || '#2563eb'}08 0%, transparent 100%)`
                }}
              >
                {/* Header */}
                <div 
                  className="h-24 px-4 flex items-center justify-between relative"
                  style={{ backgroundColor: institutionData?.primaryColor || '#2563eb' }}
                >
                  <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                  <div className="relative z-10 flex items-center gap-3 w-full">
                    {institutionData?.logoUrl ? (
                      <img src={institutionData.logoUrl} alt="Logo" className="w-12 h-12 rounded-lg object-contain bg-white p-1" />
                    ) : (
                      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                        <Building2 className="w-6 h-6" style={{ color: institutionData?.primaryColor || '#2563eb' }} />
                      </div>
                    )}
                    <div className="text-white flex-1">
                      <h2 className="font-bold text-sm leading-tight uppercase tracking-wide">{institutionData?.name || 'Université'}</h2>
                      <p className="text-[10px] opacity-90 mt-0.5 leading-tight">{institutionData?.address || 'Adresse de l\'institution'}</p>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 p-5 flex flex-col items-center relative">
                  {/* Photo Placeholder */}
                  <div className="w-32 h-32 rounded-2xl bg-slate-100 border-4 border-white shadow-md -mt-16 mb-4 flex items-center justify-center overflow-hidden relative z-10">
                    <div className="text-4xl font-bold text-slate-300">
                      {getInitials(generatingIdFor.name)}
                    </div>
                  </div>

                  <div className="text-center w-full mb-4">
                    <h1 className="text-xl font-bold text-slate-800 uppercase tracking-tight">{generatingIdFor.name}</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1 uppercase">
                      {roleConfig[generatingIdFor.role]?.label || 'Utilisateur'}
                    </p>
                  </div>

                  <div className="w-full space-y-2.5 mb-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ID</span>
                      <span className="text-xs font-bold text-slate-800 font-mono">{generatingIdFor.matricule || generatingIdFor.id.substring(0, 8)}</span>
                    </div>
                    {generatingIdFor.faculty && (
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Faculté / Dép.</span>
                        <span className="text-xs font-semibold text-slate-700">{generatingIdFor.faculty}</span>
                      </div>
                    )}
                    {generatingIdFor.promotion && (
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Promotion</span>
                        <span className="text-xs font-semibold text-slate-700">{generatingIdFor.promotion}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</span>
                      <span className="text-[10px] font-semibold text-slate-700 truncate max-w-[150px]">{generatingIdFor.email}</span>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="mt-auto flex flex-col items-center">
                    <div className="p-1.5 bg-white rounded-lg shadow-sm border border-slate-100">
                      <QRCodeSVG 
                        value={`user:${generatingIdFor.id}:${generatingIdFor.role}`} 
                        size={64} 
                        level="M"
                        fgColor={institutionData?.primaryColor || '#2563eb'}
                      />
                    </div>
                    <p className="text-[8px] text-slate-400 mt-2 font-mono uppercase tracking-widest">
                      UID: {generatingIdFor.id.substring(0, 8)}
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div 
                  className="h-3 w-full"
                  style={{ backgroundColor: institutionData?.primaryColor || '#2563eb' }}
                ></div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3 shrink-0">
              <button 
                onClick={() => setGeneratingIdFor(null)}
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
              >
                Fermer
              </button>
              <button 
                onClick={() => window.print()}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Imprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
