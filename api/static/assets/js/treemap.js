class TreeMap {

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

    wrangleData() {
        let vis = this;

        console.log(vis.data)
        vis.filteredData = [];
        vis.filteredData.push({
            name: "Origin"
        })

        vis.data.forEach(function(part, index, theArray) {
            vis.data[index].Timestamp = vis.parseDate(theArray[index].Timestamp)
            vis.data[index].Num_Words = +vis.data[index].Num_Words;
            vis.data[index].Rating = +vis.data[index].Rating;
            if(vis.data[index].Rating >= 3) {
                vis.data[index]['Positive'] = true;
            } else {
                vis.data[index]['Positive'] = false;
            }
        })

        vis.minimumDate = d3.min(vis.data, function(d){ return d.Timestamp })
        vis.maximumDate = d3.max(vis.data, function(d){ return d.Timestamp })

        vis.data = d3.group(vis.data, d => d.Category)

        
        vis.data.forEach(element => {
            let positiveWordSum = 0;
            let numPositive = 0;

            let negativeWordSum = 0;
            let numNegative = 0;
            
            element.forEach(element => {
                if(element.Positive) {
                    numPositive++;
                    positiveWordSum += element.Num_Words;
                } else {
                    numNegative++;
                    negativeWordSum += element.Num_Words;
                }
            })

            let positiveAvg = positiveWordSum / numPositive;
            let negativeAvg = negativeWordSum / numNegative;
            
            vis.filteredData.push({
                name: element[0].Category,
                parent: 'Origin',
                value: positiveAvg
                // negativeAverage: negativeAvg
            });
        });

        console.log(vis.filteredData)

        vis.updateVis()
    }

    updateVis() {
        let vis = this;

        var root = d3.stratify()
            .id(function(d) { return d.name; })   // Name of the entity (column name is name in csv)
            .parentId(function(d) { return d.parent; })   // Name of the parent (column name is parent in csv)
        
        vis.filteredData = root(vis.filteredData)

        vis.filteredData.sum(function(d) { return d.value })

        var map = d3.treemap()
            .size([vis.width, vis.height])
            .padding(4)

        vis.filteredData = map(vis.filteredData)

        console.log(vis.filteredData.leaves())

        vis.svg
            .selectAll("rect")
            .data(vis.filteredData.leaves())
            .enter()
            .append("rect")
            .attr('x', function (d) { return d.x0; })
            .attr('y', function (d) { return d.y0; })
            .attr('width', function (d) { return d.x1 - d.x0; })
            .attr('height', function (d) { return d.y1 - d.y0; })
            .style("stroke", "black")
            .style("fill", "#69b3a2");

        // and to add the text labels
        vis.svg
            .selectAll("labels")
            .data(vis.filteredData.leaves())
            .enter()
            .append("text")
            .attr("x", function(d){ return d.x0+10})    // +10 to adjust position (more right)
            .attr("y", function(d){ return d.y0+20})    // +20 to adjust position (lower)
            .text(function(d){ return d.data.name})
            .attr("font-size", "12px")
            .attr("fill", "white")
    }

}