
// product ratings pie chart
document.addEventListener('DOMContentLoaded', function () {
  const data = ratingsData.map(d => ({ rating: d.rating, count: d.count }));

  const width = 200;
  const height = 200;
  const radius = Math.min(width, height) / 2;

  const color = d3.scaleOrdinal()
    .domain(data.map(d => d.rating))
    .range(d3.schemeCategory10);  // Predefined color palette

  const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  const pie = d3.pie()
    .value(d => d.count);

  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(radius);

  const arcs = svg.selectAll("arc")
    .data(pie(data))
    .enter()
    .append("g")
    .attr("class", "arc");

  arcs.append("path")
    .attr("d", arc)
    .attr("fill", d => color(d.data.rating));

  arcs.append("text")
    .attr("transform", d => `translate(${arc.centroid(d)})`)
    .attr("text-anchor", "middle")
    .text(d => `Rating ${d.data.rating}`);
});

// weekly sales bar chart
document.addEventListener('DOMContentLoaded', function () {
  const data = salesData.map(d => ({ week: d.week, sales: d.sales_amount }));

  const margin = { top: 20, right: 30, bottom: 40, left: 50 };
  const width = 300- margin.left - margin.right;
  const height = 200 - margin.top - margin.bottom;

  const svg = d3.select("#saleschart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // X scale (for the weeks)
  const x = d3.scaleBand()
    .domain(data.map(d => d.week))
    .range([0, width])
    .padding(0.1);

  // Y scale (for the sales amount)
  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.sales)])  // Scale according to sales amount
    .range([height, 0]);

  // Add X axis
  svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x));

  // Add Y axis
  svg.append("g")
    .call(d3.axisLeft(y));

  // Create the bars
  svg.selectAll(".bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.week))
    .attr("y", d => y(d.sales))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.sales))
    .attr("fill", "#00A5E3");  // Bar color
});

