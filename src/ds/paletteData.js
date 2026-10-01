// Users, roles, and collabspace (material palette) metadata. Material membership itself
// (which materials live in which palette) is generated separately into paletteMaterials.json,
// since it's derived from the 999-material dataset rather than hand-authored.
//
// A collabspace can have more than one palette deployed into it, so each palette records
// which collabspace it belongs to (several palettes below intentionally share one).

export const USERS = [
  { id: "u1", name: "Sarah Chen", title: "Senior Materials Engineer" },
  { id: "u2", name: "James Okoro", title: "Materials Scientist" },
  { id: "u3", name: "Priya Patel", title: "Lead Materials Engineer" },
  { id: "u4", name: "Daniel Kim", title: "Design Engineer" },
  { id: "u5", name: "Laura Fischer", title: "Supplier Quality Engineer" },
  { id: "u6", name: "Marcus Webb", title: "Powertrain Engineer" },
  { id: "u7", name: "Elena Rossi", title: "Sustainability Analyst" },
  { id: "u8", name: "Thomas Nguyen", title: "CAD Designer" },
  { id: "u9", name: "Rachel Adams", title: "Materials Engineer" },
  { id: "u10", name: "Omar Haddad", title: "Composite Materials Specialist" },
  { id: "u11", name: "Grace Liu", title: "Exterior Design Engineer" },
  { id: "u12", name: "Kevin O'Brien", title: "Chassis Engineer" },
  { id: "u13", name: "Nadia Volkov", title: "Interior Design Engineer" },
  { id: "u14", name: "Ben Thompson", title: "Materials Technician" },
  { id: "u15", name: "Ana Souza", title: "Regional Supplier Liaison, North America" },
  { id: "u16", name: "Felix Wagner", title: "Regional Supplier Liaison, Europe" },
  { id: "u17", name: "Hana Sato", title: "Regional Supplier Liaison, Asia Pacific" },
  { id: "u18", name: "Chris Delgado", title: "Program Manager" },
];

export const PALETTE_ROLES = ["Reader", "Contributor", "Author", "Leader", "Owner"];

export const PALETTE_VISIBILITIES = ["Private", "Public", "Protected"];

// matHint biases which materials a palette is likely to get during generation — matches the
// same lightweight-plausibility approach used for Usage Classification.
export const PALETTE_DEFS = [
  {
    id: "p1", name: "F-150 Program Materials", collabspace: "Ford Truck & SUV Program", visibility: "Protected", deployed: true,
    description: "Materials approved for F-150 platform design and CAD work.",
    matHint: ["Metals", "Composites"],
    members: [
      { userId: "u1", role: "Owner" }, { userId: "u18", role: "Leader" },
      { userId: "u4", role: "Author" }, { userId: "u11", role: "Author" },
      { userId: "u12", role: "Contributor" }, { userId: "u13", role: "Contributor" },
      { userId: "u14", role: "Reader" },
    ],
  },
  {
    id: "p2", name: "Explorer Program Materials", collabspace: "Ford Truck & SUV Program", visibility: "Protected", deployed: true,
    description: "Materials approved for Explorer platform design and CAD work.",
    matHint: ["Metals", "Polymers", "Composites"],
    members: [
      { userId: "u3", role: "Owner" }, { userId: "u18", role: "Leader" },
      { userId: "u11", role: "Author" }, { userId: "u4", role: "Contributor" },
      { userId: "u8", role: "Reader" },
    ],
  },
  {
    id: "p3", name: "Mustang Program Materials", collabspace: "Performance & Electrification Program", visibility: "Private", deployed: true,
    description: "Materials approved for Mustang platform design and CAD work.",
    matHint: ["Metals", "Ceramics"],
    members: [
      { userId: "u6", role: "Owner" }, { userId: "u4", role: "Author" },
      { userId: "u11", role: "Contributor" }, { userId: "u12", role: "Reader" },
    ],
  },
  {
    id: "p4", name: "Global Standard Materials Library", collabspace: "Global Materials Standards", visibility: "Public", deployed: true,
    description: "Organization-wide catalog of standard, pre-qualified materials available to all programs.",
    matHint: null,
    members: [
      { userId: "u2", role: "Owner" }, { userId: "u3", role: "Leader" },
      { userId: "u9", role: "Author" }, { userId: "u14", role: "Contributor" },
      { userId: "u8", role: "Reader" }, { userId: "u18", role: "Reader" },
    ],
  },
  {
    id: "p5", name: "Supplier-Qualified Materials (North America)", collabspace: "Supplier Network", visibility: "Protected", deployed: true,
    description: "Materials qualified by North American suppliers.",
    matHint: null,
    members: [
      { userId: "u15", role: "Owner" }, { userId: "u5", role: "Contributor" },
      { userId: "u9", role: "Reader" },
    ],
  },
  {
    id: "p6", name: "Supplier-Qualified Materials (Europe)", collabspace: "Supplier Network", visibility: "Protected", deployed: true,
    description: "Materials qualified by European suppliers.",
    matHint: null,
    members: [
      { userId: "u16", role: "Owner" }, { userId: "u5", role: "Contributor" },
      { userId: "u9", role: "Reader" },
    ],
  },
  {
    id: "p7", name: "Supplier-Qualified Materials (Asia Pacific)", collabspace: "Supplier Network", visibility: "Protected", deployed: true,
    description: "Materials qualified by Asia-Pacific suppliers.",
    matHint: null,
    members: [
      { userId: "u17", role: "Owner" }, { userId: "u5", role: "Contributor" },
      { userId: "u9", role: "Reader" },
    ],
  },
  {
    id: "p8", name: "Advanced Composites R&D", collabspace: "Advanced Materials R&D", visibility: "Private", deployed: false,
    description: "Experimental composite materials under evaluation — not yet published to CAD.",
    matHint: ["Composites"],
    members: [
      { userId: "u10", role: "Owner" }, { userId: "u7", role: "Contributor" },
      { userId: "u1", role: "Reader" },
    ],
  },
  {
    id: "p9", name: "EV Powertrain Materials (Pilot)", collabspace: "Performance & Electrification Program", visibility: "Private", deployed: false,
    description: "Pilot material set for upcoming electric powertrain programs — not yet published to CAD.",
    matHint: ["Metals", "Ceramics"],
    members: [
      { userId: "u6", role: "Owner" }, { userId: "u2", role: "Contributor" },
      { userId: "u18", role: "Reader" },
    ],
  },
  {
    id: "p10", name: "Sustainability Initiative Materials", collabspace: "Global Materials Standards", visibility: "Public", deployed: true,
    description: "Lower-impact and recycled-content materials tracked under the sustainability initiative.",
    matHint: ["Polymers", "Composites"],
    members: [
      { userId: "u7", role: "Owner" }, { userId: "u9", role: "Contributor" },
      { userId: "u3", role: "Reader" }, { userId: "u18", role: "Reader" },
    ],
  },
];
