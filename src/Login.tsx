import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Navigate } from 'react-router-dom';
import { BookOpen, GraduationCap, ShieldCheck, Library, ArrowRight, Briefcase, Calculator, Award, Mail, Lock, AlertCircle } from 'lucide-react';

export default function Login() {
  const { user, signIn, signInWithEmail, signInAsDemo, loading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDemoLogin = async (role: any) => {
    setIsSubmitting(true);
    setAuthError('');
    try {
      await signInAsDemo(role);
    } catch (error: any) {
      if (error.code === 'auth/operation-not-allowed') {
        setAuthError("L'authentification anonyme n'est pas activée. Veuillez l'activer dans la console Firebase.");
      } else if (error.code === 'auth/admin-restricted-operation') {
        setAuthError("La création de compte est désactivée. Dans Firebase, allez dans Authentication > Settings > User actions et cochez 'Enable create (sign-up)'.");
      } else {
        setAuthError("Erreur lors de la connexion de démonstration : " + error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsSubmitting(true);
    setAuthError('');
    try {
      await signInWithEmail(email, password);
    } catch (error: any) {
      if (error.code === 'auth/operation-not-allowed') {
        setAuthError("L'authentification anonyme n'est pas activée. Veuillez l'activer dans la console Firebase.");
      } else if (error.code === 'auth/admin-restricted-operation') {
        setAuthError("La création de compte est désactivée. Dans Firebase, allez dans Authentication > Settings > User actions et cochez 'Enable create (sign-up)'.");
      } else if (error.code === 'permission-denied') {
        setAuthError("Erreur de permission Firestore. Vérifiez les règles de sécurité.");
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setAuthError("Identifiants incorrects ou compte inexistant.");
      } else {
        setAuthError(error.message || "Identifiants incorrects ou compte inexistant.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/app" />;
  }

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* Left Pane - Image & Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop" 
            alt="Campus Universitaire" 
            className="w-full h-full object-cover opacity-40"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col justify-between p-16 w-full h-full">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-extrabold text-white tracking-tight">UCCM</span>
          </div>

          <div className="space-y-8 max-w-lg">
            <h1 className="text-4xl font-bold text-white leading-tight">
              L'excellence académique à portée de main.
            </h1>
            <p className="text-lg text-slate-300">
              Accédez à vos cours, gérez vos documents administratifs et déposez vos travaux de recherche sur une plateforme unifiée et sécurisée.
            </p>

            <div className="grid grid-cols-1 gap-6 pt-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Library className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Ressources Numériques</h3>
                  <p className="text-slate-400 text-sm mt-1">Accès illimité aux syllabus, cours et documents partagés par vos professeurs.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Dépôt de TFC & Mémoires</h3>
                  <p className="text-slate-400 text-sm mt-1">Soumettez vos travaux de fin de cycle directement en ligne pour validation.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Espace Sécurisé</h3>
                  <p className="text-slate-400 text-sm mt-1">Vos données académiques et personnelles sont protégées et confidentielles.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-slate-400 text-sm">
            <p className="mb-1">© {new Date().getFullYear()} Université Chrétienne Catholique par <span className="text-white font-medium">KassHeritier</span>. Tous droits réservés.</p>
            <p className="flex items-center gap-2">Contact : <a href="tel:+243818261297" className="text-blue-400 hover:text-blue-300 transition-colors">+243 818 261 297</a></p>
          </div>
        </div>
      </div>

      {/* Right Pane - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-24 bg-slate-50 relative">
        {/* Mobile Header (Visible only on small screens) */}
        <div className="lg:hidden absolute top-8 left-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-extrabold text-slate-900 tracking-tight">UCCM</span>
        </div>

        <div className="w-full max-w-md space-y-10">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Connexion au portail
            </h2>
            <p className="mt-3 text-slate-500">
              Veuillez vous identifier avec votre compte institutionnel pour accéder à vos services.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <div className="space-y-6">
              
              {authError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-sm text-red-600">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{authError}</p>
                </div>
              )}

              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Adresse email</label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="email@institution.edu"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Mot de passe</label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Se connecter'
                  )}
                </button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-slate-400 font-medium">
                    Ou
                  </span>
                </div>
              </div>

              <button
                onClick={signIn}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-300 rounded-xl shadow-sm text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
                Continuer avec Google
              </button>

              <div className="relative mt-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-slate-400 font-medium">
                    Informations
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-blue-50 p-4 border border-blue-100">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <ShieldCheck className="h-5 w-5 text-blue-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Accès Restreint</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        L'accès à ce portail est strictement réservé aux étudiants, professeurs et membres de l'administration de l'UCCM.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-white text-slate-400 font-medium">
                      Accès Démonstration
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handleDemoLogin('super_admin')} disabled={isSubmitting} className="col-span-2 flex items-center justify-center gap-2 py-2 px-3 border border-slate-800 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-70">
                    <ShieldCheck className="w-4 h-4" /> Super Admin SaaS
                  </button>
                  <button onClick={() => handleDemoLogin('student')} disabled={isSubmitting} className="flex items-center justify-center gap-2 py-2 px-3 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors disabled:opacity-70">
                    <GraduationCap className="w-4 h-4" /> Étudiant
                  </button>
                  <button onClick={() => handleDemoLogin('professor')} disabled={isSubmitting} className="flex items-center justify-center gap-2 py-2 px-3 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition-colors disabled:opacity-70">
                    <Briefcase className="w-4 h-4" /> Professeur
                  </button>
                  <button onClick={() => handleDemoLogin('admin')} disabled={isSubmitting} className="flex items-center justify-center gap-2 py-2 px-3 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-purple-600 transition-colors disabled:opacity-70">
                    <ShieldCheck className="w-4 h-4" /> Admin
                  </button>
                  <button onClick={() => handleDemoLogin('cashier')} disabled={isSubmitting} className="flex items-center justify-center gap-2 py-2 px-3 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-amber-600 transition-colors disabled:opacity-70">
                    <Calculator className="w-4 h-4" /> Caissier
                  </button>
                  <button onClick={() => handleDemoLogin('chef')} disabled={isSubmitting} className="col-span-2 flex items-center justify-center gap-2 py-2 px-3 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-rose-600 transition-colors disabled:opacity-70">
                    <Award className="w-4 h-4" /> Chef de Département
                  </button>
                </div>
              </div>

            </div>
          </div>

          <div className="flex items-center justify-center gap-4 text-sm text-slate-500 font-medium">
            <a href="#" className="hover:text-slate-800 transition-colors">Besoin d'aide ?</a>
            <span>•</span>
            <a href="#" className="hover:text-slate-800 transition-colors">Politique de confidentialité</a>
          </div>
        </div>
      </div>
    </div>
  );
}
