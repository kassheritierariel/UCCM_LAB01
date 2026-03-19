import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { BookOpen, Bell, LogOut, Upload, Users, FileText, MessageSquare, Sparkles, Plus, Edit2, Trash2, X, Calendar, UserPlus, CheckCircle, XCircle, ChevronRight, ChevronLeft, Home, AlertCircle } from 'lucide-react';
import ProfessorAITools from './components/ProfessorAITools';
import { db, storage } from './firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import Logo from './components/Logo';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface EnrolledStudent {
  name: string;
  email: string;
  studentId: string;
}

interface Course {
  id: string;
  name: string;
  faculty: string;
  promotion: string;
  professorId: string;
  tenantId: string;
  status?: 'planifié' | 'en cours' | 'terminé' | 'annulé';
  description?: string;
  notes?: string;
  deadline?: string;
  enrolledStudents?: EnrolledStudent[];
  createdAt: any;
}

interface CourseDocument {
  id: string;
  title: string;
  description: string;
  type: 'syllabus' | 'notes' | 'exercise' | 'other';
  fileName: string;
  fileUrl: string;
  courseId: string;
  professorId: string;
  tenantId: string;
  createdAt: any;
}

interface Student {
  id: string;
  faculty?: string;
  promotion?: string;
  tenantId?: string;
}

interface AppNotification {
  id: string;
  title: string;
  message: string;
  date: Date;
  type: 'deadline' | 'enrollment';
}

export default function ProfessorPortal() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'courses' | 'students' | 'ai'>('courses');
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courseDocuments, setCourseDocuments] = useState<CourseDocument[]>([]);
  
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', description: '', type: 'syllabus', courseId: '', fileName: '', fileUrl: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseForm, setCourseForm] = useState({ name: '', faculty: '', promotion: '', description: '', notes: '', deadline: '', status: 'planifié' });
  const [isSaving, setIsSaving] = useState(false);
  
  const [editingDescriptionId, setEditingDescriptionId] = useState<string | null>(null);
  const [tempDescription, setTempDescription] = useState('');

  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');

  const [editingDeadlineId, setEditingDeadlineId] = useState<string | null>(null);
  const [tempDeadline, setTempDeadline] = useState('');

  const [managingCourseId, setManagingCourseId] = useState<string | null>(null);
  const [managingCoursesForGroup, setManagingCoursesForGroup] = useState<string | null>(null);
  const [newStudentForm, setNewStudentForm] = useState({ name: '', email: '', studentId: '' });

  const [showNotifications, setShowNotifications] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toastMessage, setToastMessage] = useState<{title: string, message: string, type: 'success' | 'error'} | null>(null);
  const [confirmAction, setConfirmAction] = useState<{message: string, onConfirm: () => void} | null>(null);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const getCoursesForDate = (date: Date) => {
    return courses.filter(c => c.deadline && isSameDay(parseISO(c.deadline), date));
  };

  const showToast = (title: string, message: string, type: 'success' | 'error') => {
    setToastMessage({ title, message, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  useEffect(() => {
    if (!user) return;

    // Fetch courses
    const qCourses = query(
      collection(db, 'courses'),
      where('professorId', '==', user.uid),
      where('tenantId', '==', user.tenantId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeCourses = onSnapshot(qCourses, (snapshot) => {
      setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course)));
    });

    // Fetch students to count enrollments
    const qStudents = query(
      collection(db, 'users'),
      where('role', '==', 'student'),
      where('tenantId', '==', user.tenantId)
    );

    const unsubscribeStudents = onSnapshot(qStudents, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ 
        id: doc.id, 
        faculty: doc.data().faculty,
        promotion: doc.data().promotion,
        tenantId: doc.data().tenantId
      } as Student)));
    });

    // Fetch course documents
    const qDocs = query(
      collection(db, 'course_documents'),
      where('professorId', '==', user.uid),
      where('tenantId', '==', user.tenantId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeDocs = onSnapshot(qDocs, (snapshot) => {
      setCourseDocuments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CourseDocument)));
    });

    return () => {
      unsubscribeCourses();
      unsubscribeStudents();
      unsubscribeDocs();
    };
  }, [user]);

  useEffect(() => {
    const generatedNotifications: AppNotification[] = [];
    const now = new Date();

    courses.forEach(course => {
      // Deadlines
      if (course.deadline) {
        const deadlineDate = new Date(course.deadline);
        const diffTime = deadlineDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 0 && diffDays <= 7) {
          generatedNotifications.push({
            id: `deadline-${course.id}`,
            title: 'Date limite approchante',
            message: `La date limite pour le cours "${course.name}" est dans ${diffDays} jour(s).`,
            date: now,
            type: 'deadline'
          });
        } else if (diffDays < 0) {
           generatedNotifications.push({
            id: `deadline-past-${course.id}`,
            title: 'Date limite dépassée',
            message: `La date limite pour le cours "${course.name}" est dépassée depuis ${Math.abs(diffDays)} jour(s).`,
            date: now,
            type: 'deadline'
          });
        }
      }

      // Enrollments
      if (course.enrolledStudents && course.enrolledStudents.length > 0) {
        generatedNotifications.push({
          id: `enrollment-${course.id}-${course.enrolledStudents.length}`,
          title: 'Nouvelles inscriptions',
          message: `${course.enrolledStudents.length} étudiant(s) inscrit(s) au cours "${course.name}".`,
          date: now,
          type: 'enrollment'
        });
      }
    });

    setNotifications(generatedNotifications);
  }, [courses]);

  const unreadCount = notifications.filter(n => !readNotificationIds.includes(n.id)).length;

  const markAsRead = (id: string) => {
    if (!readNotificationIds.includes(id)) {
      setReadNotificationIds([...readNotificationIds, id]);
    }
  };

  const markAllAsRead = () => {
    setReadNotificationIds(notifications.map(n => n.id));
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    try {
      if (editingCourse) {
        await updateDoc(doc(db, 'courses', editingCourse.id), {
          name: courseForm.name,
          faculty: courseForm.faculty,
          promotion: courseForm.promotion,
          description: courseForm.description,
          notes: courseForm.notes,
          deadline: courseForm.deadline,
          status: courseForm.status,
        });
      } else {
        await addDoc(collection(db, 'courses'), {
          name: courseForm.name,
          faculty: courseForm.faculty,
          promotion: courseForm.promotion,
          description: courseForm.description,
          notes: courseForm.notes,
          deadline: courseForm.deadline,
          status: courseForm.status,
          professorId: user.uid,
          tenantId: user.tenantId,
          createdAt: serverTimestamp()
        });
      }
      setShowCourseModal(false);
      setEditingCourse(null);
      setCourseForm({ name: '', faculty: '', promotion: '', description: '', notes: '', deadline: '', status: 'planifié' });
      showToast("Succès", "Le cours a été enregistré avec succès.", "success");
    } catch (error) {
      console.error("Error saving course:", error);
      showToast("Erreur", "Une erreur est survenue lors de l'enregistrement du cours.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    setConfirmAction({
      message: 'Êtes-vous sûr de vouloir supprimer ce cours ?',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'courses', courseId));
          showToast("Succès", "Le cours a été supprimé.", "success");
        } catch (error) {
          console.error("Error deleting course:", error);
          showToast("Erreur", "Une erreur est survenue lors de la suppression du cours.", "error");
        }
      }
    });
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setCourseForm({ name: course.name, faculty: course.faculty, promotion: course.promotion, description: course.description || '', notes: course.notes || '', deadline: course.deadline || '', status: course.status || 'planifié' });
    setShowCourseModal(true);
  };

  const openAddModal = () => {
    setEditingCourse(null);
    setCourseForm({ name: '', faculty: '', promotion: '', description: '', notes: '', deadline: '', status: 'planifié' });
    setShowCourseModal(true);
  };

  const getEnrolledStudentsCount = (faculty: string, promotion: string) => {
    return students.filter(s => s.faculty === faculty && s.promotion === promotion).length;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, courseId: string | null) => {
    if (!courseId) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length === 0) {
          showToast("Erreur", "Le fichier CSV est vide.", "error");
          return;
        }

        const hasHeader = lines[0].toLowerCase().includes('nom') || lines[0].toLowerCase().includes('name') || lines[0].toLowerCase().includes('email');
        const dataLines = hasHeader ? lines.slice(1) : lines;
        
        const newStudents: EnrolledStudent[] = dataLines.map(line => {
          // Gérer les guillemets éventuels dans le CSV
          const cleanLine = line.replace(/["']/g, '');
          const parts = cleanLine.split(/[;,]/).map(s => s.trim());
          return {
            name: parts[0] || 'Inconnu',
            email: parts[1] || '',
            studentId: parts[2] || ''
          };
        }).filter(s => s.name !== 'Inconnu' && s.name !== '');

        const course = courses.find(c => c.id === courseId);
        const existingStudents = course?.enrolledStudents || [];
        
        // Combine and deduplicate by email (if provided) or name
        const combined = [...existingStudents, ...newStudents];
        const uniqueStudentsMap = new Map();
        
        combined.forEach(student => {
          const key = student.email ? student.email.toLowerCase() : student.name.toLowerCase();
          if (!uniqueStudentsMap.has(key)) {
            uniqueStudentsMap.set(key, student);
          }
        });

        const finalStudents = Array.from(uniqueStudentsMap.values());

        await updateDoc(doc(db, 'courses', courseId), {
          enrolledStudents: finalStudents
        });
        
        showToast("Import réussi", `${newStudents.length} étudiants trouvés. Total après fusion : ${finalStudents.length} inscrits.`, "success");
      } catch (error) {
        console.error("Erreur lors de l'importation:", error);
        showToast("Erreur", "Une erreur est survenue lors de l'importation du fichier CSV.", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveDescription = async (courseId: string) => {
    try {
      await updateDoc(doc(db, 'courses', courseId), {
        description: tempDescription
      });
      setEditingDescriptionId(null);
      showToast("Succès", "Description mise à jour.", "success");
    } catch (error) {
      console.error("Error updating description:", error);
      showToast("Erreur", "Erreur lors de la mise à jour de la description.", "error");
    }
  };

  const handleSaveNotes = async (courseId: string) => {
    try {
      await updateDoc(doc(db, 'courses', courseId), {
        notes: tempNotes
      });
      setEditingNotesId(null);
      showToast("Succès", "Notes mises à jour.", "success");
    } catch (error) {
      console.error("Error updating notes:", error);
      showToast("Erreur", "Erreur lors de la mise à jour des notes.", "error");
    }
  };

  const handleSaveDeadline = async (courseId: string) => {
    try {
      await updateDoc(doc(db, 'courses', courseId), {
        deadline: tempDeadline
      });
      setEditingDeadlineId(null);
      showToast("Succès", "Date limite mise à jour.", "success");
    } catch (error) {
      console.error("Error updating deadline:", error);
      showToast("Erreur", "Erreur lors de la mise à jour de la date limite.", "error");
    }
  };

  const handleAddManualStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingCourseId) return;
    const course = courses.find(c => c.id === managingCourseId);
    if (!course) return;

    const newStudent: EnrolledStudent = { ...newStudentForm };
    const updatedStudents = [...(course.enrolledStudents || []), newStudent];

    try {
      await updateDoc(doc(db, 'courses', course.id), {
        enrolledStudents: updatedStudents
      });
      setNewStudentForm({ name: '', email: '', studentId: '' });
      showToast("Succès", "Étudiant ajouté avec succès.", "success");
    } catch (error) {
      console.error("Error adding student:", error);
      showToast("Erreur", "Erreur lors de l'ajout de l'étudiant.", "error");
    }
  };

  const handleRemoveStudent = async (studentToRemove: EnrolledStudent) => {
    if (!managingCourseId) return;
    const course = courses.find(c => c.id === managingCourseId);
    if (!course || !course.enrolledStudents) return;

    const updatedStudents = course.enrolledStudents.filter(s => 
      s.studentId !== studentToRemove.studentId || 
      s.email !== studentToRemove.email || 
      s.name !== studentToRemove.name
    );

    try {
      await updateDoc(doc(db, 'courses', course.id), {
        enrolledStudents: updatedStudents
      });
      showToast("Succès", "Étudiant retiré du cours.", "success");
    } catch (error) {
      console.error("Error removing student:", error);
      showToast("Erreur", "Erreur lors de la suppression de l'étudiant.", "error");
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !uploadForm.courseId || !uploadForm.title || !selectedFile) return;
    
    setIsSaving(true);
    try {
      const fileName = selectedFile.name;
      const storageRef = ref(storage, `course_documents/${user.tenantId}/${uploadForm.courseId}/${Date.now()}_${fileName}`);
      
      const uploadTask = uploadBytesResumable(storageRef, selectedFile);
      
      uploadTask.on('state_changed', 
        (snapshot) => {
          // Progress can be handled here if needed
        }, 
        (error) => {
          console.error("Error uploading file:", error);
          showToast("Erreur", "Erreur lors de l'upload du fichier.", "error");
          setIsSaving(false);
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          await addDoc(collection(db, 'course_documents'), {
            title: uploadForm.title,
            description: uploadForm.description,
            type: uploadForm.type,
            courseId: uploadForm.courseId,
            fileName: fileName,
            fileUrl: downloadURL,
            professorId: user.uid,
            tenantId: user.tenantId,
            createdAt: serverTimestamp()
          });

          setShowUploadModal(false);
          setUploadForm({ title: '', description: '', type: 'syllabus', courseId: '', fileName: '', fileUrl: '' });
          setSelectedFile(null);
          showToast("Succès", "Le document a été partagé avec succès.", "success");
          setIsSaving(false);
        }
      );
    } catch (error) {
      console.error("Error uploading document:", error);
      showToast("Erreur", "Une erreur est survenue lors du partage du document.", "error");
      setIsSaving(false);
    }
  };

  const handleDeleteDocument = async (document: CourseDocument) => {
    setConfirmAction({
      message: 'Êtes-vous sûr de vouloir supprimer ce document ?',
      onConfirm: async () => {
        try {
          if (document.fileUrl && !document.fileUrl.includes('example.com')) {
            const fileRef = ref(storage, document.fileUrl);
            try {
              await deleteObject(fileRef);
            } catch (storageError) {
              console.error("Error deleting file from storage:", storageError);
              // Continue to delete the document even if storage deletion fails
            }
          }
          await deleteDoc(doc(db, 'course_documents', document.id));
          showToast("Succès", "Le document a été supprimé.", "success");
        } catch (error) {
          console.error("Error deleting document:", error);
          showToast("Erreur", "Une erreur est survenue lors de la suppression du document.", "error");
        }
      }
    });
  };

  const downloadCSVTemplate = () => {
    const csvContent = "Nom,Email,Matricule\nJean Dupont,jean.dupont@example.com,MAT123\nMarie Curie,marie.curie@example.com,MAT456";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "modele_etudiants.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-50 text-slate-900 font-sans antialiased min-h-screen">
      <header className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-md">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Logo className="w-10 h-10" withText={false} />
            <div>
              <h1 className="text-lg font-extrabold leading-none tracking-tight">
                UCCM <span className="font-light text-slate-300">| Professeur</span>
              </h1>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
                Portail Enseignant
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full hover:bg-slate-700 transition-colors"
              >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-slate-900">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800">Notifications</h3>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        Tout marquer comme lu
                      </button>
                    )}
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 text-sm">
                        Aucune notification
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {notifications.map(notification => (
                          <div 
                            key={notification.id} 
                            className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${!readNotificationIds.includes(notification.id) ? 'bg-emerald-50/30' : ''}`}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <div className="flex gap-3">
                              <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${!readNotificationIds.includes(notification.id) ? 'bg-emerald-500' : 'bg-transparent'}`} />
                              <div>
                                <h4 className={`text-sm font-medium ${!readNotificationIds.includes(notification.id) ? 'text-slate-800' : 'text-slate-600'}`}>
                                  {notification.title}
                                </h4>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                  {notification.message}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium hidden sm:block">Prof. {user?.name}</span>
              <button 
                onClick={signOut}
                className="p-2 text-slate-400 hover:text-white transition-colors"
                title="Déconnexion"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center text-sm font-medium text-slate-500 mb-2">
          <button 
            onClick={() => setActiveTab('courses')}
            className="flex items-center hover:text-emerald-600 transition-colors"
          >
            <Home className="w-4 h-4 mr-1.5" />
            Accueil
          </button>
          <ChevronRight className="w-4 h-4 mx-2 text-slate-300" />
          <span className="text-slate-800">
            {activeTab === 'courses' && 'Mes Cours & Documents'}
            {activeTab === 'students' && 'Mes Promotions'}
            {activeTab === 'ai' && 'Outils IA'}
          </span>
        </nav>

        <div className="flex gap-4 border-b border-slate-200 pb-2">
          <button 
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'courses' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Mes Cours & Documents
          </button>
          <button 
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'students' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Mes Promotions
          </button>
          <button 
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'ai' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Sparkles className="w-4 h-4" />
            Outils IA
          </button>
        </div>

        {activeTab === 'courses' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-slate-800">Documents Pédagogiques</h2>
                  <button 
                    onClick={() => setShowUploadModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Partager un document
                  </button>
                </div>
                
                {courseDocuments.length === 0 ? (
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center bg-slate-50">
                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-800">Aucun document partagé</h3>
                    <p className="text-sm text-slate-500 mt-2">Partagez des supports de cours, des syllabus ou des exercices avec vos étudiants.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {courseDocuments.map(doc => {
                      const course = courses.find(c => c.id === doc.courseId);
                      return (
                        <div key={doc.id} className="p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-shadow group relative">
                          <button 
                            onClick={() => handleDeleteDocument(doc)}
                            className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg shrink-0 ${
                              doc.type === 'syllabus' ? 'bg-purple-100 text-purple-600' :
                              doc.type === 'notes' ? 'bg-blue-100 text-blue-600' :
                              doc.type === 'exercise' ? 'bg-amber-100 text-amber-600' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1 pr-6">
                              <h4 className="font-bold text-slate-800 truncate" title={doc.title}>{doc.title}</h4>
                              <p className="text-xs font-medium text-emerald-600 truncate mt-0.5">{course?.name || 'Cours inconnu'}</p>
                              {doc.description && (
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{doc.description}</p>
                              )}
                              <div className="flex items-center gap-3 mt-3">
                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                                  {doc.type === 'syllabus' ? 'Syllabus' : doc.type === 'notes' ? 'Notes de cours' : doc.type === 'exercise' ? 'Exercice' : 'Autre'}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {doc.createdAt ? format(doc.createdAt.toDate(), 'dd MMM yyyy', { locale: fr }) : ''}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            
            <div className="md:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-slate-800">Mes Cours Assignés</h2>
                  <button 
                    onClick={openAddModal}
                    className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                    title="Ajouter un cours"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  {courses.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-sm">
                      Aucun cours assigné pour le moment.
                    </div>
                  ) : (
                    courses.map(course => (
                      <div key={course.id} className="p-4 rounded-lg bg-slate-50 border border-slate-100 group relative">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <button 
                            onClick={() => openEditModal(course)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteCourse(course.id)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 pr-12">
                          <h4 className="font-bold text-slate-800">{course.name}</h4>
                          {course.status && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              course.status === 'planifié' ? 'bg-blue-100 text-blue-700' :
                              course.status === 'en cours' ? 'bg-amber-100 text-amber-700' :
                              course.status === 'terminé' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {course.status}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {course.promotion} {course.faculty} • {course.enrolledStudents ? course.enrolledStudents.length : getEnrolledStudentsCount(course.faculty, course.promotion)} étudiants
                        </p>
                        
                        <div className="mt-2">
                          {editingDeadlineId === course.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="date"
                                value={tempDeadline}
                                onChange={(e) => setTempDeadline(e.target.value)}
                                className="px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveDeadline(course.id)}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingDeadlineId(null)}
                                className="p-1 text-slate-400 hover:bg-slate-50 rounded"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div 
                              className="inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer group/deadline transition-colors"
                              onClick={() => {
                                setEditingDeadlineId(course.id);
                                setTempDeadline(course.deadline || '');
                              }}
                            >
                              {course.deadline ? (
                                <div className="text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-100 hover:bg-amber-100 flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5" />
                                  Date limite : {new Date(course.deadline).toLocaleDateString()}
                                  <Edit2 className="w-3 h-3 opacity-0 group-hover/deadline:opacity-100 transition-opacity ml-1" />
                                </div>
                              ) : (
                                <div className="text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 hover:bg-slate-200 flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5" />
                                  Ajouter une date limite
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-3 space-y-3">
                          {/* Description Section */}
                          <div>
                            <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Description (Syllabus)</h5>
                            {editingDescriptionId === course.id ? (
                              <div className="space-y-2">
                                <textarea
                                  value={tempDescription}
                                  onChange={(e) => setTempDescription(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all min-h-[60px] resize-y"
                                  placeholder="Saisissez la description du cours..."
                                  autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => setEditingDescriptionId(null)}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                                  >
                                    Annuler
                                  </button>
                                  <button
                                    onClick={() => handleSaveDescription(course.id)}
                                    className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                                  >
                                    Enregistrer
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div 
                                className="group/desc relative bg-white p-3 rounded border border-slate-100 cursor-pointer hover:border-emerald-200 transition-colors"
                                onClick={() => {
                                  setEditingDescriptionId(course.id);
                                  setTempDescription(course.description || '');
                                }}
                              >
                                {course.description ? (
                                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{course.description}</p>
                                ) : (
                                  <p className="text-sm text-slate-400 italic">Ajouter une description...</p>
                                )}
                                <div className="absolute top-2 right-2 opacity-0 group-hover/desc:opacity-100 transition-opacity">
                                  <Edit2 className="w-3.5 h-3.5 text-emerald-500" />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Notes Section */}
                          <div>
                            <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Notes privées</h5>
                            {editingNotesId === course.id ? (
                              <div className="space-y-2">
                                <textarea
                                  value={tempNotes}
                                  onChange={(e) => setTempNotes(e.target.value)}
                                  className="w-full px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all min-h-[60px] resize-y"
                                  placeholder="Saisissez vos notes personnelles..."
                                  autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => setEditingNotesId(null)}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                                  >
                                    Annuler
                                  </button>
                                  <button
                                    onClick={() => handleSaveNotes(course.id)}
                                    className="px-3 py-1.5 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
                                  >
                                    Enregistrer
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div 
                                className="group/notes relative bg-amber-50/50 p-3 rounded border border-amber-100 cursor-pointer hover:border-amber-300 transition-colors"
                                onClick={() => {
                                  setEditingNotesId(course.id);
                                  setTempNotes(course.notes || '');
                                }}
                              >
                                {course.notes ? (
                                  <p className="text-sm text-amber-900 whitespace-pre-wrap">{course.notes}</p>
                                ) : (
                                  <p className="text-sm text-amber-600/60 italic">Ajouter des notes personnelles...</p>
                                )}
                                <div className="absolute top-2 right-2 opacity-0 group-hover/notes:opacity-100 transition-opacity">
                                  <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <div className="text-xs text-slate-500">
                            {course.enrolledStudents ? (
                              <span className="text-emerald-600 font-medium">{course.enrolledStudents.length} inscrits</span>
                            ) : (
                              <span>Aucun inscrit</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setManagingCourseId(course.id)}
                              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors"
                            >
                              <Users className="w-3.5 h-3.5" />
                              Gérer
                            </button>
                            <label className="cursor-pointer flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors">
                              <Upload className="w-3.5 h-3.5" />
                              CSV
                              <input 
                                type="file" 
                                accept=".csv" 
                                className="hidden" 
                                onChange={(e) => handleFileUpload(e, course.id)} 
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Calendrier */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-slate-800">Calendrier</h2>
                  <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded">
                      <ChevronLeft className="w-4 h-4 text-slate-600" />
                    </button>
                    <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded">
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                </div>
                <div className="text-center font-medium text-slate-700 mb-4 capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale: fr })}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500 mb-2">
                  <div>L</div><div>M</div><div>M</div><div>J</div><div>V</div><div>S</div><div>D</div>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, idx) => {
                    const dayCourses = getCoursesForDate(day);
                    const hasDeadline = dayCourses.length > 0;
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, currentMonth);

                    return (
                      <div
                        key={idx}
                        onClick={() => hasDeadline && setSelectedDate(day)}
                        className={`
                          aspect-square flex items-center justify-center rounded-full text-sm relative
                          ${!isCurrentMonth ? 'text-slate-300' : 'text-slate-700'}
                          ${isSelected ? 'bg-emerald-600 text-white font-bold' : ''}
                          ${hasDeadline && !isSelected ? 'bg-amber-100 text-amber-900 font-bold cursor-pointer hover:bg-amber-200' : ''}
                          ${!hasDeadline && isCurrentMonth ? 'hover:bg-slate-100' : ''}
                        `}
                      >
                        {format(day, 'd')}
                        {hasDeadline && (
                          <span className="absolute bottom-1 w-1 h-1 rounded-full bg-amber-500"></span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {selectedDate && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800 mb-2 capitalize">
                      {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
                    </h3>
                    <div className="space-y-2">
                      {getCoursesForDate(selectedDate).map(course => (
                        <div key={course.id} className="p-2 bg-amber-50 border border-amber-100 rounded text-sm">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-amber-900">{course.name}</div>
                            {course.status && (
                              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                course.status === 'planifié' ? 'bg-blue-100 text-blue-700' :
                                course.status === 'en cours' ? 'bg-amber-200 text-amber-800' :
                                course.status === 'terminé' ? 'bg-emerald-100 text-emerald-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {course.status}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-amber-700">{course.promotion} {course.faculty}</div>
                        </div>
                      ))}
                      {getCoursesForDate(selectedDate).length === 0 && (
                        <div className="text-sm text-slate-500">Aucune date limite ce jour.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Promotions & Étudiants</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from(new Set(students.map(s => `${s.promotion || 'Non assignée'}|${s.faculty || 'Non assigné'}`))).map(uniquePromo => {
                const [promotion, faculty] = (uniquePromo as string).split('|');
                const count = getEnrolledStudentsCount(faculty === 'Non assigné' ? undefined : faculty, promotion === 'Non assignée' ? undefined : promotion);
                const groupCourses = courses.filter(c => (c.promotion || 'Non assignée') === promotion && (c.faculty || 'Non assigné') === faculty);
                
                return (
                  <div key={uniquePromo} className="border border-slate-200 rounded-xl p-6 hover:border-emerald-500 transition-colors cursor-pointer group">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">{promotion} {faculty}</h3>
                        <p className="text-sm text-slate-500">Année Académique en cours</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                          {count} inscrit{count !== 1 ? 's' : ''}
                        </div>
                        <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {groupCourses.length} cours
                        </div>
                      </div>
                    </div>

                    {groupCourses.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Vos cours associés</h4>
                        <div className="space-y-2">
                          {groupCourses.map(c => (
                            <div key={c.id} className="text-sm text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">
                              {c.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 mt-6">
                      <button 
                        onClick={() => setManagingCoursesForGroup(`${promotion} - ${faculty}`)}
                        className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <BookOpen className="h-4 w-4" />
                        Gérer les cours
                      </button>
                      <button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                        <Users className="h-4 w-4" />
                        Liste
                      </button>
                    </div>
                  </div>
                );
              })}
              {students.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-500">
                  Aucun étudiant ou groupe trouvé dans l'établissement.
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'ai' && (
          <div className="mt-8">
            <ProfessorAITools />
          </div>
        )}
      </main>

      {/* Add/Edit Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">
                {editingCourse ? 'Modifier le cours' : 'Ajouter un cours'}
              </h2>
              <button 
                onClick={() => setShowCourseModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveCourse} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom du cours</label>
                <input 
                  type="text" 
                  required
                  value={courseForm.name}
                  onChange={(e) => setCourseForm({...courseForm, name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="ex: Droit Constitutionnel"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Faculté / Département</label>
                <input 
                  type="text" 
                  required
                  value={courseForm.faculty}
                  onChange={(e) => setCourseForm({...courseForm, faculty: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="ex: Droit"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Promotion / Niveau</label>
                <input 
                  type="text" 
                  required
                  value={courseForm.promotion}
                  onChange={(e) => setCourseForm({...courseForm, promotion: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="ex: G1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Statut</label>
                <select
                  value={courseForm.status}
                  onChange={(e) => setCourseForm({...courseForm, status: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                >
                  <option value="planifié">Planifié</option>
                  <option value="en cours">En cours</option>
                  <option value="terminé">Terminé</option>
                  <option value="annulé">Annulé</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date limite (Optionnel)</label>
                <input 
                  type="date" 
                  value={courseForm.deadline}
                  onChange={(e) => setCourseForm({...courseForm, deadline: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optionnel)</label>
                <textarea 
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all min-h-[80px] resize-y"
                  placeholder="Ajoutez une description ou le syllabus du cours..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes privées (Optionnel)</label>
                <textarea 
                  value={courseForm.notes}
                  onChange={(e) => setCourseForm({...courseForm, notes: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all min-h-[80px] resize-y"
                  placeholder="Ajoutez vos notes personnelles pour ce cours..."
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Enregistrement...
                    </>
                  ) : (
                    'Enregistrer'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Manage Students Modal */}
      {managingCourseId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
              <h2 className="text-xl font-bold text-slate-800">
                Gérer les inscrits - {courses.find(c => c.id === managingCourseId)?.name}
              </h2>
              <button 
                onClick={() => setManagingCourseId(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form onSubmit={handleAddManualStudent} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nom complet</label>
                  <input type="text" required value={newStudentForm.name} onChange={e => setNewStudentForm({...newStudentForm, name: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Jean Dupont" />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" value={newStudentForm.email} onChange={e => setNewStudentForm({...newStudentForm, email: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="jean@example.com" />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Matricule</label>
                  <input type="text" value={newStudentForm.studentId} onChange={e => setNewStudentForm({...newStudentForm, studentId: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="MAT123" />
                </div>
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 h-[38px]">
                  <UserPlus className="w-4 h-4" />
                  Ajouter
                </button>
              </form>

              <div className="space-y-2">
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Étudiants inscrits ({courses.find(c => c.id === managingCourseId)?.enrolledStudents?.length || 0})</h3>
                    <p className="text-xs text-slate-500 mt-1">Format CSV attendu : Nom, Email, Matricule</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={downloadCSVTemplate}
                      className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Modèle CSV
                    </button>
                    <label className="cursor-pointer flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      Importer CSV
                      <input 
                        type="file" 
                        accept=".csv" 
                        className="hidden" 
                        onChange={(e) => handleFileUpload(e, managingCourseId)} 
                      />
                    </label>
                  </div>
                </div>
                {courses.find(c => c.id === managingCourseId)?.enrolledStudents?.length ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                        <tr>
                          <th className="px-4 py-3 font-medium">Nom</th>
                          <th className="px-4 py-3 font-medium">Email</th>
                          <th className="px-4 py-3 font-medium">Matricule</th>
                          <th className="px-4 py-3 font-medium text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {courses.find(c => c.id === managingCourseId)?.enrolledStudents?.map((student, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-medium text-slate-800">{student.name}</td>
                            <td className="px-4 py-3 text-slate-600">{student.email || '-'}</td>
                            <td className="px-4 py-3 text-slate-600 font-mono text-xs">{student.studentId || '-'}</td>
                            <td className="px-4 py-3 text-right">
                              <button onClick={() => handleRemoveStudent(student)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Retirer">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 text-sm bg-slate-50 rounded-xl border border-slate-200">
                    Aucun étudiant n'est inscrit à ce cours.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'upload de document */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Partager un document</h2>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadDocument} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Titre du document</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white transition-colors"
                  placeholder="Ex: Syllabus d'Algèbre Linéaire"
                  value={uploadForm.title}
                  onChange={e => setUploadForm({...uploadForm, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (optionnelle)</label>
                <textarea
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white transition-colors resize-none h-24"
                  placeholder="Brève description du contenu..."
                  value={uploadForm.description}
                  onChange={e => setUploadForm({...uploadForm, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white transition-colors"
                    value={uploadForm.type}
                    onChange={e => setUploadForm({...uploadForm, type: e.target.value as any})}
                  >
                    <option value="syllabus">Syllabus</option>
                    <option value="notes">Notes de cours</option>
                    <option value="exercise">Exercice / TP</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cours associé</label>
                  <select
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white transition-colors"
                    value={uploadForm.courseId}
                    onChange={e => setUploadForm({...uploadForm, courseId: e.target.value})}
                  >
                    <option value="">Sélectionner un cours...</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fichier</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-blue-400 transition-colors bg-slate-50">
                  <input
                    type="file"
                    required
                    className="hidden"
                    id="file-upload"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-sm font-medium text-blue-600 hover:text-blue-700">Cliquez pour sélectionner un fichier</span>
                    <span className="text-xs text-slate-500 mt-1">PDF, DOCX, PPTX (Max 10MB)</span>
                  </label>
                  {selectedFile && (
                    <div className="mt-4 p-2 bg-blue-50 rounded-lg flex items-center gap-2 text-sm text-blue-800">
                      <FileText className="w-4 h-4" />
                      <span className="truncate">{selectedFile.name}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !selectedFile}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Partage...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Partager le document</span>
                    </>
                  )}
                </button>
              </div>
            </form>
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
                    const [promo, fac] = managingCoursesForGroup.split(' - ');
                    const groupCourses = courses.filter(c => 
                      (c.promotion || 'Non assignée') === promo && 
                      (c.faculty || 'Non assigné') === fac
                    );

                    if (groupCourses.length === 0) {
                      return (
                        <div className="text-center py-8 bg-white rounded-xl border border-slate-200 border-dashed">
                          <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-sm text-slate-500">Aucun cours n'est encore associé à ce groupe.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid gap-3">
                        {groupCourses.map(course => (
                          <div key={course.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center group hover:border-blue-300 transition-colors">
                            <div>
                              <h4 className="font-bold text-slate-800">{course.name}</h4>
                            </div>
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
                                      showToast("Succès", "Cours retiré du groupe.", "success");
                                    } catch (error) {
                                      console.error("Error removing course from group:", error);
                                      showToast("Erreur", "Erreur lors du retrait du cours.", "error");
                                    }
                                  }
                                });
                              }}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                              title="Retirer du groupe"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Formulaire d'ajout de cours */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Associer un de vos cours existants</h3>
                    <div className="flex gap-3">
                      <select
                        className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        onChange={async (e) => {
                          if (!e.target.value) return;
                          const courseId = e.target.value;
                          const [promo, fac] = managingCoursesForGroup.split(' - ');
                          try {
                            await updateDoc(doc(db, 'courses', courseId), {
                              faculty: fac === 'Non assigné' ? '' : fac,
                              promotion: promo === 'Non assignée' ? '' : promo
                            });
                            e.target.value = ''; // Reset select
                            showToast("Succès", "Cours associé au groupe.", "success");
                          } catch (error) {
                            console.error("Error updating course:", error);
                            showToast("Erreur", "Erreur lors de l'association du cours.", "error");
                          }
                        }}
                      >
                        <option value="">Sélectionner un cours...</option>
                        {courses
                          .filter(c => (c.promotion || 'Non assignée') !== managingCoursesForGroup.split(' - ')[0] || (c.faculty || 'Non assigné') !== managingCoursesForGroup.split(' - ')[1])
                          .map(c => (
                            <option key={c.id} value={c.id}>{c.name} {c.promotion || c.faculty ? `(Actuellement: ${c.promotion || 'N/A'} - ${c.faculty || 'N/A'})` : ''}</option>
                          ))
                        }
                      </select>
                    </div>
                  </div>
                </div>
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

      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
          <div className={`rounded-xl shadow-lg border p-4 flex items-start gap-3 max-w-sm ${
            toastMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {toastMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="font-bold text-sm">{toastMessage.title}</h4>
              <p className="text-xs opacity-90 mt-1">{toastMessage.message}</p>
            </div>
            <button 
              onClick={() => setToastMessage(null)}
              className="ml-auto p-1 hover:bg-black/5 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
