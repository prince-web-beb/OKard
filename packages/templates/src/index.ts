import { CARD_FAMILIES, type CardFamilyId } from '@okard/shared';
import {
  assertCardDocument, createEmptyCardDocument, createHamadCardDocument,
  type CardDocument, type HamadEdition, type RectangleNode,
  type TextNode, type ImageNode, type SceneNode,
} from '@okard/design-schema';

/**
 * Catalog metadata is editorial content, never an issuance claim.
 * Customers must have authority to publish/use institution-specific identities.
 */
export interface TemplateField {
  id: string;
  label: string;
  nodeId: string;
  required: boolean;
}
export type Composition =
  | 'portrait-left' | 'portrait-right' | 'panorama' | 'editorial'
  | 'split' | 'ticket' | 'gate' | 'orbit' | 'giftwrap' | 'hospitality'
  | 'campus' | 'safety' | 'corporate' | 'visitor' | 'volunteer'
  | 'partner' | 'digital' | 'collectible';

export interface TemplateManifest {
  readonly id: string;
  readonly family: CardFamilyId;
  readonly name: string;
  readonly descriptor: string;
  readonly category: string;
  readonly tags: readonly string[];
  readonly composition: Composition;
  readonly palette: Readonly<{ base: string; accent: string; ink: string; muted: string; paper: string }>;
  readonly headline: string;
  readonly primaryLabel: string;
  readonly defaultName: string;
  readonly supportingLabel: string;
  readonly supportingValue: string;
  readonly reverseHeadline: string;
  readonly reverseStatement: string;
  readonly portrait: 'none' | 'left' | 'right' | 'wide';
  readonly fields: readonly TemplateField[];
  readonly issuerRequired: boolean;
  readonly designOnly: true;
}

const fieldSet = (label: string, secondaryLabel: string): readonly TemplateField[] => [
  { id: 'display-name', label, nodeId: 'display-name', required: true },
  { id: 'supporting-value', label: secondaryLabel, nodeId: 'supporting-value', required: false },
];

/* All designs are originals. Names are *template titles*, not actual organizations. */
export const CARD_TEMPLATES: readonly TemplateManifest[] = [
  { id:'studio-identity',family:'private-brand',name:'Obsidian Signature',descriptor:'An original personal-brand statement in brushed charcoal and gold.',category:'Identity',
    tags:['luxury','portrait','signature','creator'],composition:'portrait-left',
    palette:{base:'#11151d',accent:'#d6b67c',ink:'#f8f0df',muted:'#a5a4ac',paper:'#23252e'},
    headline:'SIGNATURE / ORIGINAL',primaryLabel:'DISPLAY NAME',defaultName:'YOUR NAME',supportingLabel:'SERIES',supportingValue:'PRIVATE BRAND',reverseHeadline:'STORIES MAKE THE MARK',reverseStatement:'Designed with intention. Made to be yours.',
    portrait:'left',fields:fieldSet('Display name','Series'),issuerRequired:false,designOnly:true},
  { id:'company-staff',family:'staff',name:'Company Atelier',descriptor:'A clean, contemporary employee card reserved for authorized organizations.',category:'Organization',
    tags:['employee','workplace','authorized','business'],composition:'portrait-right',
    palette:{base:'#ecf1f3',accent:'#124c64',ink:'#172936',muted:'#516876',paper:'#cfdce3'},
    headline:'PEOPLE & PURPOSE',primaryLabel:'TEAM MEMBER',defaultName:'YOUR NAME',supportingLabel:'POSITION',supportingValue:'YOUR ROLE',reverseHeadline:'PEOPLE BUILD WHAT LASTS',reverseStatement:'Company-issued use requires authorization.',
    portrait:'right',fields:fieldSet('Team member','Job title'),issuerRequired:true,designOnly:true},
  { id:'heritage-club',family:'membership',name:'Heritage Circle',descriptor:'A timeless private-club statement with elegant tiers and restrained typography.',category:'Community',
    tags:['club','heritage','tier','gold'],composition:'editorial',
    palette:{base:'#231b1c',accent:'#d3a77a',ink:'#f7ede4',muted:'#c5b3a8',paper:'#503938'},
    headline:'THE CIRCLE',primaryLabel:'MEMBER NAME',defaultName:'YOUR NAME',supportingLabel:'TIER',supportingValue:'SIGNATURE',reverseHeadline:'BELONGING, REIMAGINED',reverseStatement:'Private membership artwork. Not an issued credential.',
    portrait:'none',fields:fieldSet('Member name','Membership tier'),issuerRequired:true,designOnly:true},
  { id:'family-portrait',family:'family',name:'Family Stories',descriptor:'Warm, image-forward artwork for people who share a personal story.',category:'Personal',
    tags:['family','portrait','couple','commemorative'],composition:'split',
    palette:{base:'#f8ecdb',accent:'#ae7054',ink:'#43392f',muted:'#826f62',paper:'#ead4bd'},
    headline:'OUR STORY',primaryLabel:'FAMILY NAME',defaultName:'YOUR FAMILY',supportingLabel:'MOMENT',supportingValue:'TOGETHER',reverseHeadline:'EVERY MOMENT MATTERS',reverseStatement:'A personal keepsake, not proof of any relationship.',
    portrait:'left',fields:fieldSet('Family name','Commemorative title'),issuerRequired:false,designOnly:true},
  { id:'anniversary-ivory',family:'keepsake',name:'Golden Anniversary',descriptor:'Ivory, soft champagne tones and minimal artistic framing for memories.',category:'Personal',
    tags:['anniversary','wedding','keepsake','celebration'],composition:'panorama',
    palette:{base:'#f7f3e9',accent:'#b88a4d',ink:'#453d35',muted:'#7f6d5a',paper:'#e9d8bb'},
    headline:'MOMENTS',primaryLabel:'CELEBRATING',defaultName:'YOUR MOMENT',supportingLabel:'MESSAGE',supportingValue:'FOREVER IN FOCUS',reverseHeadline:'MADE OF MEMORIES',reverseStatement:'A celebration of moments worth keeping.',
    portrait:'wide',fields:fieldSet('Commemorative title','Message'),issuerRequired:false,designOnly:true},
  { id:'summit-event',family:'events',name:'Summit Passage',descriptor:'Bold, directional conference artwork with striking geometry.',category:'Events',
    tags:['conference','event','festival','attendee'],composition:'ticket',
    palette:{base:'#141b33',accent:'#f59a55',ink:'#ffffff',muted:'#b6bed1',paper:'#252f54'},
    headline:'BE HERE',primaryLabel:'ATTENDEE',defaultName:'YOUR NAME',supportingLabel:'EVENT',supportingValue:'YOUR EVENT',reverseHeadline:'SEE YOU THERE',reverseStatement:'A visual pass concept. Not valid for venue entry.',
    portrait:'none',fields:fieldSet('Attendee','Event'),issuerRequired:true,designOnly:true},
  { id:'studio-access',family:'private-access',name:'Venue Studio',descriptor:'High-contrast authorized-venue design language, without functional access codes.',category:'Organization',
    tags:['venue','access','guest','private'],composition:'gate',
    palette:{base:'#0f2020',accent:'#78c8a7',ink:'#e8f8f0',muted:'#a7c6b7',paper:'#234b43'},
    headline:'SPACES WITH PURPOSE',primaryLabel:'CARDHOLDER',defaultName:'YOUR NAME',supportingLabel:'AREA',supportingValue:'ISSUER CONTROLLED',reverseHeadline:'PRIVATE SPACE / PRIVATE RULES',reverseStatement:'Design only. Real access is managed by its authorized issuer.',
    portrait:'right',fields:fieldSet('Cardholder','Area label'),issuerRequired:true,designOnly:true},
  { id:'rewards-orbit',family:'loyalty',name:'Rewards Orbit',descriptor:'Confident retail rewards artwork with playful circular composition.',category:'Retail',
    tags:['rewards','loyalty','retail','points'],composition:'orbit',
    palette:{base:'#f1ebfa',accent:'#704db5',ink:'#39295b',muted:'#6a6180',paper:'#daceef'},
    headline:'GOOD THINGS RETURN',primaryLabel:'CUSTOMER',defaultName:'YOUR NAME',supportingLabel:'REWARDS',supportingValue:'YOUR REWARDS',reverseHeadline:'A LITTLE MORE EVERY TIME',reverseStatement:'Benefits require a real merchant rewards program.',
    portrait:'none',fields:fieldSet('Customer','Rewards label'),issuerRequired:true,designOnly:true},
  { id:'merchant-gift',family:'gift',name:'Ribbon & Glow',descriptor:'Modern, giftable artwork in richly layered burgundy and copper.',category:'Retail',
    tags:['gift','voucher','retail','celebration'],composition:'giftwrap',
    palette:{base:'#4e162b',accent:'#e7b997',ink:'#fff4ec',muted:'#dfc3cb',paper:'#862f50'},
    headline:'MADE TO GIVE',primaryLabel:'FOR',defaultName:'SOMEONE SPECIAL',supportingLabel:'FROM',supportingValue:'WITH LOVE',reverseHeadline:'THE THOUGHT IS THE GIFT',reverseStatement:'Art concept only. No prepaid value or balance is issued.',
    portrait:'none',fields:fieldSet('Recipient','Sender'),issuerRequired:true,designOnly:true},
  { id:'hotel-reserve',family:'hospitality',name:'The Guest Experience',descriptor:'Warm boutique-hotel minimalism for an authorized guest program.',category:'Hospitality',
    tags:['hotel','resort','travel','guest'],composition:'hospitality',
    palette:{base:'#f2e9db',accent:'#997450',ink:'#3e372e',muted:'#806e60',paper:'#dfcebc'},
    headline:'WELCOME IN',primaryLabel:'GUEST',defaultName:'YOUR NAME',supportingLabel:'EXPERIENCE',supportingValue:'YOUR STAY',reverseHeadline:'A STAY WORTH REMEMBERING',reverseStatement:'A design concept. Room access is not enabled.',
    portrait:'none',fields:fieldSet('Guest','Stay message'),issuerRequired:true,designOnly:true},
  { id:'campus-studio',family:'education',name:'Campus Collective',descriptor:'Energetic, clearly original visual system for authorized campus programs.',category:'Education',
    tags:['campus','school','student','authorized'],composition:'campus',
    palette:{base:'#fff7e7',accent:'#e48c48',ink:'#243850',muted:'#727278',paper:'#dbe8ef'},
    headline:'LEARN / EXPLORE',primaryLabel:'PARTICIPANT',defaultName:'YOUR NAME',supportingLabel:'PROGRAM',supportingValue:'YOUR PROGRAM',reverseHeadline:'CURIOSITY LEADS',reverseStatement:'Program artwork, not an academic credential or student ID.',
    portrait:'right',fields:fieldSet('Participant','Program'),issuerRequired:true,designOnly:true},
  { id:'emergency-contact',family:'emergency',name:'Care First',descriptor:'Practical, accessible high-contrast emergency contact reference.',category:'Personal',
    tags:['emergency','contact','accessibility','care'],composition:'safety',
    palette:{base:'#ffffff',accent:'#b93642',ink:'#263238',muted:'#5b636b',paper:'#fff0ed'},
    headline:'CONTACT & CARE',primaryLabel:'NAME',defaultName:'YOUR NAME',supportingLabel:'EMERGENCY CONTACT',supportingValue:'ADD CONTACT',reverseHeadline:'KEEP THIS CLOSE',reverseStatement:'Contact details are user-supplied. Not medical certification.',
    portrait:'none',fields:fieldSet('Display name','Emergency contact'),issuerRequired:false,designOnly:true},
  { id:'corporate-nexus',family:'corporate',name:'Corporate Nexus',descriptor:'Executive-grade navy and gold organization relationship branding.',category:'Organization',
    tags:['executive','business','corporate','premium'],composition:'corporate',
    palette:{base:'#111b31',accent:'#c7a772',ink:'#f4f7ff',muted:'#b9c2d5',paper:'#344263'},
    headline:'THE NEXT CHAPTER',primaryLabel:'REPRESENTATIVE',defaultName:'YOUR NAME',supportingLabel:'DIVISION',supportingValue:'YOUR TEAM',reverseHeadline:'PARTNERS IN POSSIBILITY',reverseStatement:'Corporate affiliation requires the real issuer’s approval.',
    portrait:'left',fields:fieldSet('Representative','Division'),issuerRequired:true,designOnly:true},
  { id:'visitor-welcome',family:'visitor',name:'A Warm Welcome',descriptor:'A welcoming visitor/contractor concept with distinctive rounded geometry.',category:'Organization',
    tags:['visitor','contractor','welcome','organization'],composition:'visitor',
    palette:{base:'#eaf1fa',accent:'#436fbc',ink:'#183657',muted:'#5e7895',paper:'#cbdcf2'},
    headline:'YOU ARE WELCOME',primaryLabel:'VISITOR',defaultName:'YOUR NAME',supportingLabel:'HOST',supportingValue:'YOUR HOST',reverseHeadline:'MAKING CONNECTIONS',reverseStatement:'No venue privileges or verified access are granted.',
    portrait:'none',fields:fieldSet('Visitor','Host'),issuerRequired:true,designOnly:true},
  { id:'volunteer-together',family:'volunteer',name:'We Move Together',descriptor:'Human-centered community design in expressive coral and olive.',category:'Community',
    tags:['volunteer','community','charity','service'],composition:'volunteer',
    palette:{base:'#f4f0e9',accent:'#a55841',ink:'#36433a',muted:'#7c756d',paper:'#deead8'},
    headline:'BETTER TOGETHER',primaryLabel:'VOLUNTEER',defaultName:'YOUR NAME',supportingLabel:'COMMUNITY',supportingValue:'YOUR CAUSE',reverseHeadline:'SMALL ACTS / BIG IMPACT',reverseStatement:'Recognition concept only. A real nonprofit approves issuance.',
    portrait:'none',fields:fieldSet('Volunteer','Cause'),issuerRequired:true,designOnly:true},
  { id:'partner-connection',family:'partner',name:'Aligned Futures',descriptor:'A sleek minimalist partnership composition with overlapping signature bands.',category:'Business',
    tags:['partnership','affiliate','business','collaboration'],composition:'partner',
    palette:{base:'#171a20',accent:'#84adc4',ink:'#f4f6f8',muted:'#a7b4c0',paper:'#2a424f'},
    headline:'ALIGNED TOGETHER',primaryLabel:'PARTNER',defaultName:'YOUR NAME',supportingLabel:'RELATIONSHIP',supportingValue:'YOUR PARTNERSHIP',reverseHeadline:'BETTER, TOGETHER',reverseStatement:'Partnership claims need authorization from all parties.',
    portrait:'none',fields:fieldSet('Partner','Relationship'),issuerRequired:true,designOnly:true},
  { id:'digital-signal',family:'digital-pass',name:'Signal Pass',descriptor:'Futuristic digital-pass artwork without counterfeit wallet or access functions.',category:'Digital',
    tags:['pass','digital','minimal','futuristic'],composition:'digital',
    palette:{base:'#070e1a',accent:'#7ee1d6',ink:'#e9fcff',muted:'#8bafbe',paper:'#1d3542'},
    headline:'ONE WORLD / YOUR MARK',primaryLabel:'NAME',defaultName:'YOUR NAME',supportingLabel:'DESIGN TYPE',supportingValue:'DIGITAL CONCEPT',reverseHeadline:'DESIGNED FOR WHAT IS NEXT',reverseStatement:'Artwork only. No wallet credential or verification token.',
    portrait:'none',fields:fieldSet('Display name','Design type'),issuerRequired:true,designOnly:true},
  { id:'creator-edition',family:'collectible',name:'Creator Edition No. 01',descriptor:'Expressive editorial design for artistic collectible series.',category:'Creative',
    tags:['artist','collector','gaming','creator'],composition:'collectible',
    palette:{base:'#201320',accent:'#ef85af',ink:'#fff3f8',muted:'#c5b3c4',paper:'#502b4b'},
    headline:'CREATE WHAT MATTERS',primaryLabel:'CREATOR',defaultName:'YOUR NAME',supportingLabel:'COLLECTION',supportingValue:'YOUR SERIES',reverseHeadline:'ORIGINAL BY DESIGN',reverseStatement:'An original artistic collectible, not financial ownership.',
    portrait:'wide',fields:fieldSet('Creator','Collection'),issuerRequired:false,designOnly:true},
] as const;

const byId = new Map<string, TemplateManifest>(CARD_TEMPLATES.map((item) => [item.id, item]));
const previewBlacklist = /\b(passport|government id|national id|driver.?s? licen[sc]e|immigration document|emirates id|bank card)\b/i;
const allFamilies = new Set(CARD_FAMILIES.map((family) => family.id));

export function listTemplates(options: {
  family?: CardFamilyId | 'all'; search?: string; limit?: number;
} = {}): TemplateManifest[] {
  const search = (options.search ?? '').trim().toLocaleLowerCase('en').slice(0, 90);
  const limit = Math.max(1, Math.min(100, Number.isInteger(options.limit)
    ? (options.limit as number) : CARD_TEMPLATES.length));
  return CARD_TEMPLATES
    .filter((template) => !options.family || options.family === 'all' || template.family === options.family)
    .filter((template) => !search || [
      template.name, template.descriptor, template.category,
      template.family, ...template.tags,
    ].some((v) => v.toLocaleLowerCase('en').includes(search)))
    .slice(0, limit);
}
export function getTemplate(id: string): TemplateManifest | null {
  return byId.get(id) ?? null;
}
export function getTemplateFamilyCoverage(): { complete: boolean; missing: CardFamilyId[] } {
  const templateFamilies = new Set(CARD_TEMPLATES.map((template) => template.family));
  const missing = CARD_FAMILIES.map((family) => family.id).filter((id) => !templateFamilies.has(id));
  return { complete: missing.length === 0, missing };
}

type Palette = TemplateManifest['palette'];
type Placement = { x: number; y: number; w: number; h: number };
const norm = (id: string): string => id.replace(/[^a-z0-9:_-]/gi, '').slice(0, 80);
function rectangle(id: string, x: number, y: number, w: number, h: number,
  fill: string, opacity = 1, cornerRadiusMm = 0, rotationDeg = 0): RectangleNode {
  return {
    id: norm(id),kind:'rectangle',xMm:x,yMm:y,widthMm:w,heightMm:h,
    fill,opacity,cornerRadiusMm,rotationDeg,locked:false,visible:true,
  };
}
function label(id: string, text: string, x: number, y: number, w: number,
  fontSizeMm: number, fill: string, family: TextNode['fontFamily'] = 'Arial',
  weight: TextNode['fontWeight'] = 400, letterSpacingMm = 0): TextNode {
  return {
    id:norm(id),kind:'text',text,xMm:x,yMm:y,widthMm:w,
    heightMm:fontSizeMm*1.35,opacity:1,rotationDeg:0,visible:true,
    locked:false,fill,fontFamily:family,fontSizeMm,fontWeight:weight,letterSpacingMm,align:'start',
  };
}
function photo(id: string, placement: Placement, opacity = 1): ImageNode {
  return {
    id:norm(id),kind:'image',assetId:'portrait',...{
      xMm:placement.x,yMm:placement.y,widthMm:placement.w,heightMm:placement.h,
    },opacity,rotationDeg:0,visible:true,locked:false,fit:'cover',cornerRadiusMm:1.1,
  };
}
function line(id:string,x:number,y:number,w:number,color:string,alpha=0.6): RectangleNode {
  return rectangle(id,x,y,w,0.17,color,alpha);
}
function background(spec: TemplateManifest, side: 'front' | 'back'): SceneNode[] {
  const p=spec.palette;
  return [
    rectangle(side+'-background',0,0,85.6,53.98,p.base),
    rectangle(side+'-bar-left',0,0,1.05,53.98,p.accent),
  ];
}

/** Compositions have structurally different geometry, not the same rectangle recolored. */
function compositionLayers(spec: TemplateManifest, side: 'front' | 'back'): SceneNode[] {
  const p=spec.palette,front=side==='front',nodes:SceneNode[]=[];
  switch(spec.composition) {
    case 'portrait-left': {
      nodes.push(rectangle('portrait-panel-'+side,3.4,14.5,32,34.4,p.paper,0.76,1.8));
      nodes.push(line('signature-divider-'+side,40,17.1,39,p.accent));
      nodes.push(rectangle('fine-line-'+side,77,2.8,0.35,9.5,p.accent,0.73));
      if(front) nodes.push(photo('portrait-primary',{x:3.4,y:14.5,w:32,h:34.4}));
      else nodes.push(rectangle('reverse-portrait-art',6,18,24,25,p.accent,0.18,8));
      break;
    }
    case 'portrait-right': {
      nodes.push(rectangle('portrait-panel-'+side,58,0,27.6,49.7,p.paper,0.75));
      nodes.push(rectangle('underlining-'+side,5,14,39,0.24,p.accent,0.8));
      if(front)nodes.push(photo('portrait-primary',{x:58,y:0,w:27.6,h:49.7}));
      else nodes.push(rectangle('reverse-portrait-art',65,8,16,33,p.accent,0.2,1.5));
      break;
    }
    case 'panorama': {
      nodes.push(rectangle('wide-band-'+side,0,0,85.6,29,p.paper,0.6));
      nodes.push(line('wide-gold-edge-'+side,0,29,85.6,p.accent,1));
      if(front)nodes.push(photo('portrait-primary',{x:0,y:0,w:85.6,h:29},0.62));
      else nodes.push(rectangle('back-plate',9,14,68,22,p.accent,0.13,5));
      break;
    }
    case 'editorial': {
      nodes.push(rectangle('editorial-side-'+side,60,0,25.6,53.98,p.paper,0.85));
      nodes.push(rectangle('editorial-stripe-'+side,65,5,0.4,44,p.accent,1));
      nodes.push(rectangle('editorial-plate-'+side,9,15,43,26,p.accent,0.10,2));
      break;
    }
    case 'split': {
      nodes.push(rectangle('split-zone-'+side,0,0,40,53.98,p.paper,0.7));
      nodes.push(rectangle('split-rule-'+side,40,0,0.32,53.98,p.accent,0.9));
      if(front)nodes.push(photo('portrait-primary',{x:0,y:0,w:40,h:53.98},0.75));
      break;
    }
    case 'ticket': {
      nodes.push(rectangle('ticket-rail-'+side,68,0,17.6,53.98,p.accent,0.92));
      nodes.push(rectangle('ticket-bridge-'+side,66.5,4,0.4,45,p.ink,0.38));
      for(let i=0;i<5;i++)nodes.push(rectangle('ticket-dot-'+side+'-'+i,69,9+i*7.4,13,0.22,p.base,0.7));
      break;
    }
    case 'gate': {
      nodes.push(rectangle('gate-marker-'+side,60,6,18,34,p.accent,0.19,0.8));
      for(let i=0;i<3;i++)nodes.push(rectangle('gate-pin-'+side+'-'+i,65+i*5,7,1.1,39,p.accent,0.4));
      if(front)nodes.push(photo('portrait-primary',{x:49,y:13,w:31,h:35},0.86));
      break;
    }
    case 'orbit': {
      for(let i=0;i<3;i++)nodes.push(rectangle('orbit-plane-'+side+'-'+i,51+i*5,13+i*3,24-i*6,24-i*6,p.accent,0.16+(i*0.08),10));
      nodes.push(rectangle('orbit-stripe-'+side,6,12,38,0.28,p.accent));
      break;
    }
    case 'giftwrap': {
      nodes.push(rectangle('ribbon-across-'+side,0,18.5,85.6,9,p.accent,0.20));
      nodes.push(rectangle('ribbon-down-'+side,58,0,10,53.98,p.accent,0.22));
      nodes.push(rectangle('bow-corner-'+side,62,21,10,8,p.accent,0.37,3,34));
      break;
    }
    case 'hospitality': {
      nodes.push(rectangle('hotel-panel-'+side,5,7,75.6,41,p.paper,0.86,1.6));
      nodes.push(rectangle('hotel-border-'+side,8,9,69.6,0.3,p.accent,0.92));
      nodes.push(rectangle('hotel-door-'+side,63,18,12,22,p.accent,0.30,6));
      break;
    }
    case 'campus': {
      nodes.push(rectangle('campus-ribbon-'+side,0,0,85.6,9.5,p.accent,0.95));
      nodes.push(rectangle('campus-block-'+side,57,12,28,38,p.paper,0.9,3));
      if(front)nodes.push(photo('portrait-primary',{x:57,y:12,w:28,h:38},0.84));
      break;
    }
    case 'safety': {
      nodes.push(rectangle('safety-rail-'+side,0,0,85.6,10,p.accent));
      nodes.push(rectangle('safety-card-'+side,6,17,73,29,p.paper,0.93,2));
      nodes.push(rectangle('safety-bar-'+side,7.2,23,1.2,14,p.accent));
      break;
    }
    case 'corporate': {
      nodes.push(rectangle('corporate-panel-'+side,0,0,33,53.98,p.paper,0.6));
      nodes.push(rectangle('corporate-rule-'+side,34,3,0.35,47,p.accent));
      if(front)nodes.push(photo('portrait-primary',{x:2,y:10,w:29,h:38},0.86));
      break;
    }
    case 'visitor': {
      nodes.push(rectangle('visitor-round-'+side,51,6,29,36,p.accent,0.18,14));
      nodes.push(rectangle('visitor-tab-'+side,62,0,15,7,p.accent,0.85,2));
      nodes.push(rectangle('visitor-strip-'+side,9,36,35,0.3,p.accent));
      break;
    }
    case 'volunteer': {
      nodes.push(rectangle('volunteer-block-'+side,0,33,85.6,21,p.paper,0.8));
      nodes.push(rectangle('volunteer-banner-'+side,6,13,56,12,p.accent,0.24,6,-9));
      nodes.push(rectangle('volunteer-ribbon-'+side,73,3,2,41,p.accent,0.9));
      break;
    }
    case 'partner': {
      nodes.push(rectangle('partner-band-one-'+side,45,6,30,41,p.paper,0.85,12,16));
      nodes.push(rectangle('partner-band-two-'+side,57,4,21,42,p.accent,0.25,9,-16));
      nodes.push(line('partner-rule-'+side,7,41,31,p.accent));
      break;
    }
    case 'digital': {
      nodes.push(rectangle('digital-band-'+side,5,9,76,9,p.paper,0.76,2));
      nodes.push(rectangle('digital-node-'+side,62,22,16,21,p.accent,0.20,3));
      for(let i=0;i<4;i++)nodes.push(rectangle('signal-line-'+side+'-'+i,62+i*4,25,0.18,15,p.accent,0.35));
      break;
    }
    case 'collectible': {
      nodes.push(rectangle('collectible-editorial-'+side,5,4,50,45,p.paper,0.35,2,-5));
      nodes.push(rectangle('collectible-stripe-'+side,58,0,21,53.98,p.accent,0.15));
      if(front)nodes.push(photo('portrait-primary',{x:5,y:5,w:41,h:42},0.54));
      break;
    }
  }
  return nodes;
}
function fontPosition(spec: TemplateManifest): { brandX:number; brandY:number; titleX:number; titleY:number; nameX:number; nameY:number; max:number } {
  switch(spec.composition) {
    case 'portrait-left': return {brandX:6,brandY:4,titleX:39,nameX:39,titleY:20,nameY:29,max:43};
    case 'portrait-right': return {brandX:6,brandY:5,titleX:6,titleY:19,nameX:6,nameY:29,max:45};
    case 'panorama': return {brandX:6,brandY:31,titleX:6,titleY:33,nameX:6,nameY:38,max:73};
    case 'split': return {brandX:44,brandY:5,titleX:44,titleY:17,nameX:44,nameY:29,max:39};
    case 'corporate': return {brandX:38,brandY:5,titleX:38,titleY:17,nameX:38,nameY:28,max:44};
    case 'campus': return {brandX:6,brandY:11,titleX:6,titleY:23,nameX:6,nameY:31,max:48};
    case 'safety': return {brandX:6,brandY:11,titleX:12,titleY:19,nameX:12,nameY:29,max:62};
    case 'giftwrap': return {brandX:6,brandY:5,titleX:6,titleY:13,nameX:6,nameY:32,max:51};
    case 'visitor': return {brandX:6,brandY:5,titleX:6,titleY:18,nameX:6,nameY:27,max:49};
    case 'volunteer': return {brandX:6,brandY:6,titleX:6,titleY:17,nameX:6,nameY:36,max:71};
    default: return {brandX:6,brandY:5,titleX:6,titleY:19,nameX:6,nameY:29,max:56};
  }
}
function foreground(spec: TemplateManifest, side: 'front' | 'back'): SceneNode[] {
  const p=spec.palette;
  if(side==='back') return [
    label('back-brand','OKARD / DESIGN STUDY',6,5,71,2.4,p.accent,'Arial',700,0.4),
    line('back-headline-rule',6,11,71,p.accent,0.64),
    label('back-motto',spec.reverseHeadline,6,16,73,5.2,p.ink,'Georgia',600),
    label('back-description',spec.reverseStatement,6,31.5,74,2.8,p.ink),
    label('back-purpose','ORIGINAL ARTWORK ONLY',6,42.3,72,2.1,p.muted,'Arial',600,0.23),
    rectangle('back-footer',0,49.2,85.6,4.78,p.base,0.97),
    label('back-notice','DESIGN CONCEPT · NOT LEGAL IDENTIFICATION',4.5,50.5,78,1.84,p.ink),
  ];
  const pos=fontPosition(spec), nameX=pos.nameX;
  const ink=spec.composition==='safety' ? p.ink : p.ink;
  const labelY=pos.titleY;
  const nodes:SceneNode[]=[
    label('brand-title','OKARD / '+spec.category.toUpperCase(),pos.brandX,pos.brandY,72,2.7,p.accent,'Arial',700,0.42),
    label('hero-headline',spec.headline,pos.titleX,labelY-6,pos.max,3.9,p.ink,'Georgia',600),
    label('name-label',spec.primaryLabel,nameX,labelY+1.2,pos.max,2.3,p.muted,'Arial',700,0.24),
    label('display-name',spec.defaultName,nameX,pos.nameY,pos.max,5.5,ink,'Georgia',600),
    label('supporting-label',spec.supportingLabel,nameX,39,pos.max,2.1,p.muted,'Arial',600,0.3),
    label('supporting-value',spec.supportingValue,nameX,42.4,pos.max,3.1,p.accent,'Arial',600),
  ];
  // A few visual variants use field positions where the lower footer would collide.
  if(['panorama','volunteer','giftwrap'].includes(spec.composition)) {
    const support=nodes.find((n)=>n.id==='supporting-label');
    const value=nodes.find((n)=>n.id==='supporting-value');
    if(support) support.yMm=44.2;
    if(value && value.kind==='text'){value.yMm=47.1;value.fontSizeMm=2.1;value.heightMm=2.9;}
  }
  nodes.push(
    rectangle('footer-cover',0,49.8,85.6,4.18,p.base,0.94),
    label('disclaimer','PRIVATE BRAND DESIGN · NOT ISSUED',4.5,50.75,77,2.05,p.ink),
  );
  return nodes;
}
/** A fresh validated, editable two-sided project for an original gallery template. */
export function createTemplateDocument(
  id: string, options: { displayName?: string; now?: string; countryCode?: string | null; locale?: string } = {},
): CardDocument {
  const spec=getTemplate(id);
  if(!spec)throw new Error('Unknown OKard template identifier.');
  if(!allFamilies.has(spec.family) || previewBlacklist.test(spec.name)) {
    throw new Error('Unsupported or restricted card family.');
  }
  const doc=createEmptyCardDocument({
    id:'template-'+spec.id,
    title:spec.name,
    family:spec.family,
    now:options.now,locale:options.locale,countryCode:options.countryCode,
  });
  doc.artboards.front.nodes=[
    ...background(spec,'front'),...compositionLayers(spec,'front'),...foreground(spec,'front'),
  ];
  doc.artboards.back.nodes=[
    ...background(spec,'back'),...compositionLayers(spec,'back'),...foreground(spec,'back'),
  ];
  if(options.displayName!==undefined){
    const node=doc.artboards.front.nodes.find((n)=>n.kind==='text' && n.id==='display-name');
    if(node && node.kind==='text')node.text=options.displayName;
  }
  assertCardDocument(doc);
  return doc;
}
export const HAMAD_SHOWCASE = [
  { id:'hamad-royal', name:'HAMAD Royal Signature', edition:'royal' as HamadEdition },
  { id:'hamad-future', name:'HAMAD Future Identity', edition:'future' as HamadEdition },
  { id:'hamad-imperial', name:'HAMAD Imperial Edition', edition:'imperial' as HamadEdition },
] as const;
export function findCatalogDocument(id: string): CardDocument | null {
  if(getTemplate(id))return createTemplateDocument(id);
  const hamad=HAMAD_SHOWCASE.find((x)=>x.id===id);
  return hamad?createHamadCardDocument(hamad.edition):null;
}
