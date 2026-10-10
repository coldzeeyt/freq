import type { Creator } from '@/types/models';

const c = (id: string, name: string, handle: string, verified: boolean, avatarColor: string): Creator => ({
  id,
  name,
  handle,
  verified,
  avatarColor,
});

// Muted, printed-ink avatar tones rather than a rainbow.
export const CREATORS = {
  mara: c('mara', 'Mara Okafor', 'maramakes', true, '#C9A27E'),
  devon: c('devon', 'Devon Park', 'devonplays', false, '#8FA3A6'),
  lena: c('lena', 'Lena Brandt', 'lenalens', true, '#D8C3A5'),
  theo: c('theo', 'Theo Ramos', 'theoeats', false, '#B98B6E'),
  ayo: c('ayo', 'Ayo Mensah', 'ayobeats', true, '#A39171'),
  kira: c('kira', 'Kira Sato', 'kiracodes', false, '#9AA58C'),
  jules: c('jules', 'Jules Moreau', 'julesmoves', true, '#C7B48A'),
  nina: c('nina', 'Nina Ivers', 'ninaandpaws', false, '#B7A6A0'),
  omar: c('omar', 'Omar Haddad', 'omar.outside', true, '#8E9C86'),
  zoe: c('zoe', 'Zoe Lin', 'zoewears', false, '#C4A1A1'),
  ravi: c('ravi', 'Ravi Nair', 'ravilab', false, '#93A1B0'),
  gus: c('gus', 'Gus Whitfield', 'gusjokes', false, '#CDB97A'),
  ines: c('ines', 'Inês Carvalho', 'inesreads', true, '#B59C8B'),
  sam: c('sam', 'Sam Achterberg', 'samskates', false, '#9C8F7C'),
  priya: c('priya', 'Priya Desai', 'priyaglow', false, '#C9A9A6'),
  hal: c('hal', 'Hal Brooks', 'halsgarage', true, '#8C8C84'),
  ai: c('ai', 'clipfactory', 'clipfactory', false, '#6E6A63'),
  viral: c('viral', 'trendloop', 'trendloop.daily', false, '#6E6A63'),
} satisfies Record<string, Creator>;

/** The local user. Not verified, so only their camera recordings count as human. */
export const ME: Creator = c('me', 'You', 'you', false, '#EDE6D6');
