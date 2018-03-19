class Graph {
    constructor(parent, limit, range) {
        this.parent = d3.select(parent);
        this.width = this.parent.node().offsetWidth;
        this.height = this.parent.node().offsetHeight;
        this.range = range;
        this.limit = limit;
        this.margin = {
            top: this.height * 0.05,
            bottom: this.height * 0.25,
            left: this.width * 0.08,
            right: this.width * 0.04,
            volume: 30
        };
        this.scale = {
            y: d3.scaleLinear().range([this.height - this.margin.bottom, this.margin.top]),
            x: d3.scaleTime().range([this.margin.left, this.width - this.margin.right]),
            v: d3.scaleLinear().range([this.height - this.margin.volume, this.height - this.margin.bottom + this.margin.volume])
        };
    }
    init() {
        this.chart = this.parent
            .append("svg")
            .attr("id", "chart")
            .attr("width", this.width)
            .attr("height", this.height);
        this.tooltip = {
            y: {
                text: this.parent
                    .append("div")
                    .classed("tooltip-y", true)
                    .classed("tooltip", true)
                    .style("left", `${this.margin.left * 0.5 - 5}px`)
                    .style("width", `${this.margin.left * 0.8}px`),

                line: this.parent
                    .append("div")
                    .classed("tooltip-y-line", true)
                    .classed("tooltip-line", true)
                    .style("right", `${this.margin.right}px`)
                    .style("width", `${this.width - this.margin.right - this.margin.left + ((this.margin.left - this.parent.select(".tooltip-y").node().offsetWidth) * 0.5) + 6}px`),

                scale: d3.scaleTime()
                    .domain([this.margin.left, this.width - this.margin.right])
            },
            x: {
                text: this.parent
                    .append("div")
                    .classed("tooltip-x", true)
                    .classed("tooltip", true)
                    .style("bottom", `${this.margin.volume * 0.1}px`)
                    .style("transform", "translateX(-50%)"),

                line: this.parent
                    .append("div")
                    .classed("tooltip-x-line", true)
                    .classed("tooltip-line", true)
                    .style("top", `${this.margin.top * 0.5}px`)
                    .style("height", `${this.height - this.margin.volume - this.margin.top * 0.33}px`),

                scale: d3.scaleLinear()
                    .domain([this.height - this.margin.bottom, this.margin.top]),

                scaleV: d3.scaleLinear()
                    .domain([this.height - this.margin.volume, this.height - this.margin.bottom + this.margin.volume])
            },
            price: {
                text: this.parent
                    .append("div")
                    .classed("tooltip-price", true)
                    .classed("tooltip", true)
                    .classed("shown", true)
                    .style("left", `${this.margin.left * 0.5 - 5}px`),
                line: this.parent
                    .append("div")
                    .classed("tooltip-price-line", true)
                    .classed("tooltip-line", true)
                    .classed("shown", true)
                    .style("right", `${this.margin.right}px`)
                    .style("width", `${this.width - this.margin.right - this.margin.left + ((this.margin.left - this.parent.select(".tooltip-price").node().offsetWidth) * 0.5) + 6}px`)
            }
        };
        this.chart
            .on("wheel", () => {
                const max = 1200;
                const min = 50;
                const scroll = parseInt(d3.event.deltaY * 0.5);
                if (!(this.limit >= max && scroll > 0) || (this.limit <= min && scroll < 0)) {
                    const y = d3.event.offsetY;
                    const x = d3.event.offsetX;
                    this.limit += scroll;
                    this.update();
                    this.tooltip.x
                        .text
                        .text(this.tooltip.y.scale(x).toDateString());
                    this.tooltip.y
                        .text
                        .text(y < this.height - this.margin.bottom + this.margin.volume * 0.5 ? this.tooltip.x.scale(y).toFixed(2) : this.tooltip.x.scaleV(y).toFixed(0));
                }
            })
            .on("mousemove", () => {
                const y = d3.event.offsetY;
                const x = d3.event.offsetX;
                const closest = (num, arr) => {
                    let curr = arr[0].time;
                    let diff = Math.abs(num - curr);
                    arr.forEach((val, i, arr) => {
                        const newdiff = Math.abs(num - val.time);
                        if (newdiff < diff) {
                            diff = newdiff;
                            curr = val.time;
                        }
                    });
                    return curr;
                };
                const num = Date.parse(this.tooltip.y.scale(x)) * 0.001;
                const fixedDate = new Date(closest(num, this.data.slice(0, this.limit)) * 1000);
                if (y >= this.margin.top * 0.5 && y <= this.height - this.margin.volume && x >= this.margin.left * 0.25 && x <= this.width - this.margin.right * 0.5) {
                    this.tooltip.x.line
                        .style("left", `${this.scale.x(fixedDate) + 0.35 * (this.width - this.margin.left - this.margin.right) / this.data.slice(0, this.limit).length}px`)
                        .classed("shown", true);
                    this.tooltip.x.text
                        .style("left", `${this.scale.x(fixedDate) + 0.35 * (this.width - this.margin.left - this.margin.right) / this.data.slice(0, this.limit).length}px`)
                        .classed("shown", true)
                        .text(this.tooltip.y.scale(x).toDateString());
                    this.tooltip.y.line
                        .style("top", `${y}px`)
                        .classed("shown", true);
                    this.tooltip.y.text
                        .style("top", `${y}px`)
                        .classed("shown", true)
                        .text(y < this.height - this.margin.bottom + (this.margin.volume * 0.5) ? this.tooltip.x.scale(y).toFixed(2) : this.tooltip.x.scaleV(y).toFixed(0));
                        
                    if ((y > this.height - this.margin.bottom + (this.margin.volume * 0.2) && y < this.height - this.margin.bottom + (this.margin.volume * 0.8)) || this.tooltip.y.text.text() < 0) {
                        this.tooltip.y.text.classed("shown", false);
                        this.tooltip.y.line.classed("shown", false)
                    }
                }
            })
            .on("mouseleave", () => {
                this.tooltip.y.line.classed("shown", false);
                this.tooltip.x.line.classed("shown", false);
                this.tooltip.y.text.classed("shown", false);
                this.tooltip.x.text.classed("shown", false);
            });
    }
    update () {
        const getMin = (a, b) => a < b ? a : b;
        const getMax = (a, b) => a > b ? a : b;
        const parseData = (data) =>  data.forEach(d => {
            d.date = new Date(d.time * 1000);
            d.high = +d.high;
            d.low = +d.low;
            d.open = +d.open;
            d.close = +d.close;
            d.volume = +d.volumefrom;
            d.sma = data.map((cur, i, arr) => arr.slice(i, i + 100).reduce((acc, cur) => acc + cur.close, 0))
            .map((cur, i, arr) => i < arr.length - 101 ? cur / 100 : 0);
        });
        const rescale = (data) => {
            this.scale.y.domain([d3.min(data.map(d => d.low)),d3.max(data.map(d => d.high))]);
            this.scale.x.domain(d3.extent(data, d => d.date));
            this.scale.v.domain([0, d3.max(data, d => d.volume)]);
            this.tooltip.y.scale.range(d3.extent(data, d => d.date));
            this.tooltip.x.scale.range([d3.min(data.map(d => d.low)),d3.max(data.map(d => d.high))]);
            this.tooltip.x.scaleV.range([0, d3.max(data, d => d.volume)]);
        };

        const data = this.data.slice(0, this.limit);
        parseData(data);
        rescale(data);

        const yUpdate = this.chart.selectAll("line.y")
                             .data(this.scale.y.ticks(15));
        yUpdate
            .exit()
            .remove();
        yUpdate
            .enter().append("line")
            .merge(yUpdate)
            .attr("class", "y")
            .attr("x1", this.margin.left - 10)
            .attr("x2", this.margin.left - 15)
            .attr("y1", this.scale.y)
            .attr("y2", this.scale.y)
            .attr("stroke", "#2e2e2e")
            .attr("stroke-width", 0.5);

        const vUpdate = this.chart.selectAll("line.v")
                             .data(this.scale.v.ticks(5).slice(1));
        vUpdate
            .exit()
            .remove();
        vUpdate
            .enter().append("line")
            .merge(vUpdate)
            .attr("class", "v")
            .attr("x1", this.margin.left - 10)
            .attr("x2", this.margin.left - 15)
            .attr("y1", this.scale.v)
            .attr("y2", this.scale.v)
            .attr("stroke", "#2e2e2e")
            .attr("stroke-width", 0.5);

        const yruleUpdate = this.chart.selectAll("text.yrule")
                                 .data(this.scale.y.ticks(15));
        yruleUpdate
            .exit()
            .remove();
        yruleUpdate
            .enter()
            .append("text")
            .merge(yruleUpdate)
            .attr("class", "yrule")
            .attr("x", this.margin.left / 2)
            .attr("y", this.scale.y)
            .attr("dy", 4)
            .attr("dx", -5)
            .attr("text-anchor", "middle")
            .text(d => d);

        const yruleVolumeUpdate = this.chart.selectAll("text.yrulevolume")
                                       .data(this.scale.v.ticks(5).slice(1));
        yruleVolumeUpdate
            .exit()
            .remove();
        yruleVolumeUpdate
            .enter()
            .append("text")
            .merge(yruleVolumeUpdate)
            .attr("class", "yrulevolume")
            .attr("x", this.margin.left * 0.5)
            .attr("y", this.scale.v)
            .attr("dy", 4)
            .attr("dx", -5)
            .attr("text-anchor", "middle")
            .text(d => d)
            .style("font-size", ".8em");

        const xruleUpdate = this.chart.selectAll("text.xrule")
                                 .data(this.scale.x.ticks());
        xruleUpdate
            .exit()
            .remove();
        xruleUpdate
            .enter()
            .append("text")
            .merge(xruleUpdate)
            .attr("class", "xrule")
            .attr("x", this.scale.x)
            .attr("y", this.height)
            .attr("dy", this.margin.bottom * -0.05)
            .attr("text-anchor", "middle")
            .text(d => d.toDateString().slice(4));

        const stemUpdate = this.chart.selectAll("line.stem")
                                .data(data);
        stemUpdate
            .exit()
            .remove();
        stemUpdate
            .enter().append("line")
            .attr("class", "stem")
            .merge(stemUpdate)
            .attr("x1", d => this.scale.x(d.date) + 0.35 * (this.width - this.margin.left - this.margin.right) / data.length)
            .attr("x2", d => this.scale.x(d.date) + 0.35 * (this.width - this.margin.left - this.margin.right) / data.length)
            .attr("y1", d => this.scale.y(d.high))
            .attr("y2", d => this.scale.y(d.low))
            .attr("stroke", d => d.open > d.close ? "#EA4D5B " : "#52B887");


        const rectUpdate = this.chart.selectAll(".bar")
                                .data(data);
        rectUpdate
            .exit()
            .remove();
        rectUpdate
            .enter().append("rect")
            .merge(rectUpdate)
            .classed("bar", true)
            .attr("x", d => this.scale.x(d.date))
            .attr("y", d => this.scale.y(getMax(d.open, d.close)))
            .attr("height", d => this.scale.y(getMin(d.open, d.close)) - this.scale.y(getMax(d.open, d.close)))
            .attr("width", d => 0.7 * (this.width - this.margin.left - this.margin.right) / data.length)
            .attr("fill", d => d.open > d.close ? "#EA4D5B " : "#52B887");

        const volumeUpdate = this.chart.selectAll(".volume")
                                  .data(data);
        volumeUpdate
            .exit()
            .remove();
        volumeUpdate
            .enter().append("rect")
            .merge(volumeUpdate)
            .classed("volume", true)
            .attr("x", d => this.scale.x(d.date))
            .attr("y", d => this.scale.v(d.volume))
            .attr("height", d => this.height - this.scale.v(d.volume) - this.margin.volume)
            .attr("width", d => 0.7 * (this.width - this.margin.left - this.margin.right) / data.length)
            .attr("fill", d => d.open > d.close ? "#EA4D5B" : "#52B887");
            
        this.tooltip.price.text
            .style("top", `${this.scale.y(this.data[0].close)}px`)
            .style("background", this.data[0].open > this.data[0].close ? "#EA4D5B" : "#52B887")
            .text(data[0].close.toFixed(2));
        this.tooltip.price.line
            .style("top", `${this.scale.y(this.data[0].close)}px`)
            .style("width", `${this.width - this.margin.right - this.margin.left + ((this.margin.left - this.tooltip.price.text.node().offsetWidth) * 0.5) + 6}px`)
            .style("background-image", `linear-gradient(to right, ${this.data[0].open > this.data[0].close ? "rgba(234, 77, 90, 0.6)" : "rgba(82, 184, 135, 0.6)"} 50%, transparent 0%)`);
    }
    getData (from, to, ...func) {
        const url = `https://min-api.cryptocompare.com/data/${this.range}?fsym=${from}&tsym=${to}&limit=2000&aggregate=0&e=CCCAGG`;
        fetch(url)
            .then(response => response.json())
            .then(response => response.Data.reverse())
            .then(data => {
                this.data = data;
                func.forEach(cur => this[cur]())
            }).catch(console.error);
            
        fetch(`https://min-api.cryptocompare.com/data/price?fsym=${from}&tsyms=${to}&e=CCCAGG`)
            .then(response => response.json())
            .then(response => {
                this.nowPrice = response[to];
                console.log(this.nowPrice);
                
            }).catch(console.error);
    }
}