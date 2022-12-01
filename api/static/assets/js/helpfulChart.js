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

        vis.margin = {top: 0, right: 0, bottom: 0, left: 0};
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

        vis.displayData = aggregateArray

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        var diameter = 600;

        var radiusScale = d3.scaleSqrt()
        .domain(d3.extent(vis.displayData, d => d.count))
        .range([0.2, 1])

        var previousElementY = 25;
        var previousElementHeight = 0;
        let starTerms = ["One Star", "Two Star", "Three Star", "Four Star", "Five Star"]
        vis.displayData.forEach((element, index) => {
            console.log("YES")
            console.log(radiusScale(element.count))
            var node = vis.svg
                .append("g")
                .attr("class", "node")

            let x = vis.width / 2 - (500 * radiusScale(element.count) / 2)
            let width =  500 * radiusScale(element.count);
            let y = previousElementY + previousElementHeight + 100
            node.append("image")
                .attr("href","/static/assets/js/images/" + (index + 1) + "star.svg")
                .attr("x", x)
                .attr("y", y)
                .attr("width", width)
                .attr("height", (500 * (244 / 1284)) * radiusScale(element.count))

            node.append("text")
                .text("Number of Helpful " + starTerms[index] + " Reviews: " + element.count)
                .attr("x", x + (width / 2))
                .attr("y", y - 15)
                .attr("fill", "white")
                .attr("text-anchor", "middle")
            
            previousElementY = y;
            previousElementHeight = (500 * (244 / 1284)) * radiusScale(element.count);
               
        })

        d3.select(self.frameElement)
            .style("height", diameter + "px");
    }
}