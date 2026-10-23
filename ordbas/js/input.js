(function (root) {
  'use strict';
  const O=root.Ordbas,byId=id=>document.getElementById(id);
  function collect(){
    return {mode:document.querySelector('input[name="mode"]:checked').value,level:Number(document.querySelector('input[name="level"]:checked').value),count:Number(byId('countSelect').value),classes:[...document.querySelectorAll('input[name="wordClass"]:checked')].map(x=>x.value),showMeaning:byId('meaningToggle').checked};
  }
  function bindDrag(){
    const host=byId('game');
    let pointer=null,ghost=null,hovered=null,dragged=false;
    function clear(){
      if(ghost)ghost.remove();
      if(hovered)hovered.classList.remove('ob-drag-over');
      ghost=null;hovered=null;pointer=null;
    }
    host.addEventListener('dragstart',event=>{if(event.target.closest('#wordCard,button[data-pair-index]'))event.preventDefault();});
    host.addEventListener('pointerdown',event=>{
      dragged=false;
      const card=event.target.closest('#wordCard,button[data-pair-index]'),round=O.App.round();
      if(!card||card.disabled||event.button!==0||!event.isPrimary||!round||round.state.phase!=='answering')return;
      event.preventDefault();
      const bounds=card.getBoundingClientRect();
      pointer={id:event.pointerId,x:event.clientX,y:event.clientY,bounds,card};
      host.setPointerCapture(event.pointerId);
      if(card.dataset.pairIndex!==undefined)O.App.selectCard(Number(card.dataset.pairIndex));
    });
    host.addEventListener('pointermove',event=>{
      if(!pointer||pointer.id!==event.pointerId)return;
      if(!ghost&&Math.hypot(event.clientX-pointer.x,event.clientY-pointer.y)<8)return;
      event.preventDefault();dragged=true;
      if(!ghost){
        ghost=pointer.card.cloneNode(true);ghost.removeAttribute('id');ghost.removeAttribute('aria-pressed');
        ghost.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));
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
    host.addEventListener('pointerup',event=>{
      if(!pointer||pointer.id!==event.pointerId)return;
      const selected=ghost&&hovered?hovered.dataset.class:null;
      clear();
      if(host.hasPointerCapture(event.pointerId))host.releasePointerCapture(event.pointerId);
      if(selected)O.App.answer(selected);
    });
    host.addEventListener('pointercancel',clear);
    host.addEventListener('lostpointercapture',clear);
    host.addEventListener('click',event=>{if(dragged&&event.detail>0){dragged=false;event.preventDefault();event.stopImmediatePropagation();}},true);
  }
  function bind(){
    byId('setup').addEventListener('change',()=>O.App.change(collect()));
    byId('startButton').addEventListener('click',()=>O.App.start());
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
    byId('pairContext').addEventListener('click',event=>{const card=event.target.closest('button[data-pair-index]');if(card)O.App.selectCard(Number(card.dataset.pairIndex));});
    byId('huntSentence').addEventListener('click',event=>{const word=event.target.closest('button[data-word-index]');if(word&&!word.disabled)O.App.chooseWord(Number(word.dataset.wordIndex));});
    bindDrag();
    document.addEventListener('keydown',event=>{
      if(event.repeat||event.ctrlKey||event.altKey||event.metaKey||byId('game').hidden||document.querySelector('dialog[open]')||event.target.closest('input,select,textarea'))return;
      const index=Number(event.key)-1;if(!Number.isInteger(index)||index<0||index>3)return;
      const button=byId('bins').querySelectorAll('button[data-class]')[index];
      if(button&&!button.disabled){event.preventDefault();O.App.answer(button.dataset.class);}
    });
  }
  O.Input={bind,collect};
})(window);
