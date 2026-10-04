(function () {
  "use strict";
  // Dimensions are centimetres. Every object shares this one orthographic camera.
  const catalog=window.LivslinaItemCatalog;
  const camera={width:480,height:360,originX:220,originY:136,scale:0.52,axisX:Math.sqrt(3)/2,axisY:0.5};
  const room={width:420,depth:360,height:240};
  const variants={
    bed:[{w:95,d:200,h:95},{w:120,d:200,h:95}],
    desk:[{w:120,d:60,h:75},{w:150,d:65,h:75}],
    chair:[{w:42,d:42,h:85},{w:48,d:48,h:90}],
    rug:[{w:260,d:190,h:1},{w:280,d:200,h:1}],
    sofa:[{w:82,d:145,h:80},{w:90,d:155,h:80}],
    "tv-bench":[{w:45,d:100,h:45},{w:45,d:120,h:50}]
  };
  const bedTierHeights=[78,82,86,94,102];
  const colors={wood:["#dbc39a","#b99b72","#cbaa80"],sage:["#cad9bb","#8aa77b","#abc29b"],coral:["#f2c6b4","#c98f79","#dfaa94"],plum:["#d6c2df","#a78cb3","#baa3c5"],teal:["#bbdce5","#75a4b3","#95bfcd"],cream:["#fff7df","#d5c8ac","#e9dfc6"],metal:["#8d9398","#4d5860","#6d777e"]};
  const names={bed:"Seng",desk:"Pult",chair:"Stol",rug:"Teppe",sofa:"Sofa","tv-bench":"TV-benk",tv:"TV",pc:"PC",decor:"Pynt",floorItem:"Golvting"};
  const floorTypes={speaker:{w:28,d:30,h:90,label:"Høgtalar"},plant:{w:40,d:40,h:110,label:"Plante"},nightstand:{w:45,d:40,h:55,label:"Nattbord"}};
  function tierIndex(value){const n=Number(value);return Number.isInteger(n)&&n>=1&&n<=5?n-1:0;}
  function tierItem(family,value){const tier=tierIndex(value),definition=catalog.families[family],dims=definition.options[tier].dimensions;
    return Object.assign({family:family,tier:tier,variant:tier,label:definition.label}, {w:dims[0],d:dims[1],h:dims[2]});}
  function project(u,v,z){return [camera.originX+(u-v)*camera.scale*camera.axisX,camera.originY+(u+v)*camera.scale*camera.axisY-z*camera.scale];}
  function point(u,v,z){return project(u,v,z).map(function(n){return n.toFixed(2);}).join(",");}
  function polygon(points,fill,extra){return '<polygon points="'+points.map(function(p){return point.apply(null,p);}).join(" ")+'" fill="'+fill+'" stroke="#273a33" stroke-width="1" stroke-linejoin="round" '+(extra||"")+'/>';}
  function plane(u,v,z,w,d,fill,extra){return polygon([[u,v,z],[u+w,v,z],[u+w,v+d,z],[u,v+d,z]],fill,extra);}
  function box(u,v,z,w,d,h,palette){
    const c=colors[palette];
    return polygon([[u+w,v,z],[u+w,v+d,z],[u+w,v+d,z+h],[u+w,v,z+h]],c[1])+
      polygon([[u,v+d,z],[u+w,v+d,z],[u+w,v+d,z+h],[u,v+d,z+h]],c[2])+plane(u,v,z+h,w,d,c[0]);
  }
  function screenOnV(u,v,z,w,h,fill){return polygon([[u,v,z],[u+w,v,z],[u+w,v,z+h],[u,v,z+h]],fill);}
  function screenOnU(u,v,z,d,h,fill){return polygon([[u,v,z],[u,v+d,z],[u,v+d,z+h],[u,v,z+h]],fill);}
  function legs(u,v,w,d,h,p){return box(u+3,v+3,0,6,6,h,p)+box(u+w-9,v+3,0,6,6,h,p)+box(u+3,v+d-9,0,6,6,h,p)+box(u+w-9,v+d-9,0,6,6,h,p);}
  function layout(selection){
    const items={};
    Object.keys(variants).forEach(function(key){
      const style=selection&&selection[key]==="02"?1:0;
      const sizeChoice=selection&&selection[key+"Size"]||selection&&selection[key];
      const size=sizeChoice==="02"?1:0;
      items[key]=Object.assign({variant:style,sizeVariant:size},variants[key][size]);
    });
    const requestedBedTier=selection&&Number(selection.bedTier);
    if(Number.isInteger(requestedBedTier)&&requestedBedTier>=1&&requestedBedTier<=5){
      items.bed.tier=requestedBedTier-1;
      items.bed.w=variants.bed[0].w;
      items.bed.d=variants.bed[0].d;
      items.bed.sizeVariant=0;
      items.bed.h=bedTierHeights[requestedBedTier-1];
    }
    ["desk","chair","rug","tv-bench"].forEach(function(key){items[key]=tierItem(key,selection&&selection[key]);});
    Object.assign(items.bed,{u:32,v:0});
    Object.assign(items.desk,{u:410-items.desk.w,v:0});
    Object.assign(items.chair,{u:items.desk.u+items.desk.w/2-items.chair.w/2,v:items.desk.d+35-items.chair.d/2});
    Object.assign(items.rug,{u:250-items.rug.w/2,v:250-items.rug.d/2});
    Object.assign(items.sofa,{u:305-items.sofa.w,v:250-items.sofa.d/2});
    Object.assign(items["tv-bench"],{u:0,v:275-items["tv-bench"].d/2});
    items.tv=tierItem("tv",selection&&selection.tv);
    items.tv.u=items["tv-bench"].u+items["tv-bench"].w/2-items.tv.w/2;
    items.tv.v=items["tv-bench"].v+(items["tv-bench"].d-items.tv.d)/2;
    items.tv.z=items["tv-bench"].h;
    items.pc=tierItem("pc",selection&&selection.pc);
    items.pc.u=items.desk.u+items.desk.w-items.pc.w-7;
    items.pc.v=items.desk.v+7;
    items.pc.z=items.desk.h;
    const floorKind=selection&&selection.floorItem||"plant";
    if(["hifi","plant","nightstand"].indexOf(floorKind)>=0){
      const a=tierItem(floorKind,selection&&selection.floorVariant);
      a.kind=floorKind;
      if(floorKind==="nightstand"){a.u=items.bed.u+items.bed.w+4;a.v=14;}
      else if(floorKind==="hifi"){a.u=items.bed.u+items.bed.w+40;a.v=0;}
      else{a.u=items.bed.u+items.bed.w+22;a.v=125;}
      items.floorItem=a;
    }
    const decorKind=selection&&selection.decorKind;
    if(decorKind&&catalog.families[decorKind]){
      items.decor=tierItem(decorKind,selection&&selection.decorTier);
      items.decor.kind=decorKind;
      items.decor.mount=catalog.families[decorKind].mount||"desk";
      if(items.decor.mount==="wall"){items.decor.u=260;items.decor.v=0;items.decor.z=175;}
      else{items.decor.u=items.desk.u+5;items.decor.v=items.desk.v+items.desk.d-items.decor.d-4;items.decor.z=items.desk.h;}
    }
    return items;
  }
  function wallLayout(selection,items){
    const result=[];
    const left=selection&&selection.leftWall||"both",right=items.decor&&items.decor.mount==="wall"?"none":(selection&&selection.rightWall||"both");
    const pictureStyle=selection&&selection.pictureStyle==="02"?1:0,shelfStyle=selection&&selection.shelfStyle==="02"?1:0;
    if(left==="picture"||left==="both")result.push({id:"left-picture",kind:"picture",style:pictureStyle,wall:"left",u:0,v:215,z:158,w:3,d:55,h:57});
    if(left==="shelf"||left==="both")result.push({id:"left-shelf",kind:"shelf",style:shelfStyle,wall:"left",u:0,v:270,z:130,w:22,d:80,h:4});
    if(right==="picture"||right==="both")result.push({id:"right-picture",kind:"picture",style:pictureStyle,wall:"right",u:185,v:0,z:140,w:60,d:3,h:60});
    if(right==="shelf"||right==="both")result.push({id:"right-shelf",kind:"shelf",style:shelfStyle,wall:"right",u:items.desk.u+items.desk.w/2-50,v:0,z:145,w:100,d:22,h:4});
    return result;
  }
  function wallPicture(a){
    function surface(start,end,low,high,fill){
      return a.wall==="left"?polygon([[a.u+a.w+0.1,start,low],[a.u+a.w+0.1,end,low],[a.u+a.w+0.1,end,high],[a.u+a.w+0.1,start,high]],fill):
        polygon([[start,a.v+a.d+0.1,low],[end,a.v+a.d+0.1,low],[end,a.v+a.d+0.1,high],[start,a.v+a.d+0.1,high]],fill);
    }
    const start=(a.wall==="left"?a.v:a.u)+4,end=start+(a.wall==="left"?a.d:a.w)-8;
    const coordinate=a.wall==="left"?a.u+a.w+0.2:a.v+a.d+0.2;
    const poster=(s,z,w,h,fill)=>surface(s,s+w,z,z+h,fill);
    let out=box(a.u,a.v,a.z,a.w,a.d,a.h,a.style?"plum":"wood")+surface(start,end,a.z+4,a.z+a.h-4,a.style?"#263b55":"#c5dde8");
    if(a.style===0){
      out+=poster(start+8,a.z+12,9,9,"#e7bd59")+poster(start+7,a.z+5,11,7,"#e7bd59");
      out+=poster(start+4,a.z+4,14,9,"#d6e6ec")+poster(start+4,a.z+4,14,5,"#e7bd59");
      out+=poster(start+5,a.z+4,14,18,"#87a6a0")+poster(start+5,a.z+4,11,13,"#668a79");
      out+=poster(start+4,a.z+4,17,9,"#adc499");
      out+=poster(start+5,a.z+4,11,8,"#74876d");
    }else{
      out+=poster(start+7,a.z+8,5,5,"#fff0bf")+poster(start+22,a.z+16,3,3,"#fff0bf");
      out+=poster(start+39,a.z+12,4,4,"#fff0bf")+poster(start+8,a.z+4,8,7,"#526b85");
      [[8,5,8,18,"#9b83af"],[20,5,10,26,"#668899"],[34,5,9,20,"#c98f79"]].forEach(function(r){out+=poster(start+r[0],a.z+r[1],r[2],r[3],r[4]);});
      [[10,6],[23,8],[36,5]].forEach(function(p){out+=poster(start+p[0],a.z+9,3,4,"#e7bd59");});
    }
    return out;
  }
  function wallShelf(a){
    let out=box(a.u,a.v,a.z,a.w,a.d,a.h,a.style?"plum":"wood");
    const top=a.z+a.h;
    if(a.wall==="left"){
      const metal=a.style?"metal":"wood";
      out=box(a.u,a.v+8,a.z-16,4,5,16,metal)+box(a.u,a.v+a.d-13,a.z-16,4,5,16,metal)+out;
      if(a.style===0){["plum","coral","teal"].forEach(function(p,i){out+=box(a.u+4,a.v+10+i*8,top,13,6,24+i*3,p);});out+=box(a.u+5,a.v+a.d-24,top,12,14,12,"cream");}
      else{["teal","cream","coral"].forEach(function(p,i){out+=box(a.u+4,a.v+12+i*9,top,14,7,18+i*4,p);});out+=box(a.u+5,a.v+a.d-25,top,13,15,18,"sage")+box(a.u+5,a.v+a.d-25,top+18,13,15,2,"cream");}
    }else{
      const metal=a.style?"metal":"wood";
      out=box(a.u+8,a.v,a.z-16,5,4,16,metal)+box(a.u+a.w-13,a.v,a.z-16,5,4,16,metal)+out;
      if(a.style===0){["teal","plum","coral"].forEach(function(p,i){out+=box(a.u+10+i*8,a.v+4,top,6,13,25+i*2,p);});out+=box(a.u+a.w-28,a.v+4,top,20,14,10,"sage");}
      else{["cream","coral","teal"].forEach(function(p,i){out+=box(a.u+10+i*8,a.v+4,top,6,13,22+i*3,p);});out+=box(a.u+a.w-29,a.v+4,top,21,14,15,"plum")+box(a.u+a.w-24,a.v+6,top+15,4,2,2,"cream");}
    }
    return out;
  }
  function floorObject(a){
    if(Number.isInteger(a.tier))return tieredFurniture(a,a.kind);
    if(a.kind==="nightstand"){
      let out=legs(a.u,a.v,a.w,a.d,8,a.variant?"metal":"wood")+box(a.u,a.v,8,a.w,a.d,a.h-11,a.variant?"teal":"wood")+box(a.u,a.v,a.h-3,a.w,a.d,3,a.variant?"cream":"wood");
      if(a.variant===0){out+=box(a.u+5,a.v+a.d,22,a.w-10,0.4,23,"plum")+box(a.u+a.w/2-3,a.v+a.d+0.5,32,6,1,3,"metal");}
      else{out+=box(a.u+5,a.v+a.d,14,a.w-10,0.5,21,"cream")+box(a.u+5,a.v+8,18,a.w-10,a.d-16,2,"wood")+box(a.u+a.w/2-2,a.v+a.d+0.6,23,4,1,3,"metal");}
      return out;
    }
    if(a.kind==="speaker"){
      let out=box(a.u,a.v,0,a.w,a.d,a.h,a.variant?"wood":"metal");
      if(a.variant===0){
        [25,64].forEach(function(z,index){const radius=index?7:10,points=[];
          for(let i=0;i<24;i++){const angle=i*Math.PI/12;points.push([a.u+a.w/2+Math.cos(angle)*radius,a.v+a.d+0.1,z+Math.sin(angle)*radius]);}
          out+=polygon(points,"#c5d1d5")+polygon(points.map(function(p){return [a.u+a.w/2+(p[0]-a.u-a.w/2)*0.55,p[1]+0.1,z+(p[2]-z)*0.55];}),"#526b70");
        });
      }else{
        out+=screenOnV(a.u+4,a.v+a.d+0.15,12,a.w-8,a.h-20,"#45606a");
        [0,1,2,3].forEach(function(i){out+=screenOnV(a.u+7+i*4,a.v+a.d+0.25,18,a.w>20?2:1,a.h-32,"#a9c2c2");});
        out+=box(a.u+a.w/2-4,a.v+a.d+0.3,a.h-9,8,0.7,3,"coral");
      }
      return out;
    }
    const u=a.u+a.w/2,v=a.v+a.d/2;
    const pot=a.variant?"teal":"coral",leaf1=a.variant?"#789a6e":"#91b77e",leaf2=a.variant?"#b4cf9a":"#c6d79c";
    let out=box(a.u+6,a.v+6,0,a.w-12,a.d-12,a.variant?24:28,pot)+box(u-1,v-1,a.variant?24:28,2,2,a.h-(a.variant?26:30),"wood");
    if(a.variant===0){[[52,1],[72,-1],[92,1]].forEach(function(pair){const z=pair[0],sign=pair[1];
      out+=polygon([[u,v,z-10],[u+sign*18,v,z+2],[u+sign*13,v,z+16],[u,v,z+5]],leaf1);
      out+=polygon([[u,v,z-6],[u,v-sign*18,z+3],[u,v-sign*12,z+16],[u,v,z+8]],leaf2);
    });}
    else{
      [[47,-1,1],[60,1,-1],[75,-1,-1],[89,1,1],[89,-1,1]].forEach(function(p){
        const z=p[0],su=p[1],sv=p[2];
        out+=polygon([[u,v,z-13],[u+su*6,v+sv*5,z-2],[u+su*19,v+sv*8,z+12],[u+su*13,v+sv*15,z+16],[u+su*4,v+sv*10,z+7]],p[0]%2?leaf1:leaf2);
      });
    }
    return out;
  }
  function tieredFurniture(a,family){
    const u=a.u,v=a.v,z=a.z||0,w=a.w,d=a.d,h=a.h,t=a.tier,wood=["wood","wood","sage","teal","plum"][t],soft=["cream","sage","coral","teal","plum"][t];
    if(family==="tv-bench"){
      if(t===0){let out=box(u,v,z,w,d,h,"cream")+screenOnU(u+w+0.2,v+5,z+5,d-10,h-10,"#c7b38f");
        out+=screenOnU(u+w+0.4,v+13,z+h-8,d-26,2,"#e1d4b9")+screenOnU(u+w+0.4,v+d/2-1,z+3,3,2,"#8d765b");return out;}
      let legH=[0,7,8,9,10][t],out=legs(u,v,w,d,legH,t===4?"metal":"wood")+box(u,v,z+legH,w,d,h-legH-3,wood)+box(u,v,z+h-3,w,d,3,t>=3?"cream":"wood");
      const faceU=u+w+0.25;
      if(t===1){out+=screenOnU(faceU,v+7,z+legH+7,d-14,h-legH-16,"#a78cb3");out+=screenOnU(faceU+0.1,v+d/2-1,z+legH+10,3,2,"#e7bd59");}
      else if(t===2){out+=screenOnU(faceU,v+5,z+legH+5,d-10,h-legH-11,"#e7d4b3");out+=screenOnU(faceU+0.1,v+d/2-1,z+legH+6,3,2,"#8d9398");}
      else{out+=screenOnU(faceU,v+4,z+legH+5,d-8,h-legH-10,t===4?"#263b37":"#dac3a4");
        [0,1].forEach(function(i){out+=screenOnU(faceU+0.1,v+9+i*(d-20)/2,z+legH+9,d/2-10,h-legH-18,i===0?"#f3ead9":"#b7c5b2");
          out+=screenOnU(faceU+0.2,v+14+i*(d-20)/2,z+legH+15,d/2-20,2,t===4?"#79cbb2":"#8b7869");});}
      if(t===4){out+=screenOnU(faceU+0.5,v+3,z+5,d-6,3,"#7fe0ae")+screenOnU(faceU+0.6,v+3,z+8,d-6,1,"#d98be8");
        for(let i=0;i<8;i++)out+=screenOnU(faceU+0.5,v+5+i*17,z+h-5,4,1,["#df79d3","#75d9d0","#e7bd59"][i%3]);}
      return out;
    }
    if(family==="tv"){
      let out=box(u+w*.16,v+d*.18,z,w*.68,d*.64,5,"metal")+box(u+w*.15,v+d*.13,z+5,w*.7,d*.74,h-5,t===4?"metal":"wood");
      out+=screenOnU(u+w*.85,v+d*.07,z+8,d*.86,h-11,t===0?"#6a7070":(t===4?"#172126":"#273b42"));
      out+=screenOnU(u+w*.88,v+d*.11,z+11,d*.78,h-17,t===0?"#b8c4ba":"#526e77");
      if(t>=2){out+=screenOnU(u+w*.9,v+d*.17,z+h*.42,d*.16,Math.max(2,h*.08),"#e7bd59")+screenOnU(u+w*.9,v+d*.4,z+h*.62,d*.38,Math.max(2,h*.06),"#8ab2ae");}
      if(t===4){out+=screenOnU(u+w*.92,v+d*.08,z+7,d*.82,1,"#77dfb5")+screenOnU(u+w*.92,v+d*.08,z+9,d*.82,1,"#d683e1");}
      out+=box(u+w*.34,v+d*.48,z-4,w*.32,d*.07,4,"metal");return out;
    }
    if(family==="desk"){
      let out=legs(u,v,w,d,h-3,t===4?"metal":"wood")+box(u,v,z+h-7,w,d,7,t>=3?"plum":wood);
      out+=box(u+8,v+5,z+h-28,w*.26,d*.34,19,t>=3?"metal":"wood");
      out+=screenOnU(u+w*.26,v+7,z+h-27,d*.32,2,"#8d9398")+box(u+w*.26,v+7,z+h-25,d*.32,2,2,"metal");
      if(t>=2)out+=box(u+13,v+d-13,z+h-10,w*.18,5,2,"cream");
      const mx=u+w*.53-21,mv=v+7;
      out+=box(mx+16,mv+4,z+h,10,2,7,"metal")+box(mx+12,mv+3,z+h+7,18,4,2,"metal")+
        box(mx,mv,z+h+9,42,3,29,t>=3?"metal":"wood")+screenOnV(mx+3,mv+3.1,z+h+12,36,22,t===4?"#172b32":"#293c42")+
        screenOnV(mx+6,mv+3.2,z+h+14,8,7,t>=3?"#8fc7b2":"#a7bd9f")+screenOnV(mx+16,mv+3.2,z+h+20,17,3,"#e7bd59")+
        box(mx+8,v+d-24,z+h,27,13,2,"metal");
      for(let i=0;i<7;i++)out+=box(mx+10+i*3,v+d-22,z+h+2,1,1,.5,"cream");
      return out;
    }
    if(family==="pc"){
      let out=box(u,v,z,w,d,h,t===0?"metal":(t<3?"wood":"metal"))+screenOnU(u+w+.15,v+4,z+5,d-8,h-10,t<2?"#333b3b":"#263a42");
      if(t>=2){out+=screenOnU(u+w+.25,v+6,z+7,d-12,h-14,t===4?"#263640":"#42585c");
        [0,1,2].forEach(i=>out+=screenOnU(u+w+.4,v+8,z+10+i*10,d-16,2,t===4?["#cf6bd5","#64d9cd","#e7bd59"][i]:"#6f8b86"));}
      if(t===4){out+=screenOnU(u+w+.45,v+4,z+3,d-8,2,"#72dfb3")+box(u+w*.4,v+d*.75,z+9,w*.28,1,1,"coral");}
      else out+=screenOnU(u+w+.3,v+d*.7,z+8,3,2,"#e7bd59");
      return out;
    }
    if(family==="chair"){
      const seatZ=h*.46,backH=h-seatZ;
      let out=box(u+w*.46,v+d*.42,0,w*.08,d*.08,seatZ-2,"metal");
      [[4,4],[w-10,4],[4,d-10],[w-10,d-10],[w*.45,d*.44]].forEach(p=>out+=box(u+p[0],v+p[1],2,5,5,3,"metal"));
      if(t===0)out+=box(u+3,v+d-10,seatZ-6,w-6,7,7,"wood")+box(u+5,v+d-7,seatZ+1,w-10,5,backH-3,"wood");
      else if(t===1)out+=box(u+3,v+3,seatZ,w-6,d-6,5,"wood")+box(u+4,v+d-8,seatZ+5,w-8,6,backH-5,"wood");
      else{out+=box(u+4,v+4,seatZ,w-8,d-8,7,soft)+box(u+5,v+d-10,seatZ+7,w-10,8,backH-7,t>=3?"plum":"teal");
        out+=box(u+7,v+d-2,seatZ+12,w-14,2,backH-14,t===4?"coral":"cream");
        if(t>=2){out+=box(u,v+13,seatZ-2,4,d-22,5,"metal")+box(u+w-4,v+13,seatZ-2,4,d-22,5,"metal");}
        if(t===4){out+=box(u+8,v+d-5,seatZ+15,w-16,3,3,"coral")+box(u+w*.34,v+d-1,h-8,w*.32,1,2,"cream");}}
      return out;
    }
    if(family==="rug"){
      const edge=["#8e8069","#9b806c","#748b84","#765c8d","#304b55"][t],field=["#c7b497","#c4b5a0","#c6d3c1","#b7a6ca","#bec8c1"][t],light=["#a89577","#d3c5b2","#eee2cf","#ede0cf","#e9d8bb"][t];
      let out=plane(u,v,.5,w,d,edge)+plane(u+5,v+5,.6,w-10,d-10,field)+plane(u+12,v+12,.7,w-24,d-24,light);
      const step=t>2?18:28;for(let x=u+18;x<u+w-18;x+=step)for(let y=v+18;y<v+d-18;y+=step){if(((Math.floor(x/step)+Math.floor(y/step)+t)%2)===0)out+=plane(x,y,.8,step*.42,step*.42,edge);}
      out+=plane(u+w/2-22,v+d/2-22,.9,44,44,field);return out;
    }
    if(family==="hifi"){
      let out=box(u,v,0,w,d,h,t===4?"metal":wood)+screenOnV(u+4,v+d+.15,8,w-8,h-16,"#34494d");
      const count=t<2?1:2;
      for(let i=0;i<count;i++){const x=u+w*(i+1)/(count+1),radius=Math.min(w,d)*.2;
        out+=screenOnV(x-radius,v+d+.25,Math.max(10,h*.28),radius*2,Math.max(8,h*.22),"#a9b2a5")+
          screenOnV(x-radius*.6,v+d+.4,Math.max(11,h*.31),radius*1.2,Math.max(5,h*.12),"#53686a");}
      if(t>=2)out+=box(u+w*.32,v+d+0.4,h*.72,w*.36,1,2,"cream");
      if(t===4)out+=screenOnV(u+4,v+d+.35,h-10,w-8,2,"#78dfbe");return out;
    }
    if(family==="plant"){
      const cx=u+w/2,cy=v+d/2,pot=t>=3?"teal":"coral";
      let out=box(u+5,v+5,0,w-10,d-10,h*.22,pot)+box(cx-1,cy-1,h*.2,2,2,h*.37,"wood");
      const leaves=t===0?3:(t===1?5:(t===2?7:(t===3?9:12)));
      for(let i=0;i<leaves;i++){const angle=i*Math.PI*2/leaves,reach=w*.36,z0=h*.38+(i%3)*h*.08;
        const dx=Math.cos(angle)*reach,dy=Math.sin(angle)*d*.34;
        out+=polygon([[cx,cy,z0-10],[cx+dx*.35,cy+dy*.35,z0-1],[cx+dx,cy+dy,z0+7],[cx+dx*.74,cy+dy*.95,z0+14],[cx+dx*.2,cy+dy*.3,z0+5]],["#7e946c","#7c9f70","#72916a","#648868","#5e7f65"][i%5]);}
      return out;
    }
    if(family==="nightstand"){
      const leg=[0,5,7,8,9][t];let out=legs(u,v,w,d,leg,t===4?"metal":"wood")+box(u,v,z+leg,w,d,h-leg-3,wood)+box(u,v,z+h-3,w,d,3,t>=3?"cream":"wood");
      out+=screenOnU(u+w+.15,v+5,z+leg+7,d-10,h-leg-15,t<2?"#9c7b61":"#c5d6cf");
      if(t>=2)out+=screenOnU(u+w+.2,v+d*.25,z+leg+9,d*.5,h*.25,soft);
      if(t===4)out+=screenOnU(u+w+.3,v+4,z+5,d-8,2,"#77d8b2");return out;
    }
    return box(u,v,z,w,d,h,wood);
  }
  function decorObject(a){
    const t=a.tier,w=a.w,d=a.d,h=a.h,wood=["wood","wood","sage","teal","plum"][t],soft=["cream","sage","coral","teal","plum"][t];
    if(a.mount==="wall"){
      const outBase=box(a.u,a.v,a.z,w,d,h,t===4?"metal":"wood"),surface=screenOnV(a.u+3,a.v+d+.15,a.z+3,w-6,h-6,t===0?"#d9cebd":"#c8d6d0");
      let out=outBase+surface;
      if(a.kind==="mirror")out+=screenOnV(a.u+w*.18,a.v+d+.3,a.z+h*.18,w*.64,h*.64,t>=3?"#9ab8ba":"#cad9d6");
      else if(a.kind==="pinboard")for(let i=0;i<7;i++)out+=screenOnV(a.u+w*.12+i*w*.105,a.v+d+.4,a.z+h*(.25+(i%3)*.13),w*.08,3,["#d77e66","#edbd59","#789981"][i%3]);
      else if(a.kind==="neon-sign"){out+=screenOnV(a.u+w*.18,a.v+d+.4,a.z+h*.4,w*.64,3,"#e7bd59")+screenOnV(a.u+w*.25,a.v+d+.5,a.z+h*.62,w*.46,2,t>=3?"#cc79d5":"#78adb4");}
      else{out+=screenOnV(a.u+w*.14,a.v+d+.4,a.z+h*.15,w*.72,3,"#e7bd59")+screenOnV(a.u+w*.2,a.v+d+.5,a.z+h*.38,w*.6,3,t>=3?"#6c9c87":"#9c7eac");}
      return out;
    }
    if(a.kind==="desk-lamp"){
      const base=box(a.u+w*.25,a.v+d*.68,a.z,w*.5,d*.3,3,t>=3?"metal":"wood"),stem=box(a.u+w*.47,a.v+d*.76,a.z+3,2,2,h*.55,"metal");
      return base+stem+polygon([[a.u+w*.18,a.v+d*.58,a.z+h*.62],[a.u+w*.84,a.v+d*.56,a.z+h*.9],[a.u+w*.78,a.v+d*.92,a.z+h*.92],[a.u+w*.2,a.v+d*.91,a.z+h*.73]],t===4?"#e7bd59":"#c9b27e");
    }
    if(a.kind==="alarm-clock")return box(a.u,a.v,a.z,w,d,h,wood)+screenOnV(a.u+3,a.v+d+.1,a.z+h*.22,w-6,2,t>=3?"#9de1ca":"#8ea49a");
    if(a.kind==="books"){
      let out="";for(let i=0;i<4;i++)out+=box(a.u+i*(w/4),a.v+i%2*2,a.z,w*.22,d*.9,h*(.75+i%3*.07),["plum","coral","teal","sage"][i]);
      return out;
    }
    if(a.kind==="collectibles"){
      const out=box(a.u+w*.12,a.v+d*.2,a.z,w*.76,d*.68,3,"wood");
      return out+box(a.u+w*.27,a.v+d*.32,a.z+3,w*.24,d*.35,h-3,t>=3?"plum":"coral")+box(a.u+w*.54,a.v+d*.28,a.z+3,w*.22,d*.38,h*.72,t>=4?"teal":"sage");
    }
    if(a.kind==="makeup-set"){
      const caseTone=["coral","plum","wood","teal","plum"][t],baseH=h*.4;
      let out=box(a.u,a.v,a.z,w,d,baseH,caseTone)+screenOnV(a.u+w*.08,a.v+d+.15,a.z+baseH*.25,w*.84,2,t<2?"#947a66":"#c5a87f");
      if(t===0)return out+box(a.u+w*.18,a.v+d*.25,a.z+baseH,w*.64,2,2,"cream");
      out+=box(a.u+w*.08,a.v+d*.72,a.z+baseH,w*.84,d*.1,2,"metal")+
        box(a.u+w*.08,a.v+d*.78,a.z+baseH,w*.84,2,h-baseH,"wood")+
        screenOnV(a.u+w*.14,a.v+d*.79+.15,a.z+baseH+3,w*.72,2,h-baseH-6,t>=3?"#91b8b2":"#b4cfca");
      for(let i=0;i<4;i++)out+=box(a.u+w*(.16+i*.18),a.v+d*.12,a.z+baseH*.42,w*.12,d*.42,2,["coral","cream","plum","teal"][i]);
      if(t>=3)for(let i=0;i<5;i++)out+=box(a.u+w*(.18+i*.14),a.v+d*.83,a.z+h-5,2,1,2,"cream");
      return out;
    }
    if(a.kind==="plush"){
      const head=box(a.u+w*.25,a.v+d*.18,a.z+h*.42,w*.5,d*.56,h*.5,"cream"),body=box(a.u+w*.19,a.v+d*.31,a.z+h*.1,w*.62,d*.56,h*.42,t>=3?"coral":"sage");
      return body+head+box(a.u+w*.18,a.v+d*.15,a.z+h*.78,w*.22,d*.24,h*.2,"cream")+box(a.u+w*.59,a.v+d*.15,a.z+h*.78,w*.22,d*.24,h*.2,"cream");
    }
    return box(a.u,a.v,a.z,w,d,h,soft);
  }
  function bed(a){
    if(Number.isInteger(a.tier))return tieredBed(a);
    const quilt=a.variant?"coral":"sage",frame=a.variant?"plum":"wood";
    let out=legs(a.u,a.v,a.w,a.d,a.variant?14:28,frame)+box(a.u,a.v,0,a.w,7,95,frame)+
      box(a.u,a.v,28,a.w,a.d,10,a.variant?"plum":"wood")+box(a.u+3,a.v+7,38,a.w-6,a.d-10,15,"cream")+
      box(a.u+4,a.v+58,53,a.w-8,a.d-65,5,quilt)+box(a.u+15,a.v+15,53,a.w-30,35,9,a.variant?"teal":"plum")+
      box(a.u,a.v+a.d-6,0,a.w,6,59,frame);
    if(a.variant===0){
      out+=box(a.u+8,a.v+9,39,5,2,13,"wood")+box(a.u+a.w-13,a.v+9,39,5,2,13,"wood");
      [0,1,2,3,4].forEach(function(i){out+=box(a.u+8+i*6,a.v+57,59,a.w-16-i*12,1,1,"cream");});
      out+=box(a.u+18,a.v+23,62,3,2,2,"coral")+box(a.u+a.w-22,a.v+23,62,3,2,2,"coral");
    }else{
      [0,1,2,3,4].forEach(function(i){out+=box(a.u+10+i*8,a.v+1,70,3,1,3,"cream");});
      out+=box(a.u+3,a.v+45,45,a.w-6,6,9,"plum")+box(a.u+3,a.v+42,53,a.w-6,4,3,"coral");
      out+=box(a.u+7,a.v+65,58,a.w-14,2,2,"cream");
    }
    return out;
  }
  function tieredBed(a){
    const u=a.u,v=a.v,w=a.w,d=a.d,t=a.tier;
    if(t===0){
      // A cheap, handmade frame: mismatched reclaimed boards and an old mattress.
      let out=box(u+4,v+13,0,9,9,25,"wood")+box(u+w-13,v+18,0,9,8,32,"wood")+
        box(u+5,v+d-28,0,8,10,20,"wood")+box(u+w-14,v+d-24,0,9,8,24,"wood")+
        box(u+5,v+13,24,w-10,d-34,8,"wood")+box(u+3,v+5,31,w-6,10,47,"wood")+
        box(u+4,v+d-12,20,w-8,9,18,"wood")+box(u+9,v+22,32,w-18,d-36,14,"cream")+
        box(u+11,v+26,46,w-22,d-47,6,"sage")+
        box(u+15,v+25,50,28,27,5,"cream")+box(u+17,v+27,54,23,20,2,"plum");
      // Crooked, mismatched braces and patched bedding remain within the measured footprint.
      out+=polygon([[u+3,v+20,21],[u+9,v+20,24],[u+10,v+d-20,31],[u+4,v+d-20,28]],"#8d6b4d")+
        box(u+13,v+55,48,w-26,2,1,"coral")+box(u+29,v+103,47,17,20,2,"plum")+
        box(u+51,v+155,47,20,3,1,"cream");
      return out;
    }
    if(t===1){
      let out=legs(u+2,v+2,w-4,d-4,28,"wood")+box(u,v+9,23,w,10,48,"wood")+
        box(u,v+d-14,20,w,10,23,"wood")+box(u+7,v+16,24,w-14,d-30,8,"wood")+
        box(u+6,v+20,32,w-12,d-33,16,"cream")+box(u+8,v+24,48,w-16,d-43,6,"sage")+
        box(u+18,v+22,54,w-36,31,6,"cream");
      out+=box(u+15,v+d-9,30,3,2,2,"metal")+box(u+25,v+75,53,20,2,1,"coral");
      return out;
    }
    if(t===2){
      let out=legs(u+2,v+2,w-4,d-4,31,"wood")+box(u,v+7,25,w,8,55,"wood")+
        box(u,v+d-14,23,w,9,27,"wood")+box(u+5,v+13,28,w-10,d-27,10,"wood")+
        box(u+5,v+17,38,w-10,d-34,18,"cream")+box(u+8,v+22,56,w-16,d-45,7,"sage")+
        box(u+16,v+20,63,w-32,33,7,"plum")+box(u+20,v+22,68,w-40,27,2,"cream");
      [0,1,2,3].forEach(function(i){out+=box(u+10+i*18,v+7,38,2,1,34,"cream");});
      return out;
    }
    if(t===3){
      let out=legs(u+4,v+4,w-8,d-8,18,"wood")+box(u,v+7,18,w,10,60,"plum")+
        box(u+4,v+3,18,w-8,d-6,13,"wood")+box(u+w-5,v+36,21,5,43,17,"wood")+
        box(u+w-5,v+99,21,5,43,17,"wood")+box(u+7,v+15,31,w-14,d-24,24,"cream")+
        box(u+9,v+19,55,w-18,d-34,8,"coral")+box(u+17,v+16,63,w-34,38,8,"teal")+
        box(u+w+0.1,v+55,28,0.5,7,3,"metal")+box(u+w+0.1,v+118,28,0.5,7,3,"metal");
      return out;
    }
    // Top tier: a premium adjustable bed with visible lift columns and a padded headboard.
    let out=legs(u+4,v+5,w-8,d-10,12,"metal")+box(u+5,v+8,12,w-10,d-16,8,"metal")+
      box(u+9,v+20,20,7,8,26,"metal")+box(u+w-16,v+20,20,7,8,26,"metal")+
      box(u+9,v+d-28,20,7,8,26,"metal")+box(u+w-16,v+d-28,20,7,8,26,"metal")+
      box(u+2,v+5,38,w-4,12,64,"plum")+box(u+7,v+14,31,w-14,d-24,24,"cream")+
      box(u+10,v+19,55,w-20,d-35,12,"teal")+box(u+12,v+17,67,w-24,36,10,"cream")+
      box(u+14,v+19,76,w-28,30,4,"coral");
    [[u+9,v+20],[u+w-16,v+20],[u+9,v+d-28],[u+w-16,v+d-28]].forEach(function(p){out+=box(p[0],p[1],20,7,8,28,"metal");});
    out+=box(u+w-12,v+79,33,7,15,2,"metal")+box(u+w-11,v+80,35,5,12,1,"teal");
    return out;
  }
  function desk(a){
    if(Number.isInteger(a.tier))return tieredFurniture(a,"desk");
    const finish=a.variant?"metal":"wood";
    let out=legs(a.u,a.v,a.w,a.d,72,finish)+box(a.u+a.w-35,a.v+4,52,28,a.d-8,17,a.variant?"metal":"wood")+box(a.u,a.v,72,a.w,a.d,3,a.variant?"plum":"wood");
    // The computer is a desk accessory: its feet, screen and keyboard follow the desk surface.
    const cx=a.u+a.w/2-21,back=a.v+7;
    out+=box(cx+16,back+4,75,10,2,7,"metal")+box(cx+12,back+3,82,18,4,2,"metal")+
      box(cx,back,84,42,3,29,a.variant?"metal":"wood")+screenOnV(cx+3,back+3.1,87,36,22,"#243b45")+
      screenOnV(cx+6,back+3.2,89,8,7,a.variant?"#d58b79":"#93b7a4")+
      screenOnV(cx+16,back+3.2,96,17,3,a.variant?"#e7bd59":"#d9e6d1")+
      box(cx+8,a.v+a.d-24,75,27,13,2,"metal");
    [0,1,2,3,4,5,6].forEach(function(i){out+=box(cx+10+i*3,a.v+a.d-22,77,1,1,0.5,"cream");});
    if(a.variant===1){
      out+=box(a.u+9,a.v+8,75,24,18,22,"metal")+box(a.u+12,a.v+11,78,18,12,3,"teal");
      out+=box(a.u+15,a.v+12,81,5,1,1,"coral")+box(a.u+22,a.v+12,81,5,1,1,"plum");
    }else{out+=box(a.u+10,a.v+10,75,18,15,18,"cream")+box(a.u+13,a.v+13,93,12,2,1,"plum");}
    return out;
  }
  function chair(a){
    if(Number.isInteger(a.tier))return tieredFurniture(a,"chair");
    if(a.variant===0){
      let out=legs(a.u,a.v,a.w,a.d,42,"wood")+box(a.u,a.v,42,a.w,a.d,5,"sage")+box(a.u,a.v+a.d-6,47,a.w,6,a.h-47,"wood");
      [0,1,2].forEach(function(i){out+=box(a.u+6+i*(a.w-12)/3,a.v+a.d-7,55,3,1,a.h-58,"cream");});
      out+=box(a.u+5,a.v+a.d-1,a.h-12,a.w-10,1,4,"wood");
      return out;
    }
    let out=box(a.u+a.w/2-2,a.v+a.d/2-2,0,4,4,43,"metal");
    [[4,4],[a.w-10,4],[4,a.d-10],[a.w-10,a.d-10],[a.w/2-3,a.d/2-3]].forEach(function(p){out+=box(a.u+p[0],a.v+p[1],3,6,6,4,"metal");});
    out+=box(a.u+4,a.v+4,43,a.w-8,a.d-8,6,"teal")+box(a.u+5,a.v+a.d-10,49,a.w-10,7,a.h-49,"plum");
    out+=box(a.u+7,a.v+a.d-2,57,a.w-14,1,a.h-67,"coral")+
      box(a.u+1,a.v+13,43,4,a.d-22,4,"metal")+box(a.u+a.w-5,a.v+13,43,4,a.d-22,4,"metal")+
      box(a.u+1,a.v+13,47,4,4,11,"metal")+box(a.u+a.w-5,a.v+13,47,4,4,11,"metal");
    return out;
  }
  function sofa(a){
    const fabric=a.variant?"coral":"sage",cushion=a.variant?"teal":"cream";
    let out=legs(a.u,a.v,a.w,a.d,15,a.variant?"metal":"wood")+box(a.u,a.v,15,a.w,a.d,20,fabric)+
      box(a.u+4,a.v+12,35,a.w-20,(a.d-28)/2,9,cushion)+box(a.u+4,a.v+a.d/2+2,35,a.w-20,(a.d-28)/2,9,cushion)+
      box(a.u,a.v,35,a.w,12,27,fabric)+box(a.u,a.v+a.d-12,35,a.w,12,27,fabric)+box(a.u+a.w-13,a.v,35,13,a.d,45,fabric);
    // Both sofas face the TV (towards -u). Keep the arm tops clear: no block-like back details.
    if(a.variant===1)out+=box(a.u+8,a.v+8,39,a.w-25,3,2,"cream")+box(a.u+8,a.v+a.d-11,39,a.w-25,3,2,"cream");
    return out;
  }
  function bench(a){if(Number.isInteger(a.tier))return tieredFurniture(a,"tv-bench");let out=legs(a.u,a.v,a.w,a.d,8,"wood")+box(a.u,a.v,8,a.w,a.d,a.h-11,a.variant?"sage":"plum")+box(a.u,a.v,a.h-3,a.w,a.d,3,"wood");
    if(a.variant===0){
      out+=screenOnU(a.u+a.w+0.2,a.v+6,15,a.d/2-9,a.h-22,"#a78cb3")+
        screenOnU(a.u+a.w+0.3,a.v+a.d/2+3,15,a.d/2-9,a.h-22,"#d6c2df")+
        screenOnU(a.u+a.w+0.5,a.v+a.d/2-2,26,4,3,"#e7bd59")+
        screenOnU(a.u+a.w+0.5,a.v+23,26,4,3,"#e7bd59");
    }else{
      out+=screenOnU(a.u+a.w+0.2,a.v+4,23,a.d-8,2,"#d6c2df")+
        screenOnU(a.u+a.w+0.2,a.v+4,39,a.d-8,2,"#d6c2df")+
        box(a.u+9,a.v+13,13,a.w-18,13,10,"cream")+
        box(a.u+10,a.v+15,23,a.w-20,9,2,"teal")+
        box(a.u+9,a.v+a.d-28,13,a.w-18,12,10,"coral");
    }
    // TV feet start exactly on the top plane of the chosen bench.
    const tvU=a.u+a.w*0.55,tvV=a.v+a.d/2-40;
    out+=box(tvU,tvV+8,a.h,12,5,5,"metal")+box(tvU,tvV+67,a.h,12,5,5,"metal")+box(tvU,tvV,a.h+5,4,80,53,"metal");
    out+=screenOnU(tvU+4.1,tvV+4,a.h+10,72,43,a.variant?"#263b55":"#b6d8e2");
    if(a.variant===0){out+=screenOnU(tvU+4.2,tvV+12,a.h+15,18,14,"#d5e5dc")+screenOnU(tvU+4.2,tvV+31,a.h+15,43,9,"#86a89b")+screenOnU(tvU+4.2,tvV+15,a.h+42,55,6,"#adc499");}
    else{out+=screenOnU(tvU+4.2,tvV+12,a.h+17,9,9,"#f0cb74")+screenOnU(tvU+4.2,tvV+27,a.h+32,29,4,"#82bac0")+screenOnU(tvU+4.2,tvV+20,a.h+47,45,3,"#c98f79");}
    return out+screenOnU(tvU+4.3,tvV+61,a.h+7,3,2,"#e7bd59");}
  function rug(a){
    if(Number.isInteger(a.tier))return tieredFurniture(a,"rug");
    const edge=a.variant?"#668a96":"#9a7e9f",field=a.variant?"#a5cbd9":"#d3bfdf",light=a.variant?"#f3dfcb":"#bdd1ad";
    let out=plane(a.u,a.v,0.5,a.w,a.d,edge)+plane(a.u+8,a.v+8,0.6,a.w-16,a.d-16,field)+
      plane(a.u+18,a.v+18,0.7,a.w-36,a.d-36,light);
    if(a.variant===0){
      for(let u=a.u+29;u<a.u+a.w-24;u+=24){
        out+=plane(u,a.v+25,0.8,9,9,"#d8b8d0")+plane(u+9,a.v+34,0.8,9,9,"#8ba68a")+
          plane(u+2,a.v+a.d-34,0.8,8,8,"#8ba68a")+plane(u+10,a.v+a.d-42,0.8,8,8,"#d8b8d0");
      }
      out+=plane(a.u+a.w/2-30,a.v+a.d/2-30,0.9,60,60,"#f5e6c8")+
        plane(a.u+a.w/2-16,a.v+a.d/2-16,1,32,32,"#d3bfdf")+
        plane(a.u+a.w/2-5,a.v+a.d/2-5,1.1,10,10,"#e7bd59");
    }else{
      for(let u=a.u+25;u<a.u+a.w-30;u+=28){
        for(let v=a.v+25;v<a.v+a.d-30;v+=28){
          if(((Math.floor((u-a.u)/28)+Math.floor((v-a.v)/28))%2)===0)out+=plane(u,v,0.8,12,12,"#efd0be");
        }
      }
      out+=plane(a.u+a.w/2-35,a.v+a.d/2-35,0.9,70,70,"#f3dfcb")+
        plane(a.u+a.w/2-23,a.v+a.d/2-23,1,46,46,"#a5cbd9")+
        plane(a.u+a.w/2-8,a.v+a.d/2-8,1.1,16,16,"#d58b79");
    }
    return out;
  }
  function windowShape(){function pane(v0,v1,z0,z1,fill){return polygon([[0.3,v0,z0],[0.3,v1,z0],[0.3,v1,z1],[0.3,v0,z1]],fill);}
    return pane(70,190,100,195,"#e4d0ac")+pane(76,184,106,189,"#d8e8eb")+pane(126,132,106,189,"#e4d0ac")+pane(76,184,145,151,"#e4d0ac");}
  function direction(a,du,dv){const u=a.u+a.w/2,v=a.v+a.d/2,p=project(u,v,2),q=project(u+du,v+dv,2);
    return '<line x1="'+p[0]+'" y1="'+p[1]+'" x2="'+q[0]+'" y2="'+q[1]+'" stroke="#774525" stroke-width="2.5" marker-end="url(#direction)"/>';}
  function projectedBounds(markup){
    const xs=[],ys=[];
    Array.from(markup.matchAll(/points="([^"]+)"/g)).forEach(function(match){
      const values=match[1].match(/[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/gi)||[];
      for(let i=0;i+1<values.length;i+=2){xs.push(Number(values[i]));ys.push(Number(values[i+1]));}
    });
    if(!xs.length)throw new Error("Could not measure sprite geometry");
    return {x:Math.min.apply(null,xs),y:Math.min.apply(null,ys),w:Math.max.apply(null,xs)-Math.min.apply(null,xs),h:Math.max.apply(null,ys)-Math.min.apply(null,ys)};
  }
  function sprite(markup,file,assetRoot,className){
    const b=projectedBounds(markup),href=assetRoot.replace(/\/$/,"")+"/"+file;
    const align=className.indexOf("--wall")>=0?"xMidYMid meet":"xMidYMax meet";
    return '<image class="asset-test__sprite '+className+'" href="'+href+'" x="'+b.x.toFixed(2)+'" y="'+b.y.toFixed(2)+'" width="'+b.w.toFixed(2)+'" height="'+b.h.toFixed(2)+'" preserveAspectRatio="'+align+'" image-rendering="pixelated"/>';
  }
  function assetGuide(selection,family){
    selection=Object.assign({},selection||{});
    if(catalog.families[family]&&catalog.families[family].mount)selection.decorKind=family;
    const items=layout(selection),renderers={bed:bed,desk:desk,chair:chair,sofa:sofa,"tv-bench":bench,rug:rug};
    Object.assign(renderers,{tv:function(a){return tieredFurniture(a,"tv");},pc:function(a){return tieredFurniture(a,"pc");},decor:decorObject});
    if(items.floorItem)renderers.floorItem=function(a){return tieredFurniture(a,a.kind);};
    const source=family.indexOf("wall-picture-")===0||family.indexOf("wall-shelf-")===0?
      (function(){
        const wall=family.indexOf("left")>=0?"left":"right",kind=family.indexOf("picture")>=0?"picture":"shelf";
        return wallLayout(selection,items).filter(function(a){return a.wall===wall&&a.kind===kind;}).map(function(a){return kind==="picture"?wallPicture(a):wallShelf(a);}).join("");
      }()):renderers[family]?renderers[family](family==="floorItem"?items.floorItem:items[family]):"";
    if(!source)throw new Error("Unknown or empty asset family: "+family);
    const bounds=projectedBounds(source),pad=1.5,x=bounds.x-pad,y=bounds.y-pad,w=bounds.w+pad*2,h=bounds.h+pad*2;
    const grayscale=source.replace(/fill="(#[0-9a-f]{6})"/gi,function(_,hex){
      const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
      const gray=Math.round(r*0.299+g*0.587+b*0.114),value=gray.toString(16).padStart(2,"0");
      return 'fill="#'+value+value+value+'"';
    });
    return '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="'+Math.ceil(1200*h/w)+'" viewBox="'+x.toFixed(2)+' '+y.toFixed(2)+' '+w.toFixed(2)+' '+h.toFixed(2)+'" shape-rendering="crispEdges">'+grayscale+'</svg>';
  }
  function build(selection,guides,assetRoot){
    assetRoot=assetRoot||"resources-v5/items";
    const items=layout(selection);
    let out='<defs><marker id="direction" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#774525"/></marker></defs><rect width="480" height="360" fill="#f7f3e9"/>';
    out+=polygon([[0,0,0],[0,room.depth,0],[0,room.depth,room.height],[0,0,room.height]],"#dae3d1")+
      polygon([[0,0,0],[room.width,0,0],[room.width,0,room.height],[0,0,room.height]],"#c5d2bc")+plane(0,0,0,room.width,room.depth,"#e7d4b3")+windowShape();
    if(guides){
      for(let u=50;u<room.width;u+=50)out+='<path d="M'+point(u,0,0)+' L'+point(u,room.depth,0)+'" stroke="#a89172" stroke-width="0.5"/>';
      for(let v=50;v<room.depth;v+=50)out+='<path d="M'+point(0,v,0)+' L'+point(room.width,v,0)+'" stroke="#a89172" stroke-width="0.5"/>';
    }
    wallLayout(selection,items).forEach(function(a){
      const source=a.kind==="picture"?wallPicture(a):wallShelf(a),file="wall-"+a.kind+"-"+a.wall+"-0"+(a.style+1)+".png";
      out+='<g data-wall-item="'+a.id+'">'+sprite(source,file,assetRoot,"asset-test__sprite--wall")+'</g>';
    });
    if(items.decor&&items.decor.mount==="wall")out+='<g data-furniture="decor">'+sprite(decorObject(items.decor),items.decor.kind+"-tier-0"+(items.decor.tier+1)+".png",assetRoot,"asset-test__sprite--wall")+'</g>';
    out+='<g data-furniture="rug">'+sprite(rug(items.rug),"rug-tier-0"+(items.rug.tier+1)+".png",assetRoot,"asset-test__sprite--rug")+'</g>';
    const renderers={bed:bed,desk:desk,chair:chair,sofa:sofa,"tv-bench":bench,tv:function(a){return tieredFurniture(a,"tv");},pc:function(a){return tieredFurniture(a,"pc");}};
    if(items.floorItem)renderers.floorItem=function(a){return tieredFurniture(a,a.kind);};
    if(items.decor&&items.decor.mount!=="wall")renderers.decor=decorObject;
    Object.keys(renderers).sort(function(a,b){
      if(a==="decor"&&b==="desk")return 1;
      if(b==="decor"&&a==="desk")return -1;
      const x=items[a],y=items[b];return (x.u+x.w/2+x.v+x.d/2)-(y.u+y.w/2+y.v+y.d/2);
    }).forEach(function(k){
      const a=items[k],family=k==="decor"?a.kind:(k==="floorItem"?a.kind:k),file=k==="bed"&&Number.isInteger(a.tier)?"bed-tier-0"+(a.tier+1)+".png":
        family==="sofa"?"sofa-0"+(a.variant+1)+".png":family+"-tier-0"+(a.tier+1)+".png";
      const cls=k==="decor"&&a.mount==="wall"?"asset-test__sprite--wall":"asset-test__sprite--item";
      out+='<g data-furniture="'+k+'">'+sprite(renderers[k](a),file,assetRoot,cls)+'</g>';
    });
    if(guides){Object.keys(items).filter(function(k){return k!=="rug";}).forEach(function(k){const a=items[k],p=project(a.u+a.w/2,a.v+a.d/2,a.h+14);
      out+=plane(a.u,a.v,0.1,a.w,a.d,"none",'stroke-dasharray="3 3"')+'<text x="'+p[0]+'" y="'+p[1]+'" text-anchor="middle" fill="#000" font-family="Arial,sans-serif" font-size="10" paint-order="stroke" stroke="#fffdf5" stroke-width="4">'+(k==="floorItem"?a.label:names[k])+'</text>';});
      out+=direction(items.sofa,-90,0)+direction(items.chair,0,-60);
    }
    return out;
  }
  function validate(selection){const items=layout(selection),errors=[],solid=Object.keys(items).filter(function(k){return ["rug","tv","pc","decor"].indexOf(k)<0;});
    solid.forEach(function(k){const a=items[k];if(a.u<0||a.v<0||a.u+a.w>room.width||a.v+a.d>room.depth)errors.push(k+": outside room");});
    solid.forEach(function(k,i){solid.slice(i+1).forEach(function(j){const a=items[k],b=items[j];if(a.u<b.u+b.w&&a.u+a.w>b.u&&a.v<b.v+b.d&&a.v+a.d>b.v)errors.push(k+" overlaps "+j);});});
    const wallItems=wallLayout(selection,items);
    if(items.decor&&items.decor.mount==="wall"&&(items.decor.u<0||items.decor.u+items.decor.w>room.width||items.decor.z+items.decor.h>room.height))errors.push("decor: outside wall");
    if(items.decor&&items.decor.mount==="desk"&&(items.decor.u<items.desk.u||items.decor.u+items.decor.w>items.desk.u+items.desk.w||items.decor.v<items.desk.v||items.decor.v+items.decor.d>items.desk.v+items.desk.d||items.decor.z<items.desk.h))errors.push("decor: outside desk surface");
    if(items.tv.u<items["tv-bench"].u||items.tv.u+items.tv.w>items["tv-bench"].u+items["tv-bench"].w||items.tv.v<items["tv-bench"].v||items.tv.v+items.tv.d>items["tv-bench"].v+items["tv-bench"].d)errors.push("tv: does not fit the TV bench");
    if(items.pc.u<items.desk.u||items.pc.u+items.pc.w>items.desk.u+items.desk.w||items.pc.v<items.desk.v||items.pc.v+items.pc.d>items.desk.v+items.desk.d||items.pc.z<items.desk.h)errors.push("pc: outside desk surface");
    if(items["tv-bench"].h+items.tv.h>room.height)errors.push("tv: above room height");
    if(items.pc.h+items.desk.h>room.height)errors.push("pc: above room height");
    wallItems.forEach(function(a){
      if(a.u<0||a.v<0||a.u+a.w>room.width||a.v+a.d>room.depth||a.z<0||a.z+a.h>room.height)errors.push(a.id+": outside wall");
      if(a.wall==="left"&&a.v<190&&a.v+a.d>70&&a.z<195&&a.z+a.h>100)errors.push(a.id+": overlaps window");
      if(a.wall==="left"&&a.u!==0||a.wall==="right"&&a.v!==0)errors.push(a.id+": detached from wall");
    });
    wallItems.forEach(function(a,i){wallItems.slice(i+1).forEach(function(b){
      const startA=a.wall==="left"?a.v:a.u,endA=startA+(a.wall==="left"?a.d:a.w),startB=b.wall==="left"?b.v:b.u,endB=startB+(b.wall==="left"?b.d:b.w);
      const topA=a.z+a.h+(a.kind==="shelf"?30:0),topB=b.z+b.h+(b.kind==="shelf"?30:0);
      if(a.wall===b.wall&&startA<endB&&endA>startB&&a.z<topB&&topA>b.z)errors.push(a.id+" overlaps "+b.id);
    });});
    return errors;
  }
  window.LivslinaRoomPlan={camera:camera,room:room,variants:variants,floorTypes:floorTypes,wallLayout:wallLayout,layout:layout,project:project,build:build,assetGuide:assetGuide,validate:validate};
}());
