import React, { useState } from 'react';
import { Sparkles, BookOpen, FileText, Loader2, BrainCircuit, Zap } from 'lucide-react';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

export default function ProfessorAITools() {
  const [activeTool, setActiveTool] = useState<'syllabus' | 'content'>('syllabus');
  
  // Syllabus State
  const [courseName, setCourseName] = useState('');
  const [courseLevel, setCourseLevel] = useState('');
  const [courseObjectives, setCourseObjectives] = useState('');
  const [syllabusResult, setSyllabusResult] = useState('');
  const [isGeneratingSyllabus, setIsGeneratingSyllabus] = useState(false);

  // Content State
  const [topic, setTopic] = useState('');
  const [contentType, setContentType] = useState('quiz');
  const [contentResult, setContentResult] = useState('');
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);

  const handleGenerateSyllabus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName || !courseLevel) return;
    
    setIsGeneratingSyllabus(true);
    setSyllabusResult('');
    
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY });
      const prompt = `En tant qu'expert pédagogique universitaire, générez un syllabus détaillé pour le cours suivant :
Nom du cours : ${courseName}
Niveau/Promotion : ${courseLevel}
Objectifs principaux : ${courseObjectives}

Le syllabus doit inclure :
1. Une description générale du cours
2. Les objectifs d'apprentissage spécifiques
3. Un plan de cours détaillé semaine par semaine (sur 12 semaines)
4. Les méthodes d'évaluation suggérées
5. Une bibliographie de base recommandée

Formatez la réponse en Markdown clair et professionnel.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
        }
      });
      
      setSyllabusResult(response.text || 'Erreur lors de la génération.');
    } catch (error) {
      console.error('Error generating syllabus:', error);
      setSyllabusResult('Une erreur est survenue lors de la génération du syllabus.');
    } finally {
      setIsGeneratingSyllabus(false);
    }
  };

  const handleGenerateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) return;
    
    setIsGeneratingContent(true);
    setContentResult('');
    
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY });
      const prompt = `Générez du contenu pédagogique rapide pour des étudiants universitaires.
Sujet : ${topic}
Type de contenu souhaité : ${contentType === 'quiz' ? 'Un QCM de 5 questions avec les réponses à la fin' : 'Un résumé clair et structuré des concepts clés'}

Formatez la réponse en Markdown.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: prompt,
      });
      
      setContentResult(response.text || 'Erreur lors de la génération.');
    } catch (error) {
      console.error('Error generating content:', error);
      setContentResult('Une erreur est survenue lors de la génération du contenu.');
    } finally {
      setIsGeneratingContent(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="border-b border-slate-200">
        <div className="flex">
          <button
            onClick={() => setActiveTool('syllabus')}
            className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTool === 'syllabus' 
                ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-600' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <BrainCircuit className="w-5 h-5" />
            Générateur de Syllabus (IA Avancée)
          </button>
          <button
            onClick={() => setActiveTool('content')}
            className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTool === 'content' 
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Zap className="w-5 h-5" />
            Création Rapide de Contenu
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTool === 'syllabus' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                Détails du Cours
              </h3>
              <form onSubmit={handleGenerateSyllabus} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nom du cours</label>
                  <input
                    type="text"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="ex: Droit Constitutionnel"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Niveau / Promotion</label>
                  <input
                    type="text"
                    value={courseLevel}
                    onChange={(e) => setCourseLevel(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="ex: G1 Droit"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Objectifs principaux (optionnel)</label>
                  <textarea
                    value={courseObjectives}
                    onChange={(e) => setCourseObjectives(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none h-24 resize-none"
                    placeholder="Quelles sont les compétences visées ?"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isGeneratingSyllabus || !courseName || !courseLevel}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isGeneratingSyllabus ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Réflexion en cours...</>
                  ) : (
                    <><Sparkles className="w-5 h-5" /> Générer le Syllabus</>
                  )}
                </button>
                <p className="text-xs text-slate-500 text-center mt-2">
                  Utilise le modèle Gemini Pro avec raisonnement avancé pour des résultats optimaux.
                </p>
              </form>
            </div>
            
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 flex flex-col h-[500px]">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-500" />
                Résultat
              </h3>
              <div className="flex-1 overflow-y-auto bg-white border border-slate-200 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap">
                {syllabusResult ? (
                  syllabusResult
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <BookOpen className="w-12 h-12 mb-3 opacity-20" />
                    <p>Le syllabus généré apparaîtra ici.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTool === 'content' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                Générateur Rapide
              </h3>
              <form onSubmit={handleGenerateContent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sujet du contenu</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="ex: Les sources du droit administratif"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type de contenu</label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="quiz">QCM (5 questions)</option>
                    <option value="summary">Résumé des concepts clés</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={isGeneratingContent || !topic}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isGeneratingContent ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Génération rapide...</>
                  ) : (
                    <><Zap className="w-5 h-5" /> Générer le contenu</>
                  )}
                </button>
                <p className="text-xs text-slate-500 text-center mt-2">
                  Utilise le modèle Gemini Flash-Lite pour des réponses instantanées.
                </p>
              </form>
            </div>
            
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 flex flex-col h-[400px]">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-500" />
                Résultat
              </h3>
              <div className="flex-1 overflow-y-auto bg-white border border-slate-200 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap">
                {contentResult ? (
                  contentResult
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <Zap className="w-12 h-12 mb-3 opacity-20" />
                    <p>Le contenu généré apparaîtra ici.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
