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

        vis.dataCopy = vis.data

        vis.dataCopy.forEach(function(part, index, theArray) {
            vis.dataCopy[index].Timestamp = vis.parseDate(theArray[index].Timestamp)
            vis.dataCopy[index].Num_Words = +vis.dataCopy[index].Num_Words;
            vis.dataCopy[index].Rating = +vis.dataCopy[index].Rating;
            if(vis.dataCopy[index].Rating > 3) {
                vis.dataCopy[index]['Positive'] = true;
            } else if(vis.dataCopy[index].Rating === 3) {
                //Ignore(neither positive nor negative)
            } else {
                vis.dataCopy[index]['Positive'] = false;
            }
        })

        vis.minimumDate = d3.min(vis.dataCopy, function(d){ return d.Timestamp })
        vis.maximumDate = d3.max(vis.dataCopy, function(d){ return d.Timestamp })

        vis.dataCopy = d3.group(vis.dataCopy, d => d.Category)


        var totalPositiveAverage = 0;
        var totalNegativeAverage = 0;
        vis.dataCopy.forEach(element => {
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

            let positiveAverage = positiveWordSum / numPositive;
            totalPositiveAverage += positiveAverage;
            let negativeAverage = negativeWordSum / numNegative;
            totalNegativeAverage += negativeAverage;

            vis.negativeData.push({
                name: element[0].Category,
                parent: 'Origin',
                value: negativeAverage,
                category: "Negative"
            });

            vis.positiveData.push({
                name: element[0].Category,
                parent: 'Origin',
                value: positiveAverage,
                category: "Positive"
            });
        });

        totalPositiveAverage = totalPositiveAverage / (vis.positiveData.length - 1)
        totalNegativeAverage = totalNegativeAverage / (vis.negativeData.length - 1)

        vis.totalData.push({
            name: "Positive Reviews",
            parent: 'Origin',
            value: totalPositiveAverage,
            category: "Positive"
        });
        vis.totalData.push({
            name: "Negative Reviews",
            parent: 'Origin',
            value: totalNegativeAverage,
            category: "Negative"
        });

        if(vis.selected_opt === "negative") {
            vis.filteredData = vis.negativeData;
        } else if(vis.selected_opt === "positive") {
            vis.filteredData = vis.positiveData;
        } else {
            vis.filteredData = vis.totalData;
        }

        vis.updateVis()
    }

    updateVis() {
        let vis = this;

        if(vis.selected_opt !== "total") {
            setTimeout(function() {d3.select(".Positive").remove()}, 600);
            setTimeout(function() {d3.select(".Negative").remove()}, 600);
        }
        
        var color = "#2ecc71"
        if (vis.selected_opt == "negative") {
            color = "#e74c3c";
        } else if (vis.selected_opt == "all") {
            color = "#9b59b6"
        }

        vis.max = d3.max(vis.filteredData, d => d.value);
        vis.min = d3.min(vis.filteredData, d => d.value);
        vis.positiveColor = d3.scaleLinear().domain([vis.min, vis.max])
            .range(["white", "#2ecc71"])
        vis.negativeColor = d3.scaleLinear().domain([vis.min, vis.max])
            .range(["white", "#e74c3c"])

        vis.fontScale = d3.scaleLinear().domain([vis.min, vis.max])
            .range([10, 30])
        

        var root = d3.stratify()
            .id(function(d) { return d.name; })
            .parentId(function(d) { return d.parent; })
        
        vis.adjustedData = root(vis.filteredData)

        vis.adjustedData.sum(function(d) { return d.value })

        var map = d3.treemap()
            .size([vis.width, vis.height])
            .padding(4)

        vis.adjustedData = map(vis.adjustedData)

        var node = vis.svg.selectAll("rect")
            .data(vis.adjustedData.leaves(), d=> d.data.name)

        node.exit()
            .attr("fill-opacity", 1)
            .attr("stroke-opacity", 1)
            .transition("stroke")
            .duration(500)
            .attr("fill-opacity", 0)
            .attr("stroke-opacity", 0)
            .remove();

        node.enter()
            .append("rect")
            .merge(node)
            .attr("class", d=> d.data.name.split(' ')[0] + d.data.category)
            .attr("stroke", d=> {
                if(vis.filteredData.length > 3) {
                    if(((vis.max - vis.min) / 2) + vis.min <= d.value) {
                        return "white";
                    } else {
                        return color;
                    }
                } else {
                    return "white";
                }
            })
            .attr("stroke-width", "0")
            .on("click", function(event, d) {
                vis.clickCategory(event, d)
            })
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .attr("cursor", "pointer")
                    .transition("stroke")
                    .duration(200)
                    .attr("stroke-width", "5px")

                d3.select("#treemap-tooltip")
                    .style('left', `${event.pageX - vis.margin.left}px`)
                    .style('top', `${event.pageY - vis.margin.top}px`)
                    d3.select("#treemap-tooltip").classed("hidden", false);

                d3.select("#positiveValue")
                    .text(function() {
                        if(vis.selected_opt === "positive") {
                            return Math.round(d.data.value) + " words";
                        } else {
                            let text = "";
                            vis.positiveData.forEach(element => {
                                if(d.data.name === element.name) {
                                    text = Math.round(element.value) + " words"
                                }
                            })
                            return text;
                        }
                    })
                
                d3.select("#negativeValue")
                    .text(function() {
                        if(vis.selected_opt === "negative") {
                            return Math.round(d.data.value) + " words";
                        } else {
                            let text = "";
                            vis.negativeData.forEach(element => {
                                if(d.data.name === element.name) {
                                    text = Math.round(element.value) + " words"
                                }
                            })
                            return text;
                        }
                    })
            })
            .on("mousemove", function(event, d) {
                d3.select("#treemap-tooltip")
                    .style('left', `${event.pageX - vis.margin.left}px`)
                    .style('top', `${event.pageY - vis.margin.top}px`)
            })
            .on("mouseout", function(event, d) {
                d3.select(this)
                    .transition("stroke")
                    .duration(200)
                    .attr("stroke-width", "0px")

                d3.select("#treemap-tooltip").classed("hidden", true);
            })
            .transition()
            .duration(1000)
            .attr('x', function (d) { return d.x0; })
            .attr('y', function (d) { return d.y0; })
            .attr('width', function (d) { return d.x1 - d.x0; })
            .attr('height', function (d) { return d.y1 - d.y0; })
            .style("fill", d=> {
                if(vis.filteredData.length > 3) {
                    if(d.data.category === "Positive") {
                        return vis.positiveColor(d.data.value)
                    } else {
                        return vis.negativeColor(d.data.value)
                    }
                } else {
                    if(d.data.category === "Positive") {
                        return "#2ecc71";
                    } else {
                        return "#e74c3c";
                    }
                }
            })
            
        var textWrapper = vis.svg.selectAll("g")
            .data(vis.adjustedData.leaves(), d=> d.data.name)

        textWrapper.exit()
            .attr("fill-opacity", 1)
            .attr("stroke-opacity", 1)
            .transition()
            .duration(500)
            .attr("fill-opacity", 0)
            .attr("stroke-opacity", 0)
            .remove();

        var textWrapperEnter = textWrapper.enter()
            .append("g")
            .attr("class", d=> d.data.name.split(' ')[0] + d.data.category)
            .on("mouseover", function(event, d) {
                d3.select(this)
                .attr("cursor", "pointer")

                d3.select("." + d.data.name.split(' ')[0] + d.data.category)
                    .transition("stroke")
                    .duration(200)
                    .attr("stroke-width", "5px")
            })
            .on("mouseout", function(event, d) {
                d3.select("." + d.data.name.split(' ')[0] + d.data.category)
                    .transition("stroke")
                    .duration(200)
                    .attr("stroke-width", "0")
            })
            .on("click", function(event, d) {
                vis.clickCategory(event, d)
            })
            
        textWrapperEnter.append("text")
            .attr("class", "category")

        textWrapperEnter.append("text")
            .attr("class", "value")

        textWrapper = textWrapperEnter.merge(textWrapper)

        textWrapper
            .transition()
            .duration(1000)
            .attr("transform", d=> "translate(" + Math.round((d.x0+10)) + ", " + Math.round(d.y0+20) + ")")

        textWrapper.select("text.category")
            .transition()
            .duration(1000)
            .text(function(d){ 
                if(vis.filteredData.length <= 3 && vis.selected_opt !== "total") {
                    return d.data.name + " " + d.data.category
                } else {
                    return d.data.name
                }
            })
            .attr("font-size", d=> {
                if(vis.filteredData.length <= 3) {
                    return 30;
                } else {
                    return vis.fontScale(d.data.value);
                }
            })
            .attr("font-weight", "600")
            .attr("fill", d=> {
                if(vis.filteredData.length > 3) {
                    if(((vis.max - vis.min) / 2) + vis.min <= d.value) {
                        return "white";
                    } else {
                        return color;
                    }
                } else {
                    return "white";
                }
            })
            .style("transform", function(d) {
                if(d.y1 - d.y0 > d.x1 - d.x0) {
                    if(vis.filteredData.length <= 3) {
                        return "translate(" + (30 * 1.7) + "px, -10px) rotate(90deg) "
                    } else {
                        return "translate(" + (vis.fontScale(d.data.value) * 1.7) + "px, -10px) rotate(90deg) "
                    }
                } else {
                    if(vis.filteredData.length <= 3) {
                        return "translate(0," + (30 / 2) + "px)";
                    } else {
                        return "translate(0," + (vis.fontScale(d.data.value) / 2) + "px)";
                    }
                }
            })
        
        textWrapper.select("text.value")
        .html(d=> 'Avg Length: <tspan font-weight="800">' + Math.round(d.data.value) + ' words</tspan>')
            .transition()
            .duration(1000)
            
            .attr("font-size", d=> {
                if(vis.filteredData.length <= 3) {
                    return 30 * 0.9;
                } else {
                    return vis.fontScale(d.data.value);
                }
            })
            .attr("fill", d=> {
                if(vis.filteredData.length > 3) {
                    if(((vis.max - vis.min) / 2) + vis.min <= d.value) {
                        return "white";
                    } else {
                        return color;
                    }
                } else {
                    return "white";
                }
            })
            .attr("opacity", "0.75")
            .style("transform", d=> {
                if(d.y1 - d.y0 > d.x1 - d.x0) {
                    return "translate(" + (vis.fontScale(d.data.value) / 2) + "px, -10px) rotate(90deg) "
                } else {
                    return "translate(0," + (vis.fontScale(d.data.value) * 1.7) + "px)";
                }
            })
            .style("transform", function(d) {
                if(d.y1 - d.y0 > d.x1 - d.x0) {
                    if(vis.filteredData.length <= 3) {
                        return "translate(" + (30 / 2) + "px, -10px) rotate(90deg) "
                    } else {
                        return "translate(" + (vis.fontScale(d.data.value) / 2) + "px, -10px) rotate(90deg) "
                    }
                } else {
                    if(vis.filteredData.length <= 3) {
                        return "translate(0," + (30 * 1.7) + "px)";
                    } else {
                        return "translate(0," + (vis.fontScale(d.data.value) * 1.7) + "px)";
                    }
                }
            })
    }

    clickCategory(event, d) {
        let vis = this;

        if(vis.filteredData.length > 3) {
            let category = d.data.name
            let newData = [];
            vis.filteredData.forEach(element => {
                if(element.name === category) {
                    newData.push(element)
                    if(vis.selected_opt === "negative") {
                        vis.positiveData.forEach(element => {
                            if(element.name === category) {
                                newData.push(element)
                            }
                        });
                    } else {
                        vis.negativeData.forEach(element => {
                            if(element.name === category) {
                                newData.push(element)
                            }
                        });
                    }
                } else if(element.name === "Origin") {
                    newData.push(element)
                }
            })
            vis.filteredData = newData

            vis.updateVis();
        } else {
            if(d.data.category === "Positive") {
                d3.select("rect." + d.data.name.split(' ')[0] + "Negative").raise()
                d3.select("g." + d.data.name.split(' ')[0] + "Negative").raise()
                d3.select('#treemap-select').property("value", "positive");
                vis.wrangleData();
                return;
            } else if(d.data.category === "Negative") {
                d3.select("rect." + d.data.name.split(' ')[0] + "Positive").raise()
                d3.select("g." + d.data.name.split(' ')[0] + "Positive").raise()
                d3.select('#treemap-select').property("value", "negative");
                vis.wrangleData();
                return
            } else {
                if(d.data.category === "Positive") {
                    d3.select('#treemap-select').property("value", "positive");
                    vis.wrangleData();
                    return
                } else {
                    d3.select('#treemap-select').property("value", "negative");
                    vis.wrangleData();
                    return
                }
            }
        }
    }
}