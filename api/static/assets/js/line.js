class LineVis {
    constructor(parentElement, dropdownId, yAxisText, rollupFunction, data){
        this.parentElement = parentElement;
        this.dropdownId = dropdownId
        this.data = data;
        this.rollupFunction = rollupFunction;
        this.yAxisText = yAxisText;

        // date methods
        this.parseDate = d3.timeParse("%Y-%m-%d");
        this.formatDate = d3.timeFormat("%Y-%m-%d");

        this.initVis()
    }

    initVis(){
        let vis = this;

        vis.margin = {top: 60, right: 20, bottom: 50, left: 60};
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
            .attr('transform', `translate(${vis.width / 2}, ${vis.height+(vis.margin.bottom * 0.7)})`)
            .attr('text-anchor', 'middle');

        // add y axis text
        vis.svg.append('g')
            .attr('class', 'axis-text')
            .append('text')
            .text(vis.yAxisText)
            .attr('transform', `translate(-50,${vis.height/2})rotate(-90)`)
            .attr('text-anchor', 'middle');

        /* tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'barTooltip') */

        // Scales
        vis.x = d3.scaleTime()
            .range([0, vis.width]);

        vis.y = d3.scaleLinear()
            .range([vis.height, 0]);

        // Axes
        vis.yAxis = d3.axisLeft()
            .scale(vis.y);

        vis.svg.append("g")
            .attr("class", "y-axis axis");

        vis.xAxis = d3.axisBottom()
            .scale(vis.x);

        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + vis.height + ")");

        if (vis.rollupFunction == "avg-rating"){
            vis.wrangleAvgRatingData();
        }
        else if (vis.rollupFunction == "sum-reviews"){
            vis.wrangleNumReviewsData();
        }
        else {
            console.log("ERROR: Invalid rollupFunction value");
        }

        // Create and manage tooltip
        let tooltipGroup = vis.svg.append("g")
            .style("display", "none")
            .attr("class", "line-tooltip");

        tooltipGroup.append("line")
            .attr("x1", "0")
            .attr("y1", 0)
            .attr("x2", "0")
            .attr("y2", vis.height)
            .attr("stroke", "#656a77")
            .attr("stroke-width", 2);

        let tooltipValText = tooltipGroup.append("text")
            .attr("id", "tooltip-value")
            .attr("x", 10)
            .attr("y", 15)

        let tooltipDateText = tooltipGroup.append("text")
            .attr("id", "tooltip-date")
            .attr("x", 10)
            .attr("y", 45)

        let bisectDate = d3.bisector(d=>d.timestamp).left;

        vis.svg.append("rect")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr("x", 0)
            .attr("y", 0)
            .attr("opacity", 0)
            .on("mouseover", () => tooltipGroup.style("display", null))
            .on("mouseout", () => tooltipGroup.style("display", "none"))
            .on("mousemove", (event) => {
                let mouseX = d3.pointer(event)[0];
                let mousePosDate = vis.x.invert(mouseX);
                let closestDateIndex = bisectDate(vis.displayData[0].dates, mousePosDate);

                tooltipGroup.attr("transform", "translate("+mouseX+", 0)");
                if (vis.rollupFunction == "avg-rating"){
                    tooltipValText.text(vis.displayData[0].dates[closestDateIndex].value.toFixed(3));
                }
                else if (vis.rollupFunction == "sum-reviews"){
                    tooltipValText.text(vis.displayData[0].dates[closestDateIndex].value.toLocaleString("en-US"));
                }
                else {
                    console.log("ERROR: Invalid rollupFunction value");
                }
                tooltipDateText.text(d3.timeFormat("%Y-%m-%d")(mousePosDate));

                if (mouseX < 100) {
                    tooltipDateText.attr("text-anchor", "start")
                    tooltipDateText.attr("x", "10")
                    tooltipValText.attr("text-anchor", "start")
                    tooltipValText.attr("x", "10")
                }
                else if (mouseX > vis.width - 100) {
                    tooltipDateText.attr("text-anchor", "end")
                    tooltipDateText.attr("x", "-10")
                    tooltipValText.attr("text-anchor", "end")
                    tooltipValText.attr("x", "-10")
                }
            });
    }

    wrangleAvgRatingData() {
        let vis = this;

        let rollupData = d3.rollup(vis.data, v => d3.mean(v, d => d.Rating), d => d.Category, d => d.Timestamp)

        vis.keys = d3.map(rollupData.keys(), d=>d);
        vis.data = []

        let all_dates_daily = []

        vis.keys.forEach(function (key) {
            let daily_data = Array.from(rollupData.get(key), ([key, value]) => ({
                timestamp: key,
                value: value
            }));
            daily_data.sort((a,b) => a.timestamp - b.timestamp);

            all_dates_daily = all_dates_daily.concat(daily_data);

            let monthly_data = d3.rollups(daily_data, v => d3.mean(v, d => d.value), function (d) {
                let ts = vis.formatDate(d.timestamp).toString();
                return ts.split('-').slice(0, 2).join('-');
            });

            monthly_data = d3.map(monthly_data, d => ({timestamp: vis.parseDate(d[0]+"-01"), value: d[1]}));

            vis.data.push({category: key, dates: monthly_data});
        });

        // Averaging all dates for "Total Category"
        vis.avg_all_ratings_monthly = d3.rollups(all_dates_daily, v => d3.mean(v, d => d.value), function (d) {
            let ts = vis.formatDate(d.timestamp).toString();
            return ts.split('-').slice(0, 2).join('-');
        });
        vis.avg_all_ratings_monthly = d3.map(vis.avg_all_ratings_monthly, d => ({timestamp: vis.parseDate(d[0]+"-01"), value: d[1]}));
        vis.avg_all_ratings_monthly.sort((a,b) => a.timestamp - b.timestamp);

        vis.keys.sort();

        vis.keys.splice(0, 0, "Total (across all categories)");

        vis.dropdownOptions = d3.select("#"+vis.dropdownId).selectAll("option")
            .data(vis.keys)
            .enter()
            .append("option")
            .text(d => d)
            .attr(d => d);

        vis.filterData();
    }

    wrangleNumReviewsData(){
        let vis = this;

        let rollupData = d3.rollup(vis.data, v => v.length, d => d.Category, d => d.Timestamp)

        vis.keys = d3.map(rollupData.keys(), d=>d);
        vis.data = []

        vis.keys.forEach(function (key) {
            let daily_data = Array.from(rollupData.get(key), ([key, value]) => ({
                timestamp: key,
                value: value
            }));
            daily_data.sort((a,b) => a.timestamp - b.timestamp);

            let monthly_data = d3.rollups(daily_data, v => d3.sum(v, d => d.value), function (d) {
                let ts = vis.formatDate(d.timestamp).toString();
                return ts.split('-').slice(0, 2).join('-');
            });

            monthly_data = d3.map(monthly_data, d => ({timestamp: vis.parseDate(d[0]+"-01"), value: d[1]}));

            vis.data.push({category: key, dates: monthly_data});
        });

        vis.keys.sort();

        vis.keys.splice(0, 0, "Total (across all categories)");

        vis.dropdownOptions = d3.select("#"+vis.dropdownId).selectAll("option")
            .data(vis.keys)
            .enter()
            .append("option")
            .text(d => d)
            .attr(d => d);

        vis.filterData();
    }

    filterData(){
        let vis = this;

        let selected_opt = d3.select('#'+vis.dropdownId).property("value");

        if (selected_opt == "Total (across all categories)") {
            let all_dates = vis.data.reduce(
                function (acc, cur) {
                    return Array.from(acc).concat(cur.dates, [])
                });

            all_dates.sort((a,b) => a.timestamp - b.timestamp);

            if (vis.rollupFunction == "avg-rating"){
                vis.displayData = [{category: "Total", dates: vis.avg_all_ratings_monthly}];
            }
            else if (vis.rollupFunction == "sum-reviews"){
                let all_unique_dates = d3.rollups(all_dates, v => d3.sum(v, d => d.value), d => d.timestamp);

                all_unique_dates = Array.from(all_unique_dates, ([key, value]) => ({
                    timestamp: key,
                    value: value
                }));

                vis.displayData = [{category: "Total", dates: all_unique_dates}];
            }
            else {
                console.log("ERROR: Invalid rollupFunction value");
            }
        }
        /*else if (selected_opt == "all"){
            vis.displayData = vis.data;
        }*/
        else {
            vis.displayData = vis.data.filter(elem => elem.category == selected_opt);
        }

        vis.updateVis();
    }

    updateVis(){
        let vis = this;

        vis.minimumDate = d3.min(vis.displayData[0].dates, function(d){ return d.timestamp });
        vis.maximumDate = d3.max(vis.displayData[0].dates, function(d){ return d.timestamp });

        vis.x.domain([vis.minimumDate, vis.maximumDate]);
        vis.y.domain([0, d3.max(d3.map(vis.displayData, d => d3.max(d.dates, x => x.value)))]);

        var color = d3.scaleOrdinal().domain(vis.keys)//d3.map(vis.displayData, d => d.category))
            .range(["#17ff92"]);//.range(["#17ff92", "#ff1361", "#5a87ff", "#fcf38c"]);

        // Update axis by calling the axis function
        vis.svg.select(".y-axis")
            .transition()
            .duration(800)
            .call(vis.yAxis);

        vis.svg.select(".x-axis")
            .transition()
            .duration(800)
            .call(vis.xAxis)
        
        // Update Line
        let lineInside = d3.line()
            .x(d => vis.x(d.timestamp))
            .y(d => vis.y(d.value))
            .curve(d3.curveMonotoneX);

        let lines = vis.svg.selectAll(".line")
            .data(vis.displayData, d => d.category);

        lines.exit()
            .transition()
            .duration(400)
            .attr("stroke", "rgba(255,255,255,0)")
            .remove();

        lines.enter()
            .append("path")
            .attr("class", "line")
            .attr("stroke", "rgba(255,255,255,0)")
            .transition()
            .duration(800)
            .attr("d", d => lineInside(d.dates))
            .attr("fill", "none")
            .attr("stroke", d => color(d.category))
            .attr("stroke-width", 1);
    }
}
