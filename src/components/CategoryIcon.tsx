import React from 'react';
import * as Icons from 'lucide-react';
import { CATEGORIES } from '../types';

interface CategoryIconProps {
  category: string;
  size?: number;
  className?: string;
}

export default function CategoryIcon({ category, size = 20, className = "" }: CategoryIconProps) {
  const config = CATEGORIES[category] || CATEGORIES.other;
  
  // Dynamic lucide icon map resolving
  let IconComponent: React.ComponentType<any> = Icons.HelpCircle;
  
  switch (config.iconName) {
    case "Sun":
      IconComponent = Icons.Sun;
      break;
    case "Droplet":
      IconComponent = Icons.Droplet;
      break;
    case "Wind":
      IconComponent = Icons.Wrench; // Use wrench for sewerage/plumbing
      break;
    case "Trash2":
      IconComponent = Icons.Trash2;
      break;
    case "Flame":
      IconComponent = Icons.Flame;
      break;
    case "Construction":
      IconComponent = Icons.Milestone; // milestone / construction
      break;
    case "HeartPulse":
      IconComponent = Icons.HeartPulse;
      break;
    case "GraduationCap":
      IconComponent = Icons.GraduationCap;
      break;
    case "ShieldAlert":
      IconComponent = Icons.ShieldAlert;
      break;
    default:
      IconComponent = Icons.HelpCircle;
  }

  return (
    <div 
      className={`flex items-center justify-center rounded-[13px] shrink-0 ${className}`}
      style={{
        width: '44px',
        height: '44px',
        backgroundColor: `${config.tintColor}24`, // 14% opacity in hex is 24
        color: config.tintColor
      }}
    >
      <IconComponent size={size} strokeWidth={2.2} />
    </div>
  );
}
export { Icons };
