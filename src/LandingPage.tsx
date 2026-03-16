import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle2, Zap, Shield, Users, CreditCard, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: 'Essentiel',
      description: 'Pour les petites institutions et instituts supérieurs.',
      monthlyPrice: 50,
      annualPrice: 40,
      students: 'Jusqu\'à 500 étudiants',
      features: [
        'Gestion des TFC et Mémoires',
        'Paiements Mobile Money',
        'Portail Étudiant & Professeur',
        'Support par email'
      ],
      recommended: false
    },
    {
      name: 'Professionnel',
      description: 'Pour les universités en pleine croissance.',
      monthlyPrice: 150,
      annualPrice: 120,
      students: 'Jusqu\'à 2 500 étudiants',
      features: [
        'Toutes les fonctionnalités Essentiel',
        'Outils IA (Syllabus & Tuteur)',
        'Paiements par Carte Bancaire',
        'Tableaux de bord avancés',
        'Support prioritaire 24/7'
      ],
      recommended: true
    },
    {
      name: 'Entreprise',
      description: 'Pour les grands complexes universitaires.',
      monthlyPrice: 'Sur mesure',
      annualPrice: 'Sur mesure',
      students: 'Étudiants illimités',
      features: [
        'Toutes les fonctionnalités Pro',
        'Déploiement sur serveur dédié',
        'Marque blanche (Logo & Couleurs)',
        'Intégration API personnalisée',
        'Gestionnaire de compte dédié'
      ],
      recommended: false
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">University Solution</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Se connecter
            </Link>
            <Link to="/login" className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md">
              Commencer
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="text-center lg:text-left z-10"
          >
            <motion.h1 variants={itemVariants} className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
              La gestion universitaire <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">simplifiée</span>
            </motion.h1>
            <motion.p variants={itemVariants} className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto lg:mx-0">
              Une plateforme complète pour gérer vos étudiants, professeurs, documents académiques et paiements. 
              Conçue pour les institutions modernes en Afrique et partout ailleurs.
            </motion.p>
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5">
                Créer votre institution
              </Link>
              <a href="#pricing" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all hover:shadow-md">
                Voir les tarifs
              </a>
            </motion.div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="relative hidden lg:block"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-3xl transform rotate-3 scale-105 -z-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
              alt="Étudiants universitaires" 
              className="rounded-3xl shadow-2xl border border-white/50 object-cover h-[500px] w-full"
              referrerPolicy="no-referrer"
            />
            
            {/* Floating UI Elements */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Paiement reçu</p>
                <p className="text-xs text-slate-500">Mobile Money - 50$</p>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Nouveau TFC</p>
                <p className="text-xs text-slate-500">Soumis à l'instant</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Une solution complète et professionnelle</h2>
            <p className="text-lg text-slate-500 mt-4 max-w-2xl mx-auto">
              Nous offrons tous les outils nécessaires pour digitaliser votre institution, de l'inscription à la remise des diplômes.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-8 bg-slate-50 rounded-3xl border border-slate-100 hover:shadow-lg transition-shadow"
            >
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <Users className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Gestion Multi-Rôles</h3>
              <p className="text-slate-600 leading-relaxed">
                Espaces dédiés pour les administrateurs, professeurs, étudiants, caissiers et chefs de département.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="p-8 bg-slate-50 rounded-3xl border border-slate-100 hover:shadow-lg transition-shadow"
            >
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <Smartphone className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Paiements Flexibles</h3>
              <p className="text-slate-600 leading-relaxed">
                Intégration des paiements par Mobile Money (M-Pesa, Orange Money, Airtel) et cartes bancaires, configurables par institution.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="p-8 bg-slate-50 rounded-3xl border border-slate-100 hover:shadow-lg transition-shadow"
            >
              <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <Zap className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Outils IA Intégrés</h3>
              <p className="text-slate-600 leading-relaxed">
                Génération de syllabus pour les professeurs et tuteur virtuel pour accompagner les étudiants dans leur apprentissage.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Des tarifs adaptés à votre taille</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
            Choisissez le plan qui correspond au nombre d'étudiants de votre institution. Sans frais cachés.
          </p>
          
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-slate-900' : 'text-slate-500'}`}>Mensuel</span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative inline-flex h-7 w-14 items-center rounded-full bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isAnnual ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-medium flex items-center gap-2 ${isAnnual ? 'text-slate-900' : 'text-slate-500'}`}>
              Annuel <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">-20%</span>
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
          {plans.map((plan, index) => (
            <motion.div 
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className={`bg-white rounded-3xl p-8 border transition-all duration-300 flex flex-col h-full ${
                plan.recommended 
                  ? 'border-blue-500 shadow-xl shadow-blue-900/5 md:-translate-y-4 relative z-10' 
                  : 'border-slate-200 shadow-sm hover:shadow-md'
              }`}
            >
              {plan.recommended && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-sm">
                  Le plus populaire
                </div>
              )}
              
              <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
              <p className="text-slate-500 text-sm mb-6 h-10">{plan.description}</p>
              
              <div className="mb-6">
                {typeof plan.monthlyPrice === 'number' ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-900">
                      {isAnnual ? plan.annualPrice : plan.monthlyPrice}$
                    </span>
                    <span className="text-slate-500 font-medium">/ mois</span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900">{plan.monthlyPrice}</span>
                  </div>
                )}
                {isAnnual && typeof plan.monthlyPrice === 'number' && typeof plan.annualPrice === 'number' && (
                  <p className="text-sm text-emerald-600 font-medium mt-1">
                    Facturé {plan.annualPrice * 12}$ par an
                  </p>
                )}
              </div>
              
              <div className="p-4 bg-slate-50 rounded-xl mb-8 border border-slate-100">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-slate-700">{plan.students}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link 
                to="/login" 
                className={`w-full py-3 px-4 font-bold rounded-xl transition-colors text-center ${
                  plan.recommended 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
              >
                {typeof plan.monthlyPrice === 'number' ? 'Commencer l\'essai gratuit' : 'Contacter les ventes'}
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-500" />
            <span className="text-xl font-bold text-white tracking-tight">University Solution</span>
          </div>
          <p className="text-sm">
            © {new Date().getFullYear()} University Solution. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
