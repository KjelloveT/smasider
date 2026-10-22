(function (root) {
  'use strict';
  const O=root.Ordbas,byId=id=>document.getElementById(id);
  function collect(){
    return {mode:document.querySelector('input[name="mode"]:checked').value,level:Number(byId('levelSelect').value),count:Number(byId('countSelect').value),classes:[...document.querySelectorAll('input[name="wordClass"]:checked')].map(x=>x.value),showMeaning:byId('meaningToggle').checked};
  }
  function bindDrag(){
    const card=byId('wordCard');
    let pointer=null,ghost=null,hovered=null,dragged=false;
    function clear(){
      if(ghost)ghost.remove();
      if(hovered)hovered.classList.remove('ob-drag-over');
      ghost=null;hovered=null;pointer=null;
    }
    card.addEventListener('dragstart',event=>event.preventDefault());
    card.addEventListener('pointerdown',event=>{
      const round=O.App.round();
      if(event.button!==0||!event.isPrimary||!round||round.state.phase!=='answering')return;
      dragged=false;
      const bounds=card.getBoundingClientRect();
      pointer={id:event.pointerId,x:event.clientX,y:event.clientY,bounds};
      card.setPointerCapture(event.pointerId);
    });
    card.addEventListener('pointermove',event=>{
      if(!pointer||pointer.id!==event.pointerId)return;
      if(!ghost&&Math.hypot(event.clientX-pointer.x,event.clientY-pointer.y)<8)return;
      event.preventDefault();dragged=true;
      if(!ghost){
        ghost=card.cloneNode(true);ghost.removeAttribute('id');ghost.removeAttribute('aria-pressed');
        ghost.setAttribute('aria-hidden','true');ghost.tabIndex=-1;ghost.classList.add('ob-drag-ghost');
        ghost.style.width=pointer.bounds.width+'px';ghost.style.height=pointer.bounds.height+'px';
        document.body.append(ghost);
      }
      ghost.style.left=(pointer.bounds.left+event.clientX-pointer.x)+'px';
      ghost.style.top=(pointer.bounds.top+event.clientY-pointer.y)+'px';
      if(hovered)hovered.classList.remove('ob-drag-over');
      hovered=document.elementFromPoint(event.clientX,event.clientY)?.closest('#bins button[data-class]:not(:disabled)');
      if(hovered)hovered.classList.add('ob-drag-over');
    });
    card.addEventListener('pointerup',event=>{
      if(!pointer||pointer.id!==event.pointerId)return;
      const selected=ghost&&hovered?hovered.dataset.class:null;
      clear();
      if(card.hasPointerCapture(event.pointerId))card.releasePointerCapture(event.pointerId);
      if(selected)O.App.answer(selected);
    });
    card.addEventListener('pointercancel',clear);
    card.addEventListener('lostpointercapture',clear);
    card.addEventListener('click',event=>{if(dragged){event.preventDefault();event.stopImmediatePropagation();}},true);
  }
  function bind(){
    byId('setup').addEventListener('change',()=>O.App.change(collect()));
    byId('startButton').addEventListener('click',()=>O.App.start());
    byId('adverbButton').addEventListener('click',()=>O.App.start({mode:'sort',level:3,classes:O.Config.classes.map(c=>c.id)}));
    byId('meaningButton').addEventListener('click',()=>O.App.meaning());
    byId('nextButton').addEventListener('click',()=>O.App.next());
    byId('againButton').addEventListener('click',()=>O.App.start());
    byId('homeButton').addEventListener('click',()=>O.App.home());
    byId('backButton').addEventListener('click',()=>O.App.home());
    byId('practiceButton').addEventListener('click',()=>O.App.practice());
    byId('reviewButton').addEventListener('click',()=>O.App.practice());
    byId('resetButton').addEventListener('click',()=>O.App.reset());
    byId('reloadButton').addEventListener('click',()=>location.reload());
    byId('wordCard').addEventListener('click',event=>{event.currentTarget.setAttribute('aria-pressed','true');});
    byId('bins').addEventListener('click',event=>{const button=event.target.closest('button[data-class]');if(button&&!button.disabled)O.App.answer(button.dataset.class);});
    bindDrag();
    document.addEventListener('keydown',event=>{
      if(event.repeat||event.ctrlKey||event.altKey||event.metaKey||byId('game').hidden||document.querySelector('dialog[open]')||event.target.closest('input,select,textarea'))return;
      const index=Number(event.key)-1;if(!Number.isInteger(index)||index<0||index>3)return;
      const button=byId('bins').querySelectorAll('button')[index];
      if(button&&!button.disabled){event.preventDefault();O.App.answer(button.dataset.class);}
    });
  }
  O.Input={bind,collect};
})(window);
