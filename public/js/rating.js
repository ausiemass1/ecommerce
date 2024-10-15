 // DATA SECTION
    // Revenue data over time (for the line graph)
    // const revenueData = [
      
    //     { date: new Date(2024, 0, 1), revenue: 3000 },
    //     { date: new Date(2024, 1, 1), revenue: 4000 },
    //     { date: new Date(2024, 2, 1), revenue: 5000 },
    //     { date: new Date(2024, 3, 1), revenue: 4500 },
    //     { date: new Date(2024, 4, 1), revenue: 4000 },
    //     { date: new Date(2024, 5, 1), revenue: 5000 },
    //     { date: new Date(2024, 6, 1), revenue: 2500 },
    //     { date: new Date(2024, 7, 1), revenue: 4000 },
    //     { date: new Date(2024, 8, 1), revenue: 4600 }
    //   ];
  
    
  
      // LINE GRAPH SECTION
      // const margin = { top: 20, right: 30, bottom: 30, left: 50 },
      //       lineWidth = 500 - margin.left - margin.right,
      //       lineHeight = 300 - margin.top - margin.bottom;
  
      // const lineSvg = d3.select("#lineGraph")
      //   .attr("width", lineWidth + margin.left + margin.right)
      //   .attr("height", lineHeight + margin.top + margin.bottom)
      //   .append("g")
      //   .attr("transform", `translate(${margin.left},${margin.top})`);
  
      // const x = d3.scaleTime()
      //   .domain(d3.extent(revenueData, d => d.date))
      //   .range([0, lineWidth]);
  
      // const y = d3.scaleLinear()
      //   .domain([0, d3.max(revenueData, d => d.revenue)])
      //   .range([lineHeight, 0]);
  
      // lineSvg.append("g")
      //   .attr("transform", `translate(0,${lineHeight})`)
      //   .call(d3.axisBottom(x));
  
      // lineSvg.append("g")
      //   .call(d3.axisLeft(y));
  
      // const line = d3.line()
      //   .x(d => x(d.date))
      //   .y(d => y(d.revenue));
  
      // lineSvg.append("path")
      //   .datum(revenueData)
      //   .attr("class", "line")
      //   .attr("d", line);

        // product ratings (for the pie chart)
        const salesData = [
          { category: 'prod1', sales: 3},
          { category: 'prod2', sales: 2 },
          { category: 'prod3', sales: 3 },
          { category: 'prod4', sales: 3.5 },
          { category: 'prod5', sales: 4 }
        ];
  
      // PIE CHART SECTION
      const pieWidth = 500;
      const pieHeight = 300;
      const radius = Math.min(pieWidth, pieHeight) / 2;
  
      const pieSvg = d3.select("#pieChart")
        .attr("width", pieWidth)
        .attr("height", pieHeight)
        .append("g")
        .attr("transform", `translate(${pieWidth / 2}, ${pieHeight / 2})`);
  
      const color = d3.scaleOrdinal()
        .domain(salesData.map(d => d.category))
        .range(d3.schemeCategory10);
  
      const pie = d3.pie()
        .value(d => d.sales)
        .sort(null);
  
      const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);
  
      const arcs = pieSvg.selectAll("g.arc")
        .data(pie(salesData))
        .enter()
        .append("g")
        .attr("class", "arc");
  
      arcs.append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.category));
  
      arcs.append("text")
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .text(d => d.data.category);