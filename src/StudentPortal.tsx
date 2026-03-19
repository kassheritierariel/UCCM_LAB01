import React, { useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import { BookOpen, Bell, LogOut, Upload, FileText, CheckCircle, Clock, AlertCircle, MessageCircle, CreditCard, Smartphone, Shield, Printer, X } from 'lucide-react';
import StudentChat from './components/StudentChat';
import StudentWorkspace from './components/StudentWorkspace';
import { QRCodeSVG } from 'qrcode.react';
import Logo from './components/Logo';

export default function StudentPortal() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'resources' | 'deposit' | 'ai' | 'payments' | 'workspace'>('resources');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'mobile' | 'card' | 'chariow' | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileError(null);

    if (file) {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        setFileError('Seuls les fichiers PDF sont acceptés.');
        setSelectedFile(null);
        return;
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setFileError('Le fichier ne doit pas dépasser 10 Mo.');
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setFileError(null);
    
    const file = event.dataTransfer.files?.[0];
    if (file) {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        setFileError('Seuls les fichiers PDF sont acceptés.');
        setSelectedFile(null);
        return;
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setFileError('Le fichier ne doit pas dépasser 10 Mo.');
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = () => {
    if (selectedFile) {
      // Handle file upload logic here
      console.log('Submitting file:', selectedFile.name);
      // Reset after submission
      // setSelectedFile(null);
    }
  };

  return (
    <div className="bg-slate-50 text-slate-900 font-sans antialiased min-h-screen">
      <header className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-md">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Logo className="w-10 h-10" withText={false} />
            <div>
              <h1 className="text-lg font-extrabold leading-none tracking-tight">
                UCCM <span className="font-light text-slate-300">| Étudiant</span>
              </h1>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
                Portail Académique
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-full hover:bg-slate-700 transition-colors">
              <Bell className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium hidden sm:block">{user?.name}</span>
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
        <div className="flex gap-4 border-b border-slate-200 pb-2">
          <button 
            onClick={() => setActiveTab('resources')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'resources' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Ressources & Cours
          </button>
          <button 
            onClick={() => setActiveTab('deposit')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'deposit' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Dépôt Documents
          </button>
          <button 
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'payments' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <CreditCard className="w-4 h-4" />
            Paiements
          </button>
          <button 
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'ai' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <MessageCircle className="w-4 h-4" />
            Chat & IA
          </button>
          <button 
            onClick={() => setActiveTab('workspace')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'workspace' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <BookOpen className="w-4 h-4" />
            Espace de Travail
          </button>
        </div>

        {activeTab === 'workspace' && (
          <div className="mt-8">
            <StudentWorkspace />
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center h-64">
              <FileText className="h-12 w-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-800">Aucun document récent</h3>
              <p className="text-sm text-slate-500 mt-2">Les documents partagés par vos professeurs apparaîtront ici.</p>
            </div>
          </div>
        )}

        {activeTab === 'deposit' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Dépôt de Document</h2>
              
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">1</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-800">Type de document</h3>
                    <p className="text-sm text-slate-500 mt-1 mb-4">Sélectionnez le type de document que vous souhaitez soumettre.</p>
                    <select className="w-full max-w-md px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all">
                      <option value="tfc">Travail de Fin de Cycle (TFC)</option>
                      <option value="memoire">Mémoire</option>
                      <option value="rapport">Rapport de Stage</option>
                      <option value="autre">Autre Document</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">2</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-800">Paiement des frais de dépôt</h3>
                    <p className="text-sm text-slate-500 mt-1 mb-4">Vous devez vous acquitter des frais de dépôt avant de pouvoir soumettre votre document.</p>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      Payer maintenant (50.00 $)
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">3</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-800">Soumission du document</h3>
                    <p className="text-sm text-slate-500 mt-1 mb-4">Téléversez votre document au format PDF (Max 10 Mo).</p>
                    
                    <div 
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                        fileError ? 'border-red-300 bg-red-50' : 
                        selectedFile ? 'border-emerald-300 bg-emerald-50' : 
                        'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
                      }`}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={!selectedFile ? triggerFileInput : undefined}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="application/pdf" 
                        className="hidden" 
                      />
                      
                      {selectedFile ? (
                        <div className="flex flex-col items-center">
                          <CheckCircle className="h-10 w-10 text-emerald-500 mb-3" />
                          <p className="text-sm font-medium text-emerald-800">{selectedFile.name}</p>
                          <p className="text-xs text-emerald-600 mt-1">{(selectedFile.size / (1024 * 1024)).toFixed(2)} Mo</p>
                          <div className="mt-4 flex gap-3">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                              className="text-sm text-slate-500 hover:text-slate-700 font-medium px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                            >
                              Changer de fichier
                            </button>
                            <button 
                              onClick={handleSubmit}
                              className="text-sm text-white bg-emerald-600 hover:bg-emerald-700 font-medium px-4 py-1.5 rounded-lg shadow-sm"
                            >
                              Soumettre
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Upload className={`h-8 w-8 mx-auto mb-3 ${fileError ? 'text-red-400' : 'text-slate-400'}`} />
                          <p className={`text-sm ${fileError ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                            {fileError || 'Glissez-déposez votre fichier ici, ou cliquez pour parcourir.'}
                          </p>
                          {!fileError && (
                            <button 
                              className="mt-4 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                            >
                              Sélectionner un fichier PDF
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 opacity-50">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold shrink-0">4</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-800">Validation</h3>
                    <p className="text-sm text-slate-500 mt-1">Votre document sera examiné par l'administration et votre faculté avant publication.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'payments' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Mes Frais Académiques</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-sm text-slate-500">
                      <th className="pb-3 font-medium">Description</th>
                      <th className="pb-3 font-medium">Montant</th>
                      <th className="pb-3 font-medium">Date limite</th>
                      <th className="pb-3 font-medium">Statut</th>
                      <th className="pb-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    <tr className="border-b border-slate-100">
                      <td className="py-4 font-medium text-slate-800">Frais de scolarité (Tranche 1)</td>
                      <td className="py-4 text-slate-600">250.00 $</td>
                      <td className="py-4 text-slate-600">15 Oct 2026</td>
                      <td className="py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Impayé</span>
                      </td>
                      <td className="py-4 text-right">
                        <button 
                          onClick={() => setShowPaymentModal(true)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                        >
                          Payer
                        </button>
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-4 font-medium text-slate-800">Frais de bibliothèque</td>
                      <td className="py-4 text-slate-600">25.00 $</td>
                      <td className="py-4 text-slate-600">30 Sep 2026</td>
                      <td className="py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Payé</span>
                      </td>
                      <td className="py-4 text-right">
                        <button 
                          onClick={() => setShowReceiptModal(true)}
                          className="text-blue-600 hover:bg-blue-50 px-4 py-1.5 rounded-lg text-sm font-medium border border-blue-200 transition-colors flex items-center gap-2 ml-auto"
                        >
                          <Printer className="w-4 h-4" />
                          Reçu
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="mt-8">
            <StudentChat />
          </div>
        )}
      </main>
      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Effectuer un paiement</h3>
              <button 
                onClick={() => { setShowPaymentModal(false); setSelectedPaymentMethod(null); }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">Description</span>
                  <span className="font-medium text-slate-800">Frais de scolarité (Tranche 1)</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Montant à payer</span>
                  <span className="font-bold text-blue-600 text-lg">250.00 $</span>
                </div>
              </div>

              <h4 className="text-sm font-medium text-slate-700 mb-3">Choisissez votre mode de paiement</h4>
              
              <div className="space-y-3">
                <button 
                  onClick={() => setSelectedPaymentMethod('mobile')}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${selectedPaymentMethod === 'mobile' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedPaymentMethod === 'mobile' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">Mobile Money (M-PESA)</div>
                    <div className="text-xs text-slate-500">Envoyez au +243818261297</div>
                  </div>
                </button>

                <button 
                  onClick={() => setSelectedPaymentMethod('chariow')}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${selectedPaymentMethod === 'chariow' ? 'border-purple-600 bg-purple-50' : 'border-slate-200 hover:border-purple-300'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedPaymentMethod === 'chariow' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">Chariow</div>
                    <div className="text-xs text-slate-500">Paiement sécurisé via Chariow</div>
                  </div>
                </button>

                <button 
                  onClick={() => setSelectedPaymentMethod('card')}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${selectedPaymentMethod === 'card' ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedPaymentMethod === 'card' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">Carte Bancaire</div>
                    <div className="text-xs text-slate-500">Visa, Mastercard (via Stripe)</div>
                  </div>
                </button>
              </div>

              {selectedPaymentMethod === 'mobile' && (
                <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
                    <p className="font-semibold mb-2">Instructions M-PESA :</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Envoyez le montant exact au numéro : <strong>+243818261297</strong></li>
                      <li>Saisissez la référence de transaction ci-dessous</li>
                    </ol>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Référence de la transaction</label>
                    <input type="text" placeholder="Ex: 8G2H9K..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors">
                    Confirmer le paiement Mobile Money
                  </button>
                  <p className="text-xs text-center text-slate-500">Votre paiement sera validé par l'administration.</p>
                </div>
              )}

              {selectedPaymentMethod === 'chariow' && (
                <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  <p className="text-sm text-slate-600 text-center mb-4">
                    Vous allez être redirigé vers la plateforme sécurisée Chariow pour finaliser votre paiement.
                  </p>
                  <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-colors">
                    Payer 250.00 $ via Chariow
                  </button>
                </div>
              )}

              {selectedPaymentMethod === 'card' && (
                <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Numéro de carte</label>
                    <input type="text" placeholder="0000 0000 0000 0000" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Expiration</label>
                      <input type="text" placeholder="MM/AA" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1">CVC</label>
                      <input type="text" placeholder="123" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                  </div>
                  <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors">
                    Payer 250.00 $ par Carte
                  </button>
                  <p className="text-xs text-center text-slate-500 flex items-center justify-center gap-1">
                    <Shield className="w-3 h-3" /> Paiement sécurisé
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 print:hidden">
              <h3 className="text-lg font-bold text-slate-800">Reçu de paiement</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => window.print()}
                  className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <Printer className="w-4 h-4" />
                  Imprimer
                </button>
                <button 
                  onClick={() => setShowReceiptModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-8 print:p-0" id="receipt-content">
              <div className="text-center mb-6 border-b border-slate-200 pb-6">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">AI</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">AI Studio University</h2>
                <p className="text-sm text-slate-500 mt-1">Reçu Officiel de Paiement</p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Référence</span>
                  <span className="text-sm font-mono font-medium text-slate-800">
                    REF-9A8B7C6D
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Date</span>
                  <span className="text-sm font-medium text-slate-800">
                    30 Septembre 2026 14:30
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Étudiant</span>
                  <span className="text-sm font-medium text-slate-800">{user?.name || 'Étudiant'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Motif</span>
                  <span className="text-sm font-medium text-slate-800">
                    Frais de bibliothèque
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Méthode</span>
                  <span className="text-sm font-medium uppercase text-slate-800">
                    Mobile Money
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 mb-8 flex justify-between items-center border border-slate-100">
                <span className="font-bold text-slate-700">Montant Total</span>
                <span className="text-2xl font-bold text-blue-600">$25.00</span>
              </div>

              <div className="flex flex-col items-center justify-center pt-6 border-t border-slate-200">
                <QRCodeSVG 
                  value={JSON.stringify({
                    id: "REF-9A8B7C6D",
                    student: user?.name || 'Étudiant',
                    amount: 25.00,
                    date: "2026-09-30T14:30:00Z"
                  })} 
                  size={100}
                  level="M"
                  includeMargin={true}
                />
                <p className="text-[10px] text-slate-400 mt-2 text-center max-w-[200px]">
                  Scannez ce code QR pour vérifier l'authenticité de ce reçu.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
