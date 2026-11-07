// Mapa nome → ícone do lucide-react. O registro de módulos (`modulos.js`) é JS puro e só guarda o nome.
import {
  Activity,
  ArrowRightLeft,
  BookOpen,
  Calculator,
  ClipboardList,
  FileText,
  GraduationCap,
  History,
  Home,
  LayoutGrid,
  Mic,
  PhoneCall,
  PlusCircle,
  Stethoscope,
  User,
  Video,
} from "lucide-react";

const ICONES = {
  Activity,
  ArrowRightLeft,
  BookOpen,
  Calculator,
  ClipboardList,
  FileText,
  GraduationCap,
  History,
  Home,
  LayoutGrid,
  Mic,
  PhoneCall,
  PlusCircle,
  Stethoscope,
  User,
  Video,
};

export function icone(nome) {
  return ICONES[nome] || BookOpen;
}
