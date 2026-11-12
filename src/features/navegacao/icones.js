// Mapa nome → ícone do lucide-react. O registro de módulos (`modulos.js`) é JS puro e só guarda o nome.
import {
  Activity,
  ArrowRightLeft,
  BookOpen,
  Calculator,
  ClipboardList,
  FileText,
  Gamepad2,
  GraduationCap,
  History,
  Home,
  LayoutGrid,
  ListChecks,
  Menu,
  Mic,
  PhoneCall,
  PlusCircle,
  Stethoscope,
  Trophy,
  User,
  Video,
} from "lucide-react";

const ICONES = {
  Trophy,
  ListChecks,
  Activity,
  ArrowRightLeft,
  BookOpen,
  Calculator,
  ClipboardList,
  FileText,
  Gamepad2,
  GraduationCap,
  History,
  Home,
  LayoutGrid,
  Menu,
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
