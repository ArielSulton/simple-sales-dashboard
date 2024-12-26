// PRODUCTS.HTML
fetch('php/koneksi.php')
    .then(response => response.json())
    .then(data => {
        const container = document.getElementById('product-container');

        // Filter unique products by name
        const uniqueProducts = [];
        const productNames = new Set();

        data.forEach(product => {
            if (!productNames.has(product.product_name)) {
                productNames.add(product.product_name);
                uniqueProducts.push(product);
            }
        });

        // Render unique products
        if (uniqueProducts.length > 0) {
            uniqueProducts.forEach((product, index) => {
                const card = document.createElement('div');
                card.className = 'product-card';

                // Generate unique image URL by using the index
                const imageUrl = `https://picsum.photos/300/200?random=${index + 1}`;

                // Add card content
                card.innerHTML = `
                    <img src="${imageUrl}" alt="${product.product_name}">
                    <div class="product-info">
                        <h4>${product.product_name}</h4>
                        <p>Rp ${parseFloat(product.unit_price).toFixed(2)}</p>
                    </div>
                `;
                container.appendChild(card);
            });
        } else {
            container.innerHTML = '<p>No unique products found.</p>';
        }
    })
    .catch(error => {
        console.error('Error fetching products:', error);
        document.getElementById('product-container').innerHTML = '<p>Failed to load products.</p>';
    });