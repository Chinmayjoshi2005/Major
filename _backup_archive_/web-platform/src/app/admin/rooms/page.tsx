import Link from "next/link";
import { ArrowLeft, DoorOpen } from "lucide-react";
import { NeoCard } from "@/components/neo-brutal/neo-card";

export default function RoomsAdminPlaceholder() {
  return (
    <div className="e-page page-content flex flex-col justify-center items-center py-20">
      <NeoCard className="max-w-md w-full p-8 text-center bg-white border-4 border-[#0a0a0a] shadow-[4px_4px_0px_#0a0a0a] transition-all">
        <div className="mx-auto w-16 h-16 bg-[#ffe600] border-4 border-[#0a0a0a] rounded-full flex items-center justify-center mb-6">
          <DoorOpen className="w-8 h-8 text-[#0a0a0a]" />
        </div>
        
        <h1 className="text-2xl font-black uppercase tracking-tight text-[#0a0a0a] mb-4">
          Rooms Management
        </h1>
        
        <p className="text-sm font-bold text-gray-700 mb-8 leading-relaxed">
          The Rooms administrative module is currently under active development. In the future, this page will provide full CRUD controls for mapping physical rooms to 3D campus models.
        </p>
        
        <Link 
          href="/admin" 
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#4ecdc4] border-4 border-[#0a0a0a] text-sm font-black uppercase tracking-wide hover:bg-[#3dbdb3] transition-colors shadow-[2px_2px_0px_#0a0a0a] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#0a0a0a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[0px_0px_0px_#0a0a0a] text-[#0a0a0a]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </NeoCard>
    </div>
  );
}
