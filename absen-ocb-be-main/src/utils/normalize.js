/**
 * Generate multiple normalized name keys from a single name string.
 * Tolerates differences in abbreviation, casing, punctuation across systems.
 *
 * e.g. "Muhammad Saifuddin" → ["MUHAMMADSAIFUDDIN", "SAIFUDDIN", "MSAIFUDDIN", ...]
 */
function buildNameKeys(name) {
    if (!name) return [];

    // Tokenize: remove punctuation, split by whitespace, uppercase
    const tokens = name
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean);

    if (tokens.length === 0) return [];

    const keys = new Set();

    // Key 1: full joined name
    keys.add(tokens.join(''));

    if (tokens.length > 1) {
        const last = tokens.slice(1).join('');

        // Key 2: everything except first token (last name(s) only)
        keys.add(last);

        // Keys 3-6: abbreviate first token (1–4 chars) + last name(s)
        for (let i = 1; i <= 4; i++) {
            if (tokens[0].length >= i) {
                keys.add(tokens[0].slice(0, i) + last);
            }
        }
    }

    return [...keys];
}

module.exports = { buildNameKeys };
