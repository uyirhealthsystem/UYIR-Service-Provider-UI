import { DISTRICTS_BY_STATE } from "./hospitalFields";

// India Post's pincode directory (api.postalpincode.in) still files many post
// offices under the district they belonged to before Tamil Nadu split it - e.g.
// 627804 comes back as "Tirunelveli" although it has been in Tenkasi since 2019.
// Each post office's `Block` is its taluk, which is current, so a taluk that
// moved to a newer district tells us the real one.

const key = (value?: string) =>
  String(value || "").toLowerCase().replace(/\btk\b|\btq\b|taluka?|district|\(.*?\)/g, "").replace(/[^a-z]/g, "");

const DISTRICT_ALIASES: Record<string, string> = {
  pondicherry: "Puducherry", kanyakumari: "Kanniyakumari", tuticorin: "Thoothukudi", trichy: "Tiruchirappalli", tiruchchirappalli: "Tiruchirappalli",
  tiruchirapalli: "Tiruchirappalli", villupuram: "Viluppuram", thenilgiris: "Nilgiris", kanchipuram: "Kancheepuram", thiruvallur: "Tiruvallur",
  thiruvarur: "Tiruvarur", tirupattur: "Tirupathur", thiruvannamalai: "Tiruvannamalai", sivagangai: "Sivaganga", thirunelveli: "Tirunelveli",
  thiruppur: "Tiruppur", tirupur: "Tiruppur", nagappattinam: "Nagapattinam", thoothukkudi: "Thoothukudi", kallakkurichi: "Kallakurichi",
};

/** Match a district name against the state's list ("" when it isn't one of them). */
export function normalizeDistrict(raw: string | undefined, state: string): string {
  const k = key(raw);
  if (!k) return "";
  const list = DISTRICTS_BY_STATE[state] || Object.values(DISTRICTS_BY_STATE).flat();
  const direct = list.find((d) => key(d) === k);
  const alias = DISTRICT_ALIASES[k];
  return direct || (alias && list.includes(alias) ? alias : "");
}

/**
 * Old (parent) district -> taluks that now belong to a newer district.
 * Keyed by parent so a taluk name that exists elsewhere (Sivaganga also has a
 * Tiruppattur) is only remapped when India Post files it under that parent.
 */
const SPLITS: Record<string, Record<string, string[]>> = {
  Tirunelveli: {
    Tenkasi: ["tenkasi", "shenkottai", "sengottai", "shencottai", "kadayanallur", "sankarankovil", "sankarankoil", "sivagiri", "alangulam", "veerakeralampudur", "vkpudur", "thiruvengadam", "tiruvengadam", "surandai"],
  },
  Viluppuram: {
    Kallakurichi: ["kallakurichi", "kallakkurichi", "chinnasalem", "chinnaselam", "sankarapuram", "ulundurpet", "ulundurpettai", "tirukoilur", "thirukoilur", "tirukkoyilur", "thirukkoyilur", "kalvarayanhills"],
  },
  Kancheepuram: {
    Chengalpattu: ["chengalpattu", "chengalpet", "tambaram", "pallavaram", "vandalur", "tirukalukundram", "thirukalukundram", "thirukazhukundram", "tiruporur", "thiruporur", "madurantakam", "maduranthakam", "cheyyur", "chitlapakkam", "kelambakkam"],
  },
  Vellore: {
    Tirupathur: ["tirupathur", "tirupattur", "vaniyambadi", "ambur", "natrampalli", "natrampalle", "jolarpet", "jolarpettai"],
    Ranipet: ["ranipet", "arakkonam", "arakonam", "arcot", "walajah", "walaja", "walajapet", "nemili", "sholingur", "sholinghur", "kalavai", "timiri"],
  },
  Nagapattinam: {
    Mayiladuthurai: ["mayiladuthurai", "sirkazhi", "sirkali", "tharangambadi", "tarangambadi", "kuthalam", "kuttalam"],
  },
  Coimbatore: {
    Tiruppur: ["tiruppur", "tirupur", "avanashi", "avinashi", "palladam", "udumalaipettai", "udumalpet", "udumalaipet", "madathukulam", "uthukuli", "uthukkuli"],
  },
  Erode: {
    Tiruppur: ["dharapuram", "kangeyam", "kangayam", "tiruppur", "tirupur", "uthukuli"],
  },
  Dharmapuri: {
    Krishnagiri: ["krishnagiri", "hosur", "denkanikottai", "pochampalli", "uthangarai", "bargur", "shoolagiri", "anchetty"],
  },
  Perambalur: {
    Ariyalur: ["ariyalur", "udayarpalayam", "sendurai", "andimadam", "jayankondam"],
  },
};

type PostOffice = { District?: string; Block?: string; Name?: string; State?: string };

/**
 * The current district for a pincode, from India Post's post offices. Each post
 * office votes with its taluk; the most common answer wins (a pincode can
 * straddle a taluk border). Falls back to India Post's own district.
 */
export function resolvePincodeDistrict(postOffices: PostOffice[], state: string): string {
  const votes = new Map<string, number>();
  for (const office of postOffices) {
    const parent = normalizeDistrict(office.District, state);
    if (!parent) continue;
    const block = key(office.Block);
    let district = parent;
    for (const [child, taluks] of Object.entries(SPLITS[parent] || {})) {
      if (block && taluks.includes(block)) { district = child; break; }
    }
    // Block is "NA" for some offices: they don't vote for the parent either,
    // or a split pincode's NA offices would outvote its real taluk.
    if (district === parent && (!block || block === "na") && SPLITS[parent]) continue;
    votes.set(district, (votes.get(district) || 0) + 1);
  }
  let best = "";
  let bestCount = 0;
  for (const [district, count] of votes) if (count > bestCount) { best = district; bestCount = count; }
  return best || normalizeDistrict(postOffices[0]?.District, state);
}
