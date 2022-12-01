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

        //TODO: REMOVE STUPID WORDS

        vis.filteredNegativeDataArray.sort((a, b) => b.Value - a.Value)

        //take top25
        vis.displayData = {
            "children": vis.filteredNegativeDataArray.filter(elem => !vis.stopWords.includes(elem.Word)).slice(0, 50)
        };
        //console.log(vis.displayData)

        var diameter = 600;
        var color = d3.scaleOrdinal(d3.schemeCategory10);
        var myColor = d3.scaleLinear().domain([1,8000])
            .range(["white", "green"])

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
        var color = "green"
        if (vis.selected_opt == "negative") {
            color = "red";
        }

        var myColor = d3.scaleLinear().domain([d3.min(vis.simpleNodes, d => d.radius),d3.max(vis.simpleNodes, d => d.radius)])
            .range(["white", color])


        var simulation = d3.forceSimulation(vis.simpleNodes)
            .force('charge', d3.forceManyBody().strength(5))
            .force('center', d3.forceCenter(vis.width / 2, vis.height / 2))
            .force('collision', d3.forceCollide().radius(function(d) {
                return d.radius
            }))
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
                        return myColor(d.radius);
                    })
                    .on("mouseover", function(event, d) {
                        d3.select("#words-tooltip")
                            .style('left', `${event.pageX - vis.margin.left}px`)
                            .style('top', `${event.pageY - vis.margin.top}px`)
                            .select("#value")
                            .text(d.value);
                            
                        d3.select(this).attr("stroke", "black").attr("stroke-width", "5px")

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
                        d3.select(this).attr("stroke", "none").attr("stroke-width", "0px")
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
                    .attr("font-family", "sans-serif")
                    .attr("font-size", function(d){
                        return d.radius/2;
                    })
                    .on("mouseover", function(event, d) {
                        d3.select("#words-tooltip")
                            .style('left', `${event.pageX - vis.margin.left}px`)
                            .style('top', `${event.pageY - vis.margin.top}px`)
                            .select("#value")
                            .text(d.value);

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
                    });
            });
    }

    updateWordFreqText(word) {
        let vis = this;

        console.log(vis.wordFreqText)

        for(var elem in vis.filteredNegativeDataArray) {
            console.log(vis.filteredNegativeDataArray[elem])
            if (word == vis.filteredNegativeDataArray[elem].Word) {
                let value = vis.filteredNegativeDataArray[elem].Value
                vis.wordFreqText.html(`The word \"${word}\" appeared <b>${d3.format(",")(value)}</b> times in our sample.`)
                return
            }
        }

        vis.wordFreqText.html(`The word \"${word}\" did not appear at all in our sample.`)
    }
}