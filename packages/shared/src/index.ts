/** OKard's shared, serializable platform contracts — no host-specific URLs. */
export const PRODUCT_NAME = 'OKard Creator' as const;
export const SCENE_SCHEMA_VERSION = 1 as const;
export const CARD_SIDES = ['front', 'back'] as const;
export type CardSide = (typeof CARD_SIDES)[number];

export type HostingProvider = 'replit' | 'netlify' | 'google-cloud';
export type CardFamilyId =
  | 'private-brand'
  | 'staff'
  | 'membership'
  | 'family'
  | 'keepsake'
  | 'events'
  | 'private-access'
  | 'loyalty'
  | 'gift'
  | 'hospitality'
  | 'education'
  | 'emergency'
  | 'corporate'
  | 'visitor'
  | 'volunteer'
  | 'partner'
  | 'digital-pass'
  | 'collectible';

export interface CardFamily {
  readonly id: CardFamilyId;
  readonly title: string;
  readonly description: string;
  readonly issuerRequired: boolean;
}

/** Metadata only: a card family is not proof of legal identity or an issued credential. */
export const CARD_FAMILIES: readonly CardFamily[] = [
  { id: 'private-brand', title: 'Private Brand', description: 'Original creator and personal brand artwork.', issuerRequired: false },
  { id: 'staff', title: 'Staff', description: 'Authorized internal employee cards.', issuerRequired: true },
  { id: 'membership', title: 'Membership', description: 'Club and association member designs.', issuerRequired: true },
  { id: 'family', title: 'Family', description: 'Commemorative couple and family designs.', issuerRequired: false },
  { id: 'keepsake', title: 'Keepsake', description: 'Anniversary and celebration cards.', issuerRequired: false },
  { id: 'events', title: 'Events', description: 'Organizer-authorized attendee passes.', issuerRequired: true },
  { id: 'private-access', title: 'Private Access', description: 'Venue-issued internal access artwork.', issuerRequired: true },
  { id: 'loyalty', title: 'Loyalty', description: 'Customer rewards and brand engagement.', issuerRequired: true },
  { id: 'gift', title: 'Gift', description: 'Business-backed gift and voucher designs.', issuerRequired: true },
  { id: 'hospitality', title: 'Hospitality', description: 'Hotel and resort guest programs.', issuerRequired: true },
  { id: 'education', title: 'Education', description: 'Institution-authorized campus programs.', issuerRequired: true },
  { id: 'emergency', title: 'Emergency', description: 'Personal emergency contact cards.', issuerRequired: false },
  { id: 'corporate', title: 'Corporate', description: 'Professional partnership and VIP branding.', issuerRequired: true },
  { id: 'visitor', title: 'Visitor', description: 'Company-authorized visitor and contractor cards.', issuerRequired: true },
  { id: 'volunteer', title: 'Volunteer', description: 'Charity and community recognition cards.', issuerRequired: true },
  { id: 'partner', title: 'Partner', description: 'Authorized affiliate and partner cards.', issuerRequired: true },
  { id: 'digital-pass', title: 'Digital Pass', description: 'Brand-owned non-government digital passes.', issuerRequired: true },
  { id: 'collectible', title: 'Collectible', description: 'Artist, gaming and creator collectibles.', issuerRequired: false },
] as const;

export function isCardSide(value: string): value is CardSide {
  return (CARD_SIDES as readonly string[]).includes(value);
}
