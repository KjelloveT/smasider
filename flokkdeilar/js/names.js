/* ══════════════════════════════════════
   NAMES.JS — Gruppenamn-kategoriar (nynorsk)
   ══════════════════════════════════════ */

const Names = (() => {
    const CATEGORIES = {
        'Verdsrommet': [
            'Supernova','Orion','Polaris','Andromeda','Mjølkevegen','Komet','Galakse',
            'Kosmos','Sirius','Meteoritt','Pulsar','Nebula','Kvark','Asteroide',
            'Merkur','Venus','Mars','Jupiter','Saturn','Uranus','Neptun','Pluto',
            'Kassiopeia','Pegasus','Karlsvogna','Svanen','Løva','Vega','Altair',
            'Deneb','Rigel','Betelgeuse','Antares','Aldebaran','Capella','Arcturus',
            'Proxima','Eklipse','Solflekk','Månefase','Solstorm','Stjernestøv',
            'Astro','Satellitt','Bane','Tyngdekraft','Titan','Europa','Senit','Nadir'
        ],
        'Dyr og natur': [
            'Gaupe','Ørn','Spekkhoggar','Polarrev','Delfin','Falk','Snøugle',
            'Gepard','Tiger','Løve','Panter','Bjørn','Ulv','Jerv','Elg','Hjort',
            'Hauk','Kondor','Albatross','Hakkespett','Svane','Flamingo','Leopard',
            'Jaguar','Puma','Oter','Sel','Kval','Ekorn','Pinnsvin','Hare','Rådyr',
            'Mår','Grevling','Humle','Marihøna','Sommarfugl','Augestikkar','Trost',
            'Nattergal','Lerke','Svale','Ravn','Sjøløve','Koala','Panda','Kenguru',
            'Kameleon','Kolibri','Surikat'
        ],
        'Edelsteinar og mineral': [
            'Diamant','Rubin','Safir','Smaragd','Ametyst','Topas','Opal','Turkis',
            'Jade','Rav','Kvarts','Jaspis','Agat','Onyks','Malakitt','Lapis Lazuli',
            'Akvamarin','Granat','Peridot','Obsidian','Rosenkvarts','Tigerøye',
            'Sitrin','Fluoritt','Turmalin','Hematitt','Pyritt','Gull','Sylv',
            'Platina','Titan','Bronse','Kopar','Krystall','Glimmer','Feltspat',
            'Olivin','Kalsitt','Sodalitt','Amazonitt','Kunzitt','Morganitt',
            'Aleksandritt','Karneol','Beryll','Zirkon','Spinell','Tanzanitt',
            'Larvikitt','Solstein'
        ],
        'Lys og energi': [
            'Polarljos','Solstråle','Regnboge','Laser','Prisme','Glimt','Gnist',
            'Neon','Aurora','Lumen','Watt','Volt','Ampere','Foton','Soloppgang',
            'Solnedgang','Stråle','Refleksjon','Gløding','Flamme','Magma','Plasma',
            'Kvantum','Tesla','Joule','Energi','Dynamo','Magnet','Frekvens',
            'Bølgjelengde','Spekter','Blits','Glitring','Illusjon','Mirage','Halo',
            'Corona','Fokus','Optikk','Matrix','Kjerne','Fusjon','Alfa','Beta',
            'Gamma','Delta','Omega','Signal','Straum','Strålekrans'
        ],
        'Geografi og landformer': [
            'Fjelltind','Fjord','Oase','Isbre','Bølgje','Lagune','Vulkan','Geysir',
            'Canyon','Delta','Dal','Atoll','Korallrev','Øy','Kontinent','Fjellkjede',
            'Arkipel','Halvøy','Savanne','Prærie','Steppe','Tundra','Regnskog',
            'Elv','Foss','Innsjø','Hav','Kyst','Horisont','Ekvator','Meridian',
            'Polarsirkel','Platå','Kløft','Strandlinje','Sanddyne','Grotte','Hule',
            'Rev','Sund','Strand','Kjelde','Høgland','Ås','Topp','Tind','Vidde',
            'Skjergard','Dalstrøk','Kanal'
        ],
        'Vêr og vind': [
            'Lyn','Torvêr','Virvelvind','Havbris','Storm','Kuling','Snøstorm',
            'Sky','Passatvind','Monsun','Sønnavind','Nordavind','Vestavind',
            'Austanvind','Bris','Solskinn','Toske','Rimfrost','Is','Hagl',
            'Regndråpe','Skylege','Sludd','Snøfnugg','Vinter','Vår','Sumar',
            'Haust','Syklon','Tromme','Mistral','Sirocco','Jetstraum','Klima',
            'Termikk','Cumulus','Stratus','Cirrus','Nimbus','Tordenske','Front',
            'Lågtrykk','Høgtrykk','Dogg','Skysystem','Vindkast','Slør','Skypumpe',
            'Morgenrøde'
        ]
    };

    const ALL_KEY = 'Alle kategoriar';

    function getCategories() {
        return [ALL_KEY, ...Object.keys(CATEGORIES)];
    }

    function getNames(categoryKey) {
        if (categoryKey === ALL_KEY) {
            return Object.values(CATEGORIES).flat();
        }
        return CATEGORIES[categoryKey] || [];
    }

    /* Trekk N unike, tilfeldige namn frå vald kategori */
    function pickNames(categoryKey, count) {
        const pool = [...getNames(categoryKey)];
        const result = [];
        for (let i = 0; i < count; i++) {
            if (pool.length === 0) {
                result.push(`Gruppe ${i + 1}`);
                continue;
            }
            const idx = Math.floor(Math.random() * pool.length);
            result.push(pool.splice(idx, 1)[0]);
        }
        return result;
    }

    return { getCategories, getNames, pickNames, ALL_KEY };
})();
