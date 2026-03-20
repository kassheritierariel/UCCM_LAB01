import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { 
  Search, Filter, CircleDollarSign, CheckCircle, XCircle, Clock, 
  Download, Printer, Plus, AlertCircle, X, CreditCard, Receipt, TrendingUp, Calendar
} from 'lucide-react';
import { format, isAfter, isBefore, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '../AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';

interface Payment {
  id: string;
  studentName: string;
  studentId: string;
  type: 'tuition' | 'library' | 'exam' | 'deposit' | 'other';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  paymentMethod: 'cash' | 'card' | 'transfer' | 'mobile_money' | 'chariow';
  reference: string;
  tenantId?: string;
  createdAt: any;
}

const typeConfig = {
  tuition: { label: 'Frais Académiques', color: 'text-blue-600', bg: 'bg-blue-50' },
  library: { label: 'Frais Bibliothèque', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  exam: { label: 'Frais d\'Examen', color: 'text-purple-600', bg: 'bg-purple-50' },
  deposit: { label: 'Frais de Dépôt (TFC/Mémoire/Rapport/Autre)', color: 'text-amber-600', bg: 'bg-amber-50' },
  other: { label: 'Autres Frais', color: 'text-slate-600', bg: 'bg-slate-50' },
};

const statusConfig = {
  pending: { label: 'En attente', icon: Clock, color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-200' },
  completed: { label: 'Complété', icon: CheckCircle, color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200' },
  failed: { label: 'Échoué', icon: XCircle, color: 'text-rose-700', bg: 'bg-rose-100', border: 'border-rose-200' },
};

export default function PaymentsManager() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Date range filter for the list
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Date range state for the chart
  const [chartStartDate, setChartStartDate] = useState<string>(
    format(subMonths(new Date(), 6), 'yyyy-MM-dd')
  );
  const [chartEndDate, setChartEndDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<Payment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{title: string, message: string, type: 'success' | 'error'} | null>(null);
  const [confirmAction, setConfirmAction] = useState<{message: string, onConfirm: () => void} | null>(null);

  const showToast = (title: string, message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ title, message, type });
    setTimeout(() => setToastMessage(null), 5000);
  };
  
  // New Payment Form State
  const [newPayment, setNewPayment] = useState({
    studentName: '',
    studentId: '',
    type: 'tuition',
    amount: '',
    paymentMethod: 'cash',
    reference: ''
  });

  useEffect(() => {
    if (!user) return;

    let q;
    if (user.role === 'super_admin') {
      q = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
    } else {
      q = query(collection(db, 'payments'), where('tenantId', '==', user.tenantId), orderBy('createdAt', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const paymentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Payment[];
      setPayments(paymentsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching payments:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesType = typeFilter === 'all' || p.type === typeFilter;
    
    // Date range filter
    let matchesDate = true;
    if (p.createdAt) {
      const date = p.createdAt.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (isBefore(date, start)) matchesDate = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (isAfter(date, end)) matchesDate = false;
      }
    } else if (startDate || endDate) {
      matchesDate = false;
    }

    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  const handleUpdateStatus = async (paymentId: string, newStatus: 'completed' | 'failed') => {
    setConfirmAction({
      message: `Êtes-vous sûr de vouloir marquer ce paiement comme ${newStatus === 'completed' ? 'payé' : 'échoué'} ?`,
      onConfirm: async () => {
        try {
          await updateDoc(doc(db, 'payments', paymentId), {
            status: newStatus,
            updatedAt: serverTimestamp()
          });
          showToast("Succès", "Le statut du paiement a été mis à jour.", "success");
        } catch (error) {
          console.error("Erreur lors de la mise à jour:", error);
          showToast("Erreur", "Une erreur est survenue lors de la mise à jour.", "error");
        }
      }
    });
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayment.studentName || !newPayment.amount) {
      showToast("Erreur", "Veuillez remplir tous les champs obligatoires.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'payments'), {
        ...newPayment,
        amount: parseFloat(newPayment.amount),
        currency: 'USD',
        status: 'completed', // Direct cash entries are usually completed
        tenantId: user?.tenantId || 'SYSTEM',
        createdAt: serverTimestamp()
      });

      // Add notification for new payment
      try {
        await addDoc(collection(db, 'notifications'), {
          userId: user?.uid || 'SYSTEM',
          message: `Nouveau paiement de ${newPayment.amount}$ par ${newPayment.studentName}`,
          read: false,
          tenantId: user?.tenantId || 'SYSTEM',
          createdAt: serverTimestamp()
        });
      } catch (e) {
        console.error("Could not create notification", e);
      }

      setIsAddModalOpen(false);
      setNewPayment({
        studentName: '', studentId: '', type: 'tuition', amount: '', paymentMethod: 'cash', reference: ''
      });
      showToast("Succès", "Le paiement a été enregistré avec succès.", "success");
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
      showToast("Erreur", "Une erreur est survenue lors de l'enregistrement du paiement.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const formatCurrency = (value: number) => {
    // Format with comma as thousands separator and dot as decimal, or whatever locale gives comma for thousands.
    // en-US gives 1,234.56
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' $';
  };

  const monthlyRevenueData = React.useMemo(() => {
    const data: Record<string, { total: number, timestamp: number }> = {};
    
    // Parse dates for filtering
    const start = chartStartDate ? new Date(chartStartDate) : null;
    const end = chartEndDate ? new Date(chartEndDate) : null;
    
    if (end) {
      end.setHours(23, 59, 59, 999);
    }

    payments.forEach(p => {
      if (p.status === 'completed' && p.createdAt) {
        const date = p.createdAt.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
        
        // Apply date filter
        if (start && isBefore(date, start)) return;
        if (end && isAfter(date, end)) return;

        const month = format(date, 'MMM yyyy', { locale: fr });
        if (!data[month]) {
          data[month] = { total: 0, timestamp: date.getTime() };
        }
        data[month].total += (p.amount || 0);
      }
    });
    
    return Object.entries(data)
      .map(([month, { total, timestamp }]) => ({ month, total, timestamp }))
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(({ month, total }) => ({ month, total }));
  }, [payments, chartStartDate, chartEndDate]);

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Étudiant',
      'Matricule',
      'Type',
      'Montant',
      'Devise',
      'Méthode',
      'Référence',
      'Statut',
      'Date'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredPayments.map(p => {
        const row = [
          p.id,
          `"${(p.studentName || '').replace(/"/g, '""')}"`,
          p.studentId || '',
          typeConfig[p.type]?.label || p.type,
          p.amount || 0,
          p.currency || 'USD',
          p.paymentMethod || '',
          p.reference || '',
          statusConfig[p.status]?.label || p.status,
          p.createdAt ? (p.createdAt.toDate ? format(p.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : format(new Date(p.createdAt), 'dd/MM/yyyy HH:mm')) : ''
        ];
        return row.join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `paiements_${format(new Date(), 'yyyy-MM-dd')}.csv`);
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
            <h2 className="text-2xl font-bold text-slate-800">Gestion des Paiements</h2>
            <p className="text-sm text-slate-500 mt-1">Suivez les encaissements et validez les transactions.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-medium hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Download className="w-5 h-5" />
              <span className="hidden sm:inline">Exporter CSV</span>
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
            >
              <Plus className="w-5 h-5" />
              Nouvel encaissement
            </button>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-2xl shadow-sm text-white flex items-center justify-between">
          <div>
            <p className="text-emerald-100 text-sm font-medium uppercase tracking-wider mb-1">Revenus Totaux</p>
            <h3 className="text-3xl font-bold">{formatCurrency(totalRevenue)}</h3>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <CircleDollarSign className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-bold text-slate-800">Évolution des Revenus Mensuels</h3>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input 
                type="date" 
                value={chartStartDate}
                onChange={(e) => setChartStartDate(e.target.value)}
                className="bg-transparent border-none outline-none text-slate-700 w-32"
              />
            </div>
            <span className="text-slate-400">à</span>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input 
                type="date" 
                value={chartEndDate}
                onChange={(e) => setChartEndDate(e.target.value)}
                className="bg-transparent border-none outline-none text-slate-700 w-32"
              />
            </div>
          </div>
        </div>
        
        {monthlyRevenueData.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `${value.toLocaleString('en-US')} $`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenus']}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 6, strokeWidth: 0 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-72 w-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
            <TrendingUp className="w-8 h-8 mb-2 text-slate-300" />
            <p>Aucune donnée de revenu pour cette période</p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Rechercher par étudiant ou référence..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
          />
        </div>
        
        <div className="flex flex-wrap sm:flex-nowrap gap-4">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Du</span>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-slate-700 w-28"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Au</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-slate-700 w-28"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="relative min-w-[160px] flex-1">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm appearance-none cursor-pointer"
            >
              <option value="all">Tous les types</option>
              <option value="tuition">Frais Académiques</option>
              <option value="library">Frais Bibliothèque</option>
              <option value="exam">Frais d'Examen</option>
              <option value="deposit">Frais de Dépôt</option>
              <option value="other">Autres Frais</option>
            </select>
          </div>
          <div className="relative min-w-[160px] flex-1">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm appearance-none cursor-pointer"
            >
              <option value="all">Tous les statuts</option>
              <option value="completed">Complétés</option>
              <option value="pending">En attente</option>
              <option value="failed">Échoués</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="px-6 py-4">Transaction</th>
                <th className="px-6 py-4">Étudiant</th>
                <th className="px-6 py-4">Date & Méthode</th>
                <th className="px-6 py-4 text-right">Montant</th>
                <th className="px-6 py-4 text-center">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                      Chargement des paiements...
                    </div>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Receipt className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-base font-medium text-slate-700">Aucun paiement trouvé</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => {
                  const typeInfo = typeConfig[payment.type] || typeConfig.other;
                  const statusInfo = statusConfig[payment.status] || statusConfig.pending;
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-slate-800">{typeInfo.label}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">REF: {payment.reference || payment.id.substring(0,8).toUpperCase()}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-700">{payment.studentName}</div>
                        <div className="text-xs text-slate-500">{payment.studentId || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        <div className="font-medium text-slate-700 mb-0.5">
                          {payment.createdAt ? format(payment.createdAt.toDate(), 'dd MMM yyyy', { locale: fr }) : 'N/A'}
                        </div>
                        <div className="uppercase tracking-wider text-[10px]">{payment.paymentMethod?.replace('_', ' ')}</div>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-800 text-right">
                        ${payment.amount?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {payment.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleUpdateStatus(payment.id, 'completed')}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                              title="Valider"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(payment.id, 'failed')}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Rejeter"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setSelectedPaymentForReceipt(payment)}
                            className="text-slate-400 hover:text-blue-600 transition-colors" 
                            title="Imprimer reçu"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Payment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Saisir un encaissement</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Nom de l'étudiant *</label>
                <input 
                  type="text" 
                  required
                  value={newPayment.studentName}
                  onChange={(e) => setNewPayment({...newPayment, studentName: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Ex: Jean Dupont"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Matricule</label>
                  <input 
                    type="text" 
                    value={newPayment.studentId}
                    onChange={(e) => setNewPayment({...newPayment, studentId: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Optionnel"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Montant (USD) *</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    step="0.01"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Type de frais</label>
                <select 
                  value={newPayment.type}
                  onChange={(e) => setNewPayment({...newPayment, type: e.target.value as any})}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="tuition">Frais Académiques (Minerval)</option>
                  <option value="library">Frais de Bibliothèque</option>
                  <option value="exam">Frais d'Examen</option>
                  <option value="deposit">Frais de Dépôt (TFC/Mémoire/Rapport/Autre)</option>
                  <option value="other">Autres Frais</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Méthode de paiement</label>
                <select 
                  value={newPayment.paymentMethod}
                  onChange={(e) => setNewPayment({...newPayment, paymentMethod: e.target.value as any})}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="cash">Espèces (Caisse)</option>
                  <option value="transfer">Virement Bancaire</option>
                  <option value="mobile_money">Mobile Money (M-PESA)</option>
                  <option value="chariow">Chariow</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-70 flex items-center justify-center"
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

      {/* Receipt Modal */}
      {selectedPaymentForReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 print:hidden">
              <h3 className="text-lg font-bold text-slate-800">Reçu de paiement</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => window.print()}
                  className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <Printer className="w-4 h-4" />
                  Imprimer
                </button>
                <button 
                  onClick={() => setSelectedPaymentForReceipt(null)}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-8 print:p-0" id="receipt-content">
              <div className="text-center mb-6 border-b border-slate-200 pb-6">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">AI</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">AI Studio University</h2>
                <p className="text-sm text-slate-500 mt-1">Reçu Officiel de Paiement</p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Référence</span>
                  <span className="text-sm font-mono font-medium text-slate-800">
                    {selectedPaymentForReceipt.reference || selectedPaymentForReceipt.id.substring(0, 8).toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Date</span>
                  <span className="text-sm font-medium text-slate-800">
                    {selectedPaymentForReceipt.createdAt ? format(selectedPaymentForReceipt.createdAt.toDate(), 'dd MMMM yyyy HH:mm', { locale: fr }) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Étudiant</span>
                  <span className="text-sm font-medium text-slate-800">{selectedPaymentForReceipt.studentName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Matricule</span>
                  <span className="text-sm font-medium text-slate-800">{selectedPaymentForReceipt.studentId || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Motif</span>
                  <span className="text-sm font-medium text-slate-800">
                    {typeConfig[selectedPaymentForReceipt.type]?.label || 'Autre'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Méthode</span>
                  <span className="text-sm font-medium uppercase text-slate-800">
                    {selectedPaymentForReceipt.paymentMethod?.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 mb-8 flex justify-between items-center border border-slate-100">
                <span className="font-bold text-slate-700">Montant Total</span>
                <span className="text-2xl font-bold text-blue-600">${selectedPaymentForReceipt.amount?.toFixed(2)}</span>
              </div>

              <div className="flex flex-col items-center justify-center pt-6 border-t border-slate-200">
                <QRCodeSVG 
                  value={JSON.stringify({
                    id: selectedPaymentForReceipt.id,
                    ref: selectedPaymentForReceipt.reference || selectedPaymentForReceipt.id.substring(0, 8).toUpperCase(),
                    student: selectedPaymentForReceipt.studentName,
                    amount: selectedPaymentForReceipt.amount,
                    date: selectedPaymentForReceipt.createdAt ? selectedPaymentForReceipt.createdAt.toDate().toISOString() : new Date().toISOString()
                  })} 
                  size={100}
                  level="M"
                  includeMargin={true}
                />
                <p className="text-[10px] text-slate-400 mt-2 text-center max-w-[200px]">
                  Scannez ce code QR pour vérifier l'authenticité de ce reçu.
                </p>
              </div>
            </div>
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
