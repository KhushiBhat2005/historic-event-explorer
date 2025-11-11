import React from 'react';
import { Category, Era, Significance } from './types';
import { Sword, FlaskConical, Landmark, Drama, TestTube, Cpu, Users, DollarSign, CloudSunRain, Rocket } from 'lucide-react';

export const CATEGORY_METADATA: { [key in Category]: { color: string; icon: React.FC<any>; label: string; emoji: string; } } = {
  [Category.WarConflict]: { color: '#8a3b3b', icon: Sword, label: 'War & Conflict', emoji: '⚔️' },
  [Category.DiscoveryInvention]: { color: '#6a7a4b', icon: FlaskConical, label: 'Discovery & Invention', emoji: '🔬' },
  [Category.Political]: { color: '#4a5f7a', icon: Landmark, label: 'Political', emoji: '🏛️' },
  [Category.Cultural]: { color: '#a86f6f', icon: Drama, label: 'Cultural', emoji: '🎭' },
  [Category.Scientific]: { color: '#4b7a7a', icon: TestTube, label: 'Scientific', emoji: '🧪' },
  [Category.Technological]: { color: '#b5651d', icon: Cpu, label: 'Technological', emoji: '💻' },
  [Category.SocialMovement]: { color: '#7a4b7a', icon: Users, label: 'Social Movement', emoji: '✊' },
  [Category.Economic]: { color: '#b59a6d', icon: DollarSign, label: 'Economic', emoji: '💰' },
  [Category.NaturalDisaster]: { color: '#a85c42', icon: CloudSunRain, label: 'Natural Disaster', emoji: '🌋' },
  [Category.SpaceExploration]: { color: '#3b4b6a', icon: Rocket, label: 'Space Exploration', emoji: '🚀' },
};

export const ERA_LABELS: { [key in Era]: string } = {
    [Era.Ancient]: 'Ancient History',
    [Era.Medieval]: 'Medieval Period',
    [Era.Renaissance]: 'Renaissance',
    [Era.Enlightenment]: 'Age of Enlightenment',
    [Era.Industrial]: 'Industrial Revolution',
    [Era.Modern]: 'Modern Era',
    [Era.Contemporary]: 'Contemporary Era',
};

export const SIGNIFICANCE_LABELS: { [key in Significance]: string } = {
    [Significance.Low]: 'Low',
    [Significance.Medium]: 'Medium',
    [Significance.High]: 'High',
    [Significance.Critical]: 'Critical',
};
