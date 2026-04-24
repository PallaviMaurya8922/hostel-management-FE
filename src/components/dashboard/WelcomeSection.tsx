import React from 'react';
import { CalendarIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';

interface WelcomeSectionProps {
  studentName?: string;
}

const WelcomeSection: React.FC<WelcomeSectionProps> = ({
  studentName = 'Student',
}) => {
  const getGreeting = (): { text: string; Icon: typeof SunIcon } => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good Morning', Icon: SunIcon };
    if (hour < 18) return { text: 'Good Afternoon', Icon: SunIcon };
    return { text: 'Good Evening', Icon: MoonIcon };
  };

  const getFormattedDate = (): string => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const { text: greeting, Icon: GreetingIcon } = getGreeting();

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 rounded-2xl p-6 sm:p-8 mb-6"
      aria-label="Welcome section"
    >
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/30 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 text-brand-200 mb-3">
          <GreetingIcon className="w-5 h-5" />
          <span className="text-sm font-medium">{greeting}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          {studentName}
        </h1>
        <div className="flex items-center gap-2 text-brand-200/80">
          <CalendarIcon className="w-4 h-4" />
          <p className="text-sm">{getFormattedDate()}</p>
        </div>
      </div>
    </section>
  );
};

export default WelcomeSection;
