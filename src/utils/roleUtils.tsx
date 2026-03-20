import React from 'react';
import { ShieldCheck, GraduationCap, Briefcase, Award, Calculator, Users, LucideIcon } from 'lucide-react';

export interface RoleInfo {
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
}

export const roleConfig: Record<string, RoleInfo> = {
  super_admin: { label: 'Super Admin', icon: ShieldCheck, color: 'text-indigo-700', bg: 'bg-indigo-100', border: 'border-indigo-200' },
  admin: { label: 'Administrateur', icon: ShieldCheck, color: 'text-purple-700', bg: 'bg-purple-100', border: 'border-purple-200' },
  student: { label: 'Étudiant', icon: GraduationCap, color: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-200' },
  professor: { label: 'Professeur', icon: Briefcase, color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200' },
  cashier: { label: 'Caissier', icon: Calculator, color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-200' },
  chef: { label: 'Chef de Dép.', icon: Award, color: 'text-rose-700', bg: 'bg-rose-100', border: 'border-rose-200' },
};

export const getRoleInfo = (roleId: string, customRoles: any[] = []): RoleInfo => {
  if (roleConfig[roleId]) {
    return roleConfig[roleId];
  }
  
  const customRole = customRoles.find(r => r.id === roleId);
  if (customRole) {
    return {
      label: customRole.name,
      icon: ShieldCheck,
      color: 'text-slate-700',
      bg: 'bg-slate-100',
      border: 'border-slate-200'
    };
  }
  
  return {
    label: roleId,
    icon: Users,
    color: 'text-slate-400',
    bg: 'bg-slate-50',
    border: 'border-slate-100'
  };
};
