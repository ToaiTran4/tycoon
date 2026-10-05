import { UserRound } from 'lucide-react';

export const AVATAR_OPTIONS = [
  { id: 'male', label: 'Nam', skin: '#f2b38f', hair: '#3b2418', shirt: '#3b82f6' },
  { id: 'female', label: 'Nữ', skin: '#f2b38f', hair: '#5b2c45', shirt: '#f43f5e' },
];

export function ChibiAvatar({ gender = 'male', size = 'md', className = '' }) {
  const avatar = AVATAR_OPTIONS.find(option => option.id === gender) || AVATAR_OPTIONS[0];
  return (
    <span
      className={`chibi chibi-${size} chibi-${avatar.id} ${className}`}
      title={`Nhân vật ${avatar.label}`}
      aria-label={`Nhân vật ${avatar.label}`}
    >
      <span className="chibi-hair" style={{ backgroundColor: avatar.hair }} />
      <span className="chibi-head" style={{ backgroundColor: avatar.skin }}>
        <span className="chibi-eye chibi-eye-left" />
        <span className="chibi-eye chibi-eye-right" />
        <span className="chibi-mouth" />
      </span>
      <span className="chibi-body" style={{ backgroundColor: avatar.shirt }} />
      <span className="chibi-arm chibi-arm-left" style={{ backgroundColor: avatar.skin }} />
      <span className="chibi-arm chibi-arm-right" style={{ backgroundColor: avatar.skin }} />
    </span>
  );
}

export function AvatarPicker({ value, onChange, disabled = false }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {AVATAR_OPTIONS.map(option => (
        <button
          key={option.id}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.id)}
          className={`avatar-choice ${value === option.id ? 'avatar-choice-active' : ''}`}
          aria-pressed={value === option.id}
        >
          <ChibiAvatar gender={option.id} size="sm" />
          <span className="font-bold">{option.label}</span>
          {value === option.id && <UserRound size={12} className="text-amber-300" />}
        </button>
      ))}
    </div>
  );
}
