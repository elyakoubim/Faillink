
// helpers/openaiHelpers.js
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: "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" });


/**
 * Génère le prompt d'analyse des actifs physiques à partir
 * de métadonnées et (si disponible) du JSON comptable structuré.
 * Vous pouvez adapter les chemins selon le schéma réel renvoyé par la Banque Nationale.
 */
function buildPhysicalAssetsPrompt({ dateBilan, acquisitionValue, amortissementsCumules, vnc, stocks, rawSnippet }) {
  return `Tu es un expert en analyse comptable de sociétés en faillite.

Voici les données issues du dernier bilan d’une entreprise. Ton rôle est d’évaluer si des **actifs physiques** (machines, véhicules, mobilier, stock) sont encore présents et s’ils ont un potentiel de revente.

Données à analyser :
- Date du bilan : ${dateBilan ?? 'Inconnue'}
- Immobilisations corporelles (valeur d’acquisition) : ${acquisitionValue ?? 'Inconnue'}
- Amortissements cumulés : ${amortissementsCumules ?? 'Inconnus'}
- Valeur nette comptable : ${vnc ?? 'Inconnue'}
- Stocks : ${stocks ?? 'Inconnus'}

Si certaines valeurs sont "Inconnue(s)", déduis-les prudemment à partir du contexte JSON si possible, sinon indique clairement qu’elles sont non disponibles.

Merci de me fournir les éléments suivants dans ta réponse (format texte) :

1. Un **score clair sur 5** pour le potentiel de revente des actifs physiques
2. Une **conclusion sur la présence ou absence** d’actifs et de stock
3. Une indication si les actifs sont **totalement amortis ou pas**
4. Un **court commentaire résumé** (max 2 phrases)
5. Une mention de la **date du bilan** et si elle est récente ou ancienne
6. DONNE davantage de détails sur la composition des actifs physiques (répartition par catégories, évolution, points positifs / négatifs) si l’information est disponible.

Le format attendu (garde exactement les rubriques, adapte le contenu) :

Voici mon analyse détaillée des actifs physiques de <NOM OU CBE> basée sur le bilan <ANNEE> :
Score de potentiel de revente : x/5
Présence d'actifs et stocks
✅ / ❌ ...
État des amortissements
✅ / ❌ ...
Détail complet des actifs physiques
...

Commentaire résumé
...

Date du bilan
...

Utilise des émojis ✅ / ❌ de façon cohérente.
Ne rajoute pas de texte explicatif hors de cette structure.
Base tes explications sur les données disponibles.

Contexte JSON (extrait / condensé) :
---
${rawSnippet}
---`;
}

/**
 * Essaie d'extraire quelques valeurs clés du JSON comptable.
 * Adaptez cette fonction selon la structure réelle.
 */
function extractKeyFigures(accountingData = {}) {
  // Heuristiques / chemins possibles (à ajuster)
  const tangibles = accountingData?.balanceSheet?.assets?.fixedAssets?.tangible
                   || accountingData?.FixedAssets?.Tangible
                   || accountingData?.ImmobilisationsCorporelles;

  const acquisitionValue =
    tangibles?.acquisitionValue
    || tangibles?.grossValue
    || tangibles?.ValeurAcquisition
    || null;

  const amortissementsCumules =
    tangibles?.accumulatedDepreciation
    || tangibles?.amortissementsCumules
    || tangibles?.Depreciation
    || null;

  const vnc =
    tangibles?.netBookValue
    || tangibles?.valeurNette
    || tangibles?.ValeurNetteComptable
    || (acquisitionValue != null && amortissementsCumules != null
        ? acquisitionValue - amortissementsCumules
        : null);

  const stocks =
    accountingData?.balanceSheet?.assets?.currentAssets?.inventories
    || accountingData?.Stocks
    || accountingData?.Inventories
    || null;

  return {
    acquisitionValue,
    amortissementsCumules,
    vnc,
    stocks
  };
}

/**
 * Appelle GPT-4o pour produire l'analyse structurée.
 */
export async function analysePhysicalAssets({ meta, accountingData }) {
  const { acquisitionValue, amortissementsCumules, vnc, stocks } = extractKeyFigures(accountingData);

  // On réduit le JSON pour le prompt (évite dépassement tokens)
  const rawSnippet = JSON.stringify(
    accountingData,
    (k, v) => (typeof v === 'number' || typeof v === 'string' ? v : v),
    2
  ).slice(0, 8000); // coupe si très gros

  const prompt = buildPhysicalAssetsPrompt({
    dateBilan: meta?.exercise,
    acquisitionValue,
    amortissementsCumules,
    vnc,
    stocks,
    rawSnippet
  });

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 900,
    temperature: 0.2,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  return resp.choices[0]?.message?.content?.trim();
}

/**
 * (Optionnel) OCR image si vous devez passer par un PDF + extraction image(s)
 * Laissez votre fonction existante ocrImage si nécessaire.
 */
export async function ocrImage(url) {
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Convertis l'image en texte brut exhaustif (en-têtes, pieds, tableaux).`,
          },
          { type: 'image_url', image_url: { url, detail: 'high' } },
        ],
      },
    ],
  });
  return resp.choices[0].message.content.trim();
}
