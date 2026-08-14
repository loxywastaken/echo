import { LogoMark } from "@/components/Logo";
import { Heart, Shield, Users, Flag, EyeOff, Sparkles } from "lucide-react";

export const metadata = { title: "Community Guidelines — Echo" };

const rules = [
  { icon: Heart, title: "Be kind", body: "Treat others with respect. Harassment, hate speech, bullying, and threats have no place on Echo." },
  { icon: EyeOff, title: "Keep it safe", body: "No nudity, sexual content involving minors, graphic violence, or content that promotes self-harm." },
  { icon: Shield, title: "Stay authentic", body: "Be yourself. Don't impersonate others, spread misinformation, or run scams and spam." },
  { icon: Users, title: "Respect privacy", body: "Don't share others' private information without consent, and honour people's boundaries." },
  { icon: Flag, title: "Report, don't retaliate", body: "See something wrong? Use the report tools. Our team reviews reports and takes action." },
  { icon: Sparkles, title: "Share what echoes", body: "Post the moments worth repeating — creativity, community, and genuine connection." },
];

export default function GuidelinesPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 w-fit"><LogoMark size={48} /></div>
        <h1 className="font-display text-3xl font-extrabold">Community Guidelines</h1>
        <p className="mt-2 text-muted">The principles that keep Echo a place worth coming back to.</p>
      </div>

      <div className="space-y-3">
        {rules.map((r) => (
          <div key={r.title} className="card flex gap-4 p-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
              <r.icon size={20} />
            </span>
            <div>
              <h2 className="font-semibold">{r.title}</h2>
              <p className="mt-1 text-sm text-muted">{r.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-surface p-6 text-center">
        <p className="text-sm text-muted">
          Violations may lead to content removal, restrictions, suspension, or a permanent ban depending on severity.
          We review every report and act to keep the community healthy.
        </p>
      </div>
    </div>
  );
}
