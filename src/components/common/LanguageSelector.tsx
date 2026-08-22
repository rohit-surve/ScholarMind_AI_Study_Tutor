import React from 'react';
import { Languages, ChevronDown } from 'lucide-react';
import { RESPONSE_LANGUAGES, ResponseLanguage } from '../../types/languages';
import { useLanguage } from '../../context/LanguageContext';

interface LanguageSelectorProps {
  value: string;
  onChange: (language: ResponseLanguage) => void;
  compact?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ value, onChange, compact = false }) => {
  const { t } = useLanguage();
  const selectedLanguage = RESPONSE_LANGUAGES.find(language => language.code === value) || RESPONSE_LANGUAGES[0];

  return (
    <label className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
      <Languages className="w-3.5 h-3.5 shrink-0" />
      <span className={compact ? 'sr-only' : 'hidden sm:inline'}>{t('responseLanguage')}</span>
      <span className="relative">
        <select
          aria-label="Response language"
          value={selectedLanguage.code}
          onChange={event => {
            const nextLanguage = RESPONSE_LANGUAGES.find(language => language.code === event.target.value);
            if (nextLanguage) onChange(nextLanguage);
          }}
          className="appearance-none cursor-pointer bg-transparent pr-5 font-semibold text-zinc-700 dark:text-zinc-200 focus:outline-none"
        >
          {RESPONSE_LANGUAGES.map(language => (
            <option key={language.code} value={language.code}>
              {language.name} ({language.nativeName})
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-0 top-1/2 w-3 h-3 -translate-y-1/2" />
      </span>
    </label>
  );
};