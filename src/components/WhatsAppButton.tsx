import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton() {
  // Remplacez ce numéro par votre numéro WhatsApp (avec le code pays, ex: 243xxxxxxxxx pour la RDC)
  const phoneNumber = "243000000000"; 
  const message = "Bonjour, j'ai besoin d'aide concernant l'application UCCM.";
  
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
      aria-label="Contactez-nous sur WhatsApp"
    >
      <MessageCircle className="w-7 h-7" />
      
      {/* Tooltip */}
      <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Besoin d'aide ? Discutons !
      </span>
    </a>
  );
}
