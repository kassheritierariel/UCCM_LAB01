import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle2, Zap, Users, Smartphone, GraduationCap, Globe, ArrowRight, Building2, Play, Shield, Star, Sparkles } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function LandingPage() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [instType, setInstType] = useState('all');
  const { scrollYProgress } = useScroll();
  const yPos = useTransform(scrollYProgress, [0, 1], [0, -60]);
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
      transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 80, damping: 15 } }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-600 selection:bg-blue-200 selection:text-blue-900 overflow-hidden">
      {/* Background Pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-40"></div>
      
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 z-50 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform duration-300">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              University<span className="text-blue-600">Solution</span>
            </span>
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

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
        {/* Animated Background Blobs (DRC Colors) */}
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.4, 0.6, 0.4],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-blue-400/30 via-yellow-400/20 to-red-400/20 rounded-full blur-[120px] -z-10 pointer-events-none"
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            style={{ opacity: opacityHero }}
            className="text-center lg:text-left z-10"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm mb-8 hover:shadow-md transition-shadow cursor-default">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500"></span>
              </span>
              <span className="text-xs font-bold text-slate-700 tracking-wider uppercase">La nouvelle ère de l'éducation en RDC</span>
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 mb-6 leading-[1.1]">
              Gérez votre institution <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-yellow-500 to-red-600 animate-gradient">
                avec excellence.
              </span>
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Une plateforme complète, rapide et intelligente pour gérer vos étudiants, professeurs, documents académiques et paiements en toute sécurité.
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-full font-bold text-base hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-1">
                Créer votre espace
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button className="w-full sm:w-auto px-8 py-4 bg-white text-slate-800 border border-slate-200 rounded-full font-bold text-base hover:bg-slate-50 transition-all flex items-center justify-center gap-3 group shadow-sm hover:shadow-md hover:-translate-y-1">
                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center group-hover:bg-yellow-200 group-hover:scale-110 transition-all">
                  <Play className="w-4 h-4 text-yellow-600 ml-0.5" />
                </div>
                Voir la démo
              </button>
            </motion.div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotateY: 15 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
            style={{ y: yPos }}
            className="relative hidden lg:block perspective-1000 h-[650px]"
          >
            {/* Main Image */}
            <motion.div 
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="absolute top-8 right-0 w-[85%] h-[450px] rounded-[2.5rem] overflow-hidden border-[6px] border-white shadow-2xl z-10"
            >
              <img 
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                alt="Étudiants universitaires" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
            </motion.div>

            {/* Floating Image 1 */}
            <motion.div 
              animate={{ y: [0, 20, 0] }}
              transition={{ repeat: Infinity, duration: 8, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-12 left-0 w-[60%] h-[300px] rounded-[2rem] overflow-hidden border-[6px] border-white shadow-2xl z-20"
            >
              <img 
                src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                alt="Campus" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>

            {/* Floating Image 2 */}
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 2 }}
              className="absolute -bottom-8 right-12 w-[45%] h-[240px] rounded-[2rem] overflow-hidden border-[6px] border-white shadow-2xl z-30"
            >
              <img 
                src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" 
                alt="Graduation" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            
            {/* Floating UI Elements */}
            <motion.div 
              initial={{ y: 50, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ delay: 1.2, duration: 0.8, type: "spring" }}
              className="absolute top-1/2 -left-12 bg-white/95 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-slate-100 flex items-center gap-4 z-40"
            >
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center border border-yellow-200 shrink-0">
                <CheckCircle2 className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Paiement validé</p>
                <p className="text-xs font-medium text-slate-500">Mobile Money - 50$</p>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ y: -50, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ delay: 1.4, duration: 0.8, type: "spring" }}
              className="absolute -top-4 right-8 bg-white/95 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-slate-100 flex items-center gap-4 z-40"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center border border-blue-200 shrink-0">
                <Sparkles className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Syllabus généré</p>
                <p className="text-xs font-medium text-slate-500">Par l'IA avec succès</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-32 relative z-10 bg-white border-y border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">L'écosystème parfait</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium">
              Des outils modernes pensés pour chaque acteur de votre institution, conçus pour la performance.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Users className="h-7 w-7" />,
                title: "Gestion Multi-Rôles",
                desc: "Espaces dédiés et sécurisés pour les administrateurs, professeurs, étudiants et caissiers.",
                color: "text-blue-600",
                bg: "bg-blue-50",
                borderHover: "hover:border-blue-300"
              },
              {
                icon: <Smartphone className="h-7 w-7" />,
                title: "Paiements Flexibles",
                desc: "Intégration fluide et instantanée des paiements par Mobile Money et cartes bancaires.",
                color: "text-yellow-600",
                bg: "bg-yellow-50",
                borderHover: "hover:border-yellow-400"
              },
              {
                icon: <Zap className="h-7 w-7" />,
                title: "Outils IA Intégrés",
                desc: "Génération de syllabus et tuteur virtuel intelligent pour accompagner les étudiants.",
                color: "text-red-600",
                bg: "bg-red-50",
                borderHover: "hover:border-red-300"
              }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className={`p-10 bg-white rounded-[2rem] border-2 border-slate-100 shadow-lg shadow-slate-200/20 transition-all duration-300 relative overflow-hidden group ${feature.borderHover}`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-50 to-transparent rounded-bl-full -z-10 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 ${feature.bg} ${feature.color} group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed text-base font-medium">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Des tarifs transparents</h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-12 font-medium">
            Choisissez le plan qui correspond à la taille et aux ambitions de votre institution.
          </p>
          
          {/* Institution Type Filter */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            {institutionTypes.map(type => (
              <button
                key={type.id}
                onClick={() => setInstType(type.id)}
                className={`px-6 py-3 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                  instType === type.id
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-105'
                    : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
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
          <div className="flex items-center justify-center gap-1 bg-slate-200/50 p-1.5 rounded-full w-fit mx-auto border border-slate-200">
            <button 
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${!isAnnual ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Mensuel
            </button>
            <button 
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${isAnnual ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Annuel <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isAnnual ? 'bg-yellow-400 text-yellow-900' : 'bg-slate-300 text-slate-700'}`}>-20%</span>
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
          {filteredPlans.length > 0 ? (
            filteredPlans.map((plan, index) => (
              <motion.div 
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                whileHover={{ y: -10 }}
                className={`rounded-[2.5rem] p-10 transition-all duration-300 flex flex-col h-full relative ${
                  plan.recommended 
                    ? 'bg-gradient-to-b from-blue-600 to-blue-800 text-white shadow-2xl shadow-blue-900/30 md:-translate-y-4 z-10 border border-blue-500' 
                    : 'bg-white border-2 border-slate-100 hover:border-slate-300 shadow-lg shadow-slate-200/20'
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-4 inset-x-0 flex justify-center">
                    <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-950 text-xs font-black uppercase tracking-widest py-1.5 px-4 rounded-full shadow-lg flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-yellow-950" /> Le plus populaire
                    </span>
                  </div>
                )}
                
                <h3 className={`text-2xl font-black mb-3 ${plan.recommended ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                <p className={`text-sm mb-8 h-10 font-medium ${plan.recommended ? 'text-blue-100' : 'text-slate-500'}`}>{plan.description}</p>
                
                <div className="mb-8">
                  {typeof plan.monthlyPrice === 'number' ? (
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-5xl font-black tracking-tight ${plan.recommended ? 'text-white' : 'text-slate-900'}`}>
                        {isAnnual ? plan.annualPrice : plan.monthlyPrice}$
                      </span>
                      <span className={`text-base font-bold ${plan.recommended ? 'text-blue-200' : 'text-slate-400'}`}>/ mois</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className={`text-4xl font-black tracking-tight ${plan.recommended ? 'text-white' : 'text-slate-900'}`}>{plan.monthlyPrice}</span>
                    </div>
                  )}
                  {isAnnual && typeof plan.monthlyPrice === 'number' && typeof plan.annualPrice === 'number' && (
                    <p className={`text-sm font-bold mt-2 ${plan.recommended ? 'text-yellow-300' : 'text-blue-600'}`}>
                      Facturé {plan.annualPrice * 12}$ par an
                    </p>
                  )}
                </div>
                
                <div className={`p-4 rounded-2xl mb-8 flex items-center gap-3 ${plan.recommended ? 'bg-white/10 backdrop-blur-sm border border-white/10' : 'bg-slate-50 border border-slate-100'}`}>
                  <Users className={`w-5 h-5 ${plan.recommended ? 'text-yellow-400' : 'text-blue-600'}`} />
                  <span className={`text-sm font-bold ${plan.recommended ? 'text-white' : 'text-slate-700'}`}>{plan.students}</span>
                </div>

                <ul className="space-y-5 mb-10 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${plan.recommended ? 'text-yellow-400' : 'text-blue-600'}`} />
                      <span className={`text-sm font-medium ${plan.recommended ? 'text-blue-50' : 'text-slate-600'}`}>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link 
                  to="/login" 
                  className={`w-full py-4 px-6 font-bold rounded-2xl transition-all text-center flex items-center justify-center gap-2 text-base ${
                    plan.recommended 
                      ? 'bg-yellow-400 text-yellow-950 hover:bg-yellow-300 shadow-lg shadow-yellow-400/20 hover:-translate-y-1' 
                      : 'bg-slate-900 text-white hover:bg-blue-600 shadow-md hover:shadow-xl hover:-translate-y-1'
                  }`}
                >
                  {typeof plan.monthlyPrice === 'number' ? 'Commencer l\'essai' : 'Contacter les ventes'}
                </Link>
              </motion.div>
            ))
          ) : (
            <div className="col-span-1 md:col-span-3 text-center py-16 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-slate-500 text-lg font-medium">Aucun plan ne correspond à ce type d'institution pour le moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative z-10 overflow-hidden mx-4 sm:mx-6 lg:mx-8 mb-24 rounded-[3rem]">
        <div className="absolute inset-0 bg-blue-600"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400 rounded-full blur-[120px] opacity-20 translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-500 rounded-full blur-[120px] opacity-20 -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center py-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight"
          >
            Prêt à transformer votre institution ?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-blue-100 text-xl md:text-2xl mb-12 font-medium max-w-2xl mx-auto"
          >
            Rejoignez les institutions qui font confiance à University Solution pour leur gestion quotidienne.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Link to="/login" className="px-10 py-5 bg-yellow-400 text-yellow-950 rounded-full font-black text-lg hover:bg-yellow-300 transition-all inline-flex items-center gap-3 shadow-xl shadow-yellow-400/20 hover:shadow-yellow-400/40 hover:-translate-y-1">
              Commencer maintenant <ArrowRight className="w-6 h-6" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-black text-slate-900 tracking-tight">University<span className="text-blue-600">Solution</span></span>
          </div>
          <div className="text-center md:text-right">
            <p className="text-sm text-slate-500 mb-2 font-medium">
              © {new Date().getFullYear()} University Solution par <span className="text-slate-900 font-bold">KassHeritier</span>. Tous droits réservés.
            </p>
            <p className="text-sm text-slate-500 flex items-center justify-center md:justify-end gap-2 font-medium">
              <Globe className="w-4 h-4" /> Contact : <a href="tel:+243818261297" className="text-red-600 hover:text-red-700 transition-colors font-bold">+243 818 261 297</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
