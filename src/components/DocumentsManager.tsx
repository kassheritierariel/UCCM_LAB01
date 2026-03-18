import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, where } from 'firebase/firestore';
import { 
  Search, Filter, FileText, CheckCircle, XCircle, Clock, 
  Eye, MessageSquare, Download, FileArchive, BookOpen, GraduationCap,
  AlertCircle, X
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '../AuthContext';

interface Document {
  id: string;
  title: string;
  type: 'tfc' | 'memoire' | 'rapport' | 'autre';
  studentName: string;
  studentId: string;
  faculty: string;
  status: 'pending' | 'approved' | 'rejected';
  fileUrl?: string;
  submittedAt: any;
  feedback?: string;
  tenantId?: string;
}

const typeConfig = {
  tfc: { label: 'TFC', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
  memoire: { label: 'Mémoire', icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
  rapport: { label: 'Rapport de Stage', icon: FileArchive, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  autre: { label: 'Autre Document', icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50' },
};

const statusConfig = {
  pending: { label: 'En attente', icon: Clock, color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-200' },
  approved: { label: 'Approuvé', icon: CheckCircle, color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200' },
  rejected: { label: 'Rejeté', icon: XCircle, color: 'text-rose-700', bg: 'bg-rose-100', border: 'border-rose-200' },
};

export default function DocumentsManager() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [facultyFilter, setFacultyFilter] = useState<string>('all');
  
  const [reviewingDoc, setReviewingDoc] = useState<Document | null>(null);
  const [feedback, setFeedback] = useState('');
  
  const [rejectingDoc, setRejectingDoc] = useState<Document | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    let q;
    if (user.role === 'super_admin') {
      q = query(collection(db, 'documents'), orderBy('submittedAt', 'desc'));
    } else {
      q = query(collection(db, 'documents'), where('tenantId', '==', user.tenantId), orderBy('submittedAt', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Document[];
      setDocuments(docsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching documents:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const filteredDocs = documents.filter(d => {
    const matchesSearch = d.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          d.studentName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    const matchesType = typeFilter === 'all' || d.type === typeFilter;
    const matchesFaculty = facultyFilter === 'all' || d.faculty === facultyFilter;
    return matchesSearch && matchesStatus && matchesType && matchesFaculty;
  });

  // Extract unique faculties for the filter dropdown
  const uniqueFaculties = Array.from(new Set(documents.map(d => d.faculty).filter(Boolean)));

  const handleReview = async (status: 'approved' | 'rejected') => {
    if (!reviewingDoc) return;
    if (status === 'rejected' && !feedback.trim()) {
      // In a real app, show a toast notification
      return;
    }

    setIsSubmitting(true);
    try {
      const docRef = doc(db, 'documents', reviewingDoc.id);
      await updateDoc(docRef, {
        status,
        feedback: feedback.trim() || null,
        reviewedAt: new Date()
      });
      setReviewingDoc(null);
      setFeedback('');
    } catch (error) {
      console.error("Erreur lors de l'évaluation:", error);
      // In a real app, show a toast notification
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickApprove = async (docToApprove: Document) => {
    setIsSubmitting(true);
    try {
      const docRef = doc(db, 'documents', docToApprove.id);
      await updateDoc(docRef, {
        status: 'approved',
        reviewedAt: new Date()
      });
    } catch (error) {
      console.error("Erreur lors de l'approbation:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickReject = async () => {
    if (!rejectingDoc || !rejectReason.trim()) return;
    setIsSubmitting(true);
    try {
      const docRef = doc(db, 'documents', rejectingDoc.id);
      await updateDoc(docRef, {
        status: 'rejected',
        feedback: rejectReason.trim(),
        reviewedAt: new Date()
      });
      setRejectingDoc(null);
      setRejectReason('');
    } catch (error) {
      console.error("Erreur lors du rejet:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingCount = documents.filter(d => d.status === 'pending').length;

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Titre',
      'Type',
      'Étudiant',
      'Faculté',
      'Statut',
      'Date de soumission'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredDocuments.map(d => {
        const row = [
          d.id,
          `"${(d.title || '').replace(/"/g, '""')}"`,
          typeConfig[d.type]?.label || d.type,
          `"${(d.studentName || '').replace(/"/g, '""')}"`,
          `"${(d.faculty || '').replace(/"/g, '""')}"`,
          statusConfig[d.status]?.label || d.status,
          d.createdAt ? (d.createdAt.toDate ? format(d.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : format(new Date(d.createdAt), 'dd/MM/yyyy HH:mm')) : ''
        ];
        return row.join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `documents_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Validation des Documents</h2>
            <p className="text-sm text-slate-500 mt-1">Examinez et validez les TFC, mémoires et rapports de stage soumis par les étudiants.</p>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-medium hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-5 h-5" />
            <span className="hidden sm:inline">Exporter CSV</span>
          </button>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-2xl shadow-sm text-white flex items-center justify-between">
          <div>
            <p className="text-amber-100 text-sm font-medium uppercase tracking-wider mb-1">À traiter</p>
            <h3 className="text-4xl font-bold">{pendingCount}</h3>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Clock className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Rechercher par titre ou étudiant..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="relative min-w-[160px] flex-1 sm:flex-none">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm appearance-none cursor-pointer"
            >
              <option value="all">Tous les types</option>
              <option value="tfc">TFC</option>
              <option value="memoire">Mémoires</option>
              <option value="rapport">Rapports</option>
              <option value="autre">Autres Documents</option>
            </select>
          </div>
          <div className="relative min-w-[160px] flex-1 sm:flex-none">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm appearance-none cursor-pointer"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuvés</option>
              <option value="rejected">Rejetés</option>
            </select>
          </div>
          <div className="relative min-w-[160px] flex-1 sm:flex-none">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={facultyFilter}
              onChange={(e) => setFacultyFilter(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm appearance-none cursor-pointer"
            >
              <option value="all">Toutes les facultés</option>
              {uniqueFaculties.map(faculty => (
                <option key={faculty} value={faculty}>{faculty}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="px-6 py-4">Document</th>
                <th className="px-6 py-4">Étudiant</th>
                <th className="px-6 py-4">Date de soumission</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                      Chargement des documents...
                    </div>
                  </td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-base font-medium text-slate-700">Aucun document trouvé</p>
                      <p className="text-sm mt-1">Essayez de modifier vos filtres de recherche.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => {
                  const typeInfo = typeConfig[doc.type] || typeConfig.tfc;
                  const TypeIcon = typeInfo.icon;
                  const statusInfo = statusConfig[doc.status] || statusConfig.pending;
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${typeInfo.bg} ${typeInfo.color}`}>
                            <TypeIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 line-clamp-1" title={doc.title}>{doc.title}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{typeInfo.label}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                            {doc.studentName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-slate-700">{doc.studentName}</div>
                            <div className="text-[10px] text-slate-400">{doc.faculty}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {doc.submittedAt ? format(doc.submittedAt.toDate(), 'dd MMM yyyy à HH:mm', { locale: fr }) : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {doc.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleQuickApprove(doc)}
                                disabled={isSubmitting}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 rounded-lg text-xs font-medium transition-colors"
                                title="Approuver directement"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Approuver
                              </button>
                              <button 
                                onClick={() => {
                                  setRejectingDoc(doc);
                                  setRejectReason('');
                                }}
                                disabled={isSubmitting}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 rounded-lg text-xs font-medium transition-colors"
                                title="Rejeter avec motif"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Rejeter
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => {
                              setReviewingDoc(doc);
                              setFeedback(doc.feedback || '');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-lg text-xs font-medium transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Détails
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Reject Modal */}
      {rejectingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Motif du rejet</h3>
              <button 
                onClick={() => setRejectingDoc(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4">
                Veuillez expliquer pourquoi le document <span className="font-semibold text-slate-800">"{rejectingDoc.title}"</span> est rejeté. Ce commentaire sera visible par l'étudiant.
              </p>
              <textarea 
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Saisissez le motif du rejet ici..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all min-h-[120px] resize-y"
                autoFocus
              />
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
              <button 
                onClick={() => setRejectingDoc(null)}
                disabled={isSubmitting}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-100 transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={handleQuickReject}
                disabled={isSubmitting || !rejectReason.trim()}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl font-medium hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${typeConfig[reviewingDoc.type]?.bg} ${typeConfig[reviewingDoc.type]?.color}`}>
                  {React.createElement(typeConfig[reviewingDoc.type]?.icon || FileText, { className: "w-5 h-5" })}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 leading-tight">Évaluation de document</h3>
                  <p className="text-xs text-slate-500">{typeConfig[reviewingDoc.type]?.label}</p>
                </div>
              </div>
              <button 
                onClick={() => setReviewingDoc(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Document Info Card */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <h4 className="font-bold text-slate-800 text-lg mb-4">{reviewingDoc.title}</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Auteur</span>
                    <div className="flex items-center gap-2 font-medium text-slate-700">
                      <GraduationCap className="w-4 h-4 text-slate-400" />
                      {reviewingDoc.studentName}
                    </div>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Faculté</span>
                    <span className="font-medium text-slate-700">{reviewingDoc.faculty}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Date de soumission</span>
                    <span className="font-medium text-slate-700">
                      {reviewingDoc.submittedAt ? format(reviewingDoc.submittedAt.toDate(), 'dd MMMM yyyy à HH:mm', { locale: fr }) : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Fichier</span>
                    {reviewingDoc.fileUrl ? (
                      <a 
                        href={reviewingDoc.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:underline font-medium"
                      >
                        <Download className="w-4 h-4" />
                        Télécharger le PDF
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">Aucun fichier joint</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Feedback Section */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  Commentaires / Retours (Optionnel pour approbation, Requis pour rejet)
                </label>
                <textarea 
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Saisissez vos remarques ici. Ces commentaires seront visibles par l'étudiant..."
                  className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all min-h-[120px] resize-y"
                />
              </div>

              {/* Current Status Alert (if already reviewed) */}
              {reviewingDoc.status !== 'pending' && (
                <div className={`p-4 rounded-xl flex items-start gap-3 ${statusConfig[reviewingDoc.status].bg} ${statusConfig[reviewingDoc.status].color} ${statusConfig[reviewingDoc.status].border} border`}>
                  {React.createElement(statusConfig[reviewingDoc.status].icon, { className: "w-5 h-5 shrink-0 mt-0.5" })}
                  <div>
                    <p className="font-bold text-sm">Ce document a déjà été {statusConfig[reviewingDoc.status].label.toLowerCase()}.</p>
                    <p className="text-xs mt-1 opacity-90">Vous pouvez modifier votre décision en utilisant les boutons ci-dessous.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0 rounded-b-2xl">
              <button 
                type="button"
                onClick={() => setReviewingDoc(null)}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-100 transition-colors"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button 
                onClick={() => handleReview('rejected')}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-white border border-rose-200 text-rose-600 rounded-xl font-medium hover:bg-rose-50 transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Rejeter
              </button>
              <button 
                onClick={() => handleReview('approved')}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Approuver
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
