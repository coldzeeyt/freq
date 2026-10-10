import type { Creator } from '@/types/models';

export const CREATORS: Record<string, Creator> = {
  mara: { id: 'mara', name: 'Mara Okafor', handle: '@maramakes', verified: true, avatarColor: '#FF6FB5' },
  devon: { id: 'devon', name: 'Devon Park', handle: '@devonplays', verified: false, avatarColor: '#5CE1E6' },
  lena: { id: 'lena', name: 'Lena Brandt', handle: '@lenalens', verified: true, avatarColor: '#FFB547' },
  theo: { id: 'theo', name: 'Theo Ramos', handle: '@theoeats', verified: false, avatarColor: '#FF8A5B' },
  ayo: { id: 'ayo', name: 'Ayo Mensah', handle: '@ayobeats', verified: true, avatarColor: '#B57BFF' },
  kira: { id: 'kira', name: 'Kira Sato', handle: '@kiracodes', verified: false, avatarColor: '#5B9DFF' },
  jules: { id: 'jules', name: 'Jules Moreau', handle: '@julesfit', verified: true, avatarColor: '#C6F432' },
  nina: { id: 'nina', name: 'Nina Ivers', handle: '@ninaandpaws', verified: false, avatarColor: '#FFD166' },
  omar: { id: 'omar', name: 'Omar Haddad', handle: '@omarexplores', verified: true, avatarColor: '#34D399' },
  zoe: { id: 'zoe', name: 'Zoe Lin', handle: '@zoestyle', verified: false, avatarColor: '#F472B6' },
  ravi: { id: 'ravi', name: 'Ravi Nair', handle: '@ravilab', verified: false, avatarColor: '#7DD3FC' },
  gus: { id: 'gus', name: 'Gus Whitfield', handle: '@gusjokes', verified: false, avatarColor: '#FFE14D' },
  ai: { id: 'ai', name: 'clipfactory', handle: '@clipfactory', verified: false, avatarColor: '#8E8E93' },
};

/** The local user. Not verified, so only their camera recordings count as human. */
export const ME: Creator = {
  id: 'me',
  name: 'You',
  handle: '@you',
  verified: false,
  avatarColor: '#FFB547',
};
