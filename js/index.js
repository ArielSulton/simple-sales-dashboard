const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// INDEX.HTML
fetch('php/koneksi.php')
    .then(response => response.json())
    .then(data => {
        const container = document.getElementById('product-index');
        const productTotals = {};
        
        data.forEach(product => {
            if (productTotals[product.product_name]) {
                productTotals[product.product_name] += parseFloat(product.sales_amount);
            } else {
                productTotals[product.product_name] = parseFloat(product.sales_amount);
            }
        });
        
        const aggregatedProducts = Object.entries(productTotals).map(([name, total]) => ({
            product_name: name,
            sales_amount: total
        }));
        
        if (aggregatedProducts.length > 0) {
            aggregatedProducts.forEach(product => {
                const card = document.createElement('div');
                card.className = 'product-card';

                // Add card content
                card.innerHTML = `
                    <div class="product-info">
                        <h4>Total ${product.product_name} Terjual</h4>
                        <p>${parseFloat(product.sales_amount).toFixed(0)} pcs</p>
                    </div>
                `;
                container.appendChild(card);
            });
        } else {
            container.innerHTML = '<p>No products found.</p>';
        }
    })
    .catch(error => {
        console.error('Error fetching products:', error);
        document.getElementById('product-index').innerHTML = '<p>Failed to load products.</p>';
    });

fetch('php/koneksi.php')
    .then(response => response.json())
    .then(data => {
        // Data processing
        const groupedData = d3.rollups(
            data,
            v => d3.sum(v, d => d.sales_amount),
            d => d.product_name
        ).sort((a, b) => b[1] - a[1]);

        // Mengubah format tanggal dan mengelompokkan data per tanggal
        const parseDate = d3.timeParse("%Y-%m-%d");
        data.forEach(d => {
            d.date = parseDate(d.transaction_date);
            d.sales_amount = +d.sales_amount;
        });

        const dailyData = d3.rollups(
            data,
            v => d3.sum(v, d => d.sales_amount),
            d => d.date
        ).sort((a, b) => a[0] - b[0]);

        // pie chart
        const pieWidth = 400, pieHeight = 400;
        const radius = Math.min(pieWidth, pieHeight) / 2 - 40;

        const pieSvg = d3.select("#pieChart")
            .append("svg")
            .attr("width", pieWidth + 120) // Menambah lebar untuk legend
            .attr("height", pieHeight)
            .append("g")
            .attr("transform", `translate(${pieWidth/2},${pieHeight/2})`);

        const pieColor = d3.scaleOrdinal(d3.schemeSet3);
        const pie = d3.pie().value(d => d[1]);
        const arc = d3.arc()
            .innerRadius(radius * 0.4)
            .outerRadius(radius);

        // Menambahkan segments
        const arcs = pieSvg.selectAll("arc")
            .data(pie(groupedData))
            .enter()
            .append("g")
            .attr("class", "arc");

        arcs.append("path")
            .attr("d", arc)
            .attr("fill", (d, i) => pieColor(i))
            .on("mouseover", function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`${d.data[0]}<br/>${d.data[1].toLocaleString()} pcs`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
                    
                // Highlight segment yang di-hover
                d3.select(this)
                    .style("opacity", 0.7);
                    
                // Highlight legend yang sesuai
                legend.select(`#legend-${d.index}`)
                    .style("font-weight", "bold");
            })
            .on("mouseout", function(event, d) {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
                    
                // Kembalikan opacity segment
                d3.select(this)
                    .style("opacity", 1);
                    
                // Kembalikan style legend
                legend.select(`#legend-${d.index}`)
                    .style("font-weight", "normal");
            });

        // Tambahkan legend
        const legend = pieSvg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${radius + 30}, ${-radius})`);

        const legendItems = legend.selectAll(".legend-item")
            .data(pie(groupedData))
            .enter()
            .append("g")
            .attr("class", "legend-item")
            .attr("id", (d, i) => `legend-${i}`)
            .attr("transform", (d, i) => `translate(0, ${i * 20})`);

        // Tambahkan kotak warna
        legendItems.append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", (d, i) => pieColor(i));

        // Tambahkan teks produk
        legendItems.append("text")
            .attr("x", 20)
            .attr("y", 12)
            .style("font-size", "12px")
            .text(d => {
                const percentage = ((d.endAngle - d.startAngle) / (2 * Math.PI) * 100).toFixed(1);
                return `${d.data[0]} (${percentage}%)`;
            });

        // Tambahkan interaksi hover pada legend
        legendItems
            .on("mouseover", function(event, d) {
                // Highlight corresponding pie segment
                arcs.select(`path:nth-child(${d.index + 1})`)
                    .style("opacity", 0.7);
                    
                // Bold the legend text
                d3.select(this)
                    .style("font-weight", "bold");
                    
                // Show tooltip
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`${d.data[0]}<br/>${d.data[1].toLocaleString()} pcs`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function(event, d) {
                // Reset pie segment opacity
                arcs.select(`path:nth-child(${d.index + 1})`)
                    .style("opacity", 1);
                    
                // Reset legend text weight
                d3.select(this)
                    .style("font-weight", "normal");
                    
                // Hide tooltip
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        // Bar Chart
        const margin = {top: 20, right: 20, bottom: 60, left: 60};
        const barWidth = 460 - margin.left - margin.right;
        const barHeight = 400 - margin.top - margin.bottom;

        const barSvg = d3.select("#barChart")
            .append("svg")
            .attr("width", barWidth + margin.left + margin.right)
            .attr("height", barHeight + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand()
            .range([0, barWidth])
            .domain(groupedData.map(d => d[0]))
            .padding(0.2);

        const y = d3.scaleLinear()
            .domain([0, d3.max(groupedData, d => d[1])])
            .range([barHeight, 0]);

        // Add X axis
        barSvg.append("g")
            .attr("transform", `translate(0,${barHeight})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");

        // Add Y axis
        barSvg.append("g")
            .call(d3.axisLeft(y));

        // Add bars
        barSvg.selectAll("rect")
            .data(groupedData)
            .enter()
            .append("rect")
            .attr("x", d => x(d[0]))
            .attr("y", d => y(d[1]))
            .attr("width", x.bandwidth())
            .attr("height", d => barHeight - y(d[1]))
            .attr("fill", (d, i) => pieColor(i))
            .on("mouseover", function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`${d[0]}<br/>${d[1].toLocaleString()}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        // Line Chart
        const lineWidth = 460 - margin.left - margin.right;
        const lineHeight = 400 - margin.top - margin.bottom;

        const lineSvg = d3.select("#lineChart")
            .append("svg")
            .attr("width", lineWidth + margin.left + margin.right)
            .attr("height", lineHeight + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const xLine = d3.scaleTime()
            .domain(d3.extent(dailyData, d => d[0]))
            .range([0, lineWidth]);

        const yLine = d3.scaleLinear()
            .domain([0, d3.max(dailyData, d => d[1])])
            .range([lineHeight, 0]);

        // Add X axis
        lineSvg.append("g")
            .attr("transform", `translate(0,${lineHeight})`)
            .call(d3.axisBottom(xLine));

        // Add Y axis
        lineSvg.append("g")
            .call(d3.axisLeft(yLine));

        // Add line
        lineSvg.append("path")
            .datum(dailyData)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2)
            .attr("d", d3.line()
                .x(d => xLine(d[0]))
                .y(d => yLine(d[1]))
            );

        // Add dots
        lineSvg.selectAll("circle")
            .data(dailyData)
            .enter()
            .append("circle")
            .attr("cx", d => xLine(d[0]))
            .attr("cy", d => yLine(d[1]))
            .attr("r", 4)
            .attr("fill", "steelblue")
            .on("mouseover", function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`${d[0].toLocaleDateString()}<br/>${d[1].toLocaleString()}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        // Scatter Plot
        const scatterWidth = 460 - margin.left - margin.right;
        const scatterHeight = 400 - margin.top - margin.bottom;

        const scatterSvg = d3.select("#scatterPlot")
            .append("svg")
            .attr("width", scatterWidth + margin.left + margin.right)
            .attr("height", scatterHeight + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const xScatter = d3.scaleTime()
            .domain(d3.extent(data, d => d.date))
            .range([0, scatterWidth]);

        const yScatter = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.sales_amount)])
            .range([scatterHeight, 0]);

        // Add X axis
        scatterSvg.append("g")
            .attr("transform", `translate(0,${scatterHeight})`)
            .call(d3.axisBottom(xScatter));

        // Add Y axis
        scatterSvg.append("g")
            .call(d3.axisLeft(yScatter));

        // Add dots
        scatterSvg.selectAll("dot")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", d => xScatter(d.date))
            .attr("cy", d => yScatter(d.sales_amount))
            .attr("r", 4)
            .style("fill", d => pieColor(d.product_name))
            .on("mouseover", function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`${d.product_name}<br/>${d.date.toLocaleDateString()}<br/>${d.sales_amount.toLocaleString()}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
        
        // Horizontal Bar Chart
        const hBarWidth = 460 - margin.left - margin.right;
        const hBarHeight = 400 - margin.top - margin.bottom;

        const hBarSvg = d3.select("#horizontalBarChart")
            .append("svg")
            .attr("width", hBarWidth + margin.left + margin.right)
            .attr("height", hBarHeight + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Grup dan jumlahkan penjualan per tanggal
        const salesByDate = d3.rollups(
            data,
            v => d3.sum(v, d => d.sales_amount),
            d => d.transaction_date
        ).map(([date, total]) => ({
            date: new Date(date),
            total: total
        }));

        // Urutkan berdasarkan total penjualan dan ambil 3 teratas
        const top3Sales = salesByDate
            .sort((a, b) => b.total - a.total)
            .slice(0, 3);

        // Scales
        const yHBar = d3.scaleBand()
            .range([0, hBarHeight])
            .domain(top3Sales.map(d => d.date.toLocaleDateString()))
            .padding(0.2);

        const xHBar = d3.scaleLinear()
            .domain([0, d3.max(top3Sales, d => d.total)])
            .range([0, hBarWidth]);

        // Add Y axis (tanggal)
        hBarSvg.append("g")
            .call(d3.axisLeft(yHBar));

        // Add X axis (total penjualan)
        hBarSvg.append("g")
            .attr("transform", `translate(0,${hBarHeight})`)
            .call(d3.axisBottom(xHBar)
                .ticks(5)
                .tickFormat(d => d.toLocaleString())); // Format angka dengan separator

        // Add bars
        hBarSvg.selectAll("rect")
            .data(top3Sales)
            .enter()
            .append("rect")
            .attr("y", d => yHBar(d.date.toLocaleDateString()))
            .attr("height", yHBar.bandwidth())
            .attr("x", 0)
            .attr("width", d => xHBar(d.total))
            .attr("fill", (d, i) => pieColor(i))
            .on("mouseover", function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                
                // Dapatkan detail produk yang terjual pada tanggal tersebut
                const productsOnDate = data.filter(item => 
                    new Date(item.transaction_date).toDateString() === d.date.toDateString()
                );
                
                let productDetails = productsOnDate
                    .map(p => `${p.product_name}: ${p.sales_amount} pcs`)
                    .join('<br/>');

                tooltip.html(`
                    <strong>Tanggal: ${d.date.toLocaleDateString()}</strong><br/>
                    Total Penjualan: ${d.total.toLocaleString()} pcs<br/>
                    <br/>Detail Produk:<br/>
                    ${productDetails}
                `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        // Add title
        hBarSvg.append("text")
            .attr("x", hBarWidth / 2)
            .attr("y", -margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")

        // Add X axis label
        hBarSvg.append("text")
            .attr("x", hBarWidth / 2)
            .attr("y", hBarHeight + margin.bottom - 10)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Total Penjualan (pcs)");
        })
        .catch(error => console.error('Error:', error));

// TRANSACTIONS.HTML
fetch('php/koneksi.php')
    .then(response => response.json())
    .then(data => {
        const tableBody = document.getElementById('transactions-table').getElementsByTagName('tbody')[0];

        // Loop through the data and populate the table
        data.forEach(transaction => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${transaction.product_name}</td>
                <td>${transaction.sales_amount}</td>
                <td>${parseFloat(transaction.unit_price).toFixed(2)}</td>
                <td>${new Date(transaction.transaction_date).toLocaleDateString()}</td>
            `;
            
            tableBody.appendChild(row);
        });
    })
    .catch(error => {
        console.error('Error fetching transactions:', error);
    });