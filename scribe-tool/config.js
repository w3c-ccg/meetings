// duplicate main entries for backcompat. Warning: changing these values may risk
// regenerating annoying diffs on old minutes. Just be careful.

var config = [
  {
    "id": "weekly",
    "name": "W3C CCG Weekly Teleconference",
    "chairs": ["Mike Prorock", "Kimberly Linson", "Harrison Tang"]
  },
  {
    "id": "vcapi",
    "name": "VC API Task Force",
    "chairs": ["Manu Sporny"]
  },
  {
    "id": "education",
    "name": "VC for Education Task Force",
    "chairs": ["Kerri Lemoie", "Simone Ravaioli", "Dmitri Zagidulin"]
  },
  {
    "id": "traceability",
    "name": "Verifiable Traceability Task Force",
    "chairs": ["Orie Steele", "Mike Prorock", "Mahmoud Alkhraishi"]
  },
  {
    "id": "resolution",
    "name": "DID Resolution Task Force",
    "chairs": ["Markus Sabadello"]
  },
  {
    "id": "vc",
    "name": "VC Maintenance Task Force",
    "chairs": ["Brent Zundel", "Manu Sporny"]
  },
  {
    "id": "interop",
    "name": "VC Interoperability Task Force",
    "chairs": ["Orie Steele"]
  },
  {
    "id": "security",
    "name": "VC Security Task Force",
    "chairs": ["Manu Sporny", "Orie Steele"]
  },
  {
    "id": "didpkh",
    "name": "did:pkh DID Method Task Force",
    "chairs": ["Wayne Chang"]
  },
  {
    "id": "test",
    "name": "W3C CCG Infrastructure Testing",
    "chairs": ["Manu Sporny", "Charles Lehner", "Ryan Grant"]
  }
];

try {
  module.exports = config;
} catch(e) {}
