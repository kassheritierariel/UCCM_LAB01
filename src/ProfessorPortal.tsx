import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { BookOpen, Bell, LogOut, Upload, Users, FileText, MessageSquare, Sparkles, Plus, Edit2, Trash2, X, Calendar, UserPlus, CheckCircle, XCircle, ChevronRight, Home } from 'lucide-react';
import ProfessorAITools from './components/ProfessorAITools';
import { db } from './firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';

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
  description?: string;
  notes?: string;
  deadline?: string;
  enrolledStudents?: EnrolledStudent[];
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
  
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseForm, setCourseForm] = useState({ name: '', faculty: '', promotion: '', description: '', notes: '', deadline: '' });
  const [isSaving, setIsSaving] = useState(false);
  
  const [editingDescriptionId, setEditingDescriptionId] = useState<string | null>(null);
  const [tempDescription, setTempDescription] = useState('');

  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');

  const [editingDeadlineId, setEditingDeadlineId] = useState<string | null>(null);
  const [tempDeadline, setTempDeadline] = useState('');

  const [managingCourseId, setManagingCourseId] = useState<string | null>(null);
  const [newStudentForm, setNewStudentForm] = useState({ name: '', email: '', studentId: '' });

  const [showNotifications, setShowNotifications] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

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

    return () => {
      unsubscribeCourses();
      unsubscribeStudents();
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
        });
      } else {
        await addDoc(collection(db, 'courses'), {
          name: courseForm.name,
          faculty: courseForm.faculty,
          promotion: courseForm.promotion,
          description: courseForm.description,
          notes: courseForm.notes,
          deadline: courseForm.deadline,
          professorId: user.uid,
          tenantId: user.tenantId,
          createdAt: serverTimestamp()
        });
      }
      setShowCourseModal(false);
      setEditingCourse(null);
      setCourseForm({ name: '', faculty: '', promotion: '', description: '', notes: '', deadline: '' });
    } catch (error) {
      console.error("Error saving course:", error);
      alert("Une erreur est survenue lors de l'enregistrement du cours.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce cours ?")) {
      try {
        await deleteDoc(doc(db, 'courses', courseId));
      } catch (error) {
        console.error("Error deleting course:", error);
        alert("Une erreur est survenue lors de la suppression du cours.");
      }
    }
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setCourseForm({ name: course.name, faculty: course.faculty, promotion: course.promotion, description: course.description || '', notes: course.notes || '', deadline: course.deadline || '' });
    setShowCourseModal(true);
  };

  const openAddModal = () => {
    setEditingCourse(null);
    setCourseForm({ name: '', faculty: '', promotion: '', description: '', notes: '', deadline: '' });
    setShowCourseModal(true);
  };

  const getEnrolledStudentsCount = (faculty: string, promotion: string) => {
    return students.filter(s => s.faculty === faculty && s.promotion === promotion).length;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, courseId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length === 0) {
          alert("Le fichier CSV est vide.");
          return;
        }

        const hasHeader = lines[0].toLowerCase().includes('nom') || lines[0].toLowerCase().includes('name') || lines[0].toLowerCase().includes('email');
        const dataLines = hasHeader ? lines.slice(1) : lines;
        
        const newStudents: EnrolledStudent[] = dataLines.map(line => {
          const parts = line.split(/[;,]/).map(s => s.trim());
          return {
            name: parts[0] || 'Inconnu',
            email: parts[1] || '',
            studentId: parts[2] || ''
          };
        }).filter(s => s.name !== 'Inconnu' || s.email !== '');

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
        
        alert(`${newStudents.length} étudiants trouvés dans le CSV. Total après fusion : ${finalStudents.length} inscrits.`);
      } catch (error) {
        console.error("Erreur lors de l'importation:", error);
        alert("Une erreur est survenue lors de l'importation du fichier CSV.");
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
    } catch (error) {
      console.error("Error updating description:", error);
      alert("Erreur lors de la mise à jour de la description.");
    }
  };

  const handleSaveNotes = async (courseId: string) => {
    try {
      await updateDoc(doc(db, 'courses', courseId), {
        notes: tempNotes
      });
      setEditingNotesId(null);
    } catch (error) {
      console.error("Error updating notes:", error);
      alert("Erreur lors de la mise à jour des notes.");
    }
  };

  const handleSaveDeadline = async (courseId: string) => {
    try {
      await updateDoc(doc(db, 'courses', courseId), {
        deadline: tempDeadline
      });
      setEditingDeadlineId(null);
    } catch (error) {
      console.error("Error updating deadline:", error);
      alert("Erreur lors de la mise à jour de la date limite.");
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
    } catch (error) {
      console.error("Error adding student:", error);
      alert("Erreur lors de l'ajout de l'étudiant.");
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
    } catch (error) {
      console.error("Error removing student:", error);
      alert("Erreur lors de la suppression de l'étudiant.");
    }
  };

  return (
    <div className="bg-slate-50 text-slate-900 font-sans antialiased min-h-screen">
      <header className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-md">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
              <BookOpen className="h-6 w-6" />
            </div>
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
                  <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Partager un document
                  </button>
                </div>
                
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center bg-slate-50">
                  <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-800">Aucun document partagé</h3>
                  <p className="text-sm text-slate-500 mt-2">Partagez des supports de cours, des syllabus ou des exercices avec vos étudiants.</p>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-1">
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
                        <h4 className="font-bold text-slate-800 pr-12">{course.name}</h4>
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
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Promotions & Étudiants</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from(new Set(courses.map(c => `${c.promotion}|${c.faculty}`))).map(uniquePromo => {
                const [promotion, faculty] = (uniquePromo as string).split('|');
                const count = getEnrolledStudentsCount(faculty, promotion);
                
                return (
                  <div key={uniquePromo} className="border border-slate-200 rounded-xl p-6 hover:border-emerald-500 transition-colors cursor-pointer group">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">{promotion} {faculty}</h3>
                        <p className="text-sm text-slate-500">Année Académique en cours</p>
                      </div>
                      <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                        {count} inscrit{count !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                        <Users className="h-4 w-4" />
                        Liste
                      </button>
                      <button className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Discussion
                      </button>
                    </div>
                  </div>
                );
              })}
              {courses.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-500">
                  Vous n'avez pas encore de cours assignés.
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
    </div>
  );
}
