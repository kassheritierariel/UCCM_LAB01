import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle2, Zap, Users, Smartphone, GraduationCap, Globe, ArrowRight, Building2, Play, Shield, Star, Sparkles, LayoutDashboard, ShieldCheck, LineChart } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Logo from './components/Logo';

export default function LandingPage() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [instType, setInstType] = useState('all');
  const { scrollYProgress } = useScroll();
  const yPos = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const institutionTypes = [
    { id: 'all', label: 'Toutes les institutions' },
    { id: 'university', label: 'Universités' },
    { id: 'institute', label: 'Instituts Supérieurs' },
    { id: 'school', label: 'Écoles & Centres' }
  ];

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
      recommended: false,
      types: ['institute', 'school']
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
      recommended: true,
      types: ['university', 'institute']
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
      recommended: false,
      types: ['university']
    }
  ];

  const filteredPlans = plans.filter(plan => instType === 'all' || plan.types.includes(instType));

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 15 } }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-600 selection:bg-blue-200 selection:text-blue-900 overflow-hidden">
      {/* Background Pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-50"></div>
      
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 z-50 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <Logo className="w-10 h-10 group-hover:scale-105 transition-transform duration-300" />
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors hidden sm:block">
              Se connecter
            </Link>
            <Link to="/login" className="text-sm font-bold bg-slate-900 text-white px-6 py-2.5 rounded-full hover:bg-blue-600 transition-all shadow-md hover:shadow-xl hover:shadow-blue-600/20 hover:-translate-y-0.5">
              Commencer
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Hero Section - Modern Split Layout */}
      <section className="relative pt-32 lg:pt-40 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            style={{ opacity: opacityHero }}
            className="text-center lg:text-left z-10"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-8">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
              </span>
              <span className="text-xs font-bold text-blue-700 tracking-wider uppercase">Plateforme Éducative Nouvelle Génération</span>
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 mb-6 leading-[1.1]">
              L'éducation <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                sans limites.
              </span>
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Transformez la gestion de votre institution avec notre plateforme tout-en-un. De l'inscription à la diplomation, simplifiez chaque étape avec l'intelligence artificielle.
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link to="/register-institution" className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-full font-bold text-base hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-xl hover:shadow-blue-600/30 hover:-translate-y-1">
                Créer votre espace
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button className="w-full sm:w-auto px-8 py-4 bg-white text-slate-800 border border-slate-200 rounded-full font-bold text-base hover:bg-slate-50 transition-all flex items-center justify-center gap-3 group shadow-sm hover:shadow-md hover:-translate-y-1">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 group-hover:scale-110 transition-all">
                  <Play className="w-4 h-4 text-blue-600 ml-0.5" />
                </div>
                Voir la vidéo
              </button>
            </motion.div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            style={{ y: yPos }}
            className="relative lg:h-[600px] flex items-center justify-center"
          >
            <div className="relative w-full max-w-lg mx-auto aspect-[4/3] lg:aspect-auto lg:h-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50 bg-white">
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
                alt="Étudiants collaborant" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent"></div>
              
              {/* Floating UI Elements on Image */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/20 flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Frais académiques payés</p>
                  <p className="text-xs font-medium text-slate-500">Reçu généré automatiquement</p>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 1 }}
                className="absolute top-6 right-6 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-white/20 flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Syllabus IA prêt</p>
                </div>
              </motion.div>
            </div>
            
            {/* Decorative background blur */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-blue-400/20 to-indigo-400/20 blur-[80px] -z-10 rounded-full"></div>
          </motion.div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-10 border-y border-slate-200/50 bg-white relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-6">Fait confiance par les institutions innovantes</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="flex items-center gap-2 font-bold text-xl text-slate-800"><Building2 className="w-6 h-6" /> UnivTech</div>
            <div className="flex items-center gap-2 font-bold text-xl text-slate-800"><GraduationCap className="w-6 h-6" /> Institut Supérieur</div>
            <div className="flex items-center gap-2 font-bold text-xl text-slate-800"><BookOpen className="w-6 h-6" /> Académie d'Excellence</div>
            <div className="flex items-center gap-2 font-bold text-xl text-slate-800"><Globe className="w-6 h-6" /> Global Edu</div>
          </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section className="py-24 relative z-10 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">Une gestion unifiée et intelligente</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium">
              Découvrez comment notre plateforme simplifie le quotidien de votre institution.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
            {/* Feature 1 - Large */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-bl-full -z-10 transition-transform duration-500 group-hover:scale-110"></div>
              <LayoutDashboard className="w-10 h-10 text-blue-600 mb-6" />
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Tableaux de bord intuitifs</h3>
              <p className="text-slate-600 font-medium max-w-md">
                Suivez les inscriptions, les paiements et les performances académiques en temps réel avec des visualisations claires et précises.
              </p>
              <div className="absolute bottom-[-20px] right-[-20px] w-64 h-40 bg-slate-100 rounded-tl-2xl border-t border-l border-slate-200 shadow-lg transform rotate-[-5deg] group-hover:rotate-0 transition-transform duration-500 flex items-center justify-center">
                <LineChart className="w-20 h-20 text-slate-300" />
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10 transition-transform duration-500 group-hover:scale-110"></div>
              <Zap className="w-10 h-10 text-indigo-600 mb-6" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Intelligence Artificielle</h3>
              <p className="text-slate-600 font-medium text-sm">
                Générez des syllabus complets en quelques secondes et offrez un tuteur virtuel disponible 24/7 à vos étudiants.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-10 transition-transform duration-500 group-hover:scale-110"></div>
              <Smartphone className="w-10 h-10 text-emerald-600 mb-6" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Paiements Simplifiés</h3>
              <p className="text-slate-600 font-medium text-sm">
                Intégration native de Mobile Money et cartes bancaires pour des transactions rapides et sécurisées.
              </p>
            </motion.div>

            {/* Feature 4 - Large */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="md:col-span-2 bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-xl relative overflow-hidden group text-white"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800 rounded-bl-full -z-10 transition-transform duration-500 group-hover:scale-110"></div>
              <ShieldCheck className="w-10 h-10 text-blue-400 mb-6" />
              <h3 className="text-2xl font-bold mb-3">Sécurité & Fiabilité</h3>
              <p className="text-slate-400 font-medium max-w-md">
                Vos données sont chiffrées et sauvegardées en temps réel. Gérez les rôles et les permissions avec une granularité fine.
              </p>
              <div className="absolute bottom-8 right-8 flex gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                  <Users className="w-5 h-5 text-slate-300" />
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">Des tarifs transparents</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 font-medium">
            Choisissez le plan qui correspond à la taille et aux ambitions de votre institution.
          </p>
          
          {/* Institution Type Filter */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {institutionTypes.map(type => (
              <button
                key={type.id}
                onClick={() => setInstType(type.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                  instType === type.id
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {type.id === 'university' && <GraduationCap className="w-4 h-4" />}
                {type.id === 'institute' && <Building2 className="w-4 h-4" />}
                {type.id === 'school' && <BookOpen className="w-4 h-4" />}
                {type.label}
              </button>
            ))}
          </div>

          {/* Monthly/Annual Toggle */}
          <div className="flex items-center justify-center gap-1 bg-slate-100 p-1 rounded-full w-fit mx-auto border border-slate-200">
            <button 
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${!isAnnual ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Mensuel
            </button>
            <button 
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${isAnnual ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Annuel <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${isAnnual ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>-20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
          {filteredPlans.length > 0 ? (
            filteredPlans.map((plan, index) => (
              <motion.div 
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`rounded-3xl p-8 transition-all duration-300 flex flex-col h-full relative ${
                  plan.recommended 
                    ? 'bg-slate-900 text-white shadow-xl md:-translate-y-4 z-10 border border-slate-800' 
                    : 'bg-white border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md'
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 inset-x-0 flex justify-center">
                    <span className="bg-blue-600 text-white text-xs font-bold uppercase tracking-widest py-1 px-3 rounded-full shadow-sm flex items-center gap-1">
                      <Star className="w-3 h-3 fill-white" /> Le plus populaire
                    </span>
                  </div>
                )}
                
                <h3 className={`text-xl font-bold mb-2 ${plan.recommended ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                <p className={`text-sm mb-6 h-10 font-medium ${plan.recommended ? 'text-slate-400' : 'text-slate-500'}`}>{plan.description}</p>
                
                <div className="mb-6">
                  {typeof plan.monthlyPrice === 'number' ? (
                    <div className="flex items-end gap-1">
                      <span className={`text-4xl font-black tracking-tight ${plan.recommended ? 'text-white' : 'text-slate-900'}`}>
                        ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                      </span>
                      <span className={`text-sm font-medium mb-1 ${plan.recommended ? 'text-slate-400' : 'text-slate-500'}`}>/mois</span>
                    </div>
                  ) : (
                    <div className={`text-3xl font-black tracking-tight ${plan.recommended ? 'text-white' : 'text-slate-900'}`}>
                      {plan.monthlyPrice}
                    </div>
                  )}
                  {typeof plan.monthlyPrice === 'number' && isAnnual && (
                    <p className={`text-xs mt-1 font-medium ${plan.recommended ? 'text-blue-400' : 'text-blue-600'}`}>
                      Facturé ${(plan.annualPrice as number) * 12} annuellement
                    </p>
                  )}
                </div>
                
                <div className={`py-3 px-4 rounded-xl mb-6 text-sm font-bold flex items-center justify-center gap-2 ${plan.recommended ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
                  <Users className="w-4 h-4" />
                  {plan.students}
                </div>
                
                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm font-medium">
                      <CheckCircle2 className={`w-5 h-5 shrink-0 ${plan.recommended ? 'text-blue-400' : 'text-blue-600'}`} />
                      <span className={plan.recommended ? 'text-slate-300' : 'text-slate-600'}>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link 
                  to="/login" 
                  className={`w-full py-3.5 rounded-xl font-bold text-sm text-center transition-all ${
                    plan.recommended 
                      ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-md hover:shadow-blue-600/20' 
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  Commencer maintenant
                </Link>
              </motion.div>
            ))
          ) : (
            <div className="col-span-1 md:col-span-3 text-center py-12">
              <p className="text-slate-500 font-medium">Aucun plan ne correspond à ce type d'institution.</p>
              <button 
                onClick={() => setInstType('all')}
                className="mt-4 text-blue-600 font-bold hover:underline"
              >
                Voir tous les plans
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">
                University<span className="text-blue-500">Solution</span>
              </span>
            </div>
            <div className="text-sm font-medium">
              &copy; {new Date().getFullYear()} UniversitySolution. Tous droits réservés.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
