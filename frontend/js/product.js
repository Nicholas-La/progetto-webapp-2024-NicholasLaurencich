async function loadProduct(){
    const id=new URLSearchParams(location.search).get('id');
    const p=await apiFetch('/products/'+id);
    document.getElementById('product').innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
            <img src="${p.image}" style="width:100%;border-radius:8px"/>
        </div>
        <div>
            <h1>${p.title}</h1>
            <p class="price">€ ${p.price.toFixed(2)}</p>
            <div class="qty-row" style="margin-top:8px">
                <input id="qty" type="number" min="1" max="5" value="1" class="qty-input"/>
                <button id="addBtn">Aggiungi al carrello</button>
            </div>
            <div class="product-detail-desc">
                <p><strong>Descrizione:</strong></p>
                <p>${p.description || 'Nessuna descrizione disponibile.'}</p>
            </div>
        </div>
    </div>`;
    document.getElementById('addBtn').onclick=()=>{
        const qty=Number(document.getElementById('qty').value||1);
        if(qty>5){
            return;
        }
        addToCart(p,qty);
    };
}
document.addEventListener('DOMContentLoaded',loadProduct);