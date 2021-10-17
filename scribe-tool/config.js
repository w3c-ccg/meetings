// duplicate main entries for backcompat. Warning: changing these values may risk
// regenerating annoying diffs on old minutes. Just be careful.

var config = [
  {
    "name": "Credentials CG",
    "chairs": ["Wayne Chang", "Heather Vescent", "Mike Prorock"]
  },
  {
    "name": "Credentials Community Group",
    "chairs": ["Wayne Chang", "Heather Vescent", "Mike Prorock"]
  },
  {
    "name": "CCG Verifiable Credentials for Education Task Force",
    "chairs": ["Kim Hamilton Duffy", "Kerri Lemoie", "Anthony Camilleri"]
  }
];

try {
  module.exports = config;
} catch(e) {}
