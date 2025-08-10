import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getDatabase, ref, set, get, remove } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

const auth = getAuth(window.firebaseApp);
const db = getDatabase(window.firebaseApp);
const storage = getStorage(window.firebaseApp);

const signInBtn=document.getElementById('signIn'), signOutBtn=document.getElementById('signOut'), emailEl=document.getElementById('email'), passEl=document.getElementById('password'), msg=document.getElementById('authMsg'), dataPanel=document.getElementById('dataPanel');

signInBtn.addEventListener('click', async ()=>{ try{ await signInWithEmailAndPassword(auth, emailEl.value.trim(), passEl.value); msg.textContent='Signed in.'; }catch(e){ msg.textContent='Sign-in failed: '+e.message; } });
signOutBtn.addEventListener('click', async ()=>{ await signOut(auth); msg.textContent='Signed out.'; });

onAuthStateChanged(auth, (user)=>{ if(user){ dataPanel.style.display='block'; loadAll(); } else { dataPanel.style.display='none'; } });

// Categories
const catId=document.getElementById('catId'), catName=document.getElementById('catName'), catOrder=document.getElementById('catOrder'), catsTable=document.getElementById('catsTable');
document.getElementById('saveCat').addEventListener('click', async ()=>{ const id=(catId.value||'').trim(); if(!id){ msg.textContent='Category ID required'; return; } await set(ref(db,'menu/categories/'+id),{name:catName.value||id,order:parseInt(catOrder.value||'999',10)}); msg.textContent='Category saved.'; await loadCats(); });
document.getElementById('delCat').addEventListener('click', async ()=>{ const id=(catId.value||'').trim(); if(!id) return; await remove(ref(db,'menu/categories/'+id)); msg.textContent='Category deleted.'; await loadCats(); });
document.getElementById('refreshCats').addEventListener('click', loadCats);

// Items
const itemId=document.getElementById('itemId'), itemName=document.getElementById('itemName'), itemDesc=document.getElementById('itemDesc'), itemPrice=document.getElementById('itemPrice'), itemCats=document.getElementById('itemCats'), itemFeatured=document.getElementById('itemFeatured'), itemImage=document.getElementById('itemImage'), itemImageUrl=document.getElementById('itemImageUrl'), itemsTable=document.getElementById('itemsTable');

document.getElementById('saveItem').addEventListener('click', async ()=>{
  const id=(itemId.value||'').trim(); if(!id){ msg.textContent='Item ID required'; return; }
  let imageUrl=itemImageUrl.value.trim();
  if(itemImage.files && itemImage.files[0]){
    const file=itemImage.files[0]; const path=`menu/${id}-${Date.now()}`;
    const r=await uploadBytes(sRef(storage,path), file); imageUrl = await getDownloadURL(r.ref); itemImageUrl.value=imageUrl;
  }
  const body={ name:itemName.value||id, desc:itemDesc.value||'', price:parseFloat(itemPrice.value||'0'), cats:(itemCats.value||'').split(',').map(s=>s.trim()).filter(Boolean), isFeatured:itemFeatured.value==='true', imageUrl };
  await set(ref(db,'menu/items/'+id), body); msg.textContent='Item saved.'; await loadItems();
});
document.getElementById('delItem').addEventListener('click', async ()=>{ const id=(itemId.value||'').trim(); if(!id) return; await remove(ref(db,'menu/items/'+id)); msg.textContent='Item deleted.'; await loadItems(); });
document.getElementById('refreshItems').addEventListener('click', loadItems);

async function loadAll(){ await Promise.all([loadCats(), loadItems()]); }
async function loadCats(){
  catsTable.innerHTML=''; const snap=await get(ref(db,'menu/categories')); if(!snap.exists()) return; const obj=snap.val();
  Object.keys(obj).sort((a,b)=>(obj[a].order||999)-(obj[b].order||999)).forEach(id=>{
    const tr=document.createElement('tr'); tr.innerHTML=`<td>${id}</td><td>${obj[id].name||id}</td><td>${obj[id].order||''}</td>`;
    tr.addEventListener('click',()=>{catId.value=id;catName.value=obj[id].name||id;catOrder.value=obj[id].order||'';}); catsTable.appendChild(tr);
  });
}
async function loadItems(){
  itemsTable.innerHTML=''; const snap=await get(ref(db,'menu/items')); if(!snap.exists()) return; const obj=snap.val();
  Object.keys(obj).forEach(id=>{ const it=obj[id]; const tr=document.createElement('tr');
    tr.innerHTML=`<td>${id}</td><td>${it.name||id}</td><td>QAR ${Number(it.price||0).toFixed(2)}</td><td>${(it.cats||[]).join(', ')}</td><td>${it.isFeatured?'Yes':'No'}</td>`;
    tr.addEventListener('click',()=>{ itemId.value=id; itemName.value=it.name||id; itemDesc.value=it.desc||''; itemPrice.value=it.price||0; itemCats.value=(it.cats||[]).join(', '); itemFeatured.value=it.isFeatured?'true':'false'; itemImageUrl.value=it.imageUrl||''; });
    itemsTable.appendChild(tr);
  });
}
