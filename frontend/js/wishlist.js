async function loadWishlist(){
    const ids=getWishlist();
    const grid=document.getElementById('grid');
    if(!ids.length){
        grid.innerHTML='<div class=\"card\">Nessun elemento in wishlist.</div>';
        return;
    }
    const prods=await Promise.all(ids.map(id=>apiFetch('/products/'+id).catch(()=>null)));
    const items=prods.filter(Boolean);
    grid.innerHTML=items.map(p=>`<article class=\"card card-product\"><a href=\"/product.html?id=${p.id}\"><img src=\"${p.image}\"/></a><div style=\"padding:8px\"><a href=\"/product.html?id=${p.id}\"><strong>${p.title}</strong></a><div class=\"price\">€ ${p.price.toFixed(2)}</div><div class="qty-row"><input type="number" min="1" max="5" value="1" id="qty-${p.id}" class="qty-input" /><button data-add=\"${p.id}\">Aggiungi</button><button class=\"ghost\" data-wish=\"${p.id}\">Rimuovi</button></div></div></article>`).join('');
    
    document.querySelectorAll('[data-add]').forEach(btn=>btn.onclick=async()=>{
        const id=Number(btn.dataset.add);
        const qty=Number(document.getElementById(`qty-${id}`).value||1);
        if(qty>5){
            //alert('Quantità massima 5');
            return;
        }
        const p=await apiFetch('/products/'+id);
        addToCart(p,qty);
        toggleWishlist(id);
        loadWishlist();
    });
    
    document.querySelectorAll('[data-wish]').forEach(btn=>btn.onclick=()=>{
        toggleWishlist(Number(btn.dataset.wish));
        loadWishlist();
    });
}
document.addEventListener('DOMContentLoaded',loadWishlist);