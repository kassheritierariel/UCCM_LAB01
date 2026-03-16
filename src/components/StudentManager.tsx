import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, where, deleteField } from 'firebase/firestore';
import { 
  Search, Filter, Edit2, GraduationCap, X, Mail, Calendar, ChevronUp, ChevronDown, Phone, MapPin, Hash
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '../AuthContext';

interface Student {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: 'student';
  faculty?: string;
  promotion?: string;
  tenantId?: string;
  createdAt: any;
  phone?: string;
  address?: string;
  studentId?: string;
}

export default function StudentManager() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFaculty, setFilterFaculty] = useState('');
  const [filterPromotion, setFilterPromotion] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    let q;
    if (user.role === 'super_admin') {
      q = query(collection(db, 'users'), where('role', '==', 'student'), orderBy('createdAt', 'desc'));
    } else {
      q = query(collection(db, 'users'), where('tenantId', '==', user.tenantId), where('role', '==', 'student'), orderBy('createdAt', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Student[];
      setStudents(studentsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching students:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const uniqueFaculties = Array.from(new Set(students.map(s => s.faculty).filter(Boolean))) as string[];
  const uniquePromotions = Array.from(new Set(students.map(s => s.promotion).filter(Boolean))) as string[];

  const filteredStudents = students.filter(s => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = s.name?.toLowerCase().includes(searchLower) || 
           s.email?.toLowerCase().includes(searchLower) ||
           s.studentId?.toLowerCase().includes(searchLower) ||
           s.faculty?.toLowerCase().includes(searchLower) ||
           s.promotion?.toLowerCase().includes(searchLower);
           
    const matchesFaculty = filterFaculty === '' || s.faculty === filterFaculty;
    const matchesPromotion = filterPromotion === '' || s.promotion === filterPromotion;
    
    return matchesSearch && matchesFaculty && matchesPromotion;
  });

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (!sortConfig) return 0;
    
    const { key, direction } = sortConfig;
    let aValue: any = a[key as keyof Student];
    let bValue: any = b[key as keyof Student];

    if (key === 'createdAt') {
      aValue = a.createdAt?.toMillis?.() || a.createdAt?.seconds || 0;
      bValue = b.createdAt?.toMillis?.() || b.createdAt?.seconds || 0;
    } else if (key === 'name' || key === 'email' || key === 'id' || key === 'studentId' || key === 'faculty' || key === 'promotion') {
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

  const groupedStudents = React.useMemo(() => {
    const groups: Record<string, Student[]> = {};
    sortedStudents.forEach(student => {
      const key = `${student.promotion || 'Non assignée'} - ${student.faculty || 'Non assigné'}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(student);
    });
    return groups;
  }, [sortedStudents]);

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key !== columnKey) {
      return <ChevronDown className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-500" />
      : <ChevronDown className="w-4 h-4 text-blue-500" />;
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', editingStudent.id);
      
      const updateData: any = {};
      
      if (editingStudent.faculty) updateData.faculty = editingStudent.faculty;
      else updateData.faculty = deleteField();
      
      if (editingStudent.promotion) updateData.promotion = editingStudent.promotion;
      else updateData.promotion = deleteField();
      
      if (editingStudent.phone) updateData.phone = editingStudent.phone;
      else updateData.phone = deleteField();
      
      if (editingStudent.address) updateData.address = editingStudent.address;
      else updateData.address = deleteField();
      
      if (editingStudent.studentId) updateData.studentId = editingStudent.studentId;
      else updateData.studentId = deleteField();

      await updateDoc(userRef, updateData);
      setEditingStudent(null);
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestion des Étudiants</h2>
          <p className="text-sm text-slate-500 mt-1">Gérez les informations détaillées des étudiants.</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-medium">
          <GraduationCap className="w-5 h-5" />
          <span>{students.length} étudiant{students.length !== 1 ? 's' : ''} au total</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Rechercher par nom, email, matricule, département ou promotion..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <select
            value={filterFaculty}
            onChange={(e) => setFilterFaculty(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm text-slate-700 w-full sm:w-auto"
          >
            <option value="">Tous les départements</option>
            {uniqueFaculties.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <select
            value={filterPromotion}
            onChange={(e) => setFilterPromotion(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm text-slate-700 w-full sm:w-auto"
          >
            <option value="">Toutes les promos</option>
            {uniquePromotions.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedGroup ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(groupedStudents).map(([groupName, groupStudents]) => (
            <div key={groupName} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
                  {groupStudents.length} étudiant{groupStudents.length !== 1 ? 's' : ''}
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2">{groupName}</h3>
              <p className="text-sm text-slate-500 mb-6">
                Année Académique en cours
              </p>
              <button 
                onClick={() => setSelectedGroup(groupName)}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                Voir la liste
              </button>
            </div>
          ))}
          {Object.keys(groupedStudents).length === 0 && !loading && (
            <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
              Aucun groupe trouvé pour ces critères.
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedGroup(null)}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-800">{selectedGroup}</h3>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    <th 
                      className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                      onClick={() => handleSort('studentId')}
                    >
                      <div className="flex items-center gap-1">
                        Matricule <SortIcon columnKey="studentId" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        Étudiant <SortIcon columnKey="name" />
                      </div>
                    </th>
                    <th className="px-6 py-4">Contact</th>
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
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                          Chargement des étudiants...
                        </div>
                      </td>
                    </tr>
                  ) : groupedStudents[selectedGroup]?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Search className="w-8 h-8 text-slate-300" />
                          </div>
                          <p className="text-base font-medium text-slate-700">Aucun étudiant trouvé</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    groupedStudents[selectedGroup]?.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">
                          {s.studentId || <span className="italic opacity-50">Non défini</span>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 bg-blue-100 text-blue-700">
                              {getInitials(s.name)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800">{s.name}</div>
                              <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3" />
                                {s.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {s.phone && (
                              <div className="text-xs text-slate-600 flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                {s.phone}
                              </div>
                            )}
                            {s.address && (
                              <div className="text-xs text-slate-600 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                <span className="truncate max-w-[150px]" title={s.address}>{s.address}</span>
                              </div>
                            )}
                            {!s.phone && !s.address && (
                              <span className="text-slate-400 italic text-xs">Non renseigné</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {s.createdAt ? format(s.createdAt.toDate(), 'dd MMM yyyy', { locale: fr }) : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => setEditingStudent(s)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500 flex justify-between items-center">
              <span>Affichage de {groupedStudents[selectedGroup]?.length || 0} étudiant(s)</span>
            </div>
          </div>
        </div>
      )}

      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Modifier l'étudiant</h3>
              <button 
                onClick={() => setEditingStudent(null)}
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
                  value={editingStudent.name} 
                  disabled
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Matricule / ID</label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    value={editingStudent.studentId || ''}
                    onChange={(e) => setEditingStudent({...editingStudent, studentId: e.target.value})}
                    placeholder="Ex: 2024-001"
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Téléphone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="tel" 
                    value={editingStudent.phone || ''}
                    onChange={(e) => setEditingStudent({...editingStudent, phone: e.target.value})}
                    placeholder="Ex: +243 81..."
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Adresse</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <textarea 
                    value={editingStudent.address || ''}
                    onChange={(e) => setEditingStudent({...editingStudent, address: e.target.value})}
                    placeholder="Adresse complète"
                    rows={2}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Faculté</label>
                  <input 
                    type="text" 
                    value={editingStudent.faculty || ''}
                    onChange={(e) => setEditingStudent({...editingStudent, faculty: e.target.value})}
                    placeholder="Ex: Sciences"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Promotion</label>
                  <input 
                    type="text" 
                    value={editingStudent.promotion || ''}
                    onChange={(e) => setEditingStudent({...editingStudent, promotion: e.target.value})}
                    placeholder="Ex: L3 Info"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setEditingStudent(null)}
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
    </div>
  );
}
