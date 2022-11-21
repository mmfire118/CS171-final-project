class HelpfulChart {
    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;
        // parse date method
        this.parseDate = d3.timeParse("%Y-%m-%d");

        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 20, right: 20, bottom: 20, left: 20};
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

        console.log(vis.data)

        let aggregateData = {};
        for(var key in vis.data) {
            for(let i = 0; i < 5; i++) {
                if(aggregateData[i + 1]) {
                    aggregateData[i + 1] = aggregateData[i + 1] + vis.data[key][i + 1]
                } else {
                    aggregateData[i + 1] = vis.data[key][i + 1]
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

        vis.displayData = {
            children: aggregateArray
        }
        console.log(vis.displayData)

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        var symbolGenerator = d3.symbol()
            .type(d3.symbolStar)
            .size(500);

        var diameter = 600;
        var color = d3.scaleOrdinal(d3.schemeCategory10);

        var bubble = d3.pack(vis.displayData)
            .size([diameter, diameter])
            .padding(1.5);

        var nodes = d3.hierarchy(vis.displayData)
            .sum(function(d) { return d.count; });

        console.log(bubble(nodes).descendants())

        var node = vis.svg.selectAll(".node")
            .data(bubble(nodes).descendants())
            .enter()
            .filter(function(d){
                return  !d.children
            })
            .append("g")
            .attr("class", "node")
            .attr("transform", function(d) {
                return "translate(" + (100 + (parseInt(d.data.rating) * 150) ) + "," + 200 + ")";
            });

        node.append("title")
            .text(function(d) {
                return d.rating + ": " + d.count;
            });

        node.append("path")
            .attr("d", function(d) {
                symbolGenerator.size(d.r * 45);
                return symbolGenerator();
            })
            .style("fill", function(d,i) {
                return color(i);
            });

        node.append("text")
            .attr("dy", ".2em")
            .style("text-anchor", "middle")
            .text(function(d) {
                return d.data.rating.substring(0, d.r / 3);
            })
            .attr("font-family", "sans-serif")
            .attr("font-size", function(d){
                return d.r/8;
            })
            .attr("fill", "white");

        node.append("text")
            .attr("dy", "1.3em")
            .style("text-anchor", "middle")
            .text(function(d) {
                return d.data.count;
            })
            .attr("font-family",  "Gill Sans", "Gill Sans MT")
            .attr("font-size", function(d){
                return d.r/5;
            })
            .attr("fill", "white");

        var node2 = vis.svg.selectAll(".node2")
            .data(bubble(nodes).descendants())
            .enter()
            .filter(function(d){
                return  !d.children
            })
            .append("g")
            .attr("class", "node2")
            .attr("transform", function(d) {
                return "translate(" + (100 + (parseInt(d.data.rating) * 150) ) + "," + 320 + ")";
            });

        node2.append("path")
            .attr("d", function(d) {
             
                    symbolGenerator.size(d.r * 45);
                    return symbolGenerator();
                
            })
            .style("fill", function(d,i) {
                return color(i);
            })
            .style("opacity", function(d,i) {
                if(d.data.rating == "1") {
                    return 0;
                } else {
                    return 1;
                }
            });

        var node3 = vis.svg.selectAll(".node3")
            .data(bubble(nodes).descendants())
            .enter()
            .filter(function(d){
                return  !d.children
            })
            .append("g")
            .attr("class", "node3")
            .attr("transform", function(d) {
                return "translate(" + (100 + (parseInt(d.data.rating) * 150) ) + "," + 440 + ")";
            });

        node3.append("path")
            .attr("d", function(d) {
             
                    symbolGenerator.size(d.r * 45);
                    return symbolGenerator();
                
            })
            .style("fill", function(d,i) {
                return color(i);
            })
            .style("opacity", function(d,i) {
                if(d.data.rating == "1" || d.data.rating == "2") {
                    return 0;
                } else {
                    return 1;
                }
            });

        var node4 = vis.svg.selectAll(".node4")
            .data(bubble(nodes).descendants())
            .enter()
            .filter(function(d){
                return  !d.children
            })
            .append("g")
            .attr("class", "node4")
            .attr("transform", function(d) {
                return "translate(" + (100 + (parseInt(d.data.rating) * 150) ) + "," + 560 + ")";
            });

        node4.append("path")
            .attr("d", function(d) {
             
                    symbolGenerator.size(d.r * 45);
                    return symbolGenerator();
                
            })
            .style("fill", function(d,i) {
                return color(i);
            })
            .style("opacity", function(d,i) {
                if(d.data.rating == "1" || d.data.rating == "2" || d.data.rating == "3") {
                    return 0;
                } else {
                    return 1;
                }
            });
        
        var node5 = vis.svg.selectAll(".node5")
            .data(bubble(nodes).descendants())
            .enter()
            .filter(function(d){
                return  !d.children
            })
            .append("g")
            .attr("class", "node5")
            .attr("transform", function(d) {
                return "translate(" + (100 + (parseInt(d.data.rating) * 150) ) + "," + 680 + ")";
            });

        node5.append("path")
            .attr("d", function(d) {
                symbolGenerator.size(d.r * 45);
                return symbolGenerator();
            })
            .style("fill", function(d,i) {
                return color(i);
            })
            .style("opacity", function(d,i) {
                if(d.data.rating == "1" || d.data.rating == "2" || d.data.rating == "3" || d.data.rating == "4") {
                    return 0;
                } else {
                    return 1;
                }
            });

        d3.select(self.frameElement)
            .style("height", diameter + "px");
    }
}