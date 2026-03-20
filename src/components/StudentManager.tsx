import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, where, deleteField, getDoc, addDoc, deleteDoc, serverTimestamp, limit } from 'firebase/firestore';
import { 
  Search, Filter, Edit2, GraduationCap, X, Mail, Calendar, ChevronUp, ChevronDown, Phone, MapPin, Hash, Building2, BookOpen, QrCode, Printer, FileBadge, Download, User, AlertCircle, Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '../AuthContext';
import { QRCodeSVG } from 'qrcode.react';

type AllowedRole = 'student' | 'admin' | 'super_admin' | 'cashier' | 'professor';

interface Student {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: AllowedRole;
  faculty?: string;
  promotion?: string;
  campus?: string;
  specialty?: string;
  matricule?: string;
  tenantId?: string;
  createdAt: any;
  status?: 'active' | 'inactive';
  phone?: string;
  address?: string;
  libraryAccess?: boolean;
}

export default function StudentManager({ view = 'students' }: { view?: 'students' | 'courses' }) {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFaculty, setFilterFaculty] = useState('');
  const [filterPromotion, setFilterPromotion] = useState('');
  const [filterCampus, setFilterCampus] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [currentGroupPage, setCurrentGroupPage] = useState(1);
  const [groupsPerPage, setGroupsPerPage] = useState(9);
  
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
    name: '',
    email: '',
    role: 'student',
    faculty: '',
    promotion: '',
    campus: '',
    specialty: '',
    matricule: '',
    status: 'active',
    phone: '',
    address: '',
    libraryAccess: false
  });
  const [isSaving, setIsSaving] = useState(false);
  
  const [generatingIdFor, setGeneratingIdFor] = useState<Student | null>(null);
  const [institutionData, setInstitutionData] = useState<{name: string, logoUrl: string, address: string, primaryColor: string} | null>(null);

  const [courses, setCourses] = useState<any[]>([]);
  const [professors, setProfessors] = useState<any[]>([]);
  const [managingCoursesForGroup, setManagingCoursesForGroup] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{message: string, onConfirm: () => void} | null>(null);
  const [newCourseForm, setNewCourseForm] = useState({ name: '', professorId: '' });

  const isMatriculeValid = (matricule?: string) => {
    if (!matricule) return false;
    return /^[a-zA-Z0-9]{6,15}$/.test(matricule);
  };

  useEffect(() => {
    setCurrentPage(1);
    setCurrentGroupPage(1);
  }, [selectedGroup, searchTerm, filterFaculty, filterPromotion, filterCampus, filterSpecialty, filterStatus, filterDate]);

  useEffect(() => {
    if (!user?.tenantId) return;
    
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
      q = query(collection(db, 'users'), where('role', '==', 'student'), orderBy('createdAt', 'desc'), limit(100));
    } else {
      q = query(collection(db, 'users'), where('tenantId', '==', user.tenantId), where('role', '==', 'student'), orderBy('createdAt', 'desc'), limit(100));
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

  useEffect(() => {
    if (!user?.tenantId) return;

    const coursesQuery = query(collection(db, 'courses'), where('tenantId', '==', user.tenantId));
    const unsubscribeCourses = onSnapshot(coursesQuery, (snapshot) => {
      setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const professorsQuery = query(collection(db, 'users'), where('tenantId', '==', user.tenantId), where('role', '==', 'professor'));
    const unsubscribeProfessors = onSnapshot(professorsQuery, (snapshot) => {
      setProfessors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeCourses();
      unsubscribeProfessors();
    };
  }, [user]);

  const uniqueFaculties = Array.from(new Set(students.map(s => s.faculty).filter(Boolean))) as string[];
  
  const uniquePromotions = Array.from(new Set(
    students
      .filter(s => !filterFaculty || s.faculty === filterFaculty)
      .map(s => s.promotion)
      .filter(Boolean)
  )) as string[];

  const uniqueCampuses = Array.from(new Set(
    students
      .filter(s => (!filterFaculty || s.faculty === filterFaculty) && (!filterPromotion || s.promotion === filterPromotion))
      .map(s => s.campus)
      .filter(Boolean)
  )) as string[];

  const uniqueSpecialties = Array.from(new Set(
    students
      .filter(s => (!filterFaculty || s.faculty === filterFaculty) && (!filterPromotion || s.promotion === filterPromotion))
      .map(s => s.specialty)
      .filter(Boolean)
  )) as string[];

  const filteredStudents = students.filter(s => {
    const searchLower = searchTerm.toLowerCase().trim();
    const searchClean = searchLower.replace(/[\s-]/g, '');
    const safeString = (val: any) => (val || '').toString().toLowerCase();
    const safeCleanString = (val: any) => safeString(val).replace(/[\s-]/g, '');
    
    const matchesSearch = safeString(s.name).includes(searchLower) || 
           safeString(s.email).includes(searchLower) ||
           safeCleanString(s.matricule).includes(searchClean) ||
           safeCleanString((s as any).studentId).includes(searchClean) ||
           safeString(s.id).includes(searchClean) ||
           safeString(s.phone).includes(searchLower) ||
           safeString(s.faculty).includes(searchLower) ||
           safeString(s.promotion).includes(searchLower) ||
           safeString(s.campus).includes(searchLower) ||
           safeString(s.specialty).includes(searchLower);
           
    const matchesFaculty = filterFaculty === '' || s.faculty === filterFaculty;
    const matchesPromotion = filterPromotion === '' || s.promotion === filterPromotion;
    const matchesCampus = filterCampus === '' || s.campus === filterCampus;
    const matchesSpecialty = filterSpecialty === '' || s.specialty === filterSpecialty;
    
    const studentStatus = s.status || 'active';
    const matchesStatus = filterStatus === '' || studentStatus === filterStatus;
    
    let matchesDate = true;
    if (filterDate && s.createdAt) {
      try {
        const dateObj = s.createdAt.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
        const studentDate = format(dateObj, 'yyyy-MM-dd');
        matchesDate = studentDate === filterDate;
      } catch (e) {
        matchesDate = false;
      }
    } else if (filterDate && !s.createdAt) {
      matchesDate = false;
    }
    
    return matchesSearch && matchesFaculty && matchesPromotion && matchesCampus && matchesSpecialty && matchesStatus && matchesDate;
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
    } else if (key === 'name' || key === 'email' || key === 'id' || key === 'matricule' || key === 'faculty' || key === 'promotion') {
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
      const key = `${student.faculty || 'Non assigné'} | ${student.promotion || 'Non assignée'}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(student);
    });
    
    // Sort groups by Faculty then Promotion
    const sortedKeys = Object.keys(groups).sort((a, b) => a.localeCompare(b));
    const sortedGroups: Record<string, Student[]> = {};
    sortedKeys.forEach(key => {
      sortedGroups[key] = groups[key];
    });
    
    return sortedGroups;
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
    
    if (!isMatriculeValid(editingStudent.matricule)) {
      return;
    }
    
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', editingStudent.id);
      
      const updateData: any = {};
      
      if (editingStudent.faculty) updateData.faculty = editingStudent.faculty;
      else updateData.faculty = deleteField();
      
      if (editingStudent.promotion) updateData.promotion = editingStudent.promotion;
      else updateData.promotion = deleteField();

      if (editingStudent.campus) updateData.campus = editingStudent.campus;
      else updateData.campus = deleteField();

      if (editingStudent.specialty) updateData.specialty = editingStudent.specialty;
      else updateData.specialty = deleteField();
      
      if (editingStudent.phone) updateData.phone = editingStudent.phone;
      else updateData.phone = deleteField();
      
      if (editingStudent.address) updateData.address = editingStudent.address;
      else updateData.address = deleteField();
      
      if (editingStudent.matricule) updateData.matricule = editingStudent.matricule;
      else updateData.matricule = deleteField();
      
      if (editingStudent.status) updateData.status = editingStudent.status;
      else updateData.status = 'active';

      await updateDoc(userRef, updateData);
      setEditingStudent(null);
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.email || !user?.tenantId) return;
    
    setIsSaving(true);
    try {
      const studentData = {
        ...newStudent,
        tenantId: user.tenantId,
        createdAt: serverTimestamp(),
        role: 'student'
      };

      // Remove empty fields
      Object.keys(studentData).forEach(key => {
        if ((studentData as any)[key] === '' || (studentData as any)[key] === undefined) {
          delete (studentData as any)[key];
        }
      });

      await addDoc(collection(db, 'users'), studentData);
      
      setIsAddingStudent(false);
      setNewStudent({
        name: '',
        email: '',
        role: 'student',
        faculty: '',
        promotion: '',
        campus: '',
        specialty: '',
        matricule: '',
        status: 'active',
        phone: '',
        address: '',
        libraryAccess: false
      });
      alert("L'étudiant a été ajouté avec succès.");
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
      alert("Une erreur est survenue lors de l'ajout de l'étudiant.");
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleExportCSV = () => {
    const headers = [
      'Matricule',
      'Nom',
      'Email',
      'Téléphone',
      'Faculté',
      'Promotion',
      'Campus',
      'Spécialité',
      'Statut',
      'Date d\'inscription'
    ];

    const csvContent = [
      headers.join(','),
      ...sortedStudents.map(s => {
        const row = [
          s.matricule || '',
          `"${s.name.replace(/"/g, '""')}"`,
          s.email || '',
          s.phone || '',
          `"${(s.faculty || '').replace(/"/g, '""')}"`,
          `"${(s.promotion || '').replace(/"/g, '""')}"`,
          `"${(s.campus || '').replace(/"/g, '""')}"`,
          `"${(s.specialty || '').replace(/"/g, '""')}"`,
          s.status === 'inactive' ? 'Inactif' : 'Actif',
          s.createdAt ? (s.createdAt.toDate ? format(s.createdAt.toDate(), 'dd/MM/yyyy') : format(new Date(s.createdAt), 'dd/MM/yyyy')) : ''
        ];
        return row.join(',');
      })
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `etudiants_export_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {view === 'courses' ? 'Gestion des Cours & Programmes' : 'Gestion des Étudiants'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {view === 'courses' ? 'Gérez les cours, programmes et professeurs.' : 'Gérez les informations détaillées des étudiants.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {view === 'students' && (
            <button
              onClick={() => setIsAddingStudent(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Nouvel Étudiant</span>
            </button>
          )}
          {view === 'courses' && (user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'chef') && (
            <button
              onClick={() => setManagingCoursesForGroup('Global')}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Nouveau Cours</span>
            </button>
          )}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-medium hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-5 h-5" />
            <span className="hidden sm:inline">Exporter CSV</span>
          </button>
          <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-medium">
            {view === 'courses' ? <BookOpen className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
            <span>
              {view === 'courses' 
                ? `${courses.length} cours au total`
                : `${students.length} étudiant${students.length !== 1 ? 's' : ''} au total`
              }
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Rechercher par nom, email, matricule, département ou promotion..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
          <div className="relative w-full">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm text-slate-700 w-full"
              title="Filtrer par date d'inscription"
            />
          </div>
          <div className="relative w-full">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-9 pr-8 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm text-slate-700 w-full appearance-none cursor-pointer"
            >
              <option value="">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
          </div>
          <div className="relative w-full">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={filterFaculty}
              onChange={(e) => {
                setFilterFaculty(e.target.value);
                setFilterPromotion('');
                setFilterSpecialty('');
              }}
              className="pl-9 pr-8 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm text-slate-700 w-full appearance-none cursor-pointer"
            >
              <option value="">Toutes les facultés</option>
              {uniqueFaculties.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div className="relative w-full">
            <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={filterPromotion}
              onChange={(e) => {
                setFilterPromotion(e.target.value);
                setFilterSpecialty('');
              }}
              className="pl-9 pr-8 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm text-slate-700 w-full appearance-none cursor-pointer"
            >
              <option value="">Toutes les promos</option>
              {uniquePromotions.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="relative w-full">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={filterCampus}
              onChange={(e) => setFilterCampus(e.target.value)}
              className="pl-9 pr-8 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm text-slate-700 w-full appearance-none cursor-pointer"
            >
              <option value="">Tous les campus</option>
              {uniqueCampuses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="relative w-full">
            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={filterSpecialty}
              onChange={(e) => setFilterSpecialty(e.target.value)}
              className="pl-9 pr-8 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm text-slate-700 w-full appearance-none cursor-pointer"
            >
              <option value="">Toutes les spécialités</option>
              {uniqueSpecialties.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterFaculty('');
              setFilterPromotion('');
              setFilterCampus('');
              setFilterSpecialty('');
              setFilterStatus('');
              setFilterDate('');
            }}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-medium transition-all"
            title="Réinitialiser tous les filtres"
          >
            <X className="w-4 h-4" />
            <span className="lg:hidden xl:inline">Réinitialiser</span>
          </button>
        </div>
      </div>

      {view === 'courses' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.length === 0 ? (
              <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 border-dashed text-center">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-800">Aucun cours trouvé</h3>
                <p className="text-slate-500">Commencez par ajouter votre premier cours ou programme.</p>
              </div>
            ) : (
              courses.map(course => {
                const prof = professors.find(p => p.id === course.professorId);
                return (
                  <div key={course.id} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow group flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
                          {course.faculty || 'Non assigné'}
                        </div>
                        <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">
                          {course.promotion || 'Toutes les promos'}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2">{course.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="truncate">{prof ? prof.name : 'Professeur non assigné'}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-auto">
                      <button 
                        onClick={() => {
                          setNewCourseForm({ name: course.name, professorId: course.professorId });
                          setManagingCoursesForGroup(course.id); // Use course ID to indicate editing
                        }}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 rounded-xl text-sm font-bold transition-colors"
                      >
                        Détails
                      </button>
                      {(user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'chef') && (
                        <button 
                          onClick={() => {
                            setConfirmAction({
                              message: `Voulez-vous vraiment supprimer le cours "${course.name}" ?`,
                              onConfirm: async () => {
                                try {
                                  await deleteDoc(doc(db, 'courses', course.id));
                                  setConfirmAction(null);
                                } catch (error) {
                                  console.error("Error deleting course:", error);
                                }
                              }
                            });
                          }}
                          className="px-3 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-xl text-sm font-bold transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : !selectedGroup ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(Object.entries(groupedStudents) as [string, Student[]][])
              .slice((currentGroupPage - 1) * groupsPerPage, currentGroupPage * groupsPerPage)
              .map(([groupName, groupStudents]) => (
              <div key={groupName} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow group flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
                      {groupStudents.length} étudiant{groupStudents.length !== 1 ? 's' : ''}
                    </div>
                    {(() => {
                      const [fac, promo] = groupName.split(' | ');
                      const groupCoursesCount = courses.filter(c => 
                        (c.promotion || 'Non assignée') === promo && 
                        (c.faculty || 'Non assigné') === fac
                      ).length;
                      return (
                        <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {groupCoursesCount} cours
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">{groupName.split(' | ')[0]}</p>
                  <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2">{groupName.split(' | ')[1]}</h3>
                </div>
                <p className="text-sm text-slate-500 mb-6 flex-1">
                  Année Académique en cours
                </p>
                <div className="flex gap-2 mt-auto">
                  <button 
                    onClick={() => setSelectedGroup(groupName)}
                    className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    Voir la liste
                  </button>
                  {(user?.role === 'professor' || user?.role === 'admin' || user?.role === 'super_admin') && (
                    <button 
                      onClick={() => setManagingCoursesForGroup(groupName)}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-2.5 rounded-xl transition-colors flex items-center justify-center"
                      title={user?.role === 'professor' ? 'Gérer mes cours' : 'Gérer les cours'}
                    >
                      <BookOpen className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {Object.keys(groupedStudents).length === 0 && !loading && (
              <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
                Aucun groupe trouvé pour ces critères.
              </div>
            )}
          </div>
          
          {Object.keys(groupedStudents).length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm gap-4">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span>
                  Affichage de {Math.min((currentGroupPage - 1) * groupsPerPage + 1, Object.keys(groupedStudents).length)} à {Math.min(currentGroupPage * groupsPerPage, Object.keys(groupedStudents).length)} sur {Object.keys(groupedStudents).length} groupe(s)
                </span>
                <select 
                  value={groupsPerPage} 
                  onChange={(e) => {
                    setGroupsPerPage(Number(e.target.value));
                    setCurrentGroupPage(1);
                  }}
                  className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2 py-1 outline-none focus:border-blue-500"
                >
                  <option value={9}>9 par page</option>
                  <option value={18}>18 par page</option>
                  <option value={36}>36 par page</option>
                  <option value={90}>90 par page</option>
                </select>
              </div>
              {Math.ceil(Object.keys(groupedStudents).length / groupsPerPage) > 1 && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCurrentGroupPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentGroupPage === 1}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    Précédent
                  </button>
                  <span className="font-medium text-slate-700 text-sm px-2">
                    Page {currentGroupPage} sur {Math.ceil(Object.keys(groupedStudents).length / groupsPerPage)}
                  </span>
                  <button 
                    onClick={() => setCurrentGroupPage(prev => Math.min(prev + 1, Math.ceil(Object.keys(groupedStudents).length / groupsPerPage)))}
                    disabled={currentGroupPage === Math.ceil(Object.keys(groupedStudents).length / groupsPerPage)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    Suivant
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSelectedGroup(null)}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-bold text-slate-800">{selectedGroup}</h3>
            </div>
            {(user?.role === 'professor' || user?.role === 'admin' || user?.role === 'super_admin') && (
              <button
                onClick={() => setManagingCoursesForGroup(selectedGroup)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
              >
                <BookOpen className="w-4 h-4" />
                {user?.role === 'professor' ? 'Gérer mes cours' : 'Gérer les cours'}
              </button>
            )}
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    <th 
                      className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                      onClick={() => handleSort('matricule')}
                    >
                      <div className="flex items-center gap-1">
                        Matricule <SortIcon columnKey="matricule" />
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
                    <th className="px-6 py-4">Statut</th>
                    <th className="px-6 py-4">Bibliothèque</th>
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
                          Chargement des étudiants...
                        </div>
                      </td>
                    </tr>
                  ) : groupedStudents[selectedGroup]?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Search className="w-8 h-8 text-slate-300" />
                          </div>
                          <p className="text-base font-medium text-slate-700">Aucun étudiant trouvé</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    (groupedStudents[selectedGroup] || [])
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">
                          {s.matricule || <span className="italic opacity-50">Non défini</span>}
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
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            (!s.status || s.status === 'active') 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {(!s.status || s.status === 'active') ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={async () => {
                              try {
                                await updateDoc(doc(db, 'users', s.id), {
                                  libraryAccess: !s.libraryAccess
                                });
                              } catch (error) {
                                console.error("Error updating library access:", error);
                                alert("Erreur lors de la mise à jour de l'accès à la bibliothèque.");
                              }
                            }}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              s.libraryAccess ? 'bg-blue-600' : 'bg-slate-200'
                            }`}
                            title={s.libraryAccess ? "Révoquer l'accès" : "Accorder l'accès"}
                          >
                            <span
                              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                s.libraryAccess ? 'translate-x-5' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {s.createdAt ? (s.createdAt.toDate ? format(s.createdAt.toDate(), 'dd MMM yyyy', { locale: fr }) : format(new Date(s.createdAt), 'dd MMM yyyy', { locale: fr })) : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => setGeneratingIdFor(s)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Générer la carte d'étudiant"
                            >
                              <FileBadge className="w-4 h-4" />
                            </button>
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
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <span>
                  Affichage de {Math.min((currentPage - 1) * itemsPerPage + 1, (groupedStudents[selectedGroup] || []).length)} à {Math.min(currentPage * itemsPerPage, (groupedStudents[selectedGroup] || []).length)} sur {(groupedStudents[selectedGroup] || []).length} étudiant(s)
                </span>
                <select 
                  value={itemsPerPage} 
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-slate-200 text-slate-700 rounded-lg px-2 py-1 outline-none focus:border-blue-500"
                >
                  <option value={10}>10 par page</option>
                  <option value={25}>25 par page</option>
                  <option value={50}>50 par page</option>
                  <option value={100}>100 par page</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Précédent
                </button>
                <span className="font-medium text-slate-700">
                  Page {currentPage} sur {Math.max(1, Math.ceil((groupedStudents[selectedGroup] || []).length / itemsPerPage))}
                </span>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil((groupedStudents[selectedGroup] || []).length / itemsPerPage)))}
                  disabled={currentPage >= Math.ceil((groupedStudents[selectedGroup] || []).length / itemsPerPage)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Suivant
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10 rounded-t-2xl">
              <h3 className="text-lg font-bold text-slate-800">Modifier l'étudiant</h3>
              <button 
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Informations Personnelles */}
                <div className="md:col-span-2">
                  <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Informations Personnelles</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Matricule</label>
                      <div className="relative">
                        <Hash className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${editingStudent.matricule && !isMatriculeValid(editingStudent.matricule) ? 'text-red-400' : 'text-slate-400'}`} />
                        <input 
                          type="text" 
                          value={editingStudent.matricule || ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                            setEditingStudent({...editingStudent, matricule: val});
                          }}
                          maxLength={15}
                          placeholder="Ex: 2024001"
                          className={`w-full pl-9 pr-4 py-2.5 bg-white border rounded-xl text-sm focus:ring-2 focus:outline-none transition-all ${
                            editingStudent.matricule && !isMatriculeValid(editingStudent.matricule)
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500 text-red-900'
                              : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                      </div>
                      {editingStudent.matricule && !isMatriculeValid(editingStudent.matricule) && (
                        <p className="mt-1.5 text-xs text-red-500 font-medium">
                          Le matricule doit contenir entre 6 et 15 caractères alphanumériques.
                        </p>
                      )}
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
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Statut</label>
                      <select 
                        value={editingStudent.status || 'active'}
                        onChange={(e) => setEditingStudent({...editingStudent, status: e.target.value as 'active' | 'inactive'})}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      >
                        <option value="active">Actif</option>
                        <option value="inactive">Inactif</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
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
                  </div>
                </div>

                {/* Informations Académiques */}
                <div className="md:col-span-2 mt-2">
                  <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Informations Académiques</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Campus</label>
                      <input 
                        type="text" 
                        value={editingStudent.campus || ''}
                        onChange={(e) => setEditingStudent({...editingStudent, campus: e.target.value})}
                        placeholder="Ex: Campus Principal"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    
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
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Spécialité</label>
                      <input 
                        type="text" 
                        value={editingStudent.specialty || ''}
                        onChange={(e) => setEditingStudent({...editingStudent, specialty: e.target.value})}
                        placeholder="Ex: Génie Logiciel"
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
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={isSaving || (editingStudent.matricule ? !isMatriculeValid(editingStudent.matricule) : false)}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
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

      {/* Add Student Modal */}
      {isAddingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Ajouter un nouvel étudiant</h3>
                  <p className="text-xs text-slate-500">Remplissez les informations pour créer un profil étudiant</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddingStudent(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveNew} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informations Personnelles */}
                <div className="md:col-span-2">
                  <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Informations Personnelles</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Nom complet *</label>
                      <input 
                        type="text" 
                        required
                        value={newStudent.name || ''} 
                        onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                        placeholder="Ex: Jean Dupont"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Email *</label>
                      <input 
                        type="email" 
                        required
                        value={newStudent.email || ''} 
                        onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                        placeholder="Ex: jean.dupont@exemple.com"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Téléphone</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input 
                          type="tel" 
                          value={newStudent.phone || ''} 
                          onChange={(e) => setNewStudent({...newStudent, phone: e.target.value})}
                          placeholder="+243 ..."
                          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Matricule</label>
                      <div className="relative">
                        <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input 
                          type="text" 
                          value={newStudent.matricule || ''} 
                          onChange={(e) => setNewStudent({...newStudent, matricule: e.target.value.toUpperCase()})}
                          placeholder="Ex: 2024ABC123"
                          className={`w-full pl-9 pr-4 py-2.5 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                            newStudent.matricule && !isMatriculeValid(newStudent.matricule) 
                              ? 'border-red-300 bg-red-50' 
                              : 'border-slate-200'
                          }`}
                        />
                      </div>
                      {newStudent.matricule && !isMatriculeValid(newStudent.matricule) && (
                        <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          6-15 caractères alphanumériques
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Adresse</label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <textarea 
                          value={newStudent.address || ''}
                          onChange={(e) => setNewStudent({...newStudent, address: e.target.value})}
                          placeholder="Adresse complète"
                          rows={2}
                          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informations Académiques */}
                <div className="md:col-span-2 mt-2">
                  <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Informations Académiques</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Campus</label>
                      <input 
                        type="text" 
                        value={newStudent.campus || ''}
                        onChange={(e) => setNewStudent({...newStudent, campus: e.target.value})}
                        placeholder="Ex: Campus Principal"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Faculté</label>
                      <input 
                        type="text" 
                        value={newStudent.faculty || ''}
                        onChange={(e) => setNewStudent({...newStudent, faculty: e.target.value})}
                        placeholder="Ex: Sciences"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Spécialité</label>
                      <input 
                        type="text" 
                        value={newStudent.specialty || ''}
                        onChange={(e) => setNewStudent({...newStudent, specialty: e.target.value})}
                        placeholder="Ex: Génie Logiciel"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Promotion</label>
                      <input 
                        type="text" 
                        value={newStudent.promotion || ''}
                        onChange={(e) => setNewStudent({...newStudent, promotion: e.target.value})}
                        placeholder="Ex: L3 Info"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddingStudent(false)}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={isSaving || (newStudent.matricule ? !isMatriculeValid(newStudent.matricule) : false)}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Ajouter l\'étudiant'
                  )}
                </button>
              </div>
            </form>
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
                  <h3 className="font-bold text-slate-800">Carte d'Étudiant</h3>
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
                    <p className="text-sm font-medium text-slate-500 mt-1">ÉTUDIANT(E)</p>
                  </div>

                  <div className="w-full space-y-2.5 mb-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Matricule</span>
                      <span className="text-xs font-bold text-slate-800 font-mono">{generatingIdFor.matricule || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Faculté</span>
                      <span className="text-xs font-semibold text-slate-700">{generatingIdFor.faculty || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Promotion</span>
                      <span className="text-xs font-semibold text-slate-700">{generatingIdFor.promotion || 'N/A'}</span>
                    </div>
                    {(generatingIdFor.campus || generatingIdFor.specialty) && (
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Campus / Spéc.</span>
                        <span className="text-xs font-semibold text-slate-700 truncate max-w-[150px] text-right">
                          {[generatingIdFor.campus, generatingIdFor.specialty].filter(Boolean).join(' - ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* QR Code */}
                  <div className="mt-auto flex flex-col items-center">
                    <div className="p-1.5 bg-white rounded-lg shadow-sm border border-slate-100">
                      <QRCodeSVG 
                        value={`student:${generatingIdFor.id}:${generatingIdFor.matricule}`} 
                        size={64} 
                        level="M"
                        fgColor={institutionData?.primaryColor || '#2563eb'}
                      />
                    </div>
                    <p className="text-[8px] text-slate-400 mt-2 font-mono uppercase tracking-widest">
                      ID: {generatingIdFor.id.substring(0, 8)}
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
                disabled={!isMatriculeValid(generatingIdFor.matricule)}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer className="w-4 h-4" />
                Imprimer
              </button>
            </div>
            {!isMatriculeValid(generatingIdFor.matricule) && (
              <div className="px-4 pb-4 bg-slate-50 text-center">
                <p className="text-xs text-red-500 font-medium">
                  Impossible d'imprimer : le matricule doit contenir entre 6 et 15 caractères alphanumériques. Veuillez modifier l'étudiant.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de gestion des cours pour le groupe */}
      {managingCoursesForGroup && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Cours du groupe</h2>
                <p className="text-sm text-slate-500">{managingCoursesForGroup}</p>
              </div>
              <button 
                onClick={() => setManagingCoursesForGroup(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
              <div className="space-y-6">
                {/* Liste des cours actuels */}
                <div>
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Cours associés</h3>
                  {(() => {
                    const isGlobal = managingCoursesForGroup === 'Global';
                    const isEditing = !isGlobal && !managingCoursesForGroup.includes(' | ');
                    
                    if (isEditing) {
                      const course = courses.find(c => c.id === managingCoursesForGroup);
                      if (!course) return null;
                      const prof = professors.find(p => p.id === course.professorId);
                      return (
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                          <h3 className="text-lg font-bold text-slate-800 mb-4">Détails du cours</h3>
                          <div className="space-y-4">
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nom du cours</p>
                              <p className="text-slate-800 font-medium">{course.name}</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Professeur</p>
                              <p className="text-slate-800 font-medium">{prof ? prof.name : 'Non assigné'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Faculté / Promotion</p>
                              <p className="text-slate-800 font-medium">{course.faculty || 'N/A'} | {course.promotion || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    const [fac, promo] = !isGlobal ? managingCoursesForGroup.split(' | ') : [null, null];
                    const groupCourses = !isGlobal ? courses.filter(c => 
                      (c.promotion || 'Non assignée') === promo && 
                      (c.faculty || 'Non assigné') === fac
                    ) : [];

                    if (!isGlobal && groupCourses.length === 0) {
                      return (
                        <div className="text-center py-8 bg-white rounded-xl border border-slate-200 border-dashed">
                          <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-sm text-slate-500">Aucun cours n'est encore associé à ce groupe.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid gap-3">
                        {groupCourses.map(course => {
                          const prof = professors.find(p => p.id === course.professorId);
                          return (
                            <div key={course.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center group hover:border-blue-300 transition-colors">
                              <div>
                                <h4 className="font-bold text-slate-800">{course.name}</h4>
                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {prof ? prof.name : 'Professeur inconnu'}
                                </p>
                              </div>
                              {(user?.uid === course.professorId || user?.role === 'admin' || user?.role === 'super_admin') && (
                                <button
                                  onClick={() => {
                                    setConfirmAction({
                                      message: 'Voulez-vous vraiment retirer ce cours de ce groupe ?',
                                      onConfirm: async () => {
                                        try {
                                          await updateDoc(doc(db, 'courses', course.id), {
                                            faculty: '',
                                            promotion: ''
                                          });
                                        } catch (error) {
                                          console.error("Error removing course from group:", error);
                                        }
                                      }
                                    });
                                  }}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                  title="Retirer du groupe"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Formulaire d'ajout de cours */}
                {(user?.role === 'professor' || user?.role === 'admin' || user?.role === 'super_admin') && (
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-6">
                    {managingCoursesForGroup !== 'Global' && !courses.find(c => c.id === managingCoursesForGroup) && (
                      <div>
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Associer un cours existant</h3>
                        <div className="flex gap-3">
                          <select
                            className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            onChange={async (e) => {
                              if (!e.target.value) return;
                              const courseId = e.target.value;
                              const [fac, promo] = managingCoursesForGroup.split(' | ');
                              try {
                                await updateDoc(doc(db, 'courses', courseId), {
                                  faculty: fac === 'Non assigné' ? '' : fac,
                                  promotion: promo === 'Non assignée' ? '' : promo
                                });
                                e.target.value = ''; // Reset select
                              } catch (error) {
                                console.error("Error updating course:", error);
                              }
                            }}
                          >
                            <option value="">Sélectionner un cours...</option>
                            {courses
                              .filter(c => (user.role === 'professor' ? c.professorId === user.uid : true) && ((c.promotion || 'Non assignée') !== managingCoursesForGroup.split(' | ')[1] || (c.faculty || 'Non assigné') !== managingCoursesForGroup.split(' | ')[0]))
                              .map(c => (
                                <option key={c.id} value={c.id}>{c.name} {c.promotion || c.faculty ? `(Actuellement: ${c.faculty || 'N/A'} | ${c.promotion || 'N/A'})` : ''}</option>
                              ))
                            }
                          </select>
                        </div>
                      </div>
                    )}

                    <div className="pt-6 border-t border-slate-100">
                      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">
                        {courses.find(c => c.id === managingCoursesForGroup) ? 'Modifier le cours' : 'Créer un nouveau cours'}
                      </h3>
                      <form 
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!newCourseForm.name.trim()) return;
                          if (user.role !== 'professor' && !newCourseForm.professorId) {
                            alert("Veuillez sélectionner un professeur.");
                            return;
                          }
                          
                          const isEditing = courses.find(c => c.id === managingCoursesForGroup);
                          
                          try {
                            if (isEditing) {
                              await updateDoc(doc(db, 'courses', managingCoursesForGroup), {
                                name: newCourseForm.name,
                                professorId: user.role === 'professor' ? user.uid : newCourseForm.professorId,
                              });
                            } else {
                              const [fac, promo] = managingCoursesForGroup !== 'Global' ? managingCoursesForGroup.split(' | ') : ['', ''];
                              await addDoc(collection(db, 'courses'), {
                                name: newCourseForm.name,
                                faculty: fac === 'Non assigné' ? '' : fac,
                                promotion: promo === 'Non assignée' ? '' : promo,
                                professorId: user.role === 'professor' ? user.uid : newCourseForm.professorId,
                                tenantId: user.tenantId,
                                createdAt: serverTimestamp(),
                                description: '',
                                notes: '',
                                deadline: ''
                              });
                            }
                            setNewCourseForm({ name: '', professorId: '' });
                            setManagingCoursesForGroup(null);
                          } catch (error) {
                            console.error("Error saving course:", error);
                          }
                        }}
                        className="flex flex-col gap-3"
                      >
                        <div className="flex gap-3">
                          <input
                            type="text"
                            placeholder="Nom du cours (ex: Mathématiques Avancées)"
                            value={newCourseForm.name}
                            onChange={(e) => setNewCourseForm({ ...newCourseForm, name: e.target.value })}
                            className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                          />
                          {user.role !== 'professor' && (
                            <select
                              value={newCourseForm.professorId}
                              onChange={(e) => setNewCourseForm({ ...newCourseForm, professorId: e.target.value })}
                              className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                              required
                            >
                              <option value="">Sélectionner un professeur...</option>
                              {professors.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          )}
                          <button
                            type="submit"
                            disabled={!newCourseForm.name.trim() || (user.role !== 'professor' && !newCourseForm.professorId)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                          >
                            Créer
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Confirmation</h3>
              <p className="text-slate-600 text-sm mb-6">{confirmAction.message}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    confirmAction.onConfirm();
                    setConfirmAction(null);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
