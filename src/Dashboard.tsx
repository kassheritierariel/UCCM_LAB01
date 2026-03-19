import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from './firebase';
import { collection, query, onSnapshot, orderBy, limit, where, updateDoc, doc } from 'firebase/firestore';
import {
  BookOpen, Bell, Users, Banknote, Clock, PieChart, Download, Printer,
  UserPlus, CircleDollarSign, FileText, Settings, ChevronRight, ArrowRight,
  MoreHorizontal, ArrowUpRight, LogOut, LayoutDashboard, Search, Menu, X,
  GraduationCap, Briefcase, Award, ShieldCheck, Calculator, Building2, Sparkles, Library
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Logo from './components/Logo';
import UsersManager from './components/UsersManager';
import StudentManager from './components/StudentManager';
import DocumentsManager from './components/DocumentsManager';
import PaymentsManager from './components/PaymentsManager';
import InstitutionsManager from './components/InstitutionsManager';
import AITools from './components/AITools';
import SettingsManager from './components/SettingsManager';
import DigitalLibrary from './components/DigitalLibrary';

const DistributionBar = ({ label, percentage, colorClass }: { label: string, percentage: number, colorClass: string }) => {
  const colorMap: Record<string, { bg: string, text: string, barBg: string, barFill: string }> = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', barBg: 'bg-blue-50', barFill: 'bg-blue-500' },
    red: { bg: 'bg-red-100', text: 'text-red-600', barBg: 'bg-red-50', barFill: 'bg-red-400' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-600', barBg: 'bg-amber-50', barFill: 'bg-amber-400' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', barBg: 'bg-emerald-50', barFill: 'bg-emerald-400' },
  };
  const colors = colorMap[colorClass];

  return (
    <div className="relative pt-1">
      <div className="flex mb-2 items-center justify-between">
        <div className="flex items-center">
          <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${colors.text} ${colors.bg}`}>
            {label}
          </span>
        </div>
        <div className="text-right">
          <span className={`text-xs font-semibold inline-block ${colors.text}`}>
            {percentage}%
          </span>
        </div>
      </div>
      <div className={`overflow-hidden h-2 mb-4 text-xs flex rounded ${colors.barBg}`}>
        <div style={{ width: `${percentage}%` }} className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${colors.barFill}`}></div>
      </div>
    </div>
  );
};

const ShortcutButton = ({ icon, title, subtitle, colorClass, onClick }: any) => {
  const colorMap: Record<string, { bg: string, text: string, hoverBg: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-500', hoverBg: 'group-hover:bg-blue-500' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-500', hoverBg: 'group-hover:bg-emerald-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-500', hoverBg: 'group-hover:bg-amber-500' },
    slate: { bg: 'bg-slate-100', text: 'text-slate-600', hoverBg: 'group-hover:bg-slate-700' },
  };
  const colors = colorMap[colorClass];

  return (
    <button onClick={onClick} className="flex items-center gap-4 p-5 bg-white rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-lg hover:-translate-y-1 transition-all group w-full text-left">
      <div className={`w-10 h-10 rounded-lg ${colors.bg} ${colors.text} flex items-center justify-center ${colors.hoverBg} group-hover:text-white transition-colors shrink-0`}>
        {icon}
      </div>
      <div>
        <span className="block text-xs font-bold text-slate-800 uppercase tracking-tight">{title}</span>
        <span className="text-[10px] text-slate-400">{subtitle}</span>
      </div>
    </button>
  );
};

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [usersCount, setUsersCount] = useState(0);
  const [docsCount, setDocsCount] = useState(0);
  const [paymentsCount, setPaymentsCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [institutionsCount, setInstitutionsCount] = useState(0);
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [tenantSettings, setTenantSettings] = useState<any>(null);

  useEffect(() => {
    if (!user || user.tenantId === 'SYSTEM') return;
    
    const unsubscribe = onSnapshot(doc(db, 'institutions', user.tenantId), (docSnap) => {
      if (docSnap.exists()) {
        setTenantSettings(docSnap.data());
      }
    }, (error) => {
      console.error("Error fetching tenant settings:", error);
    });
    
    return () => unsubscribe();
  }, [user]);

  // Example data fetching for overview
  useEffect(() => {
    if (!user) return;

    // Institutions count for super_admin
    if (user.role === 'super_admin') {
      const q = query(collection(db, 'institutions'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setInstitutionsCount(snapshot.size);
      }, (error) => {
        console.error("Error fetching institutions count:", error);
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Users count
    if (['admin', 'super_admin'].includes(user.role)) {
      const q = user.role === 'super_admin' ? query(collection(db, 'users')) : query(collection(db, 'users'), where('tenantId', '==', user.tenantId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setUsersCount(snapshot.size);
      }, (error) => {
        console.error("Error fetching users count:", error);
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    // Docs count
    if (['admin', 'chef', 'super_admin'].includes(user.role)) {
      const q = user.role === 'super_admin' ? query(collection(db, 'documents')) : query(collection(db, 'documents'), where('tenantId', '==', user.tenantId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setDocsCount(snapshot.size);
      }, (error) => {
        console.error("Error fetching docs count:", error);
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    // Payments count & revenue
    if (['admin', 'cashier', 'super_admin'].includes(user.role)) {
      const q = user.role === 'super_admin' ? query(collection(db, 'payments')) : query(collection(db, 'payments'), where('tenantId', '==', user.tenantId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setPaymentsCount(snapshot.size);
        let rev = 0;
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.status === 'completed') rev += (data.amount || 0);
        });
        setTotalRevenue(rev);
      }, (error) => {
        console.error("Error fetching payments count:", error);
      });
      return () => unsubscribe();
    }
  }, [user]);

  // Notifications fetching
  useEffect(() => {
    if (!user) return;
    let q;
    if (user.role === 'super_admin') {
      q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(10));
    } else if (['admin', 'chef', 'cashier'].includes(user.role)) {
      q = query(collection(db, 'notifications'), where('tenantId', '==', user.tenantId), orderBy('createdAt', 'desc'), limit(10));
    } else {
      q = query(collection(db, 'notifications'), where('tenantId', '==', user.tenantId), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(10));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifs);
    }, (error) => {
      console.error("Error fetching notifications:", error);
    });
    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (notifId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notifId), { read: true });
    } catch (error) {
      console.error("Error marking as read", error);
    }
  };

  const markAllAsRead = async () => {
    notifications.filter(n => !n.read).forEach(n => markAsRead(n.id));
  };

  const navigation = [
    { id: 'overview', name: "Vue d'ensemble", icon: LayoutDashboard, roles: ['admin', 'cashier', 'chef', 'super_admin'], group: 'Général' },
    { id: 'institutions', name: 'Institutions SaaS', icon: Building2, roles: ['super_admin'], group: 'Gestion' },
    { id: 'users', name: 'Utilisateurs', icon: Users, roles: ['admin', 'super_admin'], group: 'Gestion' },
    { id: 'students', name: 'Étudiants', icon: GraduationCap, roles: ['admin', 'chef', 'super_admin'], group: 'Gestion', feature: 'students' },
    { id: 'documents', name: 'Documents & TFC', icon: FileText, roles: ['admin', 'chef', 'super_admin'], group: 'Gestion', feature: 'documents' },
    { id: 'payments', name: 'Paiements', icon: CircleDollarSign, roles: ['admin', 'cashier', 'super_admin'], group: 'Gestion', feature: 'payments' },
    { id: 'library', name: 'Bibliothèque Numérique', icon: Library, roles: ['admin', 'chef', 'super_admin', 'student', 'professor'], group: 'Outils', feature: 'library' },
    { id: 'ai', name: 'Outils IA', icon: Sparkles, roles: ['admin', 'super_admin', 'chef', 'cashier'], group: 'Outils', feature: 'ai' },
    { id: 'settings', name: 'Paramètres', icon: Settings, roles: ['admin', 'super_admin'], group: 'Outils' },
  ];

  const allowedNav = navigation.filter(item => {
    if (!item.roles.includes(user?.role || '')) return false;
    if (user?.role === 'super_admin') return true;
    if (item.feature && tenantSettings?.features) {
      return tenantSettings.features.includes(item.feature);
    }
    return true;
  });

  // Group navigation items
  const groupedNav = allowedNav.reduce((acc, item) => {
    if (!acc[item.group]) {
      acc[item.group] = [];
    }
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, typeof allowedNav>);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin': return <ShieldCheck className="w-4 h-4 text-slate-800" />;
      case 'admin': return <ShieldCheck className="w-4 h-4 text-purple-600" />;
      case 'student': return <GraduationCap className="w-4 h-4 text-blue-600" />;
      case 'professor': return <Briefcase className="w-4 h-4 text-emerald-600" />;
      case 'cashier': return <Calculator className="w-4 h-4 text-amber-600" />;
      case 'chef': return <Award className="w-4 h-4 text-rose-600" />;
      default: return <Users className="w-4 h-4 text-slate-600" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin SaaS';
      case 'admin': return 'Administrateur';
      case 'student': return 'Étudiant';
      case 'professor': return 'Professeur';
      case 'cashier': return 'Caissier';
      case 'chef': return 'Chef de Dép.';
      default: return role;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans antialiased overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 text-slate-300 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: tenantSettings?.settings?.primaryColor ? '#1e293b' : undefined }} // Keep dark theme but allow customization if needed, or just use default slate-900
      >
        <div className={`absolute inset-0 bg-slate-900 ${tenantSettings?.settings?.primaryColor ? 'opacity-90' : ''}`} style={{ backgroundColor: tenantSettings?.settings?.primaryColor }}></div>
        
        <div className="relative flex items-center justify-between h-16 px-6 bg-black/20 border-b border-white/10">
          <div className="flex items-center gap-3">
            {tenantSettings?.settings?.logoUrl ? (
              <img src={tenantSettings.settings.logoUrl} alt="Logo" className="h-8 w-auto rounded object-contain bg-white/10 p-1" />
            ) : (
              <Logo className="w-8 h-8" withText={false} />
            )}
            <span className="text-lg font-extrabold text-white tracking-tight truncate">
              {tenantSettings?.name || user?.tenantName || 'UCCM'}
            </span>
          </div>
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative flex-1 overflow-y-auto py-6 px-4 space-y-6">
          {Object.entries(groupedNav).map(([groupName, items]) => (
            <div key={groupName} className="px-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{groupName}</p>
              <div className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive 
                          ? 'bg-white/20 text-white shadow-sm' 
                          : 'text-white/60 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white/60'}`} />
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="relative p-4 border-t border-white/10 bg-black/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold uppercase shrink-0">
              {user?.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                {getRoleIcon(user?.role || '')}
                <p className="text-xs text-white/60 truncate">{getRoleLabel(user?.role || '')}</p>
              </div>
            </div>
          </div>
          <button 
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden text-slate-500 hover:text-slate-700"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-slate-800 hidden sm:block">
              {allowedNav.find(n => n.id === activeTab)?.name}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="pl-9 pr-4 py-2 bg-slate-100 border-transparent rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all w-64"
              />
            </div>
            <div className="relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800">Notifications</h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:text-blue-800">
                        Tout marquer comme lu
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-slate-500 text-sm">Aucune notification</div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${!n.read ? 'bg-blue-50/50' : ''}`}
                          onClick={() => markAsRead(n.id)}
                        >
                          <p className={`text-sm ${!n.read ? 'font-medium text-slate-800' : 'text-slate-600'}`}>
                            {n.message}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {n.createdAt ? format(n.createdAt.toDate(), 'dd MMM à HH:mm', { locale: fr }) : ''}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 border-t border-slate-100 bg-slate-50">
                    <button 
                      onClick={() => {
                        setIsNotifOpen(false);
                        setActiveTab('notifications');
                      }}
                      className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Voir toutes les notifications
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-2xl font-bold text-slate-800">
                  Bienvenue, {user?.name}
                </h2>
                <p className="text-slate-500 mt-1">
                  {user?.role === 'super_admin' && "Voici un aperçu global de votre plateforme SaaS."}
                  {user?.role === 'admin' && "Voici un aperçu de l'activité de l'université."}
                  {user?.role === 'cashier' && "Voici un aperçu de l'activité financière."}
                  {user?.role === 'chef' && "Voici un aperçu des activités académiques."}
                </p>
              </div>
              
              {/* SUPER ADMIN OVERVIEW */}
              {user?.role === 'super_admin' && (
                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="text-slate-500 text-sm font-medium uppercase tracking-tight">Institutions Actives</span>
                      <span className="bg-indigo-50 text-indigo-500 p-2 rounded-lg">
                        <Building2 className="h-5 w-5" />
                      </span>
                    </div>
                    <div className="mt-4">
                      <h2 className="text-3xl font-bold text-slate-800">{institutionsCount}</h2>
                      <p className="text-xs text-emerald-600 mt-1 flex items-center font-semibold">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        Institutions clientes
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="text-slate-500 text-sm font-medium uppercase tracking-tight">MRR Global</span>
                      <span className="bg-emerald-50 text-emerald-500 p-2 rounded-lg">
                        <CircleDollarSign className="h-5 w-5" />
                      </span>
                    </div>
                    <div className="mt-4">
                      <h2 className="text-3xl font-bold text-slate-800">{totalRevenue.toLocaleString('en-US')} $</h2>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Objectif mensuel: 85% atteint</p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="text-slate-500 text-sm font-medium uppercase tracking-tight">Utilisateurs Globaux</span>
                      <span className="bg-blue-50 text-blue-500 p-2 rounded-lg">
                        <Users className="h-5 w-5" />
                      </span>
                    </div>
                    <div className="mt-4">
                      <h2 className="text-3xl font-bold text-slate-800">{usersCount}</h2>
                      <p className="text-xs text-slate-500 mt-1 font-medium">Sur toutes les plateformes</p>
                    </div>
                  </div>
                </section>
              )}

              {/* ADMIN OVERVIEW */}
              {user?.role === 'admin' && (
                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="text-slate-500 text-sm font-medium uppercase tracking-tight">Utilisateurs</span>
                      <span className="bg-blue-50 text-blue-500 p-2 rounded-lg">
                        <Users className="h-5 w-5" />
                      </span>
                    </div>
                    <div className="mt-4">
                      <h2 className="text-3xl font-bold text-slate-800">{usersCount}</h2>
                      <p className="text-xs text-emerald-600 mt-1 flex items-center font-semibold">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        Inscrits sur la plateforme
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="text-slate-500 text-sm font-medium uppercase tracking-tight">Revenus Totaux</span>
                      <span className="bg-emerald-50 text-emerald-500 p-2 rounded-lg">
                        <Banknote className="h-5 w-5" />
                      </span>
                    </div>
                    <div className="mt-4">
                      <h2 className="text-3xl font-bold text-slate-800">{totalRevenue.toLocaleString('en-US')} $</h2>
                      <p className="text-xs text-slate-500 mt-1 font-medium">Paiements complétés</p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="text-slate-500 text-sm font-medium uppercase tracking-tight">Documents Déposés</span>
                      <span className="bg-amber-50 text-amber-500 p-2 rounded-lg">
                        <FileText className="h-5 w-5" />
                      </span>
                    </div>
                    <div className="mt-4">
                      <h2 className="text-3xl font-bold text-slate-800">{docsCount}</h2>
                      <p className="text-xs text-slate-500 mt-1 font-medium">TFC & Mémoires</p>
                    </div>
                  </div>
                </section>
              )}

              {/* CASHIER OVERVIEW */}
              {user?.role === 'cashier' && (
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="text-slate-500 text-sm font-medium uppercase tracking-tight">Revenus Encaissés</span>
                      <span className="bg-emerald-50 text-emerald-500 p-2 rounded-lg">
                        <CircleDollarSign className="h-5 w-5" />
                      </span>
                    </div>
                    <div className="mt-4">
                      <h2 className="text-3xl font-bold text-slate-800">{totalRevenue.toLocaleString('en-US')} $</h2>
                      <p className="text-xs text-slate-500 mt-1 font-medium">Total des paiements validés</p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="text-slate-500 text-sm font-medium uppercase tracking-tight">Transactions</span>
                      <span className="bg-blue-50 text-blue-500 p-2 rounded-lg">
                        <Banknote className="h-5 w-5" />
                      </span>
                    </div>
                    <div className="mt-4">
                      <h2 className="text-3xl font-bold text-slate-800">{paymentsCount}</h2>
                      <p className="text-xs text-slate-500 mt-1 font-medium">Nombre total de paiements</p>
                    </div>
                  </div>
                </section>
              )}

              {/* CHEF OVERVIEW */}
              {user?.role === 'chef' && (
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="text-slate-500 text-sm font-medium uppercase tracking-tight">Documents Soumis</span>
                      <span className="bg-blue-50 text-blue-500 p-2 rounded-lg">
                        <FileText className="h-5 w-5" />
                      </span>
                    </div>
                    <div className="mt-4">
                      <h2 className="text-3xl font-bold text-slate-800">{docsCount}</h2>
                      <p className="text-xs text-slate-500 mt-1 font-medium">TFC & Mémoires dans le système</p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between ring-2 ring-amber-500 ring-opacity-20">
                    <div className="flex justify-between items-start">
                      <span className="text-slate-500 text-sm font-medium uppercase tracking-tight">Actions Requises</span>
                      <span className="bg-amber-50 text-amber-500 p-2 rounded-lg">
                        <Clock className="h-5 w-5" />
                      </span>
                    </div>
                    <div className="mt-4">
                      <h2 className="text-3xl font-bold text-slate-800">Vérifier</h2>
                      <p className="text-xs text-slate-500 mt-1 font-medium">Consultez l'onglet Documents pour valider les TFC.</p>
                      <button 
                        onClick={() => setActiveTab('documents')}
                        className="mt-3 text-xs font-bold text-blue-500 hover:underline flex items-center gap-1"
                      >
                        Aller aux documents
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {user?.role === 'admin' && (
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-slate-400" />
                      Distribution par Faculté
                    </h3>
                    <div className="space-y-6">
                      <DistributionBar label="Sciences & Tech" percentage={35} colorClass="blue" />
                      <DistributionBar label="Médecine" percentage={24} colorClass="red" />
                      <DistributionBar label="Droit & Gestion" percentage={22} colorClass="amber" />
                      <DistributionBar label="Arts & Lettres" percentage={19} colorClass="emerald" />
                    </div>
                  </div>

                  <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <LayoutDashboard className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Bienvenue sur votre tableau de bord</h3>
                    <p className="text-slate-500 max-w-md">
                      Sélectionnez une rubrique dans le menu de gauche pour commencer à gérer les utilisateurs, les documents ou les paiements.
                    </p>
                  </div>
                </section>
              )}

              {user?.role === 'admin' && (
                <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <ShortcutButton onClick={() => setActiveTab('users')} icon={<UserPlus className="h-5 w-5" />} title="Nouvel Utilisateur" subtitle="Créer un compte" colorClass="blue" />
                  <ShortcutButton onClick={() => setActiveTab('payments')} icon={<CircleDollarSign className="h-5 w-5" />} title="Encaissement" subtitle="Frais & Dépôts" colorClass="emerald" />
                  <ShortcutButton onClick={() => setActiveTab('documents')} icon={<FileText className="h-5 w-5" />} title="Rapports" subtitle="Journalier & Hebdo" colorClass="amber" />
                  <ShortcutButton onClick={() => setActiveTab('settings')} icon={<Settings className="h-5 w-5" />} title="Système" subtitle="Paramètres" colorClass="slate" />
                </section>
              )}

              {user?.role === 'cashier' && (
                <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <ShortcutButton onClick={() => setActiveTab('payments')} icon={<CircleDollarSign className="h-5 w-5" />} title="Nouveau Paiement" subtitle="Enregistrer" colorClass="emerald" />
                  <ShortcutButton onClick={() => setActiveTab('payments')} icon={<FileText className="h-5 w-5" />} title="Reçus" subtitle="Historique" colorClass="blue" />
                </section>
              )}

              {user?.role === 'chef' && (
                <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <ShortcutButton onClick={() => setActiveTab('documents')} icon={<FileText className="h-5 w-5" />} title="Nouveau Document" subtitle="Ajouter" colorClass="blue" />
                  <ShortcutButton onClick={() => setActiveTab('students')} icon={<Users className="h-5 w-5" />} title="Étudiants" subtitle="Liste" colorClass="emerald" />
                </section>
              )}
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-800">Toutes les notifications</h2>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-lg transition-colors"
                    >
                      Tout marquer comme lu
                    </button>
                  )}
                </div>
                
                <div className="space-y-4">
                  {notifications.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>Vous n'avez aucune notification.</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        className={`p-4 rounded-xl border transition-colors flex gap-4 ${!n.read ? 'bg-blue-50/50 border-blue-100' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${!n.read ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                          <Bell className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm ${!n.read ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                            {n.message}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {n.createdAt ? format(n.createdAt.toDate(), 'dd MMMM yyyy à HH:mm', { locale: fr }) : ''}
                          </p>
                        </div>
                        {!n.read && (
                          <button 
                            onClick={() => markAsRead(n.id)}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800 self-center shrink-0"
                          >
                            Marquer comme lu
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && <UsersManager />}

          {/* STUDENTS TAB */}
          {activeTab === 'students' && <StudentManager />}

          {/* DOCUMENTS TAB */}
          {activeTab === 'documents' && <DocumentsManager />}

          {/* PAYMENTS TAB */}
          {activeTab === 'payments' && <PaymentsManager />}

          {/* INSTITUTIONS TAB */}
          {activeTab === 'institutions' && <InstitutionsManager />}

          {/* AI TOOLS TAB */}
          {activeTab === 'ai' && <AITools />}

          {/* LIBRARY TAB */}
          {activeTab === 'library' && <DigitalLibrary />}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && <SettingsManager />}

          {/* PLACEHOLDER TABS */}
          {activeTab !== 'overview' && activeTab !== 'users' && activeTab !== 'students' && activeTab !== 'documents' && activeTab !== 'payments' && activeTab !== 'institutions' && activeTab !== 'ai' && activeTab !== 'library' && activeTab !== 'settings' && activeTab !== 'notifications' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center max-w-4xl mx-auto mt-8">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                {activeTab === 'users' && <Users className="w-10 h-10 text-blue-500" />}
                {activeTab === 'students' && <GraduationCap className="w-10 h-10 text-blue-500" />}
                {activeTab === 'documents' && <FileText className="w-10 h-10 text-blue-500" />}
                {activeTab === 'payments' && <CircleDollarSign className="w-10 h-10 text-blue-500" />}
                {activeTab === 'settings' && <Settings className="w-10 h-10 text-blue-500" />}
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-3">
                Module {allowedNav.find(n => n.id === activeTab)?.name}
              </h2>
              <p className="text-slate-500 max-w-lg mx-auto">
                L'interface de gestion détaillée pour ce module est en cours de construction. 
                Elle vous permettra de visualiser, filtrer et modifier les données correspondantes.
              </p>
              <button 
                onClick={() => setActiveTab('overview')}
                className="mt-8 px-6 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
              >
                Retour à la vue d'ensemble
              </button>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
