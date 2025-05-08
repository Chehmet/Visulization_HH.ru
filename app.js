document.addEventListener('DOMContentLoaded', function() {
    addSVGGradients();
    loadDataAndInitializeCharts();
    setupEventListeners();
});

function addSVGGradients() {
    const defs = d3.select("body").append("svg")
        .attr("width", 0)
        .attr("height", 0)
        .append("defs");

    defs.append("linearGradient")
        .attr("id", "barGradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%")
        .selectAll("stop")
        .data([
            {offset: "0%", color: "#4cc9f0"},
            {offset: "100%", color: "#4895ef"}
        ])
        .enter().append("stop")
        .attr("offset", d => d.offset)
        .attr("stop-color", d => d.color);

    defs.append("linearGradient")
        .attr("id", "barGradientHover")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%")
        .selectAll("stop")
        .data([
            {offset: "0%", color: "#f72585"},
            {offset: "100%", color: "#b5179e"}
        ])
        .enter().append("stop")
        .attr("offset", d => d.offset)
        .attr("stop-color", d => d.color);
}

function loadDataAndInitializeCharts() {
    d3.json("data.json").then(function(data) {
        if (!data) {
            showDataError();
            return;
        }

        initializeChartWithAnimation(data.top_skills, "#skills-chart", "Skill", "Frequency", false);
        initializeChartWithAnimation(data.top_terms, "#terms-chart", "Term", "Frequency", true);
        initializePieChartWithAnimation(data.experience_levels, "#experience-chart");
        initializePieChartWithAnimation(data.salary_type_distribution, "#salary-chart");

    }).catch(showDataError);
}

function initializeChartWithAnimation(dataset, elementId, yLabel, xLabel, isHorizontal) {
    if (!dataset || dataset.length === 0) return;

    const container = d3.select(elementId);
    container.selectAll("*").remove();

    const margin = {top: 20, right: 30, bottom: 60, left: isHorizontal ? 100 : 50};
    const width = container.node().getBoundingClientRect().width - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const tooltip = d3.select(".tooltip") || d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    if (isHorizontal) {
        createHorizontalChart(dataset, svg, width, height, tooltip, yLabel, xLabel);
    } else {
        createVerticalChart(dataset, svg, width, height, tooltip, yLabel, xLabel);
    }
}

function createHorizontalChart(dataset, svg, width, height, tooltip, yLabel, xLabel) {
    const y = d3.scaleBand()
        .range([0, height])
        .domain(dataset.map(d => d.name))
        .padding(0.2);

    const x = d3.scaleLinear()
        .domain([0, d3.max(dataset, d => d.value)])
        .range([0, width]);

    svg.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5));

    svg.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y));

    svg.selectAll(".bar")
        .data(dataset)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("y", d => y(d.name))
        .attr("height", y.bandwidth())
        .attr("x", 0)
        .attr("width", 0)
        .transition()
        .duration(800)
        .attr("width", d => x(d.value))
        .delay((d, i) => i * 50);

    svg.selectAll(".bar")
        .on("mouseover", function(event, d) {
            showTooltip(tooltip, event, `${yLabel}: ${d.name}<br/>${xLabel}: ${d.value}`);
            d3.select(this).attr("filter", "url(#glow)");
        })
        .on("mouseout", function() {
            hideTooltip(tooltip);
            d3.select(this).attr("filter", "none");
        });
}

function createVerticalChart(dataset, svg, width, height, tooltip, yLabel, xLabel) {
    const x = d3.scaleBand()
        .range([0, width])
        .domain(dataset.map(d => d.name))
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(dataset, d => d.value)])
        .range([height, 0]);

    svg.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");

    svg.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y).ticks(5));

    svg.selectAll(".bar")
        .data(dataset)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.name))
        .attr("width", x.bandwidth())
        .attr("y", height)
        .attr("height", 0)
        .transition()
        .duration(800)
        .attr("y", d => y(d.value))
        .attr("height", d => height - y(d.value))
        .delay((d, i) => i * 50);

    svg.selectAll(".bar")
        .on("mouseover", function(event, d) {
            showTooltip(tooltip, event, `${yLabel}: ${d.name}<br/>${xLabel}: ${d.value}`);
            d3.select(this).attr("filter", "url(#glow)");
        })
        .on("mouseout", function() {
            hideTooltip(tooltip);
            d3.select(this).attr("filter", "none");
        });
}

function initializePieChartWithAnimation(dataset, elementId) {
    if (!dataset || dataset.length === 0) return;

    const container = d3.select(elementId);
    container.selectAll("*").remove();

    const width = container.node().getBoundingClientRect().width;
    const height = 250;
    const radius = Math.min(width, height) / 2 - 20;

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width/2},${height/2})`);

    const color = d3.scaleOrdinal()
        .domain(dataset.map(d => d.name))
        .range(["#4cc9f0", "#4895ef", "#4361ee", "#3f37c9", "#3a0ca3"]);

    const pie = d3.pie()
        .value(d => d.value)
        .sort(null);

    const arc = d3.arc()
        .innerRadius(radius * 0.5)
        .outerRadius(radius);

    const tooltip = d3.select(".tooltip") || d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    const arcs = svg.selectAll("arc")
        .data(pie(dataset))
        .enter()
        .append("g")
        .attr("class", "arc");

    arcs.append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.name))
        .attr("stroke", "white")
        .style("stroke-width", "2px")
        .style("opacity", 0)
        .transition()
        .duration(800)
        .style("opacity", 1)
        .delay((d, i) => i * 150);

    arcs.append("text")
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .attr("text-anchor", "middle")
        .text(d => d.data.value)
        .style("font-size", "12px")
        .style("fill", "white")
        .style("opacity", 0)
        .transition()
        .delay(1000)
        .style("opacity", 1);

    arcs.selectAll("path")
        .on("mouseover", function(event, d) {
            showTooltip(tooltip, event,
                `${d.data.name}: ${d.data.value} (${((d.data.value / d3.sum(dataset, item => item.value)) * 100).toFixed(1)}%)`
            );
            d3.select(this).attr("filter", "url(#glow)");
        })
        .on("mouseout", function() {
            hideTooltip(tooltip);
            d3.select(this).attr("filter", "none");
        });
}

function showTooltip(tooltip, event, html) {
    tooltip.html(html)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 15) + "px")
        .transition()
        .duration(200)
        .style("opacity", 1);
}

function hideTooltip(tooltip) {
    tooltip.transition()
        .duration(500)
        .style("opacity", 0);
}

function showDataError() {
    const charts = ["skills-chart", "terms-chart", "experience-chart", "salary-chart"];
    charts.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Could not load data. Please try again later.</p>
                </div>
            `;
        }
    });
}

function setupEventListeners() {
    document.querySelector('.refresh-btn').addEventListener('click', function() {
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
        setTimeout(() => {
            loadDataAndInitializeCharts();
            this.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Data';
        }, 1500);
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}
