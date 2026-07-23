const hash = (value) => Array.from(value).reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 17);

const dayPartLabel = { morning: 'deze ochtend', midday: 'rond de middag', afternoon: 'deze middag', evening: 'deze avond' };
const companyLabel = { solo: 'alleen', together: 'samen', family: 'met je gezin' };

const shared = (request, kind, title, promise, wonder, steps, extra = {}) => ({
  kind, title, promise, wonder,
  duration: Math.min(Math.max(8, request.context.availableMinutes - 5), extra.duration ?? 24),
  effort: extra.effort ?? 'Rustig', cta: extra.cta ?? 'Begin deze ervaring',
  why: [
    request.requestMode === 'active-intent' ? 'Gemaakt vanuit je eigen woorden' : `Past ${dayPartLabel[request.context.dayPart] ?? 'nu'}`,
    `Uitvoerbaar ${companyLabel[request.context.company] ?? 'in jouw gezelschap'} met buffer binnen ${request.context.availableMinutes} minuten`,
    ...(extra.why ?? []),
  ].slice(0, 3),
  prepareTitle: extra.prepareTitle ?? 'Maak ruimte om te beginnen',
  prepare: extra.prepare ?? ['Leg meldingen stil', 'Kies een plek die prettig en veilig voelt'],
  presenceMode: extra.presenceMode ?? 'guided', presenceTitle: extra.presenceTitle ?? title,
  presenceCue: extra.presenceCue ?? 'Alleen de volgende stap is nu nodig.',
  steps, memoryPrompt: extra.memoryPrompt ?? 'Welk detail wil je van dit moment onthouden?',
  keywords: extra.keywords ?? [kind, 'moment', 'beleven'], company: [request.context.company],
});

const variants = {
  food: [
    (request) => shared(request, 'food', 'Proef wat je al hebt', 'Bouw met één basis en twee contrasten een eenvoudige maaltijd die alleen vandaag zo ontstaat.', 'Door na iedere toevoeging te proeven wordt koken een kleine ontdekking in plaats van het volgen van een perfect recept.', [
      { title: 'Kies één basis', instruction: 'Kies een graan, brood, yoghurt of groente die nog goed is. Controleer houdbaarheid, allergieën en wat bij jou past.', meta: null, seconds: null, insight: null },
      { title: 'Voeg contrast toe', instruction: 'Kies iets fris, knapperigs of warms en voeg eerst een kleine hoeveelheid toe.', meta: 'Proef tussendoor', seconds: null, insight: { title: 'Contrast maakt eenvoud interessanter', body: 'Romig met fris of zacht met knapperig geeft een gerecht verschil zonder veel ingrediënten nodig te hebben.', topic: 'food' } },
      { title: 'Rond bewust af', instruction: 'Voeg één smaakmaker toe, proef opnieuw en stop zodra het compleet voelt.', meta: null, seconds: null, insight: null },
    ], { duration: 22, effort: 'Eenvoudig', prepare: ['Kies één basis die nog goed is', 'Kies maximaal twee aanvullingen', 'Controleer allergieën en geschiktheid zelf'], keywords: ['koken', 'eten', 'voorraad', 'proeven', 'food'] }),
    (request) => shared(request, 'food', 'Bouw een shake met structuur', 'Maak een shake of kom die past bij dit dagdeel en laat smaak, dikte en frisheid bewust in balans komen.', 'Dezelfde ingrediënten geven een andere ervaring wanneer je eerst de basis kiest en pas daarna gericht bijstuurt.', [
      { title: 'Bepaal de basis', instruction: 'Kies water, melk, yoghurt of een plantaardig alternatief dat jij verdraagt. Controleer allergieën, houdbaarheid en portie zelf.', meta: null, seconds: null, insight: null },
      { title: 'Bouw smaak en vulling', instruction: 'Voeg één fruit- of groentecomponent en één passende bron van structuur toe. Mix kort en beoordeel eerst de dikte.', meta: 'Kleine hoeveelheden', seconds: null, insight: { title: 'Textuur stuurt de beleving', body: 'Dikte, temperatuur en kleine stukjes veranderen hoe verzadigend en fris dezelfde combinatie aanvoelt.', topic: 'food' } },
      { title: 'Proef vóór je aanvult', instruction: 'Proef, verdun of voeg één accent toe. Stop wanneer smaak en structuur bij dit moment passen.', meta: null, seconds: null, insight: null },
    ], { duration: 12, effort: 'Licht', prepare: ['Kies een vloeibare basis', 'Leg maximaal drie aanvullingen klaar', 'Controleer allergieën en geschiktheid zelf'], keywords: ['shake', 'ontbijt', 'smaak', 'structuur', 'food'] }),
  ],
  movement: [
    (request) => shared(request, 'movement', 'Een beheerste beweegreeks', 'Gebruik je vrije ruimte voor een complete sessie waarin controle belangrijker blijft dan tempo.', 'Dezelfde beweging voelt anders wanneer je bewust een lichtere of sterkere variant kiest.', [
      { title: 'Kom rustig in beweging', instruction: 'Loop op de plaats en maak kleine kniebuigingen. Begin alleen wanneer dit comfortabel voelt.', meta: '2 minuten', seconds: 90, insight: null },
      { title: 'Duwen en zitten', instruction: 'Wissel een schuine push-up tegen een muur af met rustig opstaan uit een stoel. Kies kleinere bewegingen wanneer dat beter voelt.', meta: '3 rustige rondes', seconds: null, insight: { title: 'De hoek verandert de belasting', body: 'Een hogere steun maakt een push-up lichter. Zo pas je de beweging aan zonder het doel van controle te verliezen.', topic: 'movement' } },
      { title: 'Stabiel afronden', instruction: 'Draag je gewicht langzaam van links naar rechts, loop uit en stop direct bij pijn, duizeligheid of verlies van controle.', meta: '3 minuten', seconds: 120, insight: null },
    ], { duration: 20, effort: 'Gemiddeld', prepare: ['Vrije vloer', 'Stevige stoel of muur', 'Water', 'Stop wanneer bewegen niet goed voelt'], keywords: ['sport', 'bewegen', 'workout', 'controle', 'movement'] }),
    (request) => shared(request, 'movement', request.context.hasKettlebell ? 'Kracht met één kettlebell' : 'Tempo zonder materiaal', request.context.hasKettlebell ? 'Gebruik één gewicht voor een compacte krachtreeks met rustige overgangen en volledige controle.' : 'Gebruik tempo en houding voor een compacte reeks die geen materiaal nodig heeft.', 'Niet meer herhalingen, maar een beheerste overgang kan een korte sessie volwassen en compleet laten voelen.', [
      { title: 'Vind je startpositie', instruction: request.context.hasKettlebell ? 'Zet de kettlebell voor je neer en oefen één rustige deadlift. Kies een lichter gewicht of stop als de houding niet comfortabel blijft.' : 'Oefen rustig hurken naar een stoel en terug. Maak de beweging kleiner of stop wanneer dat comfortabeler is.', meta: 'Techniek vóór tempo', seconds: 90, insight: null },
      { title: 'Maak drie beheerste rondes', instruction: request.context.hasKettlebell ? 'Wissel vijf deadlifts af met een korte rustige draaghouding aan elke kant. Zet het gewicht veilig neer tussen rondes.' : 'Wissel vijf stoel-squats af met vijf schuine push-ups tegen een muur. Rust tussen rondes.', meta: 'Ruim herstel', seconds: null, insight: { title: 'Rust bewaakt kwaliteit', body: 'Een korte pauze maakt het makkelijker om houding en bewegingsbereik bewust te blijven kiezen.', topic: 'movement' } },
      { title: 'Laat spanning zakken', instruction: 'Loop rustig uit, controleer hoe je je voelt en stop direct bij pijn, duizeligheid of verlies van controle.', meta: '2 minuten', seconds: 120, insight: null },
    ], { duration: 18, effort: 'Stevig maar beheerst', prepare: request.context.hasKettlebell ? ['Een passende kettlebell', 'Vrije vloer', 'Water', 'Stopgrens vooraf bepalen'] : ['Stevige stoel of muur', 'Vrije vloer', 'Water', 'Stopgrens vooraf bepalen'], keywords: ['kracht', 'workout', request.context.hasKettlebell ? 'kettlebell' : 'bodyweight', 'movement'] }),
  ],
  learn: [
    (request) => shared(request, 'learn', 'Ontdek het ritme om je heen', 'Leer één klein principe en herken het daarna zonder langer op je scherm te blijven.', 'Herhaling zit niet alleen in muziek: ramen, bomen, tegels en dagelijkse handelingen hebben allemaal een ritme.', [
      { title: 'Neem dit idee mee', instruction: 'Ritme ontstaat wanneer een vorm, afstand, klank of beweging herkenbaar terugkomt.', meta: null, seconds: null, insight: { title: 'Ritme ordent wat je ziet', body: 'Je brein merkt herhaling en afwijking snel op. Daardoor kan één onderbreking in een patroon extra zichtbaar worden.', topic: 'general' } },
      { title: 'Vind twee patronen', instruction: 'Zoek in je omgeving twee verschillende herhalingen en wijs concreet aan wat terugkomt.', meta: 'Telefoon weg', seconds: 180, insight: null },
      { title: 'Vind de afwijking', instruction: 'Kijk waar één onderdeel van het patroon verandert. Bewaar alleen wat je werkelijk verraste.', meta: null, seconds: null, insight: null },
    ], { duration: 14, effort: 'Rustig', keywords: ['leren', 'kijken', 'ritme', 'ontdekken', 'learn'] }),
    (request) => shared(request, 'learn', 'Lees licht als informatie', 'Ontdek hoe richting, zachtheid en kleur van licht vertellen welk moment van de dag je beleeft.', 'Licht is niet alleen helder of donker: het vormt randen, materiaal en sfeer voortdurend opnieuw.', [
      { title: 'Leer drie kenmerken', instruction: 'Kijk naar richting, hardheid van schaduwen en kleur. Samen vertellen ze meer dan helderheid alleen.', meta: null, seconds: null, insight: { title: 'Laag licht maakt lange schaduwen', body: 'Wanneer licht onder een kleinere hoek valt, worden reliëf en textuur vaak duidelijker zichtbaar.', topic: 'general' } },
      { title: 'Vergelijk twee oppervlakken', instruction: 'Kies een mat en een glanzend oppervlak. Kijk hoe hetzelfde licht op beide anders verschijnt.', meta: 'Telefoon weg', seconds: 180, insight: null },
      { title: 'Benoem één verandering', instruction: 'Kijk enkele minuten later opnieuw en benoem alleen wat werkelijk veranderd is.', meta: null, seconds: null, insight: null },
    ], { duration: 15, effort: 'Aandachtig', keywords: ['leren', 'licht', 'waarnemen', 'omgeving', 'learn'] }),
  ],
  connect: [
    (request) => shared(request, 'connect', 'Drie keuzes samen', 'Geef iedereen één echte keuze en maak daar een kort gedeeld moment van.', 'De verschillen tussen jullie keuzes kunnen interessanter worden dan de opdracht zelf.', [
      { title: 'Kies om de beurt', instruction: 'De eerste persoon kiest een richting, plek of voorwerp; de volgende bepaalt wat jullie ermee doen.', meta: null, seconds: null, insight: null },
      { title: 'Maak één gezamenlijke regel', instruction: 'Bepaal samen één eenvoudige regel en laat daarna de telefoon uit beeld.', meta: 'Jullie bepalen wat telt', seconds: null, insight: null },
      { title: 'Eindig met één vondst', instruction: 'Iedereen noemt één detail dat zonder de ander waarschijnlijk niet was opgevallen.', meta: null, seconds: null, insight: null },
    ], { duration: 18, effort: 'Speels', keywords: ['samen', 'gezin', 'vriend', 'spel', 'connect'] }),
    (request) => shared(request, 'connect', 'Laat de ander gids zijn', 'Wissel wie kijkt en wie richting geeft, zodat een gewone omgeving twee verschillende verhalen krijgt.', 'Je ontdekt niet alleen de plek, maar ook waar de aandacht van de ander vanzelf naartoe gaat.', [
      { title: 'De eerste kiest', instruction: 'Eén persoon kiest een veilig, toegankelijk detail of een korte richting. De ander volgt zonder meteen te verbeteren.', meta: '5 minuten', seconds: null, insight: null },
      { title: 'Wissel van gids', instruction: 'Draai de rollen om. Kies iets duidelijk anders en houd de telefoon uit beeld.', meta: '5 minuten', seconds: null, insight: { title: 'Aandacht is persoonlijk', body: 'Mensen selecteren verschillende details uit dezelfde omgeving. Door te wisselen wordt dat verschil zichtbaar zonder dat iemand gelijk hoeft te krijgen.', topic: 'general' } },
      { title: 'Deel één verrassing', instruction: 'Noem allebei één keuze van de ander die je zelf niet had gemaakt.', meta: null, seconds: null, insight: null },
    ], { duration: 16, effort: 'Samen', keywords: ['samen', 'kind', 'partner', 'gids', 'connect'] }),
  ],
  outside: [
    (request) => shared(request, 'outside', 'Lees je directe omgeving opnieuw', 'Gebruik één klein detail om een bekende of onbekende plek aandachtiger te beleven.', 'Materiaal, geluid, vorm en gebruik kunnen een plek een verhaal geven zonder dat je eerst feiten hoeft op te zoeken.', [
      { title: 'Kies een begrensd stukje', instruction: 'Blijf waar toegang duidelijk en veilig is. Kies één gevel, boom, plein, pad of voorwerp.', meta: null, seconds: null, insight: null },
      { title: 'Bekijk vier lagen', instruction: 'Let op materiaal, vorm, sporen van gebruik en geluid. Verzin geen verklaring.', meta: 'Telefoon weg', seconds: 180, insight: { title: 'Waarnemen vóór verklaren', body: 'Door eerst alleen zichtbare kenmerken te benoemen, blijft helder wat je ziet en wat je vermoedt.', topic: 'place' } },
      { title: 'Neem één vraag mee', instruction: 'Formuleer één vraag die de plek opriep. Zoek het antwoord alleen later als je dat nog wilt.', meta: null, seconds: null, insight: null },
    ], { duration: 16, effort: 'Rustig', presenceMode: 'quiet', keywords: ['outside', 'kijken', 'plek', 'ontdekken'] }),
    (request) => shared(request, 'outside', 'Volg de overgang', 'Maak een korte buitenronde en zoek waar één landschap, straat of geluid merkbaar in iets anders overgaat.', 'Overgangen vallen vaak weg wanneer je alleen op een bestemming let; vandaag is juist de grens het doel.', [
      { title: 'Kies een veilige richting', instruction: 'Kies een openbare, vertrouwde richting zonder een onbekende routeclaim te volgen.', meta: null, seconds: null, insight: null },
      { title: 'Zoek drie overgangen', instruction: 'Let op een verandering in ondergrond, begroeiing, bebouwing, wind of geluid. Blijf op toegankelijke paden.', meta: 'Telefoon weg', seconds: 300, insight: { title: 'Randen zijn vaak rijk aan verschil', body: 'Waar twee omgevingen elkaar raken, veranderen licht, geluid en gebruik soms binnen enkele stappen.', topic: 'place' } },
      { title: 'Kies de sterkste grens', instruction: 'Sta kort stil bij de overgang die je het duidelijkst voelde en keer daarna op tijd terug.', meta: null, seconds: null, insight: null },
    ], { duration: 20, effort: 'Licht actief', presenceMode: 'quiet', prepare: ['Kies een bekende openbare omgeving', 'Controleer zelf toegang en veiligheid', 'Houd voldoende terugkeertijd over'], keywords: ['outside', 'wandelen', 'overgang', 'omgeving'] }),
  ],
  culture: [
    (request) => shared(request, 'culture', 'Lees een plek als cultuurspoor', 'Gebruik materiaal, vorm en gebruik om één menselijk spoor aandachtiger te bekijken.', 'Een plek kan betekenis dragen zonder dat Momentum daar een onbevestigd historisch verhaal bij verzint.', [
      { title: 'Kies één zichtbaar spoor', instruction: 'Kies een gevel, kunstwerk, gebruiksvoorwerp of openbare ruimte die je veilig kunt bekijken.', meta: null, seconds: null, insight: null },
      { title: 'Scheid zien van denken', instruction: 'Benoem eerst materiaal, vorm en gebruikssporen. Voeg daarna pas één mogelijke interpretatie toe en houd die als vermoeden.', meta: 'Geen feitclaim', seconds: 180, insight: { title: 'Interpretatie begint bij bewijs', body: 'Door observatie en verklaring uit elkaar te houden, blijft nieuwsgierigheid mogelijk zonder een verhaal als feit te presenteren.', topic: 'culture' } },
      { title: 'Neem één onderzoeksvraag mee', instruction: 'Formuleer één concrete vraag die later met een betrouwbare bron onderzocht kan worden.', meta: null, seconds: null, insight: null },
    ], { duration: 16, effort: 'Aandachtig', presenceMode: 'quiet', keywords: ['culture', 'architectuur', 'kunst', 'plek'] }),
    (request) => shared(request, 'culture', 'Luister naar de vorm van een plek', 'Ontdek hoe geluid en inrichting samen bepalen hoe een openbare plek wordt gebruikt.', 'Cultuur zit niet alleen in monumenten; ook tempo, ontmoeting en dagelijks gebruik laten menselijke keuzes zien.', [
      { title: 'Kies een openbaar standpunt', instruction: 'Ga op een veilige plek staan of zitten waar je niemand hindert en niets hoeft vast te leggen.', meta: null, seconds: null, insight: null },
      { title: 'Luister in drie afstanden', instruction: 'Merk een geluid dichtbij, in het midden en ver weg op. Kijk daarna welke vorm of activiteit erbij hoort.', meta: 'Telefoon weg', seconds: 180, insight: { title: 'Ruimte ordent geluid', body: 'Materiaal, openheid en menselijke activiteit beïnvloeden welke geluiden dichtbij of juist ver weg lijken.', topic: 'culture' } },
      { title: 'Benoem het gebruik', instruction: 'Vat in één zin samen waarvoor mensen deze plek vandaag lijken te gebruiken. Houd het bij wat je zag.', meta: null, seconds: null, insight: null },
    ], { duration: 15, effort: 'Rustig', presenceMode: 'quiet', keywords: ['culture', 'geluid', 'openbare ruimte', 'observeren'] }),
  ],
  restore: [
    (request) => shared(request, 'restore', 'Een rustige overgang', 'Maak een duidelijke pauze tussen wat je deed en wat hierna komt.', 'Wanneer er even geen nieuwe input bijkomt, worden tempo en omgeving vaak vanzelf beter merkbaar.', [
      { title: 'Sluit het vorige af', instruction: 'Leg je scherm weg, sta op en laat je schouders rustig zakken zonder je adem te sturen.', meta: null, seconds: 60, insight: null },
      { title: 'Kijk verder', instruction: 'Loop langzaam of blijf staan bij een raam. Noem stil drie concrete dingen die je ziet.', meta: 'Geen prestatie', seconds: 120, insight: null },
      { title: 'Kies wat volgt', instruction: 'Ga pas terug wanneer je weet wat de eerstvolgende kleine handeling wordt.', meta: null, seconds: null, insight: null },
    ], { duration: 10, effort: 'Zeer licht', presenceMode: 'quiet', keywords: ['rust', 'pauze', 'herstel', 'restore'] }),
    (request) => shared(request, 'restore', 'Maak je aandacht weer breed', 'Laat je aandacht kort loskomen van één taak en opnieuw landen in de ruimte om je heen.', 'Een bredere blik kan een overgang markeren zonder dat je een perfecte ontspanning hoeft te bereiken.', [
      { title: 'Onderbreek de stroom', instruction: 'Leg je telefoon buiten handbereik en verander rustig van houding of plek.', meta: '1 minuut', seconds: 60, insight: null },
      { title: 'Van dichtbij naar ver', instruction: 'Kijk achtereenvolgens naar iets dichtbij, halverwege en zo ver mogelijk. Stuur je adem niet en forceer niets.', meta: '3 rustige rondes', seconds: 180, insight: { title: 'Aandacht kan van schaal wisselen', body: 'Door bewust tussen afstanden te schakelen, wordt de ruimte om een taak heen opnieuw merkbaar.', topic: 'general' } },
      { title: 'Kies één rustig vervolg', instruction: 'Bepaal één haalbare volgende handeling en laat de rest nog even liggen.', meta: null, seconds: null, insight: null },
    ], { duration: 9, effort: 'Zeer licht', presenceMode: 'quiet', keywords: ['herstel', 'aandacht', 'pauze', 'restore'] }),
  ],
};

export function createFixtureDraft(request, variantOffset = 0) {
  const requested = request.domains[0] ?? (/kook|eten|shake/i.test(request.intent) ? 'food' : /sport|beweeg|train/i.test(request.intent) ? 'movement' : /leer|begrijp/i.test(request.intent) ? 'learn' : 'restore');
  const choices = variants[requested] ?? variants.restore;
  const seed = `${request.variationSeed || 'stable'}-${request.context.dayPart}-${request.context.company}-${request.context.availableMinutes}-${request.context.hasKettlebell}`;
  return choices[(hash(seed) + variantOffset) % choices.length](request);
}

// ADR-059: the fixture can serve a small candidate set (draftCount 1–3).
// Distinct variants are offered in order; the library holds two variants per
// kind, so a larger request truthfully returns fewer drafts rather than
// padded duplicates.
export function createFixtureDrafts(request) {
  const count = Math.min(Math.max(1, request.draftCount ?? 1), 3);
  const drafts = [];
  for (let index = 0; index < count; index += 1) {
    const draft = createFixtureDraft(request, index);
    if (!drafts.some((existing) => existing.title === draft.title)) drafts.push(draft);
  }
  return drafts.length ? drafts : [createFixtureDraft(request)];
}
