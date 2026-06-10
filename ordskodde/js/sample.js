/* sample.js — eksempeltekst for Ordskodde.
   Utdrag frå Wikipedia-artikkelen om taco på nynorsk (CC BY-SA 4.0):
   https://nn.wikipedia.org/wiki/Taco (henta 2026-06-10). */
(function (root) {
  'use strict';

  const SOURCE_URL = 'https://nn.wikipedia.org/wiki/Taco';
  const SOURCE_LABEL = 'Wikipedia-artikkelen om taco';

  const TEXT = [
    'Taco er ein tradisjonell meksikansk matrett som består av ein liten handstor mais- eller kveitetortilla med fyll. Tortillaen blir bretta rundt fyllet og eten med handa. Ein kan laga taco med mange ulike typar fyll, som oksekjøt, grisekjøt, kylling, sjømat, bønner, grønsaker og ost, og garnera han med ulike smakstilsetjingar som salsa, guacamole eller rømme, og grønsaker, som salat, koriander, lauk, tomat og chili. Taco er ei vanleg form for antojito, eller meksikansk gatekjøkkenmat, som har spreidd seg over heile verda.',
    'Tortillaen kan også steikast eller frityrsteikast til eit hardt, U-forma skjel, og dette er blitt ein utbreidd tacotype i mellom anna Noreg. Tilbehøyret stammar ofte frå texmex- eller calimex-tradisjonane, meksikansk mat vidareutvikla i Texas og California.',
    'Taco kan samanliknast med liknande matvarer som burrito, som ofte er mykje større og rulla saman i staden for å foldast; taquito, som blir rulla og steikte; eller chalupa/tostada, der tortillaen blir steikt før han blir fylt.',
    'Opphavet til taco i Mexico er omdiskutert, med nokre som hevdar at retten er eldre enn tilkomet av spanjolane til Mexico, sidan det finst antropologiske bevis for at urfolk frå innsjøregionen i Mexicodalen tradisjonelt åt tacoar fylte med små fiskar. Under tida til dei spanske conquistadorane dokumenterte Bernal Díaz del Castillo den fyrste taco-festen for europearar, eit måltid Hernán Cortés heldt for kapteinane sine i Coyoacán. Andre hevdar at retten blei funnen opp mykje seinare, og at han blei laga av sølvgruvearbeidarar på 1700-talet.',
    'Eit av dei eldste skriftlege døma på bruken av ordet «taco» kjem frå ei kokebok frå 1836, Nuevo y sencillo arte de cocina, reposteria y refrescos av Antonia Carrillo. I ei oppskrift på rulla svinekam (lomo de cerdo enrollado) instruerer ho lesarane til å rulla svinekammen som dei ville ein taco de tortilla eller tortilla-taco.',
    'Det er også verdt å merka seg at omgrepet taco var regionalt, og utbreidd i Mexico by og området rundt, medan andre regionar nytta andre namn for retten. I Guanajuato, Guerrero, Michoacán og San Luis Potosí nytta ein omgrepa burrito og burro; medan i Yucatán og Quintana Roo nytta ein codzito (coçito). Den sterke kulturelle stillinga til Mexico by gjorde at taco blei hovudomgrepet, medan omgrep som burrito og codzito anten blei gløymde eller utvikla seg til å tyda noko anna i seinare tider. I 2024 blei El Califa de León i Mexico by den fyrste taco-bua til å få ei Michelin-stjerne.',
    'I det meksikanske og sentralamerikanske kjøkenet er tortillaen som oftast av kvitt maismjøl og blir servert mjuk og varm. Ein kan også nytta gult, blått eller raudt mjøl, eller kveitemjøl. Det finst òg tortillaer laga av ei blanding av mais og kveite. I texmex-kjøkenet blir det ofte nytta tacoskjel av maistortilla gjort på gult maismjøl som blir steikte til ei U-form. Sidan midten av 1900-talet er det utvikla andre harde skjel til tacoar, som skålforma «bowls» og «tubs».'
  ].join('\n\n');

  root.OrdskoddeSample = { TEXT, SOURCE_URL, SOURCE_LABEL };
})(window);
