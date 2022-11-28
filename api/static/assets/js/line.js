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
            .attr('transform', `translate(-35,${vis.height/2})rotate(-90)`)
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

        vis.minimumDate = d3.min(vis.data, function(d){ return d.Timestamp });
        vis.maximumDate = d3.max(vis.data, function(d){ return d.Timestamp });

        if (vis.rollupFunction == "avg-rating"){
            vis.wrangleAvgRatingData();
        }
        else if (vis.rollupFunction == "sum-reviews"){
            vis.wrangleNumReviewsData();
        }
        else {
            console.log("ERROR: Invalid rollupFunction value");
        }
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

        vis.x.domain([vis.minimumDate, vis.maximumDate]);
        vis.y.domain([0, d3.max(d3.map(vis.displayData, d => d3.max(d.dates, x => x.value)))]);

        var color = d3.scaleOrdinal().domain(vis.keys)//d3.map(vis.displayData, d => d.category))
            .range(["#37d51a", "#330bf5", "#a00114", "#35c6fd", "#fe90ff", "#3e5517", "#eeae0f", "#e3aca2", "#23499e", "#34d09f", "#8c2062", "#335261", "#a8c456", "#7c10a9", "#714130", "#beb0f2", "#8fc3b7", "#faa567", "#bebb89", "#1c35d4", "#25d36e", "#fc9ad0", "#5d446b", "#195842", "#8e283b", "#73308a", "#d4b658", "#88cb1f", "#28ccce", "#65490a", "#acbacf", "#84360f", "#c5bd26", "#8bc788", "#3d3db3", "#0f5b03", "#61474d", "#19507f", "#4b5039", "#e1a9c4", "#7bcc62", "#6c06c9", "#bdb8ac", "#92bbf2", "#dca2fe", "#72c4da", "#7a384e", "#fd9dae", "#fca18b", "#e2af7e", "#fea53e", "#60d145", "#78346c", "#52428a", "#0729ea", "#5a4d24", "#babe71", "#76c8ab", "#e2a5dc", "#892f27", "#05cbe5", "#1d5922", "#35534d", "#30d287", "#990a4f", "#d0b1b8", "#06d553", "#a2c294", "#5e27be", "#7f1c94", "#32ceb7", "#eaae4c", "#d1b496", "#bfb3db", "#8e1476", "#9d0433", "#a1c637", "#fd95e8", "#922602", "#64339e", "#5e4a39", "#424a7f", "#94c770", "#544f08", "#474c6b", "#74411a", "#dbb607", "#38552e", "#4d4e4d", "#7f373b", "#8a294f", "#bfbd57", "#e6ae66", "#6fcd7b", "#83cc46", "#d8b63b", "#d0b772", "#4b3f9e", "#68d01c", "#4f16df", "#6ece54", "#74ca94", "#345705", "#6ac7ce", "#f69fc5", "#214b94", "#acbcb8", "#6d4244", "#96beda", "#584861", "#613894", "#b6c048", "#afc323", "#91261d", "#aac17d", "#7d2d76", "#ee9cf3", "#b6bca1", "#664357", "#bfb5c4", "#6f3680", "#f2aa5a", "#05556b", "#60c9c3", "#534b57", "#6a4525", "#743962", "#e9ab8a", "#8fc1cf", "#73c0fd", "#d1aed0", "#a4bfac", "#a8b5fe", "#125375", "#843145", "#662ca9", "#971b28", "#165657", "#8ec5a0", "#76ce34", "#f7a2a2", "#7f3258", "#abb7e6", "#8ec955", "#63cf6f", "#f0a3b9", "#1e4e89", "#3d38be", "#045938", "#e9a8ad", "#7a3c26", "#26c8f1", "#e8a1e7", "#6b3b75", "#f5a67f", "#7ac2e6", "#d7a6f3", "#d1aae7", "#c3acfe", "#f0a796", "#475223", "#ccba4a", "#931d45", "#f6a92c", "#e3b229", "#c8ba65", "#812580", "#b1c164", "#eeaa73", "#2445a9", "#4ed333", "#4f21d4", "#53d161", "#152fdf", "#213ac9", "#4f2ac9", "#5c2eb4", "#9dc47c", "#cdb77e", "#5bcf7b", "#2a572e", "#75410d", "#524f18", "#86ca6f", "#8b2f01", "#991904", "#94c936", "#d4b38a", "#851a8a", "#890595", "#791f9f", "#6a1abe", "#21d544", "#40d353", "#14d293", "#883031", "#61cbab", "#574d2f", "#484394", "#055b15", "#4c3ba9", "#85c894", "#7bca88", "#c3bd39", "#83361c", "#644919", "#79ce1e", "#6c3194", "#2d5643", "#7fc6b7", "#abc348", "#a5c463", "#842b62", "#55cd9f", "#405506", "#325716", "#9f021f", "#98b8fe", "#97c0c3", "#e8ae59", "#f29fd0", "#5bc7da", "#dcb366", "#514d43", "#d1b903", "#4d4b61", "#4f467f", "#67463a", "#c5b2cf", "#cbaedb", "#dcb096", "#e0b24b", "#f3aa4c", "#d4b0ad", "#dbadb9", "#b8b9b8", "#a5badb", "#6d450b", "#43ccc2", "#04584c", "#624461", "#52486b", "#f89adc", "#3c5157", "#89226c", "#8f1f59", "#644644", "#414f61", "#951c3c", "#9ebdcf", "#c4b5b8", "#b2b9c4", "#6a424e", "#aabfa0", "#b1bcac", "#a5bdc3", "#caba58", "#872a58", "#484e57", "#574a4d", "#394f6b", "#5b4a43", "#c6b895", "#cbb1c4", "#42514d", "#c9b5ad", "#475043", "#405339", "#5d4757", "#b9b6cf", "#5d4c09", "#deb259", "#8c2845", "#b3be89", "#205461", "#14d0ab", "#c2b8a1", "#d8b0a1", "#694630", "#e7a4d0", "#87c3c3", "#4a5207", "#6cc9b7", "#3b5343", "#624925", "#384794", "#554d39", "#d7b37e", "#505024", "#52cf87", "#cab78a", "#ffa52d", "#6cc2f2", "#614075", "#dfacad", "#14592e", "#235738", "#314d7f", "#fa9eb9", "#e5a8b9", "#b2b7db", "#a2b8f2", "#773958", "#faa297", "#94c594", "#7ec8a0", "#2d5457", "#7d3844", "#27526b", "#b1b4f2", "#96c3ac", "#dca9d0", "#81bff2", "#7dc4cf", "#ecab7f", "#6b3f61", "#7c3362", "#6c451a", "#75c6c3", "#fba55a", "#653c80", "#69378a", "#6f3e58", "#babb95", "#f39be7", "#e89dff", "#812c6c", "#a6c189", "#b6be7d", "#902728", "#a3c622", "#553e94", "#8cbee6", "#753d44", "#50cace", "#265904", "#b4c157", "#803731", "#773d3a", "#86303b", "#335538", "#44532e", "#7b3c1b", "#724126", "#3e4d75", "#354a89", "#4b4975", "#60492f", "#f896f3", "#b8b3e7", "#cdb4a1", "#9cc2a0", "#aebf95", "#40d17b", "#24564d", "#225916", "#2e5723", "#3acada", "#47c8e6", "#823627", "#8a2f1c", "#dda6e7", "#d7aadb", "#eda0dc", "#87c6ac", "#5b4c18", "#5b417f", "#454789", "#5e3d8a", "#743576", "#703a6c", "#dfaf8a", "#f3a68b", "#ffa17f", "#f3a3ae", "#82314e", "#723e4e", "#85c1da", "#64c5e6", "#e2a1f3", "#d0a7fe", "#87bcfe", "#9cbbe6", "#d6adc4", "#eca4c5", "#4e502f", "#2d5075", "#2442b3", "#90c77c", "#99c588", "#bac024", "#7c3c0e", "#782e80", "#8f2732", "#673f6b", "#574575", "#c2bb7d", "#9ec0b8", "#c5afe7", "#b6b0fe", "#cbabf2", "#793c30", "#6f423a", "#9bc656", "#45d093", "#eda7a2", "#e6ab96", "#3b5523", "#495217", "#51c5f1", "#5ac3fd", "#9c063c", "#970d59", "#91126c", "#f5a93e", "#e2b23c", "#cfb927", "#dab372", "#981a1e", "#6bcb9f", "#a1c470", "#adc338", "#c1bd49", "#68cd88", "#583a9e", "#47ceab", "#5ad154", "#2ed532", "#7415b4", "#7c278a", "#8b2f10", "#3a449e", "#f0aa67", "#aec170", "#8a1780", "#c5ba71", "#e4b20b", "#f7a912", "#9b0846", "#ceb93a", "#4e36b3", "#69cf62", "#7fcc55", "#73ce45", "#9e0329", "#6f2a9f", "#7222a9", "#b8c038", "#60cd93", "#3a25df", "#53d31b", "#3c41a9", "#d2b665", "#d6b64a", "#91c947", "#86cc35", "#81ca7c", "#e4af72", "#d9b628", "#98c763", "#5a34a9", "#922611", "#9ec647", "#961b32", "#852376", "#ebae3d", "#54ccb7", "#762894", "#4f30be", "#6924b4", "#911e4f", "#bdbd64", "#371bea", "#48d344", "#64d034", "#fda54d", "#5f0fd4", "#5f1ec9", "#75cc6f", "#8ac963", "#233ebe", "#96c920", "#4bd16e", "#35d361", "#3c2dd4", "#3d33c9", "#f8a673", "#830b9f", "#940f62", "#edae2b", "#f397ff", "#991a13"])

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
            .curve(d3.curveNatural);

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
