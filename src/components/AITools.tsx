import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Video, Image as ImageIcon, Mic, MapPin, Loader2, Play, Square, AlertCircle, ExternalLink, Download, BookOpen, FileText, Sparkles as SparklesIcon } from 'lucide-react';
import Markdown from 'react-markdown';

// --- Helper to check API Key ---
const ensureApiKey = async () => {
  if (typeof window !== 'undefined' && window.aistudio) {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await window.aistudio.openSelectKey();
    }
  }
};

export default function AITools() {
  const [activeTab, setActiveTab] = useState('course');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800">Outils IA Avancés</h2>
        <p className="text-sm text-slate-500 mt-1">Générez des plans de cours, des vidéos, des images ou explorez des lieux.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <TabButton active={activeTab === 'course'} onClick={() => setActiveTab('course')} icon={<BookOpen className="w-4 h-4" />} label="Plan de Cours" />
        <TabButton active={activeTab === 'maps'} onClick={() => setActiveTab('maps')} icon={<MapPin className="w-4 h-4" />} label="Explorer (Maps)" />
        <TabButton active={activeTab === 'image'} onClick={() => setActiveTab('image')} icon={<ImageIcon className="w-4 h-4" />} label="Générer Image" />
        <TabButton active={activeTab === 'video'} onClick={() => setActiveTab('video')} icon={<Video className="w-4 h-4" />} label="Animer Image (Veo)" />
        <TabButton active={activeTab === 'audio'} onClick={() => setActiveTab('audio')} icon={<Mic className="w-4 h-4" />} label="Assistant Vocal" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 min-h-[500px]">
        {activeTab === 'course' && <CoursePlanTool />}
        {activeTab === 'maps' && <MapsTool />}
        {activeTab === 'image' && <ImageGenerationTool />}
        {activeTab === 'video' && <VideoGenerationTool />}
        {activeTab === 'audio' && <AudioTool />}
      </div>
    </div>
  );
}

// --- Course Plan Generator Tool ---
function CoursePlanTool() {
  const [subject, setSubject] = useState('Créer des rôles et des permissions pour les utilisateurs');
  const [level, setLevel] = useState('Étudiants en Administration des Systèmes (L2/L3)');
  const [duration, setDuration] = useState('8 semaines');
  const [plan, setPlan] = useState(`
# Plan de Cours : Gestion des Rôles et des Permissions (RBAC & IAM)

## 1. Objectifs du cours
*   Comprendre les principes de base de la sécurité des accès (Moindre Privilège, Séparation des tâches).
*   Maîtriser la gestion des utilisateurs et des groupes sous Linux et Windows Server.
*   Implémenter le contrôle d'accès basé sur les rôles (RBAC).
*   Comprendre les listes de contrôle d'accès (ACL) et les permissions spéciales.
*   S'initier à la gestion des identités et des accès (IAM) dans le Cloud (AWS/Azure).
*   Auditer et surveiller les accès aux ressources critiques.

## 2. Prérequis
*   Bases de l'utilisation d'un système d'exploitation (Ligne de commande).
*   Notions fondamentales sur les systèmes de fichiers.
*   Compréhension basique des réseaux (Authentification, protocoles).

## 3. Structure hebdomadaire (8 semaines)

| Semaine | Thème | Contenu |
| :--- | :--- | :--- |
| 1 | Fondamentaux de la Sécurité | Principes de la CIA, Identification vs Authentification vs Autorisation. |
| 2 | Permissions Standard (Linux/Unix) | Propriétaires, Groupes, Autres (rwx). Sticky bit, SUID, SGID. |
| 3 | ACL Avancées (Linux) | Utilisation de \`getfacl\` et \`setfacl\`. Masques et héritage. |
| 4 | Active Directory & NTFS (Windows) | Gestion des utilisateurs/groupes AD. Permissions NTFS vs Partage. |
| 5 | RBAC (Role-Based Access Control) | Définition des rôles, hiérarchies, affectation des permissions aux rôles. |
| 6 | IAM dans le Cloud | Introduction à AWS IAM ou Azure AD. Politiques JSON, Rôles, Groupes. |
| 7 | Automatisation & Scripts | Gestion des permissions via Bash/PowerShell. Ansible pour les droits. |
| 8 | Audit & Conformité | Journaux d'accès, outils d'audit (Aureport, Event Viewer). Examen final. |

## 4. Méthodes d'évaluation
*   **Travaux Pratiques (50%)** : Configuration de serveurs avec des structures de permissions complexes.
*   **Étude de Cas (20%)** : Analyse d'un scénario d'entreprise et conception d'une matrice de rôles.
*   **Examen Final (30%)** : QCM théorique et résolution de problèmes en environnement simulé.

## 5. Ressources recommandées
*   *Linux Administration Handbook* par Evi Nemeth.
*   Documentation Microsoft Learn sur Active Directory.
*   AWS IAM Best Practices Guide.
*   Outils : \`chmod\`, \`chown\`, \`setfacl\`, PowerShell, Terraform (pour IAM).
`);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!subject.trim()) return;
    setLoading(true);
    setPlan('');
    setError('');

    try {
      const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || import.meta.env.VITE_GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `En tant que professeur expert, génère un plan de cours détaillé et structuré pour le sujet suivant : "${subject}".
      Public cible : ${level}
      Durée estimée : ${duration}
      
      Le plan doit inclure :
      1. Objectifs du cours
      2. Prérequis
      3. Structure hebdomadaire (ou par modules)
      4. Méthodes d'évaluation
      5. Ressources recommandées
      
      Réponds en utilisant le format Markdown avec des titres clairs.`;

      const res = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });

      setPlan(res.text || '');
    } catch (err: any) {
      console.error(err);
      setError("Une erreur s'est produite lors de la génération du plan de cours.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800">Générateur de Plan de Cours</h3>
          <p className="text-sm text-slate-500">Utilisez l'IA pour structurer vos enseignements en quelques secondes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
        <div className="md:col-span-3">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sujet du cours</label>
          <input 
            type="text" 
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            placeholder="Ex: Introduction à l'IA..."
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Niveau / Public</label>
          <input 
            type="text" 
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Durée</label>
          <input 
            type="text" 
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
          />
        </div>
        <div className="flex items-end">
          <button 
            onClick={handleGenerate}
            disabled={loading || !subject.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
            Générer le plan
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-3 border border-red-100">
          <AlertCircle className="w-5 h-5 shrink-0" /> 
          <p>{error}</p>
        </div>
      )}

      {plan && (
        <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-500" />
              Plan de cours généré :
            </h4>
            <button 
              onClick={() => {
                const blob = new Blob([plan], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `plan-cours-${subject.slice(0, 20)}.md`;
                a.click();
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 bg-indigo-50 px-4 py-2 rounded-xl"
            >
              <Download className="w-4 h-4" /> Télécharger (.md)
            </button>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm prose prose-slate max-w-none">
            <Markdown>{plan}</Markdown>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
        active 
          ? 'bg-blue-600 text-white shadow-sm' 
          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// --- Maps Grounding Tool ---
function MapsTool() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!prompt) return;
    setLoading(true);
    setResponse('');
    setPlaces([]);

    try {
      const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || import.meta.env.VITE_GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey });
      
      let latLng;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        latLng = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      } catch (e) {
        console.warn("Geolocation not available", e);
      }

      const config: any = {
        tools: [{ googleMaps: {} }],
      };

      if (latLng) {
        config.toolConfig = {
          retrievalConfig: { latLng }
        };
      }

      const res = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config
      });

      setResponse(res.text || '');
      
      const chunks = res.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        const extractedPlaces = chunks
          .filter((c: any) => c.maps?.uri)
          .map((c: any) => ({ uri: c.maps.uri, title: c.maps.title || 'Lieu sur Google Maps' }));
        setPlaces(extractedPlaces);
      }
    } catch (error) {
      console.error(error);
      setResponse("Une erreur s'est produite lors de la recherche.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <h3 className="text-lg font-bold text-slate-800">Recherche avec Google Maps</h3>
      <p className="text-sm text-slate-500">Posez une question sur des lieux (ex: "Quels sont les bons restaurants italiens à proximité ?")</p>
      
      <div className="flex gap-2">
        <input 
          type="text" 
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Votre question..."
          className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button 
          onClick={handleSearch}
          disabled={loading || !prompt}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
          Rechercher
        </button>
      </div>

      {response && (
        <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="prose prose-sm max-w-none whitespace-pre-wrap">{response}</div>
          
          {places.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <h4 className="font-semibold text-slate-700 mb-2 text-sm">Lieux mentionnés :</h4>
              <ul className="space-y-2">
                {places.map((place, idx) => (
                  <li key={idx}>
                    <a href={place.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 text-sm">
                      <ExternalLink className="w-3 h-3" /> {place.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Image Generation Tool ---
function ImageGenerationTool() {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState('1K');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setImageUrl('');
    setError('');

    try {
      await ensureApiKey();
      // We must create a new instance after ensuring API key
      const apiKey = (typeof process !== 'undefined' && process.env?.API_KEY) || import.meta.env.VITE_GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey });
      
      const res = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
            imageSize: size as any
          }
        }
      });

      let foundImage = false;
      for (const part of res.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setImageUrl(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
          foundImage = true;
          break;
        }
      }
      
      if (!foundImage) {
        setError("Aucune image n'a été générée.");
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('Requested entity was not found')) {
        setError("Veuillez sélectionner une clé API valide et réessayer.");
        if (window.aistudio) window.aistudio.openSelectKey();
      } else {
        setError(err.message || "Erreur lors de la génération. Assurez-vous que votre prompt respecte les règles de sécurité.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `generation-ia-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h3 className="text-xl font-bold text-slate-800">Générateur d'Images IA</h3>
        <p className="text-sm text-slate-500 mt-1">Décrivez l'image que vous souhaitez créer avec le plus de détails possible.</p>
      </div>
      
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Description de l'image (Prompt)</label>
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex: Un campus universitaire futuriste avec des étudiants utilisant des tablettes holographiques, style cyberpunk, éclairage néon..."
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none h-28 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleGenerate();
              }
            }}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Format</label>
            <select 
              value={aspectRatio} 
              onChange={(e) => setAspectRatio(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            >
              <option value="1:1">Carré (1:1)</option>
              <option value="16:9">Paysage (16:9)</option>
              <option value="9:16">Portrait (9:16)</option>
              <option value="4:3">Classique (4:3)</option>
              <option value="3:4">Photo (3:4)</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Résolution</label>
            <select 
              value={size} 
              onChange={(e) => setSize(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            >
              <option value="512px">Standard (512px)</option>
              <option value="1K">Haute (1K)</option>
              <option value="2K">Très Haute (2K)</option>
              <option value="4K">Ultra (4K)</option>
            </select>
          </div>
        </div>

        <button 
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3.5 rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
          {loading ? 'Création de l\'image en cours...' : 'Générer l\'image'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-3 border border-red-100">
          <AlertCircle className="w-5 h-5 shrink-0" /> 
          <p>{error}</p>
        </div>
      )}

      {imageUrl && (
        <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-800">Résultat :</h4>
            <button 
              onClick={handleDownload}
              className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors"
            >
              <Download className="w-4 h-4" /> Télécharger
            </button>
          </div>
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 flex justify-center p-2 shadow-inner">
            <img src={imageUrl} alt="Générée par IA" className="max-w-full h-auto rounded-xl shadow-sm" />
          </div>
        </div>
      )}
    </div>
  );
}

// --- Video Generation Tool ---
function VideoGenerationTool() {
  const [prompt, setPrompt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!imageFile) {
      setError("Veuillez fournir une image de départ.");
      return;
    }
    
    setLoading(true);
    setVideoUrl('');
    setError('');
    setStatus('Initialisation...');

    try {
      await ensureApiKey();
      const apiKey = (typeof process !== 'undefined' && process.env?.API_KEY) || import.meta.env.VITE_GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey });
      
      const base64Data = imagePreview.split(',')[1];
      
      setStatus('Génération en cours (cela peut prendre quelques minutes)...');
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt || undefined,
        image: {
          imageBytes: base64Data,
          mimeType: imageFile.type,
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: aspectRatio as any
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        setStatus('Génération en cours... Veuillez patienter.');
        operation = await ai.operations.getVideosOperation({operation: operation});
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        setStatus('Téléchargement de la vidéo...');
        const apiKey = (typeof process !== 'undefined' && process.env?.API_KEY) || import.meta.env.VITE_GEMINI_API_KEY;
        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: { 'x-goog-api-key': apiKey as string },
        });
        
        if (response.ok) {
          const blob = await response.blob();
          setVideoUrl(URL.createObjectURL(blob));
          setStatus('');
        } else {
          throw new Error("Erreur lors de la récupération de la vidéo.");
        }
      } else {
        throw new Error("Aucune vidéo générée.");
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('Requested entity was not found')) {
        setError("Veuillez sélectionner une clé API valide et réessayer.");
        if (window.aistudio) window.aistudio.openSelectKey();
      } else {
        setError(err.message || "Erreur lors de la génération.");
      }
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <h3 className="text-lg font-bold text-slate-800">Animation d'image (Veo)</h3>
      <p className="text-sm text-slate-500">Uploadez une image et ajoutez un prompt optionnel pour générer une vidéo.</p>
      
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Image de départ</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={handleImageChange}
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Format</label>
            <select 
              value={aspectRatio} 
              onChange={(e) => setAspectRatio(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-auto"
            >
              <option value="16:9">Paysage (16:9)</option>
              <option value="9:16">Portrait (9:16)</option>
            </select>
          </div>
        </div>

        {imagePreview && (
          <div className="w-32 h-32 rounded-lg overflow-hidden border border-slate-200">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Prompt (Optionnel)</label>
          <input 
            type="text" 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex: La caméra avance lentement..."
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <button 
          onClick={handleGenerate}
          disabled={loading || !imageFile}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Video className="w-5 h-5" />}
          {loading ? 'Génération en cours...' : 'Générer la vidéo'}
        </button>
      </div>

      {status && (
        <div className="p-3 bg-blue-50 text-blue-700 rounded-xl text-sm flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> {status}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {videoUrl && (
        <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden bg-black flex justify-center">
          <video src={videoUrl} controls autoPlay loop className="max-w-full max-h-[500px]" />
        </div>
      )}
    </div>
  );
}

// --- Audio Tool (Live API) ---
function AudioTool() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null);
  const nextPlayTimeRef = useRef<number>(0);

  const startConversation = async () => {
    setIsConnecting(true);
    setError('');
    try {
      const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || import.meta.env.VITE_GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      nextPlayTimeRef.current = audioContextRef.current.currentTime;

      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "Tu es un assistant vocal utile pour une université. Parle en français.",
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            
            processorRef.current!.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcm16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                let s = Math.max(-1, Math.min(1, inputData[i]));
                pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
              }
              
              const buffer = new ArrayBuffer(pcm16.length * 2);
              const view = new DataView(buffer);
              for (let i = 0; i < pcm16.length; i++) {
                view.setInt16(i * 2, pcm16[i], true);
              }
              
              const base64Data = btoa(String.fromCharCode(...new Uint8Array(buffer)));
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({
                  media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                });
              });
            };
            
            source.connect(processorRef.current!);
            processorRef.current!.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
              const binaryString = atob(base64Audio);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              
              const pcm16 = new Int16Array(bytes.buffer);
              const float32 = new Float32Array(pcm16.length);
              for (let i = 0; i < pcm16.length; i++) {
                float32[i] = pcm16[i] / 0x8000;
              }
              
              const audioBuffer = audioContextRef.current.createBuffer(1, float32.length, 24000);
              audioBuffer.getChannelData(0).set(float32);
              
              const sourceNode = audioContextRef.current.createBufferSource();
              sourceNode.buffer = audioBuffer;
              sourceNode.connect(audioContextRef.current.destination);
              
              const currentTime = audioContextRef.current.currentTime;
              if (nextPlayTimeRef.current < currentTime) {
                nextPlayTimeRef.current = currentTime;
              }
              
              sourceNode.start(nextPlayTimeRef.current);
              nextPlayTimeRef.current += audioBuffer.duration;
            }
            
            if (message.serverContent?.interrupted) {
              nextPlayTimeRef.current = audioContextRef.current?.currentTime || 0;
            }
          },
          onclose: () => {
            stopConversation();
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            setError("Erreur de connexion audio.");
            stopConversation();
          }
        }
      });
      
      sessionRef.current = await sessionPromise;
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur lors de l'initialisation audio.");
      setIsConnecting(false);
      stopConversation();
    }
  };

  const stopConversation = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch(e) {}
      sessionRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  };

  useEffect(() => {
    return () => stopConversation();
  }, []);

  return (
    <div className="space-y-6 max-w-md mx-auto text-center py-12">
      <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
        {isConnected && (
          <>
            <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20"></div>
            <div className="absolute inset-2 bg-blue-300 rounded-full animate-ping opacity-30" style={{ animationDelay: '0.2s' }}></div>
          </>
        )}
        <Mic className={`w-10 h-10 ${isConnected ? 'text-blue-600' : 'text-slate-400'} relative z-10`} />
      </div>
      
      <h3 className="text-xl font-bold text-slate-800">Assistant Vocal IA</h3>
      <p className="text-slate-500">Discutez en temps réel avec l'assistant de l'université.</p>
      
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="pt-6">
        {!isConnected ? (
          <button 
            onClick={startConversation}
            disabled={isConnecting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-3 mx-auto shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
          >
            {isConnecting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6 fill-current" />}
            {isConnecting ? 'Connexion...' : 'Démarrer la conversation'}
          </button>
        ) : (
          <button 
            onClick={stopConversation}
            className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-full font-bold text-lg flex items-center justify-center gap-3 mx-auto shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
          >
            <Square className="w-6 h-6 fill-current" />
            Arrêter
          </button>
        )}
      </div>
      
      {isConnected && (
        <p className="text-sm text-emerald-600 font-medium animate-pulse mt-4">
          En écoute... Parlez maintenant.
        </p>
      )}
    </div>
  );
}
