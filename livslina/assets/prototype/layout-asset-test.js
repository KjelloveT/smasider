(function () {
  "use strict";
  const model=window.LivslinaRoomPlan,catalog=window.LivslinaItemCatalog,bedLadder=window.LivslinaBedPriceLadder.tiers;
  const controls={bed:"bed-variant",desk:"desk-variant",chair:"chair-variant",rug:"rug-variant",sofa:"sofa-variant","tv-bench":"bench-variant",tv:"tv-variant",pc:"pc-variant",leftWall:"left-wall-decor",rightWall:"right-wall-decor",pictureStyle:"picture-style",shelfStyle:"shelf-style",floorItem:"floor-item",floorVariant:"floor-variant",decorKind:"decor-kind",decorTier:"decor-tier"};
  const defaults={bed:"03",desk:"03",chair:"03",rug:"03",sofa:"01","tv-bench":"03",tv:"03",pc:"03",deskSize:"01",chairSize:"01",rugSize:"01",sofaSize:"01","tv-benchSize":"01",leftWall:"both",rightWall:"both",pictureStyle:"01",shelfStyle:"01",floorItem:"plant",floorVariant:"03",decorKind:"none",decorTier:"03"};
  const root=document.getElementById("room-model"),status=document.getElementById("variant-status"),guideButton=document.getElementById("toggle-floor-guides"),randomButton=document.getElementById("randomize-room");
  let guides=false;
  function tierLabel(entry){return entry.level+" · "+entry.label+" · "+entry.priceLabel;}
  function fillTiers(select,family,chosen){
    const entries=catalog.families[family].options,old=chosen||select.value||"03";
    select.replaceChildren();
    entries.forEach(function(entry){const option=document.createElement("option");option.value=String(entry.level).padStart(2,"0");option.textContent=tierLabel(entry);select.appendChild(option);});
    select.value=entries.some(function(entry){return String(entry.level).padStart(2,"0")===old;})?old:"03";
  }
  function fillDecorKinds(){const select=document.getElementById("decor-kind");
    catalog.decor.forEach(function(key){const option=document.createElement("option");option.value=key;option.textContent=catalog.families[key].label;select.appendChild(option);});}
  function refreshDecor(chosen){const kind=document.getElementById("decor-kind").value,select=document.getElementById("decor-tier");
    select.disabled=kind==="none";select.replaceChildren();
    if(kind==="none"){const option=document.createElement("option");option.value="03";option.textContent="Vel pyntetype først";select.appendChild(option);return;}
    catalog.families[kind].options.forEach(function(entry){const option=document.createElement("option");option.value=String(entry.level).padStart(2,"0");option.textContent=tierLabel(entry);select.appendChild(option);});
    const choice=chosen||defaults.decorTier;select.value=Array.from(select.options).some(function(option){return option.value===choice;})?choice:"03";
  }
  function selection(){const values={};
    Object.keys(controls).forEach(function(key){values[key]=document.getElementById(controls[key]).value;});
    values.bedTier=values.bed;
    values.bedSize="01";
    values.sofaSize=document.getElementById("sofa-size").value;
    return values;
  }
  function render(){
    const choices=selection(),svg=new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg">'+model.build(choices,false)+'</svg>',"image/svg+xml");
    root.replaceChildren.apply(root,Array.from(svg.documentElement.childNodes).map(function(node){return document.importNode(node,true);}));
    const items=model.layout(choices),bedLevel=Number(choices.bedTier)-1,bedOption=bedLadder[bedLevel]||bedLadder[0];
    document.getElementById("bed-price-label").textContent="Førebels spelpris · nivå "+bedOption.level+" av "+bedLadder.length;
    document.getElementById("bed-price").textContent=bedOption.priceLabel;
    document.getElementById("bed-price-detail").textContent=bedOption.description;
    Object.keys(items).forEach(function(key){const a=items[key],output=document.getElementById("measure-"+key);if(output)output.textContent=key==="tv"?a.d+" cm breidd":(key==="sofa"||key==="tv-bench"?a.d+" × "+a.w:a.w+" × "+a.d)+" cm";});
    const floor=items.floorItem,floorEntry=floor&&catalog.families[floor.kind].options[floor.tier];
    document.getElementById("floor-item-summary").textContent=floor?floor.label+" · "+floorEntry.label+" · "+floor.w+" × "+floor.d+" cm golvplass · "+floor.h+" cm høgd. Gjenstanden står i den ledige sona mellom seng og pult.":"Ingen golvting er vald.";
    const errors=model.validate(choices),decor=items.decor?catalog.families[items.decor.kind].options[items.decor.tier]:null;
    status.textContent=errors.length?"Målmodellen fann ein plasskonflikt: "+errors.join(", "):"TV "+items.tv.d+" cm og PC-tårnet er festa til høvesvis TV-benken og pulten. "+(decor?decor.label+" følgjer "+(items.decor.mount==="wall"?"høgre vegg.":"pultflata."):"Vel éi pynteting for å prøve ho i rommet.");
  }
  document.querySelectorAll("[data-tier-family]").forEach(function(select){
    const family=select.dataset.tierFamily;
    if(family==="floor")fillTiers(select,"plant",defaults.floorVariant);else fillTiers(select,family,defaults[family]);
  });
  fillDecorKinds();
  Object.keys(controls).forEach(function(key){const select=document.getElementById(controls[key]);
    if(controls[key]==="decor-tier")return;
    if(defaults[key]&&Array.from(select.options).some(function(option){return option.value===defaults[key];}))select.value=defaults[key];
  });
  document.getElementById("decor-kind").value="none";refreshDecor();
  ["desk-size","chair-size","rug-size","bench-size"].forEach(function(id){const element=document.getElementById(id);if(element)element.closest("label").remove();});
  Object.keys(controls).forEach(function(key){document.getElementById(controls[key]).addEventListener("change",function(){
    if(key==="floorItem")fillTiers(document.getElementById("floor-variant"),this.value,defaults.floorVariant);
    if(key==="decorKind")refreshDecor();
    render();
  });});
  document.getElementById("sofa-size").addEventListener("change",render);
  guideButton.addEventListener("click",function(){guides=!guides;guideButton.setAttribute("aria-pressed",String(guides));guideButton.textContent=guides?"Skjul golvruter og retning":"Vis golvruter og retning";
    const svg=new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg">'+model.build(selection(),guides)+'</svg>',"image/svg+xml");root.replaceChildren.apply(root,Array.from(svg.documentElement.childNodes).map(function(node){return document.importNode(node,true);}));});
  randomButton.addEventListener("click",function(){
    ["bed-variant","desk-variant","chair-variant","rug-variant","sofa-variant","sofa-size","bench-variant","tv-variant","pc-variant","left-wall-decor","right-wall-decor","picture-style","shelf-style","floor-item"].forEach(function(id){const el=document.getElementById(id);el.selectedIndex=Math.floor(Math.random()*el.options.length);});
    const floorSelect=document.getElementById("floor-variant");fillTiers(floorSelect,document.getElementById("floor-item").value);floorSelect.selectedIndex=Math.floor(Math.random()*floorSelect.options.length);
    const decorKind=document.getElementById("decor-kind");decorKind.selectedIndex=Math.floor(Math.random()*decorKind.options.length);refreshDecor();
    const decorTier=document.getElementById("decor-tier");if(!decorTier.disabled)decorTier.selectedIndex=Math.floor(Math.random()*decorTier.options.length);
    render();status.textContent="Heile rommet fekk eit tilfeldig oppsett.";
  });
  document.getElementById("reset-variants").addEventListener("click",function(){
    Object.keys(controls).forEach(function(key){const select=document.getElementById(controls[key]);if(defaults[key]&&Array.from(select.options).some(function(option){return option.value===defaults[key];}))select.value=defaults[key];});
    document.getElementById("sofa-size").value="01";fillTiers(document.getElementById("floor-variant"),"plant",defaults.floorVariant);document.getElementById("decor-kind").value="none";refreshDecor();render();
  });
  render();
}());
