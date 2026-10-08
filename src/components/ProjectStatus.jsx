import { Cpu, Monitor } from 'lucide-react';
import { Card } from './ui';

/** Honest project completion indicator for the college demo. */
export default function ProjectStatus() {
  return (
    <Card title="Project Development Status" icon={Cpu}>
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 font-semibold text-slate-200"><Monitor size={15} className="text-ok" /> Software Module</span>
            <span className="font-mono font-bold text-ok">90% COMPLETED</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-ink-700">
            <div className="h-full w-[90%] rounded-full bg-gradient-to-r from-ok/70 to-ok" />
          </div>
          <p className="mt-1.5 text-xs text-slate-400">Software Prototype: <b className="text-slate-200">90% Functional</b></p>
        </div>
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 font-semibold text-slate-200"><Cpu size={15} className="text-warn" /> Hardware Integration</span>
            <span className="font-mono font-bold text-warn">10% PENDING</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-ink-700">
            <div className="h-full w-[10%] rounded-full bg-[repeating-linear-gradient(45deg,#f59e0b,#f59e0b_6px,#b45309_6px,#b45309_12px)]" />
          </div>
          <p className="mt-1.5 text-xs text-slate-400">Hardware Sensor Integration: <b className="text-warn">Pending</b> — readings shown are simulated.</p>
        </div>
      </div>
    </Card>
  );
}
