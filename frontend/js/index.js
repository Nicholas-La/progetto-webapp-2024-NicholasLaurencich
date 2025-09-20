const LIMIT=12;
let state={q:'',offset:0,total:0, category: ''};
async function loadProducts(){
	const params=new URLSearchParams(
		{q:state.q,limit:LIMIT,offset:state.offset, category: state.category});
		
	const data=await apiFetch(`/products?${params}`);
	
	state.total=data.total;
	
	document.getElementById('grid').innerHTML=data.results.map(p=>`<article class=\"card card-product\"><a href=\"/product.html?id=${p.id}\"><img src=\"${p.image}\"/></a><div style=\"padding:8px\"><a href=\"/product.html?id=${p.id}\"><strong>${p.title}</strong></a><div class=\"price\">€ ${p.price.toFixed(2)}</div><div class=\"qty-row\"><input type=\"number\" min=\"1\" max=\"5\" value=\"1\" id=\"qty-${p.id}\" class=\"qty-input\" />
<button data-add=\"${p.id}\">Aggiungi</button><button class=\"ghost\" data-wish=\"${p.id}\">Wishlist</button></div></div></article>`).join('');
	
	document.querySelectorAll('[data-add]').forEach(btn=>btn.onclick=async()=>{const id=Number(btn.dataset.add);const qty=Number(document.getElementById(`qty-${id}`).value||1);
	if(qty>5){
	
	return;}
	
	const p=await apiFetch('/products/'+id);addToCart(p,qty);});
	
	document.querySelectorAll('[data-wish]').forEach(btn=>btn.onclick=()=>{toggleWishlist(Number(btn.dataset.wish));loadProducts();});
	
	document.getElementById('prevBtn').disabled=state.offset===0;
	
	document.getElementById('nextBtn').disabled=state.offset+LIMIT>=state.total;
}

async function loadCategories() {
    const data = await apiFetch('/products');
    const allCategories = data.results.map(p => p.category);
    const uniqueCategories = ['Tutti', ...new Set(allCategories)];
    const filterDropdown = document.getElementById('filter-dropdown');
    filterDropdown.innerHTML = uniqueCategories.map(c => `<a href="#" data-category="${c}">${c}</a>`).join('');

    document.querySelectorAll('#filter-dropdown a').forEach(link => {
        link.onclick = (e) => {
            e.preventDefault();
            state.q = '';
            document.getElementById('q').value = '';
            state.category = link.dataset.category === 'Tutti' ? '' : link.dataset.category;
            state.offset = 0;
            loadProducts();
            document.getElementById('filter-dropdown').classList.remove('show');
        };
    });
}
	
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('q');
    const searchBtn = document.getElementById('searchBtn');
    const filterBtn = document.getElementById('filterBtn');
    const filterDropdown = document.getElementById('filter-dropdown');

    
    function performSearch() {
        state.q = searchInput.value.trim();
        state.category = '';
        state.offset = 0;
        loadProducts();
    }

  
    searchBtn.onclick = performSearch;


    searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            performSearch();
        }
    });

    filterBtn.onclick = () => {
        filterDropdown.classList.toggle('show');
    };

    window.onclick = (event) => {
        if (!event.target.matches('#filterBtn')) {
            if (filterDropdown.classList.contains('show')) {
                filterDropdown.classList.remove('show');
            }
        }
    };

    document.getElementById('prevBtn').onclick = () => {
        state.offset = Math.max(0, state.offset - LIMIT);
        loadProducts();
    };

    document.getElementById('nextBtn').onclick = () => {
        state.offset += LIMIT;
        loadProducts();
    };

    loadProducts();
    loadCategories();
});