    // Sample Data
    const data = [
        { date: new Date(2023, 8, 1), revenue: 1000 },
        { date: new Date(2023, 9, 1), revenue: 1500 },
        { date: new Date(2023, 10, 1), revenue: 2000 },
        { date: new Date(2023, 11, 1), revenue: 2500 },
        { date: new Date(2024, 0, 1), revenue: 3000 },
        { date: new Date(2024, 1, 1), revenue: 4000 },
        { date: new Date(2024, 2, 1), revenue: 5000 },
        { date: new Date(2024, 3, 1), revenue: 3000 },
        { date: new Date(2024, 4, 1), revenue: 4000 },
        { date: new Date(2024, 5, 1), revenue: 5000 },
        { date: new Date(2024, 6, 1), revenue: 3000 },
        { date: new Date(2024, 7, 1), revenue: 4000 },
        { date: new Date(2024, 8, 1), revenue: 5000 }
      ];
  
      // Set dimensions and margins for the graph
      const margin = { top: 20, right: 30, bottom: 30, left: 50 },
            width = 800 - margin.left - margin.right,
            height = 400 - margin.top - margin.bottom;
  
      const svg = d3.select("#svg1")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
  
      // Set the ranges
      const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.date))
        .range([0, width]);
  
      const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.revenue)])
        .range([height, 0]);
  
      // Define the line
      const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.revenue));
  
      // Add the X Axis
      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));
  
      // Add the Y Axis
      svg.append("g")
        .call(d3.axisLeft(y));
  
      // Add the line path
      svg.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("d", line);