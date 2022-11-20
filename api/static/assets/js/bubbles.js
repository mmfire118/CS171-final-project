class BubbleVis {
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

        // add title
        vis.svg.append('g')
            .attr('class', 'title')
            .attr('id', 'map-title')
            .append('text')
            .text('Covid Case Statistics in the U.S.')
            .attr('transform', `translate(${vis.width / 2}, 20)`)
            .attr('text-anchor', 'middle');

        vis.wrangleData();
    }
    //Top 25 per category
    wrangleData() {
        let vis = this;

        // console.log(vis.data["Automotive"]["1"]);
        

        let filteredDataNegative = {};

        for(var category in vis.data) {
            let categoryDataNegative = {};
            for(var key in vis.data[category]["1"]) {
                if(vis.data[category]["2"][key]) {
                   let updatedValue = vis.data[category]["1"][key] + vis.data[category]["2"][key];
                   categoryDataNegative[key] = updatedValue;
                //    categoryDataNegative.push({
                //     Word: key,
                //     Value: updatedValue
                //    })
                } else {
                    categoryDataNegative[key] = vis.data[category]["1"][key]
                    // categoryDataNegative.push({
                    //     Word: key,
                    //     Value: vis.data[category]["1"][key]
                    // })
                }
            }
    
            for(var key in vis.data[category]["2"]) {
                if(!vis.data[category]["1"][key]) {
                    categoryDataNegative[key] = vis.data[category]["2"][key]
                    // categoryDataNegative.push({
                    //     Word: key,
                    //     Value: vis.data[category]["2"][key]
                    // })
                }
            }

            for(var key in categoryDataNegative) {
                if(filteredDataNegative[key]) {
                    let updatedValue = filteredDataNegative[key] + categoryDataNegative[key];
                    filteredDataNegative[key] = updatedValue;
                    // filteredDataNegative.push({
                    //  Word: key,
                    //  Value: updatedValue
                    // })
                 } else {
                    filteredDataNegative[key] = categoryDataNegative[key]
                    // filteredDataNegative.push({
                    //      Word: key,
                    //      Value: categoryDataNegative[key].Value
                    //  })
                 }
            }
        }

        let filteredNegativeDataArray = [];
        for(var key in filteredDataNegative) {
            filteredNegativeDataArray.push({
                Word: key,
                Value: filteredDataNegative[key]
            })
        }

        filteredNegativeDataArray.sort((a, b) => b.Value - a.Value)

        

        //take top25
        vis.displayData = {
            "children": filteredNegativeDataArray.slice(0, 25)
        };
        console.log(vis.displayData)

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        var diameter = 600;
        var color = d3.scaleOrdinal(d3.schemeCategory10);

        var bubble = d3.pack(vis.displayData)
            .size([diameter, diameter])
            .padding(1.5);

        var nodes = d3.hierarchy(vis.displayData)
            .sum(function(d) { return d.Value; });

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
                return "translate(" + d.x + "," + d.y + ")";
            });

        node.append("title")
            .text(function(d) {
                return d.Word + ": " + d.Value;
            });

        node.append("circle")
            .attr("r", function(d) {
                return d.r;
            })
            .style("fill", function(d,i) {
                return color(i);
            });

        node.append("text")
            .attr("dy", ".2em")
            .style("text-anchor", "middle")
            .text(function(d) {
                return d.data.Word.substring(0, d.r / 3);
            })
            .attr("font-family", "sans-serif")
            .attr("font-size", function(d){
                return d.r/5;
            })
            .attr("fill", "white");

        node.append("text")
            .attr("dy", "1.3em")
            .style("text-anchor", "middle")
            .text(function(d) {
                return d.data.Value;
            })
            .attr("font-family",  "Gill Sans", "Gill Sans MT")
            .attr("font-size", function(d){
                return d.r/5;
            })
            .attr("fill", "white");

        d3.select(self.frameElement)
            .style("height", diameter + "px");
    }
}