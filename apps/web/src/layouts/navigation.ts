import {
  Boxes,
  Calendar,
  ClipboardCheck,
  FileStack,
  FileText,
  LayoutDashboard,
  ReceiptText,
  ShoppingCart,
  Truck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@falcao-erp/shared-types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: Role[];
  comingSoon?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAVIGATION: NavSection[] = [
  {
    title: "Visão Geral",
    items: [{ label: "Dashboard", href: "/", icon: LayoutDashboard }],
  },
  {
    title: "Suprimentos",
    items: [
      { label: "Fornecedores", href: "/fornecedores", icon: Truck },
      { label: "Banco de Produtos", href: "/produtos", icon: Boxes },
      { label: "Solicitações de Compras", href: "/solicitacoes", icon: ShoppingCart },
      {
        label: "Aprovações",
        href: "/aprovacoes",
        icon: ClipboardCheck,
        roles: ["ADMIN", "MANAGER", "BUYER", "WAREHOUSE"],
      },
    ],
  },
  {
    title: "Contratos & Financeiro",
    items: [
      { label: "Contratos", href: "/contratos", icon: FileText, comingSoon: true },
      { label: "Financeiro", href: "/financeiro", icon: Wallet, comingSoon: true },
      { label: "Reembolsos", href: "/reembolsos", icon: ReceiptText, comingSoon: true },
    ],
  },
  {
    title: "Organização",
    items: [
      { label: "Agenda", href: "/agenda", icon: Calendar, comingSoon: true },
      { label: "Documentos", href: "/documentos", icon: FileStack, comingSoon: true },
    ],
  },
];
