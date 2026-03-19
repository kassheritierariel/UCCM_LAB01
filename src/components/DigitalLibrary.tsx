import React, { useState, useEffect } from 'react';
import { Search, Book, Video, FileText, Download, Wifi, Zap, Sparkles, Filter, ChevronRight, PlayCircle, BookOpen, Baby, Backpack, GraduationCap, Briefcase, Library, Plus, Trash2, X, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { collection, getDocs, addDoc, deleteDoc, doc, onSnapshot, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';

interface LibraryResource {
  id: string;
  title: string;
  author: string;
  level: string;
  type: string;
  size: string;
  downloads: number;
  rating: number;
  fileUrl?: string;
  faculty?: string;
  promotion?: string;
  tenantId: string;
}

export default function DigitalLibrary() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newResource, setNewResource] = useState({
    title: '', author: '', level: 'universitaire', type: 'book', size: '10 MB', fileUrl: '', faculty: '', promotion: ''
  });
  const [toastMessage, setToastMessage] = useState<{title: string, message: string, type: 'success' | 'error'} | null>(null);
  const [confirmAction, setConfirmAction] = useState<{message: string, onConfirm: () => void} | null>(null);

  const showToast = (title: string, message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ title, message, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const categories = [
    { id: 'all', name: 'Tous les niveaux', icon: Library },
    { id: 'primaire', name: 'Primaire', icon: Baby },
    { id: 'secondaire', name: 'Secondaire', icon: Backpack },
    { id: 'humanites', name: 'Humanités', icon: BookOpen },
    { id: 'universitaire', name: 'Universitaire', icon: GraduationCap },
    { id: 'autres', name: 'Autres / Responsable', icon: Briefcase },
  ];

  useEffect(() => {
    if (!user?.tenantId) return;

    const q = user.role === 'super_admin' 
      ? query(collection(db, 'library_resources'))
      : query(collection(db, 'library_resources'), where('tenantId', '==', user.tenantId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const resourcesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LibraryResource[];
      setResources(resourcesData);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.tenantId) return;

    try {
      await addDoc(collection(db, 'library_resources'), {
        ...newResource,
        downloads: 0,
        rating: 5.0,
        tenantId: user.tenantId,
        createdAt: serverTimestamp()
      });
      showToast('Succès', 'Ressource ajoutée avec succès', 'success');
      setIsAdding(false);
      setNewResource({ title: '', author: '', level: 'universitaire', type: 'book', size: '10 MB', fileUrl: '', faculty: '', promotion: '' });
    } catch (error) {
      console.error('Error adding resource:', error);
      showToast('Erreur', 'Erreur lors de l\'ajout de la ressource', 'error');
    }
  };

  const handleDeleteResource = async (id: string) => {
    setConfirmAction({
      message: 'Êtes-vous sûr de vouloir supprimer cette ressource ?',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'library_resources', id));
          showToast('Succès', 'Ressource supprimée', 'success');
        } catch (error) {
          console.error('Error deleting resource:', error);
          showToast('Erreur', 'Erreur lors de la suppression', 'error');
        }
      }
    });
  };

  if (user?.role === 'student' && !user?.libraryAccess) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <BookOpen className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Accès Restreint</h2>
        <p className="text-slate-600 max-w-md">
          Vous devez payer les frais d'accès à la bibliothèque numérique pour consulter ces ressources.
          Veuillez contacter l'administration pour régulariser votre situation.
        </p>
      </div>
    );
  }

  const filteredResources = resources.filter(r => {
    const matchesCategory = activeCategory === 'all' || r.level === activeCategory;
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (user?.role === 'student') {
      const matchesFaculty = !r.faculty || r.faculty === user.faculty;
      const matchesPromotion = !r.promotion || r.promotion === user.promotion;
      return matchesCategory && matchesSearch && matchesFaculty && matchesPromotion;
    }
    
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-600" />
              Bibliothèque Numérique Premium
            </h2>
            {isAdmin && (
              <button 
                onClick={() => setIsAdding(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            )}
          </div>
          <p className="text-slate-500 mt-1">Accès illimité aux ressources académiques mondiales.</p>
        </div>
        
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-emerald-800">UCCM Edge Node Actif</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-xs text-emerald-600 font-medium">Téléchargement local ultra-rapide (Haut Débit)</p>
          </div>
        </div>
      </div>

      {/* AI Search Bar */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-2 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
        <div className="pl-3">
          <Search className="w-5 h-5 text-slate-400" />
        </div>
        <input 
          type="text"
          placeholder="Rechercher un livre, un cours, ou poser une question à l'IA..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 py-3 px-2 outline-none text-slate-700 bg-transparent"
        />
        <button className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors">
          <Sparkles className="w-4 h-4" />
          Recherche Sémantique IA
        </button>
      </div>

      {/* Categories */}
      <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat.id 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <cat.icon className="w-4 h-4" />
            {cat.name}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map(resource => (
          <div key={resource.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all group flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-xl border-b border-l border-slate-200">
              {categories.find(c => c.id === resource.level)?.name || resource.level}
            </div>
            
            <div className="flex justify-between items-start mb-4 mt-2">
              <div className={`p-3 rounded-xl ${
                resource.type === 'video' ? 'bg-rose-50 text-rose-600' : 
                resource.type === 'thesis' ? 'bg-amber-50 text-amber-600' : 
                'bg-blue-50 text-blue-600'
              }`}>
                {resource.type === 'video' ? <PlayCircle className="w-6 h-6" /> : 
                 resource.type === 'thesis' ? <FileText className="w-6 h-6" /> : 
                 <Book className="w-6 h-6" />}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                  <span className="text-xs font-bold text-slate-700">{resource.rating}</span>
                  <span className="text-[10px] text-slate-400">⭐</span>
                </div>
                {isAdmin && (
                  <button 
                    onClick={() => handleDeleteResource(resource.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1 line-clamp-2">{resource.title}</h3>
            <p className="text-sm text-slate-500 mb-4">{resource.author}</p>
            
            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Taille</span>
                <span className="text-sm font-bold text-slate-700">{resource.size}</span>
              </div>
              <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                <Download className="w-4 h-4" />
                Obtenir
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Feature Highlight */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden mt-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-medium text-indigo-200">
              <Sparkles className="w-3 h-3" />
              Fonctionnalité Premium
            </div>
            <h3 className="text-2xl md:text-3xl font-bold leading-tight">
              UCCM Edge Node : Le Haut Débit pour votre Institution
            </h3>
            <p className="text-indigo-100/80 leading-relaxed max-w-2xl">
              Attirez plus d'étudiants en offrant un accès instantané à des milliers de ressources lourdes (vidéos 4K, thèses, manuels). Notre serveur cache local se synchronise la nuit, permettant aux étudiants de télécharger à la vitesse du réseau local (Gigabit) sans consommer la bande passante internet de l'université.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-sm">
                <Wifi className="w-4 h-4 text-emerald-400" />
                Zéro latence
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-sm">
                <Zap className="w-4 h-4 text-amber-400" />
                Économie de bande passante
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-sm">
                <Search className="w-4 h-4 text-blue-400" />
                Recherche IA Intégrée
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Add Resource Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800">Ajouter une ressource</h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddResource} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Titre</label>
                <input
                  type="text"
                  required
                  value={newResource.title}
                  onChange={e => setNewResource({...newResource, title: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Auteur</label>
                <input
                  type="text"
                  required
                  value={newResource.author}
                  onChange={e => setNewResource({...newResource, author: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Niveau</label>
                  <select
                    value={newResource.level}
                    onChange={e => setNewResource({...newResource, level: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {categories.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select
                    value={newResource.type}
                    onChange={e => setNewResource({...newResource, type: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="book">Livre</option>
                    <option value="video">Vidéo</option>
                    <option value="thesis">Thèse</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Taille (ex: 15 MB)</label>
                <input
                  type="text"
                  required
                  value={newResource.size}
                  onChange={e => setNewResource({...newResource, size: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">URL du fichier (optionnel)</label>
                <input
                  type="url"
                  value={newResource.fileUrl}
                  onChange={e => setNewResource({...newResource, fileUrl: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Faculté / Département (Optionnel)</label>
                  <input
                    type="text"
                    value={newResource.faculty}
                    onChange={e => setNewResource({...newResource, faculty: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Ex: Informatique"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Promotion / Classe (Optionnel)</label>
                  <input
                    type="text"
                    value={newResource.promotion}
                    onChange={e => setNewResource({...newResource, promotion: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Ex: L1"
                  />
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Confirmation</h3>
                <p className="text-slate-600 mt-1">{confirmAction.message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  confirmAction.onConfirm();
                  setConfirmAction(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Message */}
      {toastMessage && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 animate-fade-in ${
          toastMessage.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toastMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          <div>
            <p className="font-medium">{toastMessage.title}</p>
            <p className="text-sm opacity-90">{toastMessage.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
