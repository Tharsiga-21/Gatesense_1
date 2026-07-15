/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Supported language mapping for the GateSense platform.
 */
export const SUPPORTED_LANGUAGES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  pt: "Portuguese",
  ar: "Arabic",
  ja: "Japanese",
  zh: "Chinese",
  ko: "Korean",
  hi: "Hindi"
};

/**
 * Localized accessibility instructions to be appended when a mobility need is detected.
 */
export const ACCESSIBILITY_NOTES: Record<string, string> = {
  en: "♿ Accessibility Note: Gates C and D are equipped with dedicated step-free mobility ramps, wider sensory-friendly turnstiles, and priority assistance personnel.",
  es: "♿ Nota de Accesibilidad: Las Puertas C y D están equipadas con rampas de movilidad sin escalones, torniquetes más anchos y personal de asistencia prioritaria.",
  fr: "♿ Note d'accessibilité : Les portes C et D sont équipées de rampes d'accès sans marche, de tourniquets plus larges et d'un personnel d'assistance prioritaire.",
  de: "♿ Barrierefreiheit-Hinweis: Die Tore C und D sind mit stufenlosen Rampen, breiteren Drehkreuzen und Personal für bevorzugte Hilfe ausgestattet.",
  pt: "♿ Nota de Acessibilidade: Os Portões C e D estão equipados com rampas de acessibilidade sem degraus, catracas mais largas e equipe de assistência prioritária.",
  ar: "♿ ملاحظة مخصصة لذوي الاحتياجات الخاصة: البوابتان C و D مجهزتان بممرات خالية من الدرج، وبوابات دوارة أوسع، وموظفي مساعدة ذوي أولوية.",
  ja: "♿ バリアフリー情報：ゲートCおよびDには、段差のない車椅子用スロープ、幅広の改札、および優先アシスタントスタッフが配置されています。",
  zh: "♿ 无障碍提示：C门和D门配备了无台阶坡道、加宽通道以及优先服务专员，专为行动不便的球迷提供便利。",
  ko: "♿ 교통약자 안내: 게이트 C와 D에는 계단이 없는 휠체어 전용 경사로, 넓은 개찰구 및 우선 안내 요원이 배치되어 있습니다.",
  hi: "♿ सुगमता नोट: गेट C और D सीढ़ी-रहित रैंप, व्यापक टर्नस्टाइल और प्राथमिकता सहायता कर्मचारियों से सुसज्जित हैं।"
};

/**
 * Localized sustainability guidelines to be appended when public transit or green travel is mentioned.
 */
export const SUSTAINABILITY_NOTES: Record<string, string> = {
  en: "🌱 Green Tournament: Support World Cup 2026 sustainability! Take CDMX Metro Line 3 to Gate D or Metrobus Line 1 to Gate F. Eco waste sorting hubs are active near Gates A and E.",
  es: "🌱 Torneo Verde: ¡Apoye la sostenibilidad del Mundial 2026! Tome la Línea 3 del Metro CDMX hacia la Puerta D o la Línea 1 del Metrobús hacia la Puerta F. Los centros de clasificación de residuos ecológicos están activos cerca de las Puertas A y E.",
  fr: "🌱 Tournoi Vert : Soutenez la durabilité de la Coupe du Monde 2026 ! Prenez la ligne 3 du métro CDMX vers la porte D ou la ligne 1 du Metrobus vers la porte F. Des centres de tri écologique sont actifs près des portes A et E.",
  de: "🌱 Grünes Turnier: Unterstützen Sie die Nachhaltigkeit der WM 2026! Nehmen Sie die U-Bahn-Linie 3 zum Tor D oder die Metrobus-Linie 1 zum Tor F. Öko-Abfallsortierstationen befinden sich in der Nähe der Tore A und E.",
  pt: "🌱 Torneio Verde: Apoie a sustentabilidade da Copa de 2026! Pegue a Linha 3 do Metrô CDMX para o Portão D ou a Linha 1 do Metrobús para o Portão F. Postos de coleta ecológica estão ativos perto dos Portões A e E.",
  ar: "🌱 البطولة الخضراء: ادعم استدامة كأس العالم 2026! استقل خط مترو CDMX 3 إلى البوابة D أو خط حافلات Metrobus 1 إلى البوابة F. تتوفر مراكز فرز النفايات الصديقة للبيئة بالقرب من البوابتين A و E.",
  ja: "🌱 グリーン・トーナメント：W杯2026サステナビリティ推進！CDMXメトロ3号線（ゲートD下車）またはメトロブス1号線（ゲートF下車）をご利用ください。ゲートAおよびE付近にエコ分別回収ハブが設置されています。",
  zh: "🌱 绿色赛事：支持2026世界杯可持续发展！乘 CDMX 地铁 3 号线至 D 门或乘快速公交 1 号线至 F 门。A 门和 E 门附近设有环保垃圾分类中心。",
  ko: "🌱 친환경 토너먼트: 2026 월드컵 지속가능성을 지원하세요! CDMX 지하철 3호선을 타고 게이트 D에서 내리시거나 메트로버스 1호선을 타고 게이트 F를 이용하세요. 게이트 A와 E 근처에 친환경 분리수거 허브가 운영 중입니다.",
  hi: "🌱 ग्रीन टूर्नामेंट: विश्व कप 2026 स्थिरता का समर्थन करें! गेट D के लिए CDMX मेट्रो लाइन 3 या गेट F के लिए मेट्रोबस लाइन 1 लें। गेट A and E के पास पर्यावरण अनुकूल कचरा वर्गीकरण केंद्र सक्रिय हैं।"
};

/**
 * Localized response messages for invalid, empty, or too short queries.
 */
export const ERROR_RESPONSES: Record<string, { r: string; msg: string }> = {
  en: { r: "D", msg: "Your query seems empty or unclear. Please provide details about your current location (e.g., 'near Gate B') and your target section or seat so that we can calculate the safest and most efficient gate recommendation." },
  es: { r: "D", msg: "Su consulta parece vacía o poco clara. Por favor, proporcione detalles sobre su ubicación actual (ej. 'cerca de la Puerta B') y su sección o asiento de destino para que podamos calcular la recomendación de puerta más segura y eficiente." },
  fr: { r: "D", msg: "Votre demande semble vide ou peu claire. Veuillez fournir des détails sur votre emplacement actuel (ex. 'près de la Porte B') et votre section ou siège cible afin que nous puissions calculer la recommandation de porte la plus sûre et la plus efficace." },
  de: { r: "D", msg: "Ihre Anfrage scheint leer oder unklar zu sein. Bitte geben Sie Details zu Ihrem aktuellen Standort (z. B. 'nahe Tor B') und Ihrem Zielbereich oder Sitzplatz an, damit wir die sicherste und effizienteste Torempfehlung berechnen können." },
  pt: { r: "D", msg: "Sua consulta parece vazia ou não está clara. Por favor, forneça detalhes sobre sua localização atual (ex: 'perto do Portão B') e sua seção ou assento de destino para que possamos calcular la recomendación de portão mais segura e eficiente." },
  ar: { r: "D", msg: "تبدو رسالتك غير واضحة. يرجى تقديم تفاصيل عن موقعك الحالي والبوابة أو القسم المطلوب حتى نتمكن من حساب أفضل مسار دخول آمن لك." },
  ja: { r: "D", msg: "クエリが不明確です。安全で最も効率的なゲート推薦を計算できるよう、現在の場所（例：ゲートB付近）や目的의セクションなどの詳細を入力してください。" },
  zh: { r: "D", msg: "您的咨询一头雾水。请提供您当前的位置（例如'靠近B门'）以及您的目标区域或座位，以便我们为您计算最安全和最高效的通道推荐。" },
  ko: { r: "D", msg: "문의 내용이 명확하지 않습니다. 가장 안전하고 효율적인 게이트 추천을 위해 현재 위치(예: 게이트 B 근처) 및 목적지 구역 등의 상세 정보를 제공해 주세요." },
  hi: { r: "D", msg: "आपका प्रश्न स्पष्ट नहीं है। कृपया अपने वर्तमान स्थान (जैसे 'गेट बी के पास') और अपने लक्ष्य क्षेत्र या सीट के बारे में विवरण प्रदान करें ताकि हम सबसे सुरक्षित गेट की सिफारिश कर सकें।" }
};

/**
 * Localized response messages when all gates are operating at 100% capacity.
 */
export const FULL_RESPONSES: Record<string, string> = {
  en: "ATTENTION: All stadium gates (Gates A-F) are currently operating at 100% capacity. There are no safe or uncrowded entrance routes available. Please remain in your current area, avoid forming bottlenecks, and follow instructions from physical crowd-control staff.",
  es: "ATENCIÓN: Todas las puertas del estadio (Puertas A-F) están actualmente al 100% de su capacidad. No hay rutas de entrada seguras o despejadas disponibles. Por favor, permanezca en su área actual, evite formar cuellos de botella y siga las instrucciones del personal físico de control de multitudes.",
  fr: "ATTENTION : Toutes les portes du stade (Portes A-F) fonctionnent actuellement à 100 % de leur capacité. Aucun itinéraire d'entrée sûr ou non encombré n'est disponible. Veuillez rester dans votre zone actuelle, éviter de former des goulots d'étranglement et suivre les instructions du personnel physique de contrôle des foules.",
  de: "ACHTUNG: Alle Stadiontore (Tore A-F) sind derzeit zu 100 % ausgelastet. Es stehen keine sicheren oder freien Wege zur Verfügung. Bitte bleiben Sie in Ihrem aktuellen Bereich, vermeiden Sie Engpässe und befolgen Sie die Anweisungen des Sicherheits- und Kontrollpersonals.",
  pt: "ATENÇÃO: Todos os portões do estádio (Portões A-F) estão operando atualmente com 100% de capacidade. Não há rotas de entrada seguras ou sem multidões disponíveis. Por favor, permaneça na sua área atual, evite formar gargalos e siga as instruções da equipe física de controle de multidões.",
  ar: "تنبيه: جميع بوابات الاستاد تعمل حاليًا بنسبة 100٪ من طاقتها الاستيعابية. لا توجد طرق دخول آمنة أو غير مزدحمة. يرجى البقاء في منطقتكم الحالية واتباع تعليمات موظفي مراقبة الحشود.",
  ja: "警告：現在、すべてのスタジアムゲートが100%の満員状態です。安全な入場ルートはありません。現在のエリアに留まり、現場の混雑管理スタッフの指示に従ってください。",
  zh: "注意：所有体育场通道当前均处于100%满载状态。目前没有安全或不拥挤的入场路线。请留在您当前的区域，避免造成拥堵，并听从现场秩序维护人员的指挥。",
  ko: "주의: 현재 모든 스타디움 게이트가 100% 만석으로 운영되고 있습니다. 안전한 입장 경로가 없습니다. 현재 구역에 대기해 주시고, 현장 혼잡 통제 요원의 지시에 따라 주시기 바랍니다.",
  hi: "ध्यान दें: सभी स्टेडियम गेट वर्तमान में 100% क्षमता पर चल रहे हैं। कोई भी सुरक्षित या कम भीड़ वाला प्रवेश मार्ग उपलब्ध नहीं है। कृपया अपने वर्तमान क्षेत्र में रहें और भीड़ नियंत्रण कर्मचारियों के निर्देशों का पालन करें।"
};

/**
 * Localized response messages when the user is at a highly congested gate (>80%).
 */
export const HIGH_CONGESTION_RESPONSES: Record<string, string> = {
  en: "Gate {mentionedGate} is currently at {currentDensity}% capacity (highly congested). We strongly recommend using Gate {altLetter} instead, which is at just {altDensity}% density. It has minimal crowds and will get you to your section with a similar or shorter overall transit time.",
  es: "La Puerta {mentionedGate} se encuentra actualmente al {currentDensity}% de su capacidad (muy congestionada). Le recomendamos encarecidamente que utilice la Puerta {altLetter} en su lugar, que tiene solo el {altDensity}% de densidad. Tiene menos multitudes y le permitirá llegar a su sección con un tiempo de tránsito similar o menor.",
  fr: "La Porte {mentionedGate} est actuellement à {currentDensity}% de sa capacité (très encombrée). Nous vous conseille vivement d'utiliser plutôt la Porte {altLetter}, qui est à seulement {altDensity}% de densité. Elle présente des files d'attente minimales et vous permettra de rejoindre votre section dans des conditions optimales.",
  de: "Das Tor {mentionedGate} ist derzeit zu {currentDensity}% ausgelastet (stark überlastet). Wir empfehlen Ihnen dringend, stattdessen das Tor {altLetter} zu benutzen, das nur eine Auslastung von {altDensity}% aufweist. Dort gibt es kaum Menschenaufläufe, was Ihnen einen schnelleren Zugang ermöglicht.",
  pt: "O Portão {mentionedGate} está atualmente com {currentDensity}% de capacidade (altamente congestionado). Recomendamos fortemente o uso do Portão {altLetter}, que está com apenas {altDensity}% de densidade. Possui pouca fila e garantirá que você chegue à sua seção com segurança e rapidez.",
  ar: "البوابة {mentionedGate} مزدحمة للغاية حالياً (سعة {currentDensity}%). ننصح بشدة بالتوجه إلى البوابة {altLetter} البديلة والأقل ازدحاماً (سعة {altDensity}%) لتوفير الوقت والجهد وتجنب طوابير الانتظار الطويلة.",
  ja: "現在ゲート{mentionedGate}は非常に混雑しています（混雑度{currentDensity}%）。代わりに混雑度がわずか{altDensity}%のゲート{altLetter}を使用することを強くお勧めします。行列が少なく、スムーズに入場可能です。",
  zh: "{mentionedGate} 号门当前极度拥堵（拥堵度 {currentDensity}%）。我们强烈建议您改用 {altLetter} 号门，那里的混杂度仅为 {altDensity}%。排队人数极少，能让您更快、更安全地入场就座。",
  ko: "현재 게이트 {mentionedGate}은 매우 혼잡합니다(혼잡도 {currentDensity}%). 대신 대기열이 {altDensity}%에 불과한 게이트 {altLetter}(으)로 입장하시는 것을 적극 권장합니다. 훨씬 수월하게 입장할 수 있습니다.",
  hi: "गेट {mentionedGate} वर्तमान में अत्यधिक व्यस्त है ({currentDensity}% क्षमता)। हम इसके बजाय गेट {altLetter} का उपयोग करने की सलाह देते हैं, जहाँ भीड़ केवल {altDensity}% है। यह आपको कम समय में आपकी सीट तक पहुँचाएगा।"
};

/**
 * Localized response messages when the user is at a moderately busy gate, but an alternative is significantly cleaner (>30% difference).
 */
export const MODERATE_CONGESTION_HIGH_DIFF_RESPONSES: Record<string, string> = {
  en: "Although Gate {mentionedGate} is moderately busy at {currentDensity}%, Gate {altLetter} is significantly clearer at {altDensity}% density. To ensure you make it to your section before the cutoff time, we advise bypassing Gate {mentionedGate} and entering through Gate {altLetter}.",
  es: "Aunque la Puerta {mentionedGate} está moderadamente ocupada al {currentDensity}%, la Puerta {altLetter} está significativamente más despejada al {altDensity}% de densidad. Para asegurar que llegue a su sección a tiempo, le aconsejamos ingresar por la Puerta {altLetter}.",
  fr: "Bien que la Porte {mentionedGate} soit modérément occupée à {currentDensity}%, la Porte {altLetter} est nettement plus fluide à {altDensity}% de densité. Pour vous assurer d'arriver à temps dans votre section, nous vous conseillons de passer par la Porte {altLetter}.",
  de: "Obwohl das Tor {mentionedGate} mit {currentDensity}% mäßig ausgelastet ist, ist das Tor {altLetter} mit {altDensity}% Auslastung deutlich freier. Um sicherzustellen, dass Sie rechtzeitig zu Ihrem Bereich gelangen, empfehlen wir Tor {altLetter}.",
  pt: "Embora o Portão {mentionedGate} esteja moderadamente movimentado com {currentDensity}%, o Portão {altLetter} está significativamente mais livre com {altDensity}% de densidade. Para garantir que você entre a tempo, aconselhamos entrar pelo Portão {altLetter}.",
  ar: "رغم أن البوابة {mentionedGate} مزدحمة بشكل متوسط ({currentDensity}%)، إلا أن البوابة {altLetter} أكثر سلاسة بكثير حيث تبلغ سعتها ({altDensity}%). ننصح بالمرور عبر البوابة {altLetter} لضمان الدخول السريع وقبل إغلاق التفتيش.",
  ja: "ゲート{mentionedGate}は中程度の混雑（混雑度{currentDensity}%）ですが、ゲート{altLetter}の方が大幅に空いています（混雑度{altDensity}%）。スムーズな入場のためにゲート{altLetter}への迂回をお勧めします。",
  zh: "虽然 {mentionedGate} 号门目前拥堵程度中等（约 {currentDensity}%），但 {altLetter} 号门明显更加顺畅（仅 {altDensity}%）。为了确保您能迅速入场，建议您改走 {altLetter} 号门。",
  ko: "게이트 {mentionedGate}은 보통의 혼잡도({currentDensity}%)를 보이고 있으나, 게이트 {altLetter}이 훨씬 여유롭습니다({altDensity}%). 원활한 입장을 위해 게이트 {altLetter} 이용을 추천합니다.",
  hi: "यद्यपि गेट {mentionedGate} मध्यम रूप से व्यस्त ({currentDensity}%) है, गेट {altLetter} काफी खाली ({altDensity}%) है। त्वरित प्रवेश के लिए हम आपको गेट {altLetter} से जाने की सलाह देते हैं।"
};

/**
 * Localized response messages when the user is at a moderately busy gate, and there is no massive gain in switching.
 */
export const MODERATE_CONGESTION_LOW_DIFF_RESPONSES: Record<string, string> = {
  en: "Gate {mentionedGate} is currently at {currentDensity}% capacity (moderate). Since you are already nearby and there is no heavily congested bottleneck, proceeding directly through Gate {mentionedGate} is your most optimal path.",
  es: "La Puerta {mentionedGate} está actualmente al {currentDensity}% de su capacidad (moderado). Dado que ya se encuentra cerca y no hay una congestión severa, proceder directamente por la Puerta {mentionedGate} es su opción más óptima.",
  fr: "La Porte {mentionedGate} est actuellement à {currentDensity}% de sa capacité (modérée). Comme vous êtes déjà à proximité et qu'il n'y a pas d'embouteillage majeur, passer directement par la Porte {mentionedGate} est votre itinéraire optimal.",
  de: "Das Tor {mentionedGate} ist derzeit zu {currentDensity}% ausgelastet (mäßig). Da Sie sich bereits in der Nähe befinden und kein schwerer Stau vorliegt, ist der direkte Weg durch das Tor {mentionedGate} Ihre beste Wahl.",
  pt: "O Portão {mentionedGate} está atualmente com {currentDensity}% de capacidade (moderado). Como você já está por perto e não há congestionamentos extremos, prosseguir diretamente pelo Portão {mentionedGate} é o seu caminho ideal.",
  ar: "البوابة {mentionedGate} تعمل بسعة متوسطة ({currentDensity}%). وبما أنكم قريبون منها ولا توجد اختناقات مرورية تذكر، فإن الاستمرار والدخول عبر البوابة {mentionedGate} هو خياركم الأسرع والأفضل حالياً.",
  ja: "ゲート{mentionedGate}は現在中程度の混雑（混雑度{currentDensity}%）です。現在地から最も近いため、そのままゲート{mentionedGate}から入場するのが最もスムーズです。",
  zh: "{mentionedGate} 号门当前处于中等容量（{currentDensity}%）。鉴于您已经在这附近，且暂无严重瓶颈，直接从 {mentionedGate} 号门入场是您最顺手和最省力的路径。",
  ko: "게이트 {mentionedGate}은 현재 보통의 혼잡도({currentDensity}%)를 보이고 있습니다. 이미 해당 위치 근처에 계시며 심각한 혼잡이 없으므로, 게이트 {mentionedGate}(으)로 직접 진행하시는 것이 가장 최적의 경로입니다.",
  hi: "गेट {mentionedGate} वर्तमान में {currentDensity}% क्षमता पर है। चूंकि आप पहले से ही इसके पास हैं और वहाँ अत्यधिक भीड़ नहीं है, इसलिए सीधे गेट {mentionedGate} से प्रवेश करना ही सबसे अच्छा मार्ग रहेगा।"
};

/**
 * Localized response messages when the user is at a low density gate (<50%).
 */
export const LOW_CONGESTION_RESPONSES: Record<string, string> = {
  en: "You're in luck! Gate {mentionedGate} is operating smoothly at just {currentDensity}% density. Since you are already there, enter through Gate {mentionedGate} for an effortless, immediate entry straight to your section.",
  es: "¡Está de suerte! La Puerta {mentionedGate} funciona de manera fluida con solo el {currentDensity}% de densidad. Como ya se encuentra allí, ingrese por la Puerta {mentionedGate} para un acceso rápido y directo a su sección.",
  fr: "Vous avez de la chance ! La Porte {mentionedGate} fonctionne de manière très fluide avec seulement {currentDensity}% de densité. Puisque vous y êtes déjà, entrez par la Porte {mentionedGate} pour un accès rapide et sans effort à votre section.",
  de: "Sie haben Glück! Tor {mentionedGate} läuft mit nur {currentDensity}% Auslastung absolut reibungslos. Da Sie bereits dort sind, nutzen Sie Tor {mentionedGate} für einen stressfreien und direkten Einlass.",
  pt: "Você está com sorte! O Portão {mentionedGate} está operando de forma muito tranquila com apenas {currentDensity}% de densidade. Como você já está lá, entre pelo Portão {mentionedGate} para um acesso imediato e fácil à sua seção.",
  ar: "أنتم محظوظون للغاية! البوابة {mentionedGate} تعمل بسلاسة فائقة بمعدل ازدحام ({currentDensity}%) فقط. وبما أنكم متواجدون هناك بالفعل، ننصح بالمرور منها فوراً لتوفير مجهودكم.",
  ja: "大変空いています！ゲート{mentionedGate}は現在、わずか{currentDensity}%の混雑度でスムーズに機能しています。そのままそこからご入場いただくのが、最も早くて快適です。",
  zh: "您的运气太棒了！{mentionedGate} 号门目前运转极其顺畅（仅 {currentDensity}% 混杂度）。既然您已经就位，请立刻由该通道进入，无需等待。",
  ko: "운이 좋으시네요! 게이트 {mentionedGate}은 현재 혼잡도 {currentDensity}%로 매우 원활하게 운영되고 있습니다. 바로 입장하시면 대기 없이 가장 신속하게 이동할 수 있습니다.",
  hi: "आप भाग्यशाली हैं! गेट {mentionedGate} केवल {currentDensity}% क्षमता के साथ बहुत सुचारू रूप से चल रहा है। सीधे गेट {mentionedGate} से प्रवेश करें, यहाँ कोई प्रतीक्षा समय नहीं है।"
};

/**
 * Localized response messages when no specific gate was mentioned in the user's query.
 */
export const NO_GATE_RESPONSES: Record<string, string> = {
  en: "Since no starting gate was specified in your query, we highly recommend entering through Gate {bestGateLetter}. It is currently our clearest entrance at just {bestGateDensity}% density, ensuring minimal waiting and the fastest path to your seat.",
  es: "Dado que no se especificó una puerta de inicio en su consulta, le recomendamos encarecidamente ingresar por la Puerta {bestGateLetter}. Actualmente es nuestra entrada más despejada con solo el {bestGateDensity}% de densidad, garantizando un tiempo mínimo de espera.",
  fr: "Comme aucune porte d'entrée n'a été spécifiée dans votre demande, nous vous recommandons vivement de passer par la Porte {bestGateLetter}. C'est actuellement notre entrée la plus fluide avec seulement {bestGateDensity}% de densité, vous garantissant un temps d'attente minimal.",
  de: "Da in Ihrer Anfrage kein Eingang angegeben wurde, empfehlen wir Ihnen dringend, das Tor {bestGateLetter} zu nutzen. Es ist derzeit unser freiestes Tor mit einer Auslastung von nur {bestGateDensity}%, was Ihnen die kürzeste Wartezeit beschert.",
  pt: "Como nenhum portão de entrada foi especificado, recomendamos fortemente entrar pelo Portão {bestGateLetter}. Atualmente é a nossa entrada mais livre com apenas {bestGateDensity}% de densidade, garantizando tempo mínimo de espera.",
  ar: "بما أنه لم يتم تحديد بوابة بداية في استفساركم، فإننا ننصح بشدة بالدخول عبر البوابة {bestGateLetter}. تعد الأقل ازدحاماً حالياً (سعة {bestGateDensity}%)، مما يضمن لكم حداً أدنى من الانتظار والوصول المباشر إلى مقعدكم.",
  ja: "クエリに開始ゲートが指定されていなかったため、現在最も混雑度が低い（わずか{bestGateDensity}%）ゲート{bestGateLetter}からのご入場を強くお勧めします。待ち時間を最短に抑えられます。",
  zh: "由于您未在咨询中提供起始通道，我们极力推荐您走 {bestGateLetter} 号门。这里目前是全场最顺畅的通道（仅 ${bestGateDensity}% 拥堵），能保证您最快进场。",
  ko: "문의사항에 출발 게이트가 명시되지 않아, 현재 가장 여유로운 게이트 {bestGateLetter}(혼잡도 {bestGateDensity}%)을 통한 입장을 강력 추천합니다. 대기 시간을 최소화하여 더 편안하게 입장하실 수 있습니다.",
  hi: "चूंकि आपके प्रश्न में कोई गेट निर्दिष्ट नहीं था, इसलिए हम गेट {bestGateLetter} से जाने की सलाह देते हैं। यह वर्तमान में सबसे खाली प्रवेश द्वार ({bestGateDensity}% क्षमता) है, जिससे न्यूनतम प्रतीक्षा समय लगेगा।"
};

/**
 * Utility function to format response templates with dynamic parameters.
 * 
 * @param {string} template - The localized raw template string containing bracketed parameters.
 * @param {object} params - Dynamic parameter values.
 * @returns {string} Fully formatted user-safe string.
 */
export function formatResponse(
  template: string,
  params: {
    mentionedGate?: string;
    currentDensity?: number;
    altLetter?: string;
    altDensity?: number;
    bestGateLetter?: string;
    bestGateDensity?: number;
  }
): string {
  let result = template;
  if (params.mentionedGate !== undefined) {
    result = result.replace(/{mentionedGate}/g, params.mentionedGate);
  }
  if (params.currentDensity !== undefined) {
    result = result.replace(/{currentDensity}/g, String(params.currentDensity));
  }
  if (params.altLetter !== undefined) {
    result = result.replace(/{altLetter}/g, params.altLetter);
  }
  if (params.altDensity !== undefined) {
    result = result.replace(/{altDensity}/g, String(params.altDensity));
  }
  if (params.bestGateLetter !== undefined) {
    result = result.replace(/{bestGateLetter}/g, params.bestGateLetter);
  }
  if (params.bestGateDensity !== undefined) {
    result = result.replace(/{bestGateDensity}/g, String(params.bestGateDensity));
  }
  return result;
}

/**
 * Heuristically detects the language of a query.
 * Supports: English, Spanish, French, German, Portuguese, Arabic, Japanese, Chinese, Korean, Hindi.
 * 
 * @param {string} query - Raw user query text.
 * @returns {{ code: string; name: string }} The matched ISO language code and language name.
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

  // Arabic keywords
  if (
    text.includes("مرحبا") ||
    text.includes("بوابة") ||
    text.includes("دقائق") ||
    text.includes("يغلق") ||
    text.includes("وقت") ||
    text.includes("الوصول") ||
    text.includes("ملعب") ||
    text.includes("شكرا") ||
    text.includes("الرجاء") ||
    text.includes("أرجو")
  ) {
    return { code: "ar", name: "Arabic" };
  }

  // Japanese keywords
  if (
    text.includes("こんにちは") ||
    text.includes("ゲート") ||
    text.includes("分") ||
    text.includes("閉まる") ||
    text.includes("時間") ||
    text.includes("到着") ||
    text.includes("スタジアム") ||
    text.includes("ありがとう") ||
    text.includes("おねがい") ||
    text.includes("ください")
  ) {
    return { code: "ja", name: "Japanese" };
  }

  // Chinese keywords
  if (
    text.includes("你好") ||
    text.includes("通道") ||
    text.includes("门") ||
    text.includes("分钟") ||
    text.includes("关闭") ||
    text.includes("时间") ||
    text.includes("到达") ||
    text.includes("体育场") ||
    text.includes("谢谢") ||
    text.includes("请")
  ) {
    return { code: "zh", name: "Chinese" };
  }

  // Korean keywords
  if (
    text.includes("안녕하세요") ||
    text.includes("게이트") ||
    text.includes("분") ||
    text.includes("닫히") ||
    text.includes("시간") ||
    text.includes("도착") ||
    text.includes("스타디움") ||
    text.includes("경기장") ||
    text.includes("감사") ||
    text.includes("부탁")
  ) {
    return { code: "ko", name: "Korean" };
  }

  // Hindi keywords
  if (
    text.includes("नमस्ते") ||
    text.includes("गेट") ||
    text.includes("मिनट") ||
    text.includes("बंद") ||
    text.includes("समय") ||
    text.includes("पहुंच") ||
    text.includes("स्टेडियम") ||
    text.includes("धन्यवाद") ||
    text.includes("कृपया")
  ) {
    return { code: "hi", name: "Hindi" };
  }

  // Default to English
  return { code: "en", name: "English" };
}

/**
 * Checks if a query mentions accessibility/mobility needs.
 * Supports multilingual checks for common accessibility terms.
 * 
 * @param {string} query - Raw user query text.
 * @returns {boolean} True if accessibility assistance/infrastructure is requested.
 */
export function detectAccessibilityNeed(query: string): boolean {
  const text = query.toLowerCase();
  const keywords = [
    "wheelchair", "mobility", "accessible", "disabled", "stroller", "ramp", "elevator", "handicap",
    "silla de ruedas", "movilidad", "accesible", "discapacitado", "carriola", "rampa", "ascensor",
    "fauteuil roulant", "mobilité", "accessible", "poussette", "rampe", "ascenseur",
    "rollstuhl", "mobilität", "barrierefrei", "kinderwagen", "rampe", "fahrstuhl",
    "cadeira de rodas", "mobilidade", "acessível", "carrinho", "rampa", "elevador",
    "كرسي متحرك", "الاحتياجات الخاصة", "ممر", "مصعد",
    "車椅子", "バリアフリー", "ベビーカー", "スロープ", "エレベーター",
    "轮椅", "无障碍", "婴儿车", "坡道", "电梯",
    "휠체어", "교통약자", "유모차", "경사로", "엘리베이터",
    "व्हीलचेयर", "सुगम", "रैंप", "लिफ्ट"
  ];
  return keywords.some(keyword => text.includes(keyword));
}

/**
 * Checks if a query mentions sustainability or public transit.
 * Supports multilingual checks for eco-friendly travel terms.
 * 
 * @param {string} query - Raw user query text.
 * @returns {boolean} True if public transit or green/eco guidelines are matched.
 */
export function detectSustainabilityNeed(query: string): boolean {
  const text = query.toLowerCase();
  const keywords = [
    "transit", "metro", "bus", "subway", "train", "eco", "sustainability", "bike", "green", "bicycle", "shuttle",
    "transporte", "autobús", "tren", "sostenible", "bici", "verde", "bicicleta",
    "transport", "métro", "durable", "vélo", "vert", "navette",
    "nahverkehr", "u-bahn", "zug", "nachhaltig", "fahrrad", "grün", "shuttle",
    "metrô", "ônibus", "trem", "sustentável", "bicicleta", "verde",
    "مترو", "حافلة", "قطار", "نقل", "مستدام", "دراجة", "أخضر",
    "地下鉄", "バス", "電車", "サステナブル", "自転車", "グリーン",
    "地铁", "公交", "火车", "轻轨", "绿色", "低碳", "环保", "自行车",
    "지하철", "버스", "기차", "대중교통", "친환경", "자전거",
    "मेट्रो", "बस", "ट्रेन", "परिवहन", "पर्यावरण", "साइकिल"
  ];
  return keywords.some(keyword => text.includes(keyword));
}
