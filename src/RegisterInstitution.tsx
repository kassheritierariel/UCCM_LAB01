import React, { useState } from 'react';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { Building2, Mail, Globe, Phone, MapPin, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from './components/Logo';

export default function RegisterInstitution() {
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    contactEmail: '',
    phone: '',
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Check if domain already exists
      const q = query(collection(db, 'institutions'), where('domain', '==', formData.domain));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        setError("Ce domaine est déjà utilisé par un autre établissement.");
        setIsSubmitting(false);
        return;
      }

      await addDoc(collection(db, 'institutions'), {
        name: formData.name,
        domain: formData.domain,
        contactEmail: formData.contactEmail,
        status: 'pending',
        plan: 'pro',
        createdAt: serverTimestamp(),
        settings: {
          phone: formData.phone,
          address: formData.address
        }
      });

      setSuccess(true);
    } catch (err: any) {
      console.error("Error registering institution:", err);
      setError("Une erreur est survenue lors de l'enregistrement. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Demande Envoyée !</h2>
          <p className="text-slate-600 mb-8">
            Votre demande d'enregistrement pour <strong>{formData.name}</strong> a été soumise avec succès. 
            Elle est actuellement en attente de validation par notre équipe d'administration. 
            Vous recevrez un email de confirmation une fois votre établissement activé.
          </p>
          <Link 
            to="/"
            className="inline-flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-colors"
          >
            Retour à l'accueil
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="w-8 h-8" withText={false} />
            <span className="text-xl font-bold text-slate-800 tracking-tight">UniversitySolutions</span>
          </Link>
          <Link to="/login" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            Se connecter
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
          <div className="bg-slate-900 p-8 text-white text-center">
            <h1 className="text-3xl font-bold mb-2">Enregistrez votre Établissement</h1>
            <p className="text-slate-300">
              Rejoignez notre plateforme et transformez la gestion de votre institution.
            </p>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    Nom de l'établissement *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Ex: Université de Kinshasa"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-400" />
                    Domaine (Identifiant unique) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.domain}
                    onChange={e => setFormData({...formData, domain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Ex: unikin"
                  />
                  <p className="text-xs text-slate-500">Uniquement lettres minuscules, chiffres et tirets.</p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    Email de contact (Administrateur) *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.contactEmail}
                    onChange={e => setFormData({...formData, contactEmail: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="admin@etablissement.edu"
                  />
                  <p className="text-xs text-slate-500">Cet email sera utilisé pour créer le compte administrateur principal.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="+243..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Ville, Pays"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      Soumettre la demande
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
