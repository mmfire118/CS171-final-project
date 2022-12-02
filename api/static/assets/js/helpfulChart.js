class HelpfulChart {
    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;

        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 30, right: 0, bottom: 0, left: 0};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;
        vis.selected_cat = d3.select('#helpful-select').property("value");

        var aggregateData = {};
        if(vis.selected_cat === "all") {
            for(var key in vis.data) {
                for(let i = 0; i < 5; i++) {
                    if(aggregateData[i + 1]) {
                        aggregateData[i + 1] = aggregateData[i + 1] + vis.data[key][i + 1]
                    } else {
                        aggregateData[i + 1] = vis.data[key][i + 1]
                    }
                }
            }
        } else {
            for(let i = 0; i < 5; i++) {
                if(aggregateData[i + 1]) {
                    aggregateData[i + 1] = aggregateData[i + 1] + vis.data[vis.selected_cat][i + 1]
                } else {
                    aggregateData[i + 1] = vis.data[vis.selected_cat][i + 1]
                }
            }
        }

        let aggregateArray = [];
        for(var key in aggregateData) {
            aggregateArray.push({
                rating: key,
                count: aggregateData[key]
            })
        }

        vis.displayData = aggregateArray

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        var radiusScale = d3.scaleSqrt()
            .domain(d3.extent(vis.displayData, d => d.count))
            .range([0.2, 1])

        let starTerms = ["One Star", "Two Star", "Three Star", "Four Star", "Five Star"]

        var images = vis.svg.selectAll("image")
            .data(vis.displayData, d=>d.rating)

        images.exit().remove(); 

        images.enter()
            .append("image")
            .merge(images)
            .attr("href", d=> "/static/assets/js/images/" + d.rating + "star.svg")
            .transition()
            .duration(800)
            .attr("x", d=> vis.width / 2 - (500 * radiusScale(d.count) / 2))
            .attr("y", function(d, i) {
                var y = 50;
                if(i !== 0) {
                    for(let j = 0; j < i; j++) {
                        y += (500 * (244 / 1284)) * radiusScale(vis.displayData[j].count) + 75
                    }
                }
                return y;
            })
            .attr("width", d=> 500 * radiusScale(d.count))
            .attr("height", d=> (500 * (244 / 1284)) * radiusScale(d.count))

        var text = vis.svg.selectAll("text")
            .data(vis.displayData, d=>d.rating)

        text.exit().remove(); 

        text.enter()
            .append("text")
            .merge(text)
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .attr("font-size", "16px")
            .transition()
            .duration(800)
            .text(function(d, i) {
                return "Number of Helpful " + starTerms[i] + " Reviews: " + d3.format(",")(d.count);
            })
            .attr("x", d=> (vis.width / 2) - (500 * radiusScale(d.count) / 2) + (500 * radiusScale(d.count) / 2))
            .attr("y", function(d, i) {
                var y = 30;
                if(i !== 0) {
                    for(let j = 0; j < i; j++) {
                        y += (500 * (244 / 1284)) * radiusScale(vis.displayData[j].count) + 75
                    }
                }
                return y;
            })
    }
}