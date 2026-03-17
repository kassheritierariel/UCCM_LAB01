import React, { useState, useRef, useEffect } from 'react';
import { PenTool, Eraser, RotateCcw, Download, Calculator, Sparkles, Loader2, Image as ImageIcon } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

export default function StudentWorkspace() {
  const [activeTab, setActiveTab] = useState<'draw' | 'math'>('draw');

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="border-b border-slate-200 flex">
        <button
          onClick={() => setActiveTab('draw')}
          className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'draw' 
              ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <PenTool className="w-5 h-5" />
          Tableau Blanc
        </button>
        <button
          onClick={() => setActiveTab('math')}
          className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'math' 
              ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-600' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Calculator className="w-5 h-5" />
          Résolveur Mathématique IA
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'draw' && <DrawingBoard />}
        {activeTab === 'math' && <MathSolver />}
      </div>
    </div>
  );
}

function DrawingBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set initial background to white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = tool === 'eraser' ? lineWidth * 3 : lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'dessin-etudiant.png';
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTool('pen')}
            className={`p-2 rounded-lg transition-colors ${tool === 'pen' ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-200 text-slate-600'}`}
            title="Stylo"
          >
            <PenTool className="w-5 h-5" />
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`p-2 rounded-lg transition-colors ${tool === 'eraser' ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-200 text-slate-600'}`}
            title="Gomme"
          >
            <Eraser className="w-5 h-5" />
          </button>
        </div>
        
        <div className="h-6 w-px bg-slate-300"></div>
        
        <div className="flex items-center gap-2">
          <input 
            type="color" 
            value={color} 
            onChange={(e) => setColor(e.target.value)}
            disabled={tool === 'eraser'}
            className="w-8 h-8 rounded cursor-pointer border-0 p-0"
            title="Couleur"
          />
          <input 
            type="range" 
            min="1" 
            max="20" 
            value={lineWidth} 
            onChange={(e) => setLineWidth(parseInt(e.target.value))}
            className="w-24"
            title="Épaisseur"
          />
        </div>

        <div className="h-6 w-px bg-slate-300"></div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={clearCanvas}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Effacer
          </button>
          <button
            onClick={downloadCanvas}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Sauvegarder
          </button>
        </div>
      </div>

      <div className="border-2 border-slate-200 rounded-xl overflow-hidden bg-slate-100 shadow-inner">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="w-full h-auto bg-white cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
    </div>
  );
}

function MathSolver() {
  const [problem, setProblem] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState('');
  const [isSolving, setIsSolving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problem && !image) return;

    setIsSolving(true);
    setResult('');

    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY });
      
      const prompt = `Tu es un professeur de mathématiques expert. Résous le problème mathématique suivant étape par étape. 
Si une image est fournie, analyse l'équation dans l'image et résous-la.
Problème texte : ${problem}

Fournis une explication claire, détaillée et pédagogique. Formate ta réponse en Markdown.`;

      const contents: any[] = [{ text: prompt }];

      if (image) {
        const base64Data = image.split(',')[1];
        const mimeType = image.split(';')[0].split(':')[1];
        contents.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: { parts: contents },
      });

      setResult(response.text || 'Impossible de résoudre ce problème.');
    } catch (error) {
      console.error('Error solving math problem:', error);
      setResult('Une erreur est survenue lors de la résolution.');
    } finally {
      setIsSolving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-emerald-600" />
          Votre Problème
        </h3>
        <form onSubmit={handleSolve} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Écrivez l'équation ou le problème</label>
            <textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none h-32 resize-none"
              placeholder="ex: Résoudre l'équation différentielle y'' + 4y = 0"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ou importez une photo du problème</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-6 border-2 border-dashed border-slate-300 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-colors cursor-pointer flex flex-col items-center justify-center text-slate-500"
            >
              <ImageIcon className="w-8 h-8 mb-2 text-slate-400" />
              <span className="text-sm font-medium">Cliquez pour ajouter une image</span>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            {image && (
              <div className="mt-4 relative inline-block">
                <img src={image} alt="Problème" className="h-32 rounded-lg border border-slate-200 shadow-sm" />
                <button 
                  type="button"
                  onClick={() => setImage(null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-sm"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSolving || (!problem && !image)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSolving ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Résolution en cours...</>
            ) : (
              <><Sparkles className="w-5 h-5" /> Résoudre avec l'IA</>
            )}
          </button>
        </form>
      </div>
      
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 flex flex-col h-[600px]">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          Solution Détaillée
        </h3>
        <div className="flex-1 overflow-y-auto bg-white border border-slate-200 rounded-lg p-5 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
          {result ? (
            result
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Calculator className="w-12 h-12 mb-3 opacity-20" />
              <p>La solution étape par étape apparaîtra ici.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
