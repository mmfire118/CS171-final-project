class FilterVis {
    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data.map(a => {return {...a}});

        // date methods
        this.parseDate = d3.timeParse("%Y-%m-%d");
        this.formatDate = d3.timeFormat("%Y-%m-%d");

        this.initVis()
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 20, right: 20, bottom: 40, left: 60};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append('g')
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        // add x axis text
        vis.svg.append('g')
            .attr('class', 'axis-text')
            .append('text')
            .text("Timestamp")
            .attr('transform', `translate(${vis.width / 2}, ${vis.height + (vis.margin.bottom * 0.9)})`)
            .attr('text-anchor', 'middle');

        // add y axis text
        vis.svg.append('g')
            .attr('class', 'axis-text')
            .append('text')
            .text("Avg. Words")
            .attr('transform', `translate(-50,${vis.height / 2})rotate(-90)`)
            .attr('text-anchor', 'middle');

        // Scales
        vis.x = d3.scaleTime()
            .range([0, vis.width]);

        vis.y = d3.scaleLinear()
            .range([vis.height, 0]);

        // Axes
        vis.yAxis = d3.axisLeft()
            .scale(vis.y)
            .ticks(5);

        vis.svg.append("g")
            .attr("class", "y-axis axis");

        vis.xAxis = d3.axisBottom()
            .scale(vis.x);

        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + vis.height + ")");

        // Append a path for the area function, so that it is later behind the brush overlay
        vis.timePath = vis.svg.append("path")
            .attr("class", "area");

        let brush = d3.brushX()
            .extent([[0, 0], [vis.width, vis.height]])
            .on("brush", brushed);

        vis.svg.append("g")
            .attr("class", "x brush")
            .call(brush)
            .selectAll("rect")
            .attr("y", -6)
            .attr("height", vis.height + 7);

        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;

        vis.selected_opt = d3.select('#treemap-select').property("value");

        vis.negativeData = [];
        vis.negativeData.push({
            name: "Origin"
        })
        vis.positiveData = [];
        vis.positiveData.push({
            name: "Origin"
        })
        vis.totalData = [];
        vis.totalData.push({
            name: "Origin"
        })

        let clonedArray = vis.data.map(a => {return {...a}})

        let selected_opt = d3.select('#treemap-select').property("value");

        if (selected_opt == "negative") {
            clonedArray = clonedArray.filter(d => d.Rating <= 2)
        } else if (selected_opt == "positive") {
            clonedArray = clonedArray.filter(d => d.Rating >= 4)
        }

        vis.dataCopy = d3.rollup(clonedArray, v => d3.mean(v, d => d.Num_Words), d => d.Timestamp)

        let monthly_data = d3.rollups(vis.dataCopy, v => d3.mean(v, d => d[1]), function (d) {
            let ts = vis.formatDate(d[0]).toString();
            return ts.split('-').slice(0, 2).join('-');
        });

        vis.displayData = d3.map(monthly_data, d => ({timestamp: vis.parseDate(d[0]+"-01"), value: d[1]}));

        vis.displayData.sort((a,b) => a.timestamp - b.timestamp);

        vis.updateVis()
    }

    updateVis() {
        let vis = this;

        // Update domain
        vis.x.domain(d3.extent(vis.displayData, function (d) {
            return d.timestamp;
        }));
        vis.y.domain([0, d3.max(vis.displayData, function (d) {
            return d.value;
        })]);


        // D3 area path generator
        vis.area = d3.area()
            .curve(d3.curveCardinal)
            .x(function (d) {
                return vis.x(d.timestamp);
            })
            .y0(vis.height)
            .y1(function (d) {
                return vis.y(d.value);
            });


        // Call the area function and update the path
        // D3 uses each data point and passes it to the area function. The area function translates the data into positions on the path in the SVG.
        vis.timePath
            .datum(vis.displayData)
            .transition()
            .duration(600)
            .attr("d", vis.area)
            .attr("class", "area");

        // Update axes
        vis.svg.select(".y-axis").transition().duration(600).call(vis.yAxis);
        vis.svg.select(".x-axis").transition().duration(600).call(vis.xAxis);

        vis.timePath.attr("fill", "#656a77");
    }
}