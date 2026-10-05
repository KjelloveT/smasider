(function () {
  "use strict";
  window.LivslinaBedPriceLadder = Object.freeze({
    app: "livslina",
    version: 1,
    status: "prototype",
    currency: "NOK",
    pricesAreProvisional: true,
    connectedToGameEconomy: false,
    tiers: Object.freeze([
      Object.freeze({id:"bed-tier-01",level:1,label:"Heimelaga seng",price:350,priceLabel:"kr 350",description:"Skeiv ramme av restebord og ein sliten, men brukande madrass."}),
      Object.freeze({id:"bed-tier-02",level:2,label:"Brukt seng",price:1500,priceLabel:"kr 1 500",description:"Ei heil og rein brukt seng med enkel ramme og eldre madrass."}),
      Object.freeze({id:"bed-tier-03",level:3,label:"Stødig kvardagseng",price:4500,priceLabel:"kr 4 500",description:"Ei stødig seng med god madrass og ryddig, mjukt sengetøy."}),
      Object.freeze({id:"bed-tier-04",level:4,label:"Polstra seng med oppbevaring",price:12000,priceLabel:"kr 12 000",description:"Polstra gavl, tjukk madrass og skuffer under senga."}),
      Object.freeze({id:"bed-tier-05",level:5,label:"Luksusseng med hev- og senkefunksjon",price:26000,priceLabel:"kr 26 000",description:"Eksklusiv seng med synlege løftesøyler, regulerbar høgd og sengetøy i høg kvalitet."})
    ])
  });
}());
