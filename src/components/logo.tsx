import { BookOpenCheck } from 'lucide-react';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 font-headline text-xl font-bold text-primary ${className}`}>
      <BookOpenCheck className="h-7 w-7" />
      <h1 className="font-logo text-2xl text-foreground">DalyReview</h1>
    </div>
  );
}
