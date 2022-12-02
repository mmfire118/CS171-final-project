class BubbleVis {
    constructor(parentElement, data, stopWords, wordFreqTextID) {
        this.parentElement = parentElement;
        this.data = data;
        this.stopWords = stopWords;
        this.wordFreqTextID = wordFreqTextID;

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

        vis.wordFreqText = d3.select("#"+vis.wordFreqTextID)

        vis.wrangleData();
    }
    //Top 25 per category
    wrangleData() {
        let vis = this;

        // console.log(vis.data["Automotive"]["1"]);
        vis.selected_opt = d3.select('#words-select').property("value");

        if(vis.selected_opt === "all") {
            console.log(vis.data)
            let categoryDataNegative = [];
            for(var category in vis.data) {
                for(let i = 0; i < 5; i++) {
                    for(var key in vis.data[category][i+1]) {
                        categoryDataNegative.push({
                            word: key,
                            value: vis.data[category][i+1][key]
                        })
                    }
                }
            }
    
            console.log(categoryDataNegative)
    
            let rollup = d3.rollup(categoryDataNegative, v => d3.sum(v, d => d.value), d=> d.word)

            vis.filteredNegativeDataArray = [];
            for (const [key, value] of rollup) {
                vis.filteredNegativeDataArray.push({
                    Word: key, 
                    Value: value
                });
            }

            console.log("THIS IS IT")
            console.log(vis.filteredNegativeDataArray)
    
        } else {
            let stars = ["1", "2"]
            if (vis.selected_opt == "positive") {
                stars = ["4", "5"]
            }
    
            let filteredDataNegative = {};
    
            for(var category in vis.data) {
                let categoryDataNegative = {};
                for(var key in vis.data[category][stars[0]]) {
                    if(vis.data[category][stars[1]][key]) {
                       let updatedValue = vis.data[category][stars[0]][key] + vis.data[category][stars[1]][key];
                       categoryDataNegative[key] = updatedValue;
                    } else {
                        categoryDataNegative[key] = vis.data[category][stars[0]][key]
                    }
                }
        
                for(var key in vis.data[category][stars[1]]) {
                    if(!vis.data[category][stars[0]][key]) {
                        categoryDataNegative[key] = vis.data[category][stars[1]][key]
                    }
                }
    
                for(var key in categoryDataNegative) {
                    if(filteredDataNegative[key]) {
                        let updatedValue = filteredDataNegative[key] + categoryDataNegative[key];
                        filteredDataNegative[key] = updatedValue;
                     } else {
                        filteredDataNegative[key] = categoryDataNegative[key]
                     }
                }
            }

            vis.filteredNegativeDataArray = [];
            for(var key in filteredDataNegative) {
                // if (!vis.stopWords.includes(key)) {
                    vis.filteredNegativeDataArray.push({
                        Word: key,
                        Value: filteredDataNegative[key]
                    })
                // }
            }
    
        }
       

        //TODO: REMOVE STUPID WORDS

        vis.filteredNegativeDataArray.sort((a, b) => b.Value - a.Value)

        //take top25
        vis.displayData = {
            "children": vis.filteredNegativeDataArray.filter(elem => !vis.stopWords.includes(elem.Word)).slice(0, 50)
        };
        //console.log(vis.displayData)

        vis.organizeData();
    }

    organizeData() {
        let vis = this;

        var diameter = 600;

        var bubble = d3.pack(vis.displayData)
            .size([diameter, diameter])
            .padding(1.5);

        vis.nodes = d3.hierarchy(vis.displayData)
            .sum(function(d) { return d.Value; });

        vis.simpleNodes = []
        bubble(vis.nodes).descendants().forEach((element, index) => {
            if(index !== 0) {
                vis.simpleNodes.push({
                    word: element.data.Word,
                    value: element.data.Value,
                    radius: element.r
                })
            }
        })

        vis.updateVis();
    }

    updateVis() {
        let vis = this;
        var color = "#2ecc71"
        if (vis.selected_opt == "negative") {
            color = "#e74c3c";
        } else if (vis.selected_opt == "all") {
            color = "#9b59b6"
        }

        vis.max = d3.max(vis.simpleNodes, d => d.radius);
        vis.min = d3.min(vis.simpleNodes, d => d.radius);
        vis.myColor = d3.scaleLinear().domain([vis.min, vis.max])
            .range(["white", color])
        
        vis.myColorInverted = d3.scaleLinear().domain([d3.min(vis.simpleNodes, d => d.radius), d3.max(vis.simpleNodes, d => d.radius)])
            .range([color, "white"])


        vis.simulation = d3.forceSimulation(vis.simpleNodes)
            .force("forceX", d3.forceX().strength(.06).x(vis.width * .5))
            .force("forceY", d3.forceY().strength(.06).y(vis.height * .5))
            .force("center", d3.forceCenter().x(vis.width * .5).y(vis.height * .5))
            .force("charge", d3.forceManyBody().strength(-15))
            .force('collision', d3.forceCollide().strength(.5).radius(function(d){ return d.radius + 2.5; }).iterations(1))
            .nodes(vis.simpleNodes)
            .on('tick', function() {
                vis.svg
                    .selectAll('circle')
                    .data(vis.simpleNodes)
                    .join('circle')
                    .attr('r', function(d) {
                        return d.radius
                    })
                    .attr('cx', function(d) {
                        return d.x
                    })
                    .attr('cy', function(d) {
                        return d.y
                    })
                    .style("fill", function(d,i) {
                        return vis.myColor(d.radius);
                    })
                    .call(d3.drag()
                        .on("start", function(event, d) {
                            if (!event.active) vis.simulation.alphaTarget(0.2).restart();
                            d.fy = d.y;
                            d.fx = d.x;
                        })
                        .on("drag", function(event, d) {
                            d.fx = event.x;
                            d.fy = event.y;
                        })
                        .on("end", function(event, d) {
                            if (!event.active) vis.simulation.alphaTarget(0);
                            d.fx = null;
                            d.fy = null;
                        }))
                    .on("mouseover", function(event, d) {
                        d3.select("#words-tooltip")
                            .style('left', `${event.pageX - vis.margin.left}px`)
                            .style('top', `${event.pageY - vis.margin.top}px`)
                            .select("#value")
                            .text(d.value);
                            
                        d3.select(this)
                            .style('cursor', 'pointer')
                            .transition()
                            .duration(400)
                            .attr("stroke", d=> {
                                if(((vis.max - vis.min) / 2) + vis.min <= d.radius) {
                                    return "white";
                                } else {
                                    return color;
                                }
                            })
                            .attr("stroke-width", "5px")

                        d3.select("#words-tooltip").classed("hidden", false);
                    })
                    .on("mousemove", function(event) {
                        let coords = d3.pointer(event);
                        d3.select("#words-tooltip")
                            .style('left', `${event.pageX - vis.margin.left}px`)
                            .style('top', `${event.pageY - vis.margin.top}px`)
                    })
                    .on("mouseout", function() {
                        d3.select("#words-tooltip").classed("hidden", true);
                        d3.select(this)
                            .style('cursor', 'pointer')
                            .transition()
                            .duration(400)
                            .attr("stroke-width", "0px")
                    });

                vis.svg
                    .selectAll('text')
                    .data(vis.simpleNodes)
                        .join('text')
                    .text(function(d) {
                        return d.word
                    })
                    .attr("x", function(d) {
                        return d.x
                    })
                    .attr("y", function(d) {
                        return d.y + (d.radius/5)
                    })
                    .style("text-anchor", "middle")
                    .attr("font-family", "'Montserrat',Helvetica,Arial,serif")
                    .attr("font-size", function(d){
                        return d.radius/2.25;
                    })
                    .attr("font-weight", "500")
                    .attr("fill", d=> {
                        if(((vis.max - vis.min) / 2) + vis.min <= d.radius) {
                            return "white";
                        } else {
                            return color;
                        }
                    })
                    .on("mouseover", function(event, d) {
                        d3.select("#words-tooltip")
                            .style('left', `${event.pageX - vis.margin.left}px`)
                            .style('top', `${event.pageY - vis.margin.top}px`)
                            .select("#value")
                            .text(d.value);
                        
                        d3.select(this)
                            .style('cursor', 'pointer')

                        d3.select("#words-tooltip").classed("hidden", false);
                    })
                    .on("mousemove", function(event) {
                        let coords = d3.pointer(event);
                        d3.select("#words-tooltip")
                            .style('left', `${event.pageX - vis.margin.left}px`)
                            .style('top', `${event.pageY - vis.margin.top}px`)

                        d3.select(this)
                            .style('cursor', 'pointer')
                    })
                    .on("mouseout", function() {
                        d3.select("#words-tooltip").classed("hidden", true);
                    });
            });
    }

    updateWordFreqText(word) {
        let vis = this;
        let lowerCaseWord = word.toLowerCase();
        
        for(var elem in vis.filteredNegativeDataArray) {
            if (lowerCaseWord == vis.filteredNegativeDataArray[elem].Word) {
                let value = vis.filteredNegativeDataArray[elem].Value

                if (!vis.displayData["children"].find(e => e.Word === lowerCaseWord)) {
                    vis.addBubble(lowerCaseWord, value);
                    vis.wordFreqText.html(`The word \"${lowerCaseWord}\" appeared <b>${d3.format(",")(value)}</b> times in our sample.`)
                } else {
                    vis.wordFreqText.html(`The word \"${lowerCaseWord}\" appeared <b>${d3.format(",")(value)}</b> times in our sample. (It was already added to the graph)`)
                }
                
                return
            }
        }

        vis.wordFreqText.html(`The word \"${lowerCaseWord}\" did not appear at all in our sample.`)
    }

    addBubble(word, value) {
        let vis = this;

        vis.displayData["children"].push({
            Word: word,
            Value: value
        })
        
        var diameter = 600;

        var bubble = d3.pack(vis.displayData)
            .size([diameter, diameter])
            .padding(1.5);

        vis.nodes = d3.hierarchy(vis.displayData)
            .sum(function(d) { return d.Value; });

        bubble(vis.nodes).descendants().forEach((element, index, array) => {
            if(index !== 0) {
                if(word !== element.data.Word) {
                    vis.simpleNodes[index - 1].radius = element.r;
                } else {
                    vis.simpleNodes.push({
                        word: element.data.Word,
                        value: element.data.Value,
                        radius: element.r
                    })
                }
            }
        })

        vis.myColor
            .domain([d3.min(vis.simpleNodes, d => d.radius), d3.max(vis.simpleNodes, d => d.radius)])

        vis.simulation.nodes(vis.simpleNodes);
        vis.simulation.alpha(1).restart();
    }
}