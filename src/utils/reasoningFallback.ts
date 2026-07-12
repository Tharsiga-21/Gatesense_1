/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GateData, QueryResponse } from "../types";

/**
 * Heuristically detects the language of a query.
 * Supports: English, Spanish, French, German, Portuguese.
 */
export function detectLanguage(query: string): { code: string; name: string } {
  const text = query.toLowerCase();

  // Spanish keywords
  if (
    text.includes("hola") ||
    text.includes("puerta") ||
    text.includes("minutos") ||
    text.includes("cerrar") ||
    text.includes("cierra") ||
    text.includes("tiempo") ||
    text.includes("llegar") ||
    text.includes("estadio") ||
    text.includes("gracias") ||
    text.includes("por favor")
  ) {
    return { code: "es", name: "Spanish" };
  }

  // French keywords
  if (
    text.includes("bonjour") ||
    text.includes("porte") ||
    text.includes("minutes") ||
    text.includes("ferme") ||
    text.includes("temps") ||
    text.includes("arriver") ||
    text.includes("stade") ||
    text.includes("merci") ||
    text.includes("s'il vous plaît") ||
    text.includes("s'il vous plait")
  ) {
    return { code: "fr", name: "French" };
  }

  // German keywords
  if (
    text.includes("hallo") ||
    text.includes("tor") ||
    text.includes("bereich") ||
    text.includes("minuten") ||
    text.includes("schließt") ||
    text.includes("zeit") ||
    text.includes("ankommen") ||
    text.includes("stadion") ||
    text.includes("danke") ||
    text.includes("bitte")
  ) {
    return { code: "de", name: "German" };
  }

  // Portuguese keywords
  if (
    text.includes("olá") ||
    text.includes("ola") ||
    text.includes("portão") ||
    text.includes("portao") ||
    text.includes("seção") ||
    text.includes("secao") ||
    text.includes("minutos") ||
    text.includes("fecha") ||
    text.includes("tempo") ||
    text.includes("chegar") ||
    text.includes("estádio") ||
    text.includes("obrigado") ||
    text.includes("por favor")
  ) {
    return { code: "pt", name: "Portuguese" };
  }

  // Default to English
  return { code: "en", name: "English" };
}

/**
 * Formulates a fallback response when Gemini is not configured or fails.
 * Fully satisfies "without api I need an ai chat".
 */
export function generateLocalReasoning(query: string, gates: GateData[]): QueryResponse {
  const { code: langCode, name: langName } = detectLanguage(query);
  const normalizedQuery = query.trim().toLowerCase();

  // Edge Case 1: Empty or very short/gibberish input
  if (normalizedQuery.length < 3 || /^[^\w\s]+$/.test(normalizedQuery)) {
    const errorResponses: Record<string, { r: string, msg: string }> = {
      en: {
        r: "Gate D (or any designated general entrance).",
        msg: "Your query seems empty or unclear. Please provide details about your current location (e.g., 'near Gate B') and your target section or seat so that we can calculate the safest and most efficient gate recommendation."
      },
      es: {
        r: "Puerta D (o cualquier entrada general designada).",
        msg: "Su consulta parece vacía o poco clara. Por favor, proporcione detalles sobre su ubicación actual (ej. 'cerca de la Puerta B') y su sección o asiento de destino para que podamos calcular la recomendación de puerta más segura y eficiente."
      },
      fr: {
        r: "Porte D (ou toute entrée générale désignée).",
        msg: "Votre demande semble vide ou peu claire. Veuillez fournir des détails sur votre emplacement actuel (ex. 'près de la Porte B') et votre section ou siège cible afin que nous puissions calculer la recommandation de porte la plus sûre et la plus efficace."
      },
      de: {
        r: "Tor D (oder jeder andere ausgewiesene Haupteingang).",
        msg: "Ihre Anfrage scheint leer oder unklar zu sein. Bitte geben Sie Details zu Ihrem aktuellen Standort (z. B. 'nahe Tor B') und Ihrem Zielbereich oder Sitzplatz an, damit wir die sicherste und effizienteste Torempfehlung berechnen können."
      },
      pt: {
        r: "Portão D (ou qualquer entrada geral designada).",
        msg: "Sua consulta parece vazia ou não está clara. Por favor, forneça detalhes sobre sua localização atual (ex: 'perto do Portão B') e sua seção ou assento de destino para que possamos calcular a recomendação de portão mais segura e eficiente."
      }
    };
    
    const resp = errorResponses[langCode] || errorResponses.en;
    return {
      recommendedGate: "D",
      reasoning: "Query was identified as too short, empty, or containing invalid characters, trigger fallback generic instruction.",
      detectedLanguage: `${langName} (Defaulted due to short/gibberish input)`,
      response: resp.msg,
      isFallback: true
    };
  }

  // Check if all gates are at 100% capacity
  const allFull = gates.every(g => g.density >= 100);
  if (allFull) {
    const fullResponses: Record<string, string> = {
      en: "ATTENTION: All stadium gates (Gates A-F) are currently operating at 100% capacity. There are no safe or uncrowded entrance routes available. Please remain in your current area, avoid forming bottlenecks, and follow instructions from physical crowd-control staff.",
      es: "ATENCIÓN: Todas las puertas del estadio (Puertas A-F) están actualmente al 100% de su capacidad. No hay rutas de entrada seguras o despejadas disponibles. Por favor, permanezca en su área actual, evite formar cuellos de botella y siga las instrucciones del personal físico de control de multitudes.",
      fr: "ATTENTION : Toutes les portes du stade (Portes A-F) fonctionnent actuellement à 100 % de leur capacité. Aucun itinéraire d'entrée sûr ou non encombré n'est disponible. Veuillez rester dans votre zone actuelle, éviter de former des goulots d'étranglement et suivre les instructions du personnel physique de contrôle des foules.",
      de: "ACHTUNG: Alle Stadiontore (Tore A-F) sind derzeit zu 100 % ausgelastet. Es stehen keine sicheren oder freien Wege zur Verfügung. Bitte bleiben Sie in Ihrem aktuellen Bereich, vermeiden Sie Engpässe und befolgen Sie die Anweisungen des Sicherheits- und Kontrollpersonals.",
      pt: "ATENÇÃO: Todos os portões do estádio (Portões A-F) estão operando atualmente com 100% de capacidade. Não há rotas de entrada seguras ou sem multidões disponíveis. Por favor, permaneça na sua área atual, evite formar gargalos e siga as instruções da equipe física de controle de multidões."
    };

    return {
      recommendedGate: "NONE",
      reasoning: "All stadium gates are at maximum density capacity. No safe recommendations are available. Real-time crowd safety block activated.",
      detectedLanguage: langName,
      response: fullResponses[langCode] || fullResponses.en,
      isFallback: true
    };
  }

  // Extract mentioned gate from query
  let mentionedGate: string | null = null;
  const gateMatch = normalizedQuery.match(/gate\s*([a-f])\b/) || normalizedQuery.match(/puerta\s*([a-f])\b/) || normalizedQuery.match(/porte\s*([a-f])\b/) || normalizedQuery.match(/tor\s*([a-f])\b/) || normalizedQuery.match(/portão\s*([a-f])\b/) || normalizedQuery.match(/portao\s*([a-f])\b/);
  if (gateMatch) {
    mentionedGate = gateMatch[1].toUpperCase();
  } else {
    // Look for single letters A-F in proximity to words like "near", "at", "by", "cerca de", "près de", "bei", "perto de"
    const nearbyMatch = normalizedQuery.match(/\b(near|at|by|cerca|près|bei|perto)\s+([a-f])\b/);
    if (nearbyMatch) {
      mentionedGate = nearbyMatch[2].toUpperCase();
    }
  }

  // Let's analyze our gates
  const sortedGates = [...gates].sort((a, b) => a.density - b.density);
  const bestGateObj = sortedGates[0]; // lowest density gate
  const bestGateLetter = bestGateObj.name.replace("Gate ", "");

  let finalRecommendedLetter = bestGateLetter;
  let whyEnglish = "";
  let finalResponseInLanguage = "";

  if (mentionedGate) {
    const currentGateObj = gates.find(g => g.name === `Gate ${mentionedGate}`);
    const currentDensity = currentGateObj ? currentGateObj.density : 100;
    
    if (currentDensity > 80) {
      // The current gate is heavily congested, recommend a cleaner alternative
      const alternativeGate = bestGateObj;
      const altLetter = alternativeGate.name.replace("Gate ", "");
      finalRecommendedLetter = altLetter;
      whyEnglish = `Gate ${mentionedGate} is at ${currentDensity}% capacity and heavily congested. We recommend redirecting to Gate ${altLetter} which is only at ${alternativeGate.density}% capacity, providing a much smoother entry to the stadium.`;

      // Multilingual localized translations
      const responses: Record<string, string> = {
        en: `Gate ${mentionedGate} is currently at ${currentDensity}% capacity (highly congested). We strongly recommend using Gate ${altLetter} instead, which is at just ${alternativeGate.density}% density. It has minimal crowds and will get you to your section with a similar or shorter overall transit time.`,
        es: `La Puerta ${mentionedGate} se encuentra actualmente al ${currentDensity}% de su capacidad (muy congestionada). Le recomendamos encarecidamente que utilice la Puerta ${altLetter} en su lugar, que tiene solo el ${alternativeGate.density}% de densidad. Tiene menos multitudes y le permitirá llegar a su sección con un tiempo de tránsito similar o menor.`,
        fr: `La Porte ${mentionedGate} est actuellement à ${currentDensity}% de sa capacité (très encombrée). Nous vous conseillons vivement d'utiliser plutôt la Porte ${altLetter}, qui est à seulement ${alternativeGate.density}% de densité. Elle présente des files d'attente minimales et vous permettra de rejoindre votre section dans des conditions optimales.`,
        de: `Das Tor ${mentionedGate} ist derzeit zu ${currentDensity}% ausgelastet (stark überlastet). Wir empfehlen Ihnen dringend, stattdessen das Tor ${altLetter} zu benutzen, das nur eine Auslastung von ${alternativeGate.density}% aufweist. Dort gibt es kaum Menschenaufläufe, was Ihnen einen schnelleren Zugang ermöglicht.`,
        pt: `O Portão ${mentionedGate} está atualmente com ${currentDensity}% de capacidade (altamente congestionado). Recomendamos fortemente o uso do Portão ${altLetter}, que está com apenas ${alternativeGate.density}% de densidade. Possui pouca fila e garantirá que você chegue à sua seção com segurança e rapidez.`
      };
      finalResponseInLanguage = responses[langCode] || responses.en;

    } else if (currentDensity > 50) {
      // Moderate density, check if best alternative is significantly better (e.g. >30% better)
      const diff = currentDensity - bestGateObj.density;
      if (diff > 30) {
        const altLetter = bestGateLetter;
        finalRecommendedLetter = altLetter;
        whyEnglish = `Gate ${mentionedGate} is at ${currentDensity}% capacity (moderately busy). Gate ${altLetter} is much clearer at ${bestGateObj.density}% capacity and will save you valuable time.`;
        
        const responses: Record<string, string> = {
          en: `Although Gate ${mentionedGate} is moderately busy at ${currentDensity}%, Gate ${altLetter} is significantly clearer at ${bestGateObj.density}% density. To ensure you make it to your section before the cutoff time, we advise bypassing Gate ${mentionedGate} and entering through Gate ${altLetter}.`,
          es: `Aunque la Puerta ${mentionedGate} está moderadamente ocupada al ${currentDensity}%, la Puerta ${altLetter} está significativamente más despejada al ${bestGateObj.density}% de densidad. Para asegurar que llegue a su sección a tiempo, le aconsejamos ingresar por la Puerta ${altLetter}.`,
          fr: `Bien que la Porte ${mentionedGate} soit modérément occupée à ${currentDensity}%, la Porte ${altLetter} est nettement plus fluide à ${bestGateObj.density}% de densité. Pour vous assurer d'arriver à temps dans votre section, nous vous conseillons de passer par la Porte ${altLetter}.`,
          de: `Obwohl das Tor ${mentionedGate} mit ${currentDensity}% mäßig ausgelastet ist, ist das Tor ${altLetter} mit ${bestGateObj.density}% Auslastung deutlich freier. Um sicherzustellen, dass Sie rechtzeitig zu Ihrem Bereich gelangen, empfehlen wir Tor ${altLetter}.`,
          pt: `Embora o Portão ${mentionedGate} esteja moderadamente movimentado com ${currentDensity}%, o Portão ${altLetter} está significativamente mais livre com ${bestGateObj.density}% de densidade. Para garantir que você entre a tempo, aconselhamos entrar pelo Portão ${altLetter}.`
        };
        finalResponseInLanguage = responses[langCode] || responses.en;
      } else {
        // Continue through current gate as it is reasonably low/moderate and there is no massive gain
        whyEnglish = `Gate ${mentionedGate} is at ${currentDensity}% capacity. Since you are already near it, proceeding through Gate ${mentionedGate} is your most direct and efficient option.`;
        
        const responses: Record<string, string> = {
          en: `Gate ${mentionedGate} is currently at ${currentDensity}% capacity (moderate). Since you are already nearby and there is no heavily congested bottleneck, proceeding directly through Gate ${mentionedGate} is your most optimal path.`,
          es: `La Puerta ${mentionedGate} está actualmente al ${currentDensity}% de su capacidad (moderado). Dado que ya se encuentra cerca y no hay una congestión severa, proceder directamente por la Puerta ${mentionedGate} es su opción más óptima.`,
          fr: `La Porte ${mentionedGate} est actuellement à ${currentDensity}% de sa capacité (modérée). Comme vous êtes déjà à proximité et qu'il n'y a pas d'embouteillage majeur, passer directement par la Porte ${mentionedGate} est votre itinéraire optimal.`,
          de: `Das Tor ${mentionedGate} ist derzeit zu ${currentDensity}% ausgelastet (mäßig). Da Sie sich bereits in der Nähe befinden und kein schwerer Stau vorliegt, ist der direkte Weg durch das Tor ${mentionedGate} Ihre beste Wahl.`,
          pt: `O Portão ${mentionedGate} está atualmente com ${currentDensity}% de capacidade (moderado). Como você já está por perto e não há congestionamentos extremos, prosseguir diretamente pelo Portão ${mentionedGate} é o seu caminho ideal.`
        };
        finalResponseInLanguage = responses[langCode] || responses.en;
      }
    } else {
      // Current gate is very low density (<50%), absolutely stay there!
      whyEnglish = `Gate ${mentionedGate} is operating very smoothly at ${currentDensity}% capacity. Entering here is your fastest and most convenient route.`;
      
      const responses: Record<string, string> = {
        en: `You're in luck! Gate ${mentionedGate} is operating smoothly at just ${currentDensity}% density. Since you are already there, enter through Gate ${mentionedGate} for an effortless, immediate entry straight to your section.`,
        es: `¡Está de suerte! La Puerta ${mentionedGate} funciona de manera fluida con solo el ${currentDensity}% de densidad. Como ya se encuentra allí, ingrese por la Puerta ${mentionedGate} para un acceso rápido y directo a su sección.`,
        fr: `Vous avez de la chance ! La Porte ${mentionedGate} fonctionne de manière très fluide avec seulement ${currentDensity}% de densité. Puisque vous y êtes déjà, entrez par la Porte ${mentionedGate} pour un accès rapide et sans effort à votre section.`,
        de: `Sie haben Glück! Tor ${mentionedGate} läuft mit nur ${currentDensity}% Auslastung absolut reibungslos. Da Sie bereits dort sind, nutzen Sie Tor ${mentionedGate} für einen stressfreien und direkten Einlass.`,
        pt: `Você está com sorte! O Portão ${mentionedGate} está operando de forma muito tranquila com apenas ${currentDensity}% de densidade. Como você já está lá, entre pelo Portão ${mentionedGate} para um acesso imediato e fácil à sua seção.`
      };
      finalResponseInLanguage = responses[langCode] || responses.en;
    }
  } else {
    // No gate mentioned, just find the absolute best options
    whyEnglish = `No location gate was specified. We recommend Gate ${bestGateLetter} which is the least crowded at ${bestGateObj.density}% capacity, providing a highly efficient route.`;
    
    const responses: Record<string, string> = {
      en: `Since no starting gate was specified in your query, we highly recommend entering through Gate ${bestGateLetter}. It is currently our clearest entrance at just ${bestGateObj.density}% density, ensuring minimal waiting and the fastest path to your seat.`,
      es: `Dado que no se especificó una puerta de inicio en su consulta, le recomendamos encarecidamente ingresar por la Puerta ${bestGateLetter}. Actualmente es nuestra entrada más despejada con solo el ${bestGateObj.density}% de densidad, garantizando un tiempo mínimo de espera.`,
      fr: `Comme aucune porte d'entrée n'a été spécifiée dans votre demande, nous vous recommandons vivement de passer par la Porte ${bestGateLetter}. C'est actuellement notre entrée la plus fluide avec seulement ${bestGateObj.density}% de densité, vous garantissant un temps d'attente minimal.`,
      de: `Da in Ihrer Anfrage kein Eingang angegeben wurde, empfehlen wir Ihnen dringend, das Tor ${bestGateLetter} zu nutzen. Es ist derzeit unser freiestes Tor mit einer Auslastung von nur ${bestGateObj.density}%, was Ihnen die kürzeste Wartezeit beschert.`,
      pt: `Como nenhum portão de entrada foi especificado, recomendamos fortemente entrar pelo Portão ${bestGateLetter}. Atualmente é a nossa entrada mais livre com apenas ${bestGateObj.density}% de densidade, garantindo tempo mínimo de espera.`
    };
    finalResponseInLanguage = responses[langCode] || responses.en;
  }

  return {
    recommendedGate: finalRecommendedLetter,
    reasoning: whyEnglish,
    detectedLanguage: langName,
    response: finalResponseInLanguage,
    isFallback: true
  };
}
