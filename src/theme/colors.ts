// PawStep brand palette — primary orange + cream background from proposal §2-3.
// Secondaries and semantic colors derived to complement the warm, playful pet-game tone.
export const colors = {
  // Brand
  primary: '#F5A623', // warm orange — buttons, step ring fill, active tab
  primaryLight: '#FAC76A', // lighter orange — pressed states, ring track tint
  primaryDark: '#C47E0F', // darker orange — button hover / focus ring

  // Backgrounds
  background: '#FDF8E8', // cream white — main app background
  surface: '#FFFFFF', // pure white — cards, modals
  surfaceAlt: '#FFF3D0', // warm off-white — secondary card backgrounds

  // Text
  textPrimary: '#2C1E0F', // deep warm brown — headings, body copy
  textSecondary: '#7A6245', // mid brown — captions, secondary labels
  textDisabled: '#C4B49A', // muted warm grey — disabled states, placeholder

  // Semantic
  success: '#5CB85C', // goal reached, streak active
  warning: '#F0AD4E', // pet mood: normal, partial progress
  error: '#D9534F', // errors, missing goal
  info: '#5BC0DE', // info banners, exploration events

  // UI chrome
  border: '#E8D9B5', // warm beige — dividers, ring track, card borders
  overlay: 'rgba(44, 30, 15, 0.4)', // modal backdrop
} as const;
